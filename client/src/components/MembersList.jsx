export default function MembersList({ members = [], currentSessionId }) {
  if (members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="font-body-sm text-body-sm text-secondary text-center">No one else here yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {members.map((m) => (
        <div key={m.sessionId} className="flex items-center justify-between pb-2 border-b border-surface-variant/50 last:border-0">
          <span className="font-body-sm text-body-sm text-on-surface truncate">
            {m.name} {m.sessionId === currentSessionId ? "(You)" : ""}
          </span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === "DISCONNECTED" ? "bg-surface-variant" : "bg-emerald-500"}`} />
        </div>
      ))}
    </div>
  );
}
