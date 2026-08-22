const VARIANTS = {
  primary:
    "bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-sm",
  secondary:
    "bg-surface text-on-surface-variant border border-outline-variant hover:bg-surface-container",
  ghost:
    "text-primary hover:text-on-primary-fixed-variant bg-transparent",
  danger:
    "bg-error text-on-error hover:opacity-90",
};

export default function Button({
  children,
  variant = "primary",
  icon,
  className = "",
  disabled = false,
  loading = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`font-label-caps text-label-caps px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : (
        icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
    </button>
  );
}
