export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-label-caps text-label-caps text-on-surface" htmlFor={props.id}>
          {label}
        </label>
      )}
      <input
        className={`bg-surface border rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
          error ? "border-error" : "border-outline-variant focus:border-primary"
        } ${className}`}
        {...props}
      />
      {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-label-caps text-label-caps text-on-surface" htmlFor={props.id}>
          {label}
        </label>
      )}
      <textarea
        className={`bg-surface-container-lowest border rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-y ${
          error ? "border-error" : "border-outline-variant focus:border-primary"
        } ${className}`}
        {...props}
      />
      {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, className = "", children, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-label-caps text-label-caps text-on-surface" htmlFor={props.id}>
          {label}
        </label>
      )}
      <select
        className={`bg-surface border rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none ${
          error ? "border-error" : "border-outline-variant focus:border-primary"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
    </div>
  );
}
