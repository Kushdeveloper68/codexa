import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import CodeEditorPanel from "../components/CodeEditorPanel";
import SaveStatus from "../components/SaveStatus";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import OutputPanel from "../components/OutputPanel";
import { roomService, testService } from "../services/roomService";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useActivityMonitoring } from "../hooks/useActivityMonitoring";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { getLocalSession, saveDraftLocally, getLocalDraft } from "../utils/localSession";

export default function StudentTestRoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [codeByQuestion, setCodeByQuestion] = useState({});
  const [saveState, setSaveState] = useState("saved");
  const [connectionState, setConnectionState] = useState("connected");
  const [warningBanner, setWarningBanner] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOutput, setShowOutput] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [running, setRunning] = useState(false);

  const session = getLocalSession(code);
  const currentQuestion = questions[currentIndex];

  // --- Load room + questions + any previously-saved code ---
  const load = useCallback(async () => {
    try {
      const roomRes = await roomService.getRoom(code);
      setRoom(roomRes.room);

      const qRes = await testService.questions(code);
      setQuestions(qRes.questions);

      const subsRes = await testService.mySubmissions(code);
      const map = {};
      subsRes.submissions.forEach((s) => {
        map[s.questionId] = s.code;
      });
      // Fall back to local draft for anything the server doesn't have yet
      // (e.g. saved locally right before a disconnect).
      qRes.questions.forEach((q) => {
        if (!map[q.id]) {
          const draft = getLocalDraft(code, q.id);
          if (draft) map[q.id] = draft;
        }
      });
      setCodeByQuestion(map);
      if (subsRes.status === "SUBMITTED") setSubmitted(true);
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

  // --- Socket: presence + reconnection handling ---
  const socket = useRoomSocket({
    roomCode: code,
    studentSessionId: session?.sessionId,
    onJoined: () => setConnectionState("connected"),
    onError: (err) => setError({ message: err }),
  });

  useEffect(() => {
    const onDisconnect = () => setConnectionState("reconnecting");
    const onConnect = () => setConnectionState("connected");
    const onTestEnd = () => load();

    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);
    socket.on("test:end", onTestEnd);

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("session:heartbeat");
    }, 15000);

    return () => {
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
      socket.off("test:end", onTestEnd);
      clearInterval(heartbeat);
    };
  }, [socket, load]);

  // --- Autosave: debounced write to server + immediate local draft ---
  const persistToServer = useDebouncedCallback(async (questionId, code_) => {
    setSaveState("saving");
    try {
      await testService.save(code, { questionId, code: code_ });
      setSaveState("saved");
    } catch {
      setSaveState("offline");
    }
  }, 900);

  const handleCodeChange = (value) => {
    if (!currentQuestion) return;
    setCodeByQuestion((prev) => ({ ...prev, [currentQuestion.id]: value }));
    saveDraftLocally(code, currentQuestion.id, value);
    persistToServer(currentQuestion.id, value);
  };

  // --- Anti-cheat monitoring ---
  const reportActivity = useCallback(
    async (eventType, metadata) => {
      try {
        const res = await testService.activity(code, { eventType, metadata });
        if (eventType === "FULLSCREEN_EXITED") {
          setWarningBanner({
            title: "Fullscreen mode was exited",
            message: "Your activity has been recorded.",
          });
        } else if (eventType === "MULTIPLE_TAB_DETECTED") {
          setWarningBanner({
            title: "Multiple tabs detected",
            message: "This test should only be open in one tab.",
          });
        } else if (eventType === "PASTE_ATTEMPT") {
          setWarningBanner({
            title: "Paste detected",
            message: "Pasting into the editor has been recorded and is visible to your instructor.",
          });
        }
        return res;
      } catch {
        // Activity logging failure shouldn't block the student's work.
      }
    },
    [code]
  );

  const { requestFullscreen } = useActivityMonitoring({
    enabled: room?.status === "ACTIVE" && !submitted,
    fullscreenRequired: room?.settings?.fullscreenRequired,
    onEvent: reportActivity,
  });

  useEffect(() => {
    if (room?.status === "ACTIVE" && room?.settings?.fullscreenRequired && !submitted) {
      requestFullscreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);

  // --- Submit ---
  const handleSubmit = async () => {
    setConfirmingSubmit(false);
    try {
      await testService.submit(code);
      setSubmitted(true);
    } catch (err) {
      setError(err);
    }
  };

  // --- Run code (executed remotely via Judge0, never in-browser or on
  // this server directly) ---
  const handleRunCode = async () => {
    if (!currentQuestion) return;
    setShowOutput(true);
    setRunning(true);
    setRunError(null);
    try {
      const { result } = await testService.run(code, {
        questionId: currentQuestion.id,
        code: codeByQuestion[currentQuestion.id] ?? "",
      });
      setRunResult(result);
    } catch (err) {
      setRunResult(null);
      setRunError(err.message || "Could not run code");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-body-sm text-secondary">Loading test...</div>;
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

  if (room?.status === "WAITING") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-margin-mobile text-center">
        <span className="material-symbols-outlined text-5xl text-primary">hourglass_top</span>
        <h1 className="font-headline-lg text-headline-lg text-on-background">Waiting for the test to start</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{room.title} — your teacher will start it shortly.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-margin-mobile text-center">
        <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
        <h1 className="font-headline-lg text-headline-lg text-on-background">Test submitted successfully</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">You may now close this window.</p>
      </div>
    );
  }

  if (room?.status === "ENDED") {
    return <ErrorState type="ended" message="The test has ended." />;
  }

  return (
    <div className="bg-background text-on-background h-screen flex flex-col font-body-sm overflow-hidden">
      {connectionState === "reconnecting" && (
        <div className="bg-error text-on-error text-center py-1.5 font-body-sm text-body-sm">
          Connection interrupted — reconnecting... your work is saved locally.
        </div>
      )}
      {warningBanner && (
        <div className="bg-error-container text-on-error-container px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-body-sm text-body-sm font-semibold">{warningBanner.title}</p>
            <p className="font-body-sm text-body-sm">{warningBanner.message}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {room?.settings?.fullscreenRequired && (
              <Button
                variant="secondary"
                onClick={() => { requestFullscreen(); setWarningBanner(null); }}
                className="px-3 py-2 text-[11px] md:text-label-caps whitespace-nowrap"
              >
                Return to Fullscreen
              </Button>
            )}
            <button onClick={() => setWarningBanner(null)} className="text-on-error-container">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      <header className="h-16 shrink-0 bg-surface border-b border-surface-variant flex items-center justify-between gap-2 px-3 md:px-gutter">
        <h1 className="font-headline-md text-[15px] md:text-headline-md text-on-surface truncate min-w-0">{room?.title}</h1>
        <div className="flex items-center gap-2 md:gap-8 shrink-0">
          <Timer endsAt={room?.testEndsAt} onExpire={handleSubmit} />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 bg-surface overflow-y-auto border-r border-surface-variant flex flex-col max-h-[40vh] md:max-h-none shrink-0 md:shrink">
          <div className="p-gutter flex-1">
            <div className="mb-6 flex justify-between items-center">
              <span className="font-label-caps text-label-caps text-primary uppercase">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {questions.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-7 h-7 rounded-DEFAULT text-label-caps font-label-caps ${
                        i === currentIndex ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {currentQuestion?.title && (
              <h2 className="font-headline-md text-headline-md text-on-surface mb-4">{currentQuestion.title}</h2>
            )}
            <div className="font-body-lg text-body-lg text-on-surface-variant whitespace-pre-wrap">
              {currentQuestion?.description}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CodeEditorPanel
            value={currentQuestion ? codeByQuestion[currentQuestion.id] ?? "" : ""}
            onChange={handleCodeChange}
            language={room?.language}
            onPasteAttempt={() => reportActivity("PASTE_ATTEMPT")}
            onCopyAttempt={() => reportActivity("COPY_ATTEMPT")}
            onCutAttempt={() => reportActivity("CUT_ATTEMPT")}
          />
          {showOutput && (
            <OutputPanel
              result={runResult}
              loading={running}
              error={runError}
              onClose={() => setShowOutput(false)}
            />
          )}
        </div>
      </main>

      <footer className="min-h-16 shrink-0 bg-surface border-t border-surface-variant flex flex-wrap items-center justify-between gap-2 px-3 md:px-gutter py-2">
        <SaveStatus state={connectionState === "reconnecting" ? "offline" : saveState} />
        <div className="flex gap-2 md:gap-4">
          <Button
            variant="secondary"
            icon="play_arrow"
            onClick={handleRunCode}
            loading={running}
            className="px-3 md:px-6 py-2 md:py-3 text-[11px] md:text-label-caps"
          >
            <span className="md:hidden">Run</span>
            <span className="hidden md:inline">Run Code</span>
          </Button>
          <Button
            variant="danger"
            icon="send"
            onClick={() => setConfirmingSubmit(true)}
            className="px-3 md:px-6 py-2 md:py-3 text-[11px] md:text-label-caps"
          >
            <span className="md:hidden">Submit</span>
            <span className="hidden md:inline">Submit Test</span>
          </Button>
        </div>
      </footer>

      {confirmingSubmit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-margin-mobile z-50">
          <div className="bg-surface-container-lowest rounded-lg p-6 max-w-sm w-full shadow-sm">
            <h3 className="font-headline-md text-headline-md text-on-background mb-2">Are you sure?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              You may not be able to edit your answers after submission.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmingSubmit(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
