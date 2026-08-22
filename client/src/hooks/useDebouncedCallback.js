import { useRef, useCallback } from "react";

/**
 * Returns a debounced version of fn. Used so the editor doesn't save (or
 * broadcast over the socket) on every keystroke — only after typing pauses.
 */
export function useDebouncedCallback(fn, delayMs = 800) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delayMs);
    },
    [fn, delayMs]
  );
}
