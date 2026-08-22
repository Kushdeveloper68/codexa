const STYLES = {
  NOT_STARTED: "bg-surface-container-highest text-secondary",
  WRITING: "bg-primary-fixed text-primary-container",
  SUBMITTED: "bg-surface-container-highest text-secondary",
  DISCONNECTED: "bg-error-container text-on-error-container",
  WAITING: "bg-surface-container-highest text-secondary",
  ACTIVE: "bg-primary-fixed text-primary-container",
  ENDED: "bg-surface-container-highest text-secondary",
  EXPIRED: "bg-error-container text-on-error-container",
};

const LABELS = {
  NOT_STARTED: "Not Started",
  WRITING: "Writing",
  SUBMITTED: "Submitted",
  DISCONNECTED: "Disconnected",
  WAITING: "Waiting",
  ACTIVE: "Live",
  ENDED: "Ended",
  EXPIRED: "Expired",
};

export default function StatusBadge({ status, dot = true }) {
  const style = STYLES[status] || "bg-surface-container-highest text-secondary";
  const label = LABELS[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-caps text-label-caps ${style}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
