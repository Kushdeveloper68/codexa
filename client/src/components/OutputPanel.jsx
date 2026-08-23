const STATUS_COLOR = {
  Accepted: "text-emerald-400",
  "Compilation Error": "text-error",
  "Runtime Error": "text-error",
  "Time Limit Exceeded": "text-yellow-400",
};

export default function OutputPanel({ result, loading, error, onClose }) {
  return (
    <div className="h-56 md:h-64 shrink-0 bg-[#1a1a1a] border-t border-[#333] flex flex-col">
      <div className="h-9 shrink-0 flex items-center justify-between px-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#858585]">terminal</span>
          <span className="font-label-caps text-label-caps text-[#858585]">Output</span>
          {result?.status && (
            <span className={`font-label-caps text-label-caps ${STATUS_COLOR[result.status] || "text-[#858585]"}`}>
              {result.status}
              {result.time ? ` · ${result.time}s` : ""}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#858585] hover:text-white">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-code-sm text-code-sm">
        {loading && <p className="text-[#858585]">Running...</p>}
        {!loading && error && <p className="text-error whitespace-pre-wrap">{error}</p>}
        {!loading && !error && result && (
          <>
            {result.compileOutput && (
              <pre className="text-yellow-400 whitespace-pre-wrap mb-3">{result.compileOutput}</pre>
            )}
            {result.stdout && <pre className="text-[#d4d4d4] whitespace-pre-wrap">{result.stdout}</pre>}
            {result.stderr && <pre className="text-error whitespace-pre-wrap mt-2">{result.stderr}</pre>}
            {!result.stdout && !result.stderr && !result.compileOutput && (
              <p className="text-[#858585]">Program produced no output.</p>
            )}
          </>
        )}
        {!loading && !error && !result && <p className="text-[#858585]">Run your code to see output here.</p>}
      </div>
    </div>
  );
}
