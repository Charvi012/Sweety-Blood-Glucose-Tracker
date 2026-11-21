/** Label + input + inline error, wired together for screen readers. */
export default function TextField({ id, label, error, hint, children, ...inputProps }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children ? (
        children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })
      ) : (
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      )}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
