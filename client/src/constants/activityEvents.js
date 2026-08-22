// Neutral, non-accusatory metadata for anti-cheat activity events. Shared
// between the live activity feed and the per-student detail panel so the
// icon/label mapping stays consistent everywhere.
export const EVENT_META = {
  STUDENT_JOINED: { icon: "login", label: "Joined the room", short: "Joined" },
  TEST_STARTED: { icon: "play_arrow", label: "Started the test", short: "Started" },
  FULLSCREEN_EXITED: { icon: "fullscreen_exit", label: "Exited fullscreen", short: "Fullscreen exit" },
  FULLSCREEN_ENTERED: { icon: "fullscreen", label: "Returned to fullscreen", short: "Fullscreen re-entered" },
  PAGE_HIDDEN: { icon: "visibility_off", label: "Left the test page / switched tab", short: "Tab switch" },
  PAGE_VISIBLE: { icon: "visibility", label: "Returned to the test page", short: "Returned" },
  COPY_ATTEMPT: { icon: "content_copy", label: "Attempted to copy", short: "Copy" },
  CUT_ATTEMPT: { icon: "content_cut", label: "Attempted to cut", short: "Cut" },
  PASTE_ATTEMPT: { icon: "content_paste", label: "Attempted to paste", short: "Paste" },
  PRINT_ATTEMPT: { icon: "print", label: "Attempted to print", short: "Print" },
  NAVIGATION_ATTEMPT: { icon: "logout", label: "Tried to navigate away", short: "Nav attempt" },
  MULTIPLE_TAB_DETECTED: { icon: "tab", label: "Opened another tab / window", short: "Multi-tab" },
  SUBMITTED: { icon: "check_circle", label: "Submitted the test", short: "Submitted" },
  DISCONNECTED: { icon: "wifi_off", label: "Disconnected", short: "Disconnected" },
  RECONNECTED: { icon: "wifi", label: "Reconnected", short: "Reconnected" },
};

export function eventLabel(type) {
  return EVENT_META[type]?.label || type;
}
export function eventShortLabel(type) {
  return EVENT_META[type]?.short || type;
}
export function eventIcon(type) {
  return EVENT_META[type]?.icon || "info";
}
