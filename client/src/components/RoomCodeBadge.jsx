import { useState } from "react";

export default function RoomCodeBadge({ code, size = "lg" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, code is still visible.
    }
  };

  if (size === "sm") {
    return (
      <button
        onClick={handleCopy}
        title="Click to copy"
        className="px-3 py-1 bg-surface-container-high border border-dashed border-outline-variant rounded-DEFAULT flex items-center gap-2 hover:border-primary transition-colors group"
      >
        <span className="font-code-sm text-code-sm text-on-surface group-hover:text-primary transition-colors">
          {code}
        </span>
        <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary">
          {copied ? "check" : "content_copy"}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="font-display-room-code text-display-room-code tracking-wider text-primary">
        {code}
      </span>
      <button
        onClick={handleCopy}
        aria-label="Copy Room Code"
        className="bg-surface hover:bg-surface-container transition-colors border border-outline-variant text-on-surface p-3 rounded-DEFAULT flex items-center justify-center"
      >
        <span className="material-symbols-outlined">{copied ? "check" : "content_copy"}</span>
      </button>
    </div>
  );
}
