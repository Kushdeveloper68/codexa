const CONFIG = {
  saved: { icon: "cloud_done", label: "Saved", color: "text-on-surface-variant" },
  saving: { icon: "cloud_sync", label: "Saving...", color: "text-secondary" },
  offline: { icon: "cloud_off", label: "Offline — will retry", color: "text-error" },
};

export default function SaveStatus({ state = "saved" }) {
  const c = CONFIG[state] || CONFIG.saved;
  return (
    <div className={`flex items-center gap-2 font-body-sm text-body-sm ${c.color}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{c.icon}</span>
      {c.label}
    </div>
  );
}
