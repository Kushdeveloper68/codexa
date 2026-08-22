import { eventIcon, eventLabel } from "../constants/activityEvents";

function timeAgo(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
}

export default function ActivityFeed({ events = [] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {events.length === 0 && (
        <p className="font-body-sm text-body-sm text-secondary text-center py-8">
          No activity yet.
        </p>
      )}
      {events.map((event, i) => {
        const isWarning = event.severity === "MEDIUM" || event.severity === "LOW";
        return (
          <div key={i} className="flex gap-3 items-start">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                isWarning ? "bg-error-container" : "bg-surface-container"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[14px] ${isWarning ? "text-error" : "text-secondary"}`}
              >
                {eventIcon(event.eventType)}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="font-body-sm text-body-sm text-on-surface">
                <span className="font-semibold">{event.name}</span>{" "}
                {eventLabel(event.eventType)}
              </p>
              <span className={`font-label-caps text-label-caps ${isWarning ? "text-error" : "text-outline"}`}>
                {timeAgo(event.timestamp)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
