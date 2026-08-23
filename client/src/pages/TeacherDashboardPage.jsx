import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import SummaryCards from "../components/SummaryCards";
import StudentTable from "../components/StudentTable";
import ActivityFeed from "../components/ActivityFeed";
import RunsFeed from "../components/RunsFeed";
import StudentDetailPanel from "../components/StudentDetailPanel";
import Timer from "../components/Timer";
import ErrorState from "../components/ErrorState";
import { testService } from "../services/roomService";
import { useRoomSocket } from "../hooks/useRoomSocket";

// Fallback poll — guarantees the dashboard stays fresh even if a socket
// event is ever missed (network hiccup, tab was backgrounded, etc). Real
// updates arrive instantly via socket; this is just a safety net.
const POLL_INTERVAL_MS = 5000;

export default function TeacherDashboardPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [activityEvents, setActivityEvents] = useState([]);
  const [codeRuns, setCodeRuns] = useState([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const dataRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await testService.dashboard(code);
      dataRef.current = res;
      setData(res);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const socket = useRoomSocket({
    roomCode: code,
    asTeacher: true,
    onError: () => setError({ status: 403, message: "Not authorized as teacher for this room" }),
  });

  useEffect(() => {
    const refresh = () => loadDashboard();
    const onActivity = (evt) => {
      setActivityEvents((prev) => [evt, ...prev].slice(0, 100));
      // Live-patch the selected student's warning count without waiting
      // for the next poll, so the detail panel feels instant too.
      if (selectedStudent && evt.sessionId === selectedStudent.sessionId) {
        loadStudentDetail(selectedStudent.sessionId);
      }
      refresh();
    };

    socket.on("student:joined", refresh);
    socket.on("student:started", refresh);
    socket.on("student:submitted", refresh);
    socket.on("student:disconnected", refresh);
    socket.on("student:reconnected", refresh);
    socket.on("code:saved", refresh);
    socket.on("test:start", refresh);
    socket.on("test:end", refresh);
    socket.on("activity:event", onActivity);
    socket.on("code:run", (run) => setCodeRuns((prev) => [run, ...prev].slice(0, 50)));

    return () => {
      socket.off("student:joined", refresh);
      socket.off("student:started", refresh);
      socket.off("student:submitted", refresh);
      socket.off("student:disconnected", refresh);
      socket.off("student:reconnected", refresh);
      socket.off("code:saved", refresh);
      socket.off("test:start", refresh);
      socket.off("test:end", refresh);
      socket.off("activity:event", onActivity);
      socket.off("code:run");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, loadDashboard, selectedStudent]);

  const loadStudentDetail = async (sessionId) => {
    setDetailLoading(true);
    try {
      const res = await testService.studentDetail(code, sessionId);
      setDetail(res);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    loadStudentDetail(student.sessionId);
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await testService.start(code);
      await loadDashboard();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("End the test now? Students will no longer be able to submit.")) return;
    setActionLoading(true);
    try {
      await testService.end(code);
      await loadDashboard();
    } catch (err) {
      setError(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-body-sm text-secondary">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <ErrorState
        type={error.status === 401 || error.status === 403 ? "error" : error.status === 410 ? "ended" : "not-found"}
        message={error.message}
        onRetry={loadDashboard}
      />
    );
  }

  const { room, summary, students } = data;

  return (
    <div className="bg-surface text-on-surface font-body-sm min-h-screen flex flex-col">
      <header className="bg-surface border-b border-surface-variant flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary">CodeClass</Link>
        <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps">
          <span className={`w-1.5 h-1.5 rounded-full ${socket.connected ? "bg-emerald-500" : "bg-error"} animate-pulse`} />
          {socket.connected ? "Live" : "Reconnecting..."}
        </div>
      </header>

      <main className="flex flex-1 flex-col md:flex-row max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-gutter gap-gutter">
        <section className="flex-1 flex flex-col gap-gutter min-w-0">
          <div className="bg-surface-container-lowest border border-surface-variant rounded-lg p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
            <div className="flex flex-col gap-2 min-w-0">
              <h1 className="font-headline-lg text-[22px] md:text-headline-lg text-on-surface break-words">{room.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={room.status} />
                <span className="text-secondary font-body-sm text-body-sm hidden sm:inline">|</span>
                <span className="font-code-sm text-code-sm text-secondary">{room.code}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {room.status === "ACTIVE" && room.testEndsAt && (
                <Timer endsAt={room.testEndsAt} onExpire={loadDashboard} />
              )}
              {room.status === "WAITING" && (
                <Button onClick={handleStart} loading={actionLoading} icon="play_arrow">Start Test</Button>
              )}
              {room.status === "ACTIVE" && (
                <Button onClick={handleEnd} loading={actionLoading} variant="danger" icon="stop">End Test</Button>
              )}
            </div>
          </div>

          <SummaryCards summary={summary} />

          <div className="bg-surface-container-lowest border border-surface-variant rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-3 border-b border-surface-variant flex flex-wrap items-center justify-between gap-1">
              <h3 className="font-label-caps text-label-caps text-secondary">Students</h3>
              {lastUpdated && (
                <span className="font-label-caps text-label-caps text-outline">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <StudentTable students={students} onSelect={handleSelectStudent} />
          </div>
        </section>

        <aside className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-surface-container-lowest border border-surface-variant rounded-lg flex flex-col h-[400px] md:h-[600px] shadow-sm md:sticky md:top-24">
            <div className="flex border-b border-surface-variant bg-surface-bright shrink-0">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-colors ${
                  activeTab === "activity" ? "text-primary border-b-2 border-primary" : "text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sensors</span>
                Activity
              </button>
              <button
                onClick={() => setActiveTab("runs")}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-label-caps text-label-caps transition-colors ${
                  activeTab === "runs" ? "text-primary border-b-2 border-primary" : "text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                Code Runs
              </button>
            </div>
            {activeTab === "activity" ? <ActivityFeed events={activityEvents} /> : <RunsFeed runs={codeRuns} />}
          </div>
        </aside>
      </main>

      {selectedStudent && (
        <StudentDetailPanel
          student={detail?.student}
          activity={detail?.activity}
          loading={detailLoading}
          onClose={() => {
            setSelectedStudent(null);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}
