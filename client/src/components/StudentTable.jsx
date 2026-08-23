import StatusBadge from "./StatusBadge";
import { eventIcon, eventShortLabel } from "../constants/activityEvents";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function WarningChips({ warningsByType }) {
  const entries = Object.entries(warningsByType || {}).filter(([, count]) => count > 0);
  if (entries.length === 0) return <span className="text-secondary">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([type, count]) => (
        <span
          key={type}
          title={eventShortLabel(type)}
          className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-1.5 py-0.5 rounded-DEFAULT font-label-caps text-[10px]"
        >
          <span className="material-symbols-outlined text-[12px]">{eventIcon(type)}</span>
          {eventShortLabel(type)} ×{count}
        </span>
      ))}
    </div>
  );
}

export default function StudentTable({ students = [], onSelect }) {
  if (students.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center font-body-sm text-body-sm text-secondary">
        No students have joined yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards — a wide table would need horizontal
          scrolling, which hides columns and is easy to miss on a phone. */}
      <div className="md:hidden divide-y divide-surface-variant">
        {students.map((s) => (
          <button
            key={s.sessionId}
            onClick={() => onSelect?.(s)}
            className="w-full text-left px-4 py-3 flex flex-col gap-2 hover:bg-surface-bright transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-caps text-label-caps text-secondary shrink-0">
                  {initials(s.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">{s.name}</p>
                  {s.rollNumber && <p className="font-code-sm text-code-sm text-secondary">{s.rollNumber}</p>}
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <WarningChips warningsByType={s.warningsByType} />
          </button>
        ))}
      </div>

      {/* Desktop: full table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-variant">
              <th className="px-6 py-3 font-label-caps text-label-caps text-secondary">Student</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-secondary">Roll No.</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-secondary">Status</th>
              <th className="px-6 py-3 font-label-caps text-label-caps text-secondary">Activity Notes</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.sessionId}
                onClick={() => onSelect?.(s)}
                className="hover:bg-surface-bright transition-colors cursor-pointer border-b border-surface-variant/50 last:border-0"
              >
                <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-caps text-label-caps text-secondary shrink-0">
                    {initials(s.name)}
                  </div>
                  {s.name}
                </td>
                <td className="px-6 py-4 font-code-sm text-code-sm text-secondary">{s.rollNumber || "-"}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={s.status} />
                </td>
                <td className="px-6 py-4">
                  <WarningChips warningsByType={s.warningsByType} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
