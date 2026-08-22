import Editor from "@monaco-editor/react";

const LANGUAGE_MAP = {
  C: "c",
  "C++": "cpp",
  Java: "java",
  Python: "python",
  JavaScript: "javascript",
};

/**
 * Thin wrapper around Monaco. Keystroke-level events stay local; the parent
 * page is responsible for debouncing before calling onChange upward to
 * avoid flooding the network (spec: don't save/broadcast every keystroke).
 */
export default function CodeEditorPanel({ value, onChange, language = "Python", readOnly = false }) {
  return (
    <div className="flex-1 bg-[#1E1E1E] overflow-hidden">
      <Editor
        height="100%"
        theme="vs-dark"
        language={LANGUAGE_MAP[language] || "plaintext"}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 4,
        }}
      />
    </div>
  );
}
