import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoomCodeBadge from "../components/RoomCodeBadge";
import CodeEditorPanel from "../components/CodeEditorPanel";
import ErrorState from "../components/ErrorState";
import MembersList from "../components/MembersList";
import ChatPanel from "../components/ChatPanel";
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

  // Mobile-only slide-over drawer: hidden entirely on md+ where both
  // panels are always visible side by side.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("chat");
  const [unreadCount, setUnreadCount] = useState(0);

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
    const onChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      // If the mobile drawer isn't open on the chat tab, badge it so the
      // student notices without the chat stealing focus from the editor.
      setUnreadCount((prev) => (drawerOpen && drawerTab === "chat" ? prev : prev + 1));
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, code, drawerOpen, drawerTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openDrawer = (tab) => {
    setDrawerTab(tab);
    setDrawerOpen(true);
    if (tab === "chat") setUnreadCount(0);
  };

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
      <header className="bg-surface border-b border-surface-variant flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-14 md:h-16 shrink-0">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary">CodeClass</Link>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <section className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="h-auto md:h-14 border-b border-surface-variant bg-surface-container-lowest flex flex-col md:flex-row md:items-center justify-between px-3 md:px-6 gap-2 md:gap-3 shrink-0 py-2 md:py-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => openDrawer("members")}
                className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container text-on-surface"
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h1 className="font-headline-md text-headline-md text-on-surface truncate">{room?.title}</h1>
              <RoomCodeBadge code={code} size="sm" />
            </div>
            <div className="flex items-center gap-2 justify-between md:justify-end">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-surface border border-outline-variant rounded-DEFAULT px-2 py-1.5 font-label-caps text-label-caps text-on-surface outline-none focus:border-primary shrink-0"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              {/* Desktop-only static member pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full border border-secondary-container">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-caps text-label-caps whitespace-nowrap">{members.length} Members</span>
              </div>

              {/* Mobile-only chat trigger with unread badge */}
              <button
                onClick={() => openDrawer("chat")}
                className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-DEFAULT hover:bg-surface-container text-on-surface shrink-0"
                aria-label="Open chat"
              >
                <span className="material-symbols-outlined">chat</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <CodeEditorPanel value={code_} onChange={handleCodeChange} language={language} />
        </section>

        {/* Desktop sidebar — always visible md+ */}
        <aside className="hidden md:flex md:w-80 bg-surface flex-col shrink-0">
          <div className="h-1/2 flex flex-col border-b border-surface-variant min-h-0">
            <div className="px-4 py-3 border-b border-surface-variant bg-surface-container-lowest shrink-0">
              <h2 className="font-label-caps text-label-caps text-secondary">Students ({members.length})</h2>
            </div>
            <MembersList members={members} currentSessionId={session?.sessionId} />
          </div>
          <div className="h-1/2 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-surface-variant bg-surface-container-lowest shrink-0">
              <h2 className="font-label-caps text-label-caps text-secondary">Live Chat</h2>
            </div>
            <ChatPanel
              messages={messages}
              chatInput={chatInput}
              onInputChange={setChatInput}
              onSend={handleSendMessage}
              chatEndRef={chatEndRef}
            />
          </div>
        </aside>

        {/* Mobile slide-over drawer — editor stays full-screen behind it */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="relative w-[85%] max-w-xs bg-surface h-full shadow-xl flex flex-col">
              <div className="flex border-b border-surface-variant shrink-0">
                <button
                  onClick={() => setDrawerTab("members")}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-colors ${
                    drawerTab === "members" ? "text-primary border-b-2 border-primary" : "text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  Students ({members.length})
                </button>
                <button
                  onClick={() => {
                    setDrawerTab("chat");
                    setUnreadCount(0);
                  }}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-colors relative ${
                    drawerTab === "chat" ? "text-primary border-b-2 border-primary" : "text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Chat
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 flex items-center justify-center text-secondary hover:text-on-surface"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                {drawerTab === "members" ? (
                  <MembersList members={members} currentSessionId={session?.sessionId} />
                ) : (
                  <ChatPanel
                    messages={messages}
                    chatInput={chatInput}
                    onInputChange={setChatInput}
                    onSend={handleSendMessage}
                    chatEndRef={chatEndRef}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
