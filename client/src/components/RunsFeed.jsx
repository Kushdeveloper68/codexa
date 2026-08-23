const STATUS_COLOR = {
  Accepted: "text-emerald-600",
  "Compilation Error": "text-error",
  "Runtime Error": "text-error",
  "Time Limit Exceeded": "text-yellow-600",
};

function timeAgo(timestamp) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
}

export default function RunsFeed({ runs = [] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {runs.length === 0 && (
        <p className="font-body-sm text-body-sm text-secondary text-center py-8">
          No code runs yet.
        </p>
      )}
      {runs.map((run, i) => (
        <div key={i} className="bg-surface-container-low border border-surface-variant rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">{run.name}</span>
            <span className="font-label-caps text-label-caps text-outline">{timeAgo(run.timestamp)}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-label-caps text-label-caps text-secondary">Q{(run.questionOrder ?? 0) + 1}</span>
            <span className={`font-label-caps text-label-caps ${STATUS_COLOR[run.status] || "text-secondary"}`}>
              {run.status}
            </span>
          </div>
          {(run.stdout || run.stderr || run.compileOutput) && (
            <pre className="bg-[#1a1a1a] text-[#d4d4d4] rounded p-2 font-code-sm text-[11px] overflow-x-auto max-h-24 whitespace-pre-wrap">
              {run.compileOutput || run.stderr || run.stdout}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
