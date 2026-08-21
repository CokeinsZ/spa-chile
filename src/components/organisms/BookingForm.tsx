import { useState, type FormEvent } from 'react';
import { whatsappLink } from '../../data/site';
import { buttonClass } from '../atoms/buttonStyles';
import { FormField } from '../molecules/FormField';

type FormValues = {
  nombre: string;
  comuna: string;
  equipo: string;
};

const initialValues: FormValues = { nombre: '', comuna: '', equipo: '' };

/**
 * Isla React: formulario de agendamiento.
 * Sin backend: al enviar, abre WhatsApp con la solicitud ya redactada.
 */
export default function BookingForm() {
  const [values, setValues] = useState<FormValues>(initialValues);

  const setField = (field: keyof FormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = `Hola, soy ${values.nombre} (${values.comuna}). Necesito servicio técnico para: ${values.equipo}.`;
    window.open(whatsappLink(message), '_blank', 'noopener');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-[10px] bg-paper-2 px-[26px] py-7 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] max-sm:px-[18px] max-sm:py-[22px]"
    >
      <FormField
        id="f-nombre"
        label="Nombre completo"
        placeholder="Ej. María Pérez"
        value={values.nombre}
        onChange={setField('nombre')}
      />
      <FormField
        id="f-comuna"
        label="Comuna"
        placeholder="Ej. Las Condes"
        value={values.comuna}
        onChange={setField('comuna')}
      />
      <FormField
        id="f-equipo"
        label="Equipo con falla"
        placeholder="Nevera, refrigerador, aire acondicionado…"
        value={values.equipo}
        onChange={setField('equipo')}
      />

      <button type="submit" className={buttonClass('primary', 'mt-0.5 w-full justify-center')}>
        Agendar cita
      </button>
      <p className="-mt-1.5 text-xs text-ink-soft">
        Le confirmamos por WhatsApp o llamada, según lo que prefiera.
      </p>
    </form>
  );
}
