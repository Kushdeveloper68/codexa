const CARDS = [
  { key: "totalStudents", label: "Students", icon: "group" },
  { key: "started", label: "Started", icon: "play_circle" },
  { key: "writing", label: "Writing", icon: "edit" },
  { key: "submitted", label: "Submitted", icon: "check_circle" },
  { key: "warnings", label: "Warnings", icon: "warning" },
];

export default function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="bg-surface-container-lowest border border-surface-variant rounded-lg p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
            <span className="font-label-caps text-label-caps">{c.label}</span>
          </div>
          <span className="font-headline-lg text-headline-lg text-on-background">
            {summary?.[c.key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}
