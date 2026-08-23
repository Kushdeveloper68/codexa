import { useNavigate } from "react-router-dom";
import Button from "./Button";

const PRESETS = {
  "not-found": {
    icon: "search_off",
    title: "Room not found",
    message: "The code may be incorrect or this room may have expired.",
  },
  expired: {
    icon: "hourglass_disabled",
    title: "Room expired",
    message: "This room is no longer available. Ask your instructor for a new code.",
  },
  ended: {
    icon: "event_busy",
    title: "Room ended",
    message: "This session has already ended.",
  },
  "connection-lost": {
    icon: "wifi_off",
    title: "Connection lost",
    message: "We're having trouble reaching the server. Check your connection.",
  },
  error: {
    icon: "error",
    title: "Something went wrong",
    message: "Please try again.",
  },
};

export default function ErrorState({ type = "error", message, onRetry }) {
  const navigate = useNavigate();
  const preset = PRESETS[type] || PRESETS.error;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop text-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl">{preset.icon}</span>
      </div>
      <h1 className="font-headline-lg text-[22px] md:text-headline-lg text-on-background mb-2">{preset.title}</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
        {message || preset.message}
      </p>
      <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
        {onRetry && <Button variant="secondary" onClick={onRetry} icon="refresh">Try Again</Button>}
        <Button variant="primary" onClick={() => navigate("/")} icon="home">Go Home</Button>
      </div>
    </div>
  );
}
