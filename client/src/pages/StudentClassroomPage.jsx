import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoomCodeBadge from "../components/RoomCodeBadge";
import CodeEditorPanel from "../components/CodeEditorPanel";
import ErrorState from "../components/ErrorState";
import { roomService, classroomService } from "../services/roomService";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { getLocalSession } from "../utils/localSession";
import { SUPPORTED_LANGUAGES, getSnippet } from "../constants/snippets";

export default function StudentClassroomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const session = getLocalSession(code);

  const [room, setRoom] = useState(null);
  const [language, setLanguage] = useState("JavaScript");
  const [code_, setCode] = useState("");
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [connectionState, setConnectionState] = useState("connected");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);
  const applyingRemoteChange = useRef(false);
  const codeHasContentRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const roomRes = await roomService.getRoom(code);
      setRoom(roomRes.room);
      const initialLanguage = roomRes.room.language || "JavaScript";
      setLanguage(initialLanguage);
      // Seed the editor with a starter snippet only if nothing has been
      // typed yet — a late joiner should see the live shared code, not
      // have it overwritten by a fresh snippet.
      setCode((prev) => (prev ? prev : getSnippet(initialLanguage)));

      const [membersRes, messagesRes] = await Promise.all([
        classroomService.members(code),
        classroomService.messages(code),
      ]);
      setMembers(membersRes.members);
      setMessages(messagesRes.messages);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  const socket = useRoomSocket({
    roomCode: code,
    studentSessionId: session?.sessionId,
    onError: (err) => setError({ message: err }),
  });

  useEffect(() => {
    const onCodeUpdate = (payload) => {
      codeHasContentRef.current = true;
      applyingRemoteChange.current = true;
      setCode(payload.code);
    };
    const onLanguageUpdate = (payload) => setLanguage(payload.language);
    const onChatMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onDisconnect = () => setConnectionState("reconnecting");
    const onConnect = () => setConnectionState("connected");
    const refreshMembers = () => classroomService.members(code).then((r) => setMembers(r.members));

    socket.on("code:update", onCodeUpdate);
    socket.on("language:update", onLanguageUpdate);
    socket.on("chat:message", onChatMessage);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);
    socket.on("student:joined", refreshMembers);
    socket.on("student:disconnected", refreshMembers);
    socket.on("student:reconnected", refreshMembers);

    return () => {
      socket.off("code:update", onCodeUpdate);
      socket.off("language:update", onLanguageUpdate);
      socket.off("chat:message", onChatMessage);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
      socket.off("student:joined", refreshMembers);
      socket.off("student:disconnected", refreshMembers);
      socket.off("student:reconnected", refreshMembers);
    };
  }, [socket, code]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Broadcast local edits, throttled, unless the change came from a remote
  // update (avoids feedback loops).
  const broadcastCode = useDebouncedCallback((value) => {
    socket.emit("code:update", { code: value });
  }, 300);

  const handleCodeChange = (value) => {
    codeHasContentRef.current = !!value?.trim();
    setCode(value);
    if (applyingRemoteChange.current) {
      applyingRemoteChange.current = false;
      return;
    }
    broadcastCode(value);
  };

  const handleLanguageChange = (newLanguage) => {
    const hasRealCode = codeHasContentRef.current;
    if (hasRealCode) {
      const confirmed = window.confirm(
        `Switch to ${newLanguage}? This resets the shared editor to a ${newLanguage} starter snippet for everyone.`
      );
      if (!confirmed) return;
    }
    setLanguage(newLanguage);
    const snippet = getSnippet(newLanguage);
    codeHasContentRef.current = false;
    setCode(snippet);
    socket.emit("language:update", { language: newLanguage });
    socket.emit("code:update", { code: snippet });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    socket.emit("chat:message", { message }, (res) => {
      if (res?.error) setError({ message: res.error });
    });
    setChatInput("");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-body-sm text-secondary">Loading classroom...</div>;
  }

  if (!session) {
    return <ErrorState type="error" message="You need to join this room first." onRetry={() => navigate("/join")} />;
  }

  if (error) {
    return (
      <ErrorState
        type={error.status === 410 ? "ended" : error.status === 404 ? "not-found" : "error"}
        message={error.message}
        onRetry={load}
      />
    );
  }

  return (
    <div className="bg-surface text-on-surface h-screen flex flex-col overflow-hidden font-body-sm">
      {connectionState === "reconnecting" && (
        <div className="bg-error text-on-error text-center py-1.5 font-body-sm text-body-sm shrink-0">
          Connection interrupted — reconnecting...
        </div>
      )}
      <header className="bg-surface border-b border-surface-variant flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 shrink-0">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary">CodeClass</Link>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <section className="flex-1 flex flex-col border-r border-surface-variant min-h-0">
          <div className="h-14 border-b border-surface-variant bg-surface-container-lowest flex items-center justify-between px-4 md:px-6 gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="font-headline-md text-headline-md text-on-surface truncate">{room?.title}</h1>
              <RoomCodeBadge code={code} size="sm" />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-surface border border-outline-variant rounded-DEFAULT px-2 py-1.5 font-label-caps text-label-caps text-on-surface outline-none focus:border-primary"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full border border-secondary-container">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-caps text-label-caps whitespace-nowrap">{members.length} Members</span>
              </div>
            </div>
          </div>
          <CodeEditorPanel value={code_} onChange={handleCodeChange} language={language} />
        </section>

        <aside className="w-full md:w-80 bg-surface flex flex-col shrink-0 max-h-[45vh] md:max-h-none">
          <div className="h-1/2 flex flex-col border-b border-surface-variant min-h-0">
            <div className="px-4 py-3 border-b border-surface-variant bg-surface-container-lowest shrink-0">
              <h2 className="font-label-caps text-label-caps text-secondary">Students ({members.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {members.map((m) => (
                <div key={m.sessionId} className="flex items-center justify-between pb-2 border-b border-surface-variant/50 last:border-0">
                  <span className="font-body-sm text-body-sm text-on-surface">
                    {m.name} {m.sessionId === session?.sessionId ? "(You)" : ""}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${m.status === "DISCONNECTED" ? "bg-surface-variant" : "bg-emerald-500"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-1/2 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-surface-variant bg-surface-container-lowest shrink-0">
              <h2 className="font-label-caps text-label-caps text-secondary">Live Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">{m.senderName}</span>
                    <span className="text-[10px] text-secondary">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{m.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-variant bg-surface shrink-0">
              <div className="relative">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-surface-container-lowest border border-surface-variant rounded-DEFAULT py-2 pl-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}
