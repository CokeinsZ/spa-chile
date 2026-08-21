interface FormFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

/** Campo de texto etiquetado, controlado por el formulario de agendamiento. */
export function FormField({ id, label, placeholder, value, onChange }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-line bg-white px-3.5 py-3 text-[14.5px] text-ink placeholder:text-[#9aa6a7]"
      />
    </div>
  );
}
