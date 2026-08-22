import { useEffect, useRef, useCallback } from "react";

const TAB_CHANNEL_NAME = "codeclass-test-tab";

/**
 * Wires up browser-level activity signals for a test room and reports each
 * one through onEvent(eventType, metadata). This is deliberately just
 * detection + reporting — it never decides on its own whether something
 * counts as cheating; the server assigns severity and the teacher judges.
 */
export function useActivityMonitoring({ enabled, fullscreenRequired, onEvent }) {
  const channelRef = useRef(null);

  const reportEvent = useCallback(
    (eventType, metadata = {}) => {
      onEvent?.(eventType, metadata);
    },
    [onEvent]
  );

  // Fullscreen enter/exit
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        reportEvent("FULLSCREEN_ENTERED");
      } else {
        reportEvent("FULLSCREEN_EXITED");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [enabled, reportEvent]);

  // Page visibility (tab switch / minimize)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      reportEvent(document.visibilityState === "hidden" ? "PAGE_HIDDEN" : "PAGE_VISIBLE");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, reportEvent]);

  // Paste detection (best-effort; we still let the app function if the
  // browser doesn't cooperate with preventDefault)
  useEffect(() => {
    if (!enabled) return;

    const handlePaste = () => reportEvent("PASTE_ATTEMPT");
    const handleCopy = () => reportEvent("COPY_ATTEMPT");
    const handleCut = () => reportEvent("CUT_ATTEMPT");

    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
    };
  }, [enabled, reportEvent]);

  // Print shortcut (best-effort deterrent, not a security boundary)
  useEffect(() => {
    if (!enabled) return;

    const handleKeydown = (e) => {
      const isPrint = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p";
      if (isPrint) {
        e.preventDefault();
        reportEvent("PRINT_ATTEMPT");
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [enabled, reportEvent]);

  // Multiple-tab detection via BroadcastChannel: each tab announces itself;
  // if a second tab announces while this one is alive, both get flagged.
  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(TAB_CHANNEL_NAME);
    channelRef.current = channel;
    const tabId = `${Date.now()}-${Math.random()}`;

    channel.postMessage({ type: "announce", tabId });

    channel.onmessage = (e) => {
      if (e.data?.type === "announce" && e.data.tabId !== tabId) {
        reportEvent("MULTIPLE_TAB_DETECTED");
      }
    };

    return () => channel.close();
  }, [enabled, reportEvent]);

  const requestFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request can be rejected (e.g. not a user gesture) —
        // the app must keep working even if this silently fails.
      });
    }
  }, []);

  return { requestFullscreen, isFullscreenRequired: !!fullscreenRequired };
}
