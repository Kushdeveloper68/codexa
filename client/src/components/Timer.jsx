import { useEffect, useState } from "react";

/**
 * Displays a countdown to testEndsAt (a server-provided ISO timestamp).
 * The interval only recomputes remaining time from the fixed server
 * endpoint each tick — it never accumulates client-side drift, and it
 * cannot be extended by manipulating anything in the browser, since the
 * actual test-end enforcement happens server-side.
 */
export default function Timer({ endsAt, onExpire }) {
  const [remainingMs, setRemainingMs] = useState(() =>
    endsAt ? new Date(endsAt).getTime() - Date.now() : null
  );

  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();

    const tick = () => {
      const remaining = end - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) onExpire?.();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (remainingMs === null) {
    return <span className="font-code-sm text-code-sm text-on-surface font-bold">--:--</span>;
  }

  const clamped = Math.max(remainingMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  const isLow = totalSeconds <= 60 && totalSeconds > 0;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border ${isLow ? "border-error" : "border-surface-variant"}`}>
      <span className={`material-symbols-outlined ${isLow ? "text-error" : "text-on-surface-variant"}`} style={{ fontSize: 18 }}>
        schedule
      </span>
      <span className={`font-code-sm text-code-sm font-bold ${isLow ? "text-error" : "text-on-surface"}`}>
        {mins}:{secs}
      </span>
    </div>
  );
}
