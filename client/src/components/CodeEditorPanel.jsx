import Editor from "@monaco-editor/react";
import { useRef } from "react";

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
 *
 * Clipboard detection: a plain `document.addEventListener('paste', ...)`
 * is unreliable inside Monaco, because Monaco's own clipboard service
 * often handles Ctrl+V/Ctrl+C internally rather than letting a native
 * browser event bubble predictably. We instead hook Monaco's own
 * `onDidPaste` model event (fires whenever content lands in the editor via
 * paste, regardless of how it got there) and attach copy/cut listeners
 * directly on the editor's DOM node in the capture phase, so they fire
 * before Monaco's internal handlers get a chance to stop propagation.
 */
export default function CodeEditorPanel({
  value,
  onChange,
  language = "Python",
  readOnly = false,
  onPasteAttempt,
  onCopyAttempt,
  onCutAttempt,
}) {
  const editorRef = useRef(null);

  const handleMount = (editor) => {
    editorRef.current = editor;

    if (onPasteAttempt) {
      editor.onDidPaste(() => onPasteAttempt());
    }

    const domNode = editor.getDomNode();
    if (domNode) {
      if (onCopyAttempt) {
        domNode.addEventListener("copy", () => onCopyAttempt(), true);
      }
      if (onCutAttempt) {
        domNode.addEventListener("cut", () => onCutAttempt(), true);
      }
    }
  };

  return (
    <div className="flex-1 bg-[#1E1E1E] overflow-hidden">
      <Editor
        height="100%"
        theme="vs-dark"
        language={LANGUAGE_MAP[language] || "plaintext"}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        onMount={handleMount}
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
