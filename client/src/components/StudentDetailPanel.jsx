import { eventIcon, eventLabel } from "../constants/activityEvents";
import StatusBadge from "./StatusBadge";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function StudentDetailPanel({ student, activity, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface h-full shadow-xl flex flex-col animate-in slide-in-from-right">
        <div className="h-16 shrink-0 border-b border-surface-variant flex items-center justify-between px-6">
          <h2 className="font-headline-md text-headline-md text-on-surface">Student Details</h2>
          <button onClick={onClose} className="text-secondary hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading || !student ? (
          <div className="flex-1 flex items-center justify-center font-body-sm text-secondary">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-surface-variant space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-background">{student.name}</h3>
                <StatusBadge status={student.status} />
              </div>
              {student.rollNumber && (
                <p className="font-code-sm text-code-sm text-secondary">{student.rollNumber}</p>
              )}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-label-caps text-label-caps text-secondary">Joined</p>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {student.joinedAt ? formatTime(student.joinedAt) : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-secondary">Started</p>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {student.startedAt ? formatTime(student.startedAt) : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-secondary">Submitted</p>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    {student.submittedAt ? formatTime(student.submittedAt) : "-"}
                  </p>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-secondary">Total Warnings</p>
                  <p className="font-body-sm text-body-sm text-on-surface">{student.warningCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-label-caps text-label-caps text-secondary mb-4">Activity History</h4>
              {(!activity || activity.length === 0) && (
                <p className="font-body-sm text-body-sm text-secondary">No activity recorded.</p>
              )}
              <div className="flex flex-col gap-4">
                {activity?.map((a, i) => {
                  const isWarning = a.severity === "MEDIUM" || a.severity === "LOW";
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isWarning ? "bg-error-container" : "bg-surface-container"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[14px] ${isWarning ? "text-error" : "text-secondary"}`}>
                          {eventIcon(a.eventType)}
                        </span>
                      </div>
                      <div>
                        <p className="font-body-sm text-body-sm text-on-surface">{eventLabel(a.eventType)}</p>
                        <span className="font-label-caps text-label-caps text-outline">{formatTime(a.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
