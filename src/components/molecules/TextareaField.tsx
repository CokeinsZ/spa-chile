interface TextareaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}

/** Área de texto etiquetada con hint y mensaje de error. */
export function TextareaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required = false,
  rows = 3,
  maxLength,
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-soft">
        {label}
        {required && <span className="text-brick"> *</span>}
      </label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full resize-y rounded-md border bg-white px-3.5 py-3 text-[14.5px] text-ink placeholder:text-[#9aa6a7] ${
          error ? 'border-brick' : 'border-line'
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-brick">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
