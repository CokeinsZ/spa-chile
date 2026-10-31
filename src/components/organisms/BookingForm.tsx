import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { TURNSTILE_SITE_KEY } from 'astro:env/client';
import { DEVICE_OPTIONS, validateBooking, type BookingErrors } from '../../lib/validation';
import {
  MAX_BOOKING_DAYS,
  MIN_NOTICE_HOURS,
  TIME_SLOTS,
  getZonedParts,
  isWorkingDay,
  santiagoToUtc,
  weekdayOfCalendarDate,
} from '../../lib/schedule';
import { CONFIRMATION_STORAGE_KEY, type BookingConfirmation } from '../../lib/confirmation';
import { buttonClass } from '../atoms/buttonStyles';
import { FormField } from '../molecules/FormField';
import { SelectField, type SelectOption } from '../molecules/SelectField';
import { TextareaField } from '../molecules/TextareaField';
import { TurnstileWidget } from '../molecules/TurnstileWidget';

interface FormValues {
  fullName: string;
  phone: string;
  email: string;
  commune: string;
  address: string;
  device: string;
  brand: string;
  problem: string;
  date: string;
  time: string;
}

type FieldKey = keyof FormValues;
type FormErrors = Partial<Record<FieldKey, string>>;

const initialValues: FormValues = {
  fullName: '',
  phone: '',
  email: '',
  commune: '',
  address: '',
  device: '',
  brand: '',
  problem: '',
  date: '',
  time: '',
};

const HOUR_MS = 3_600_000;

/** Fecha de calendario → "YYYY-MM-DD" (componentes, sin conversión de zona). */
function toDateInputValue(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** El servidor devuelve el error de horario como `scheduledAt`; se muestra en `time`. */
function remapErrors(errors: BookingErrors): FormErrors {
  const mapped: FormErrors = { ...(errors as FormErrors) };
  if (errors.scheduledAt) {
    mapped.time = errors.scheduledAt;
    delete (mapped as BookingErrors).scheduledAt;
  }
  return mapped;
}

/**
 * Isla React: formulario de agendamiento.
 * Valida con las mismas reglas del servidor (src/lib) y luego envía
 * la solicitud a POST /api/appointments.
 */
export default function BookingForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  // Token anti-bots de Turnstile (un solo uso). Cambiar `turnstileKey` vuelve a
  // montar el widget, que entrega un token nuevo.
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [turnstileError, setTurnstileError] = useState('');

  const resetTurnstile = () => {
    setTurnstileToken('');
    setTurnstileKey((key) => key + 1);
  };

  // Al volver con "Atrás" desde /gracias el navegador puede restaurar la página
  // desde bfcache con el envío aún en curso: se reinicia el formulario.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setValues(initialValues);
      setErrors({});
      setServerError('');
      setSubmitting(false);
      // El token pudo haberse gastado en el envío anterior.
      setTurnstileError('');
      resetTurnstile();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const setField = (field: FieldKey) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  // Los límites de fecha y los horarios se calculan en hora de Santiago.
  // La primera fecha posible es la primera con algún horario que cumpla la anticipación mínima.
  const [minDate, maxDate] = useMemo(() => {
    const today = getZonedParts(new Date());
    const earliest = new Date(Date.now() + MIN_NOTICE_HOURS * HOUR_MS);
    const e = getZonedParts(earliest);
    const lastStartHour = Math.max(...TIME_SLOTS.map((slot) => slot.startHour));
    const skipDay = santiagoToUtc(e.year, e.month, e.day, lastStartHour) < earliest ? 1 : 0;
    const first = new Date(Date.UTC(e.year, e.month - 1, e.day + skipDay, 12));
    const limit = new Date(
      Date.UTC(today.year, today.month - 1, today.day + MAX_BOOKING_DAYS, 12),
    );
    return [
      toDateInputValue(first.getUTCFullYear(), first.getUTCMonth() + 1, first.getUTCDate()),
      toDateInputValue(limit.getUTCFullYear(), limit.getUTCMonth() + 1, limit.getUTCDate()),
    ];
  }, []);

  /** Horarios ofrecibles para la fecha elegida (solo lun–vie, ≥ ahora + MIN_NOTICE_HOURS). */
  const timeOptions: SelectOption[] = useMemo(() => {
    if (!values.date) return [];
    const [y, m, d] = values.date.split('-').map(Number);
    if (!isWorkingDay(weekdayOfCalendarDate(y, m, d))) return [];
    const minStart = Date.now() + MIN_NOTICE_HOURS * HOUR_MS;
    return TIME_SLOTS.filter(
      (slot) => santiagoToUtc(y, m, d, slot.startHour).getTime() >= minStart,
    ).map((slot) => ({
      value: String(slot.startHour),
      label: `${slot.label} (${String(slot.startHour).padStart(2, '0')}:00 – ${slot.endHour}:00)`,
    }));
  }, [values.date]);

  const dateHint = useMemo(() => {
    if (!values.date) return undefined;
    const [y, m, d] = values.date.split('-').map(Number);
    if (!isWorkingDay(weekdayOfCalendarDate(y, m, d))) return 'Solo atendemos de lunes a viernes.';
    if (timeOptions.length === 0)
      return `Ya no quedan horarios con ${MIN_NOTICE_HOURS}h de anticipación para ese día; elige otra fecha.`;
    return undefined;
  }, [values.date, timeOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError('');

    const [y, m, d] = values.date.split('-').map(Number);
    // El horario elegido es hora de Santiago; no se usa la zona del navegador.
    const scheduledAt =
      values.date && values.time ? santiagoToUtc(y, m, d, Number(values.time)).toISOString() : '';

    const { errors: validationErrors, value } = validateBooking({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      commune: values.commune,
      address: values.address,
      device: values.device,
      brand: values.brand,
      problem: values.problem,
      scheduledAt,
    });

    const formErrors = remapErrors(validationErrors);
    setErrors(formErrors);
    if (!value) return;

    if (!turnstileToken) {
      setTurnstileError('Espera a que termine la verificación de seguridad e inténtalo de nuevo.');
      return;
    }

    setSubmitting(true);
    let redirecting = false;
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, turnstileToken }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 201 && data.ok) {
        // La página /gracias muestra el detalle y registra la conversión de Google Ads
        try {
          const confirmation: BookingConfirmation = {
            id: data.appointmentId,
            at: value.scheduledAt,
            phone: value.phone,
          };
          sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(confirmation));
        } catch {
          // Sin sessionStorage /gracias muestra un mensaje genérico y no registra la conversión
        }
        redirecting = true;
        window.location.assign('/gracias');
        return;
      }
      if (data.errors) {
        setErrors(remapErrors(data.errors));
      } else {
        setServerError(data.error ?? 'No se pudo agendar la cita. Inténtalo más tarde.');
      }
    } catch {
      setServerError(
        'No pudimos contactar el servidor. Revisa tu conexión o escríbenos por WhatsApp.',
      );
    } finally {
      // Mientras se navega a /gracias el botón sigue deshabilitado
      if (!redirecting) {
        setSubmitting(false);
        // El servidor pudo haber gastado el token: se pide uno nuevo para reintentar.
        resetTurnstile();
      }
    }
  }

  /* ---------- Formulario ---------- */
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 rounded-[10px] bg-paper-2 px-[26px] py-7 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] max-sm:px-[18px] max-sm:py-[22px] sm:grid-cols-2"
    >
      <FormField
        id="f-nombre"
        label="Nombre completo"
        placeholder="Ej. María Pérez"
        value={values.fullName}
        onChange={setField('fullName')}
        error={errors.fullName}
        required
        maxLength={80}
      />
      <FormField
        id="f-telefono"
        label="Teléfono celular"
        type="tel"
        placeholder="Ej. +56 9 1234 5678"
        hint="Usaremos este número para confirmar tu cita."
        value={values.phone}
        onChange={setField('phone')}
        error={errors.phone}
        required
      />
      <FormField
        id="f-email"
        label="Correo electrónico (opcional)"
        type="email"
        placeholder="Ej. maria@correo.cl"
        value={values.email}
        onChange={setField('email')}
        error={errors.email}
        maxLength={255}
      />
      <FormField
        id="f-comuna"
        label="Comuna"
        placeholder="Ej. Las Condes"
        value={values.commune}
        onChange={setField('commune')}
        error={errors.commune}
        required
        maxLength={60}
      />
      <div className="sm:col-span-2">
        <FormField
          id="f-direccion"
          label="Dirección completa"
          placeholder="Ej. Av. Providencia 1234, depto 501"
          value={values.address}
          onChange={setField('address')}
          error={errors.address}
          required
          maxLength={120}
        />
      </div>
      <SelectField
        id="f-equipo"
        label="Equipo con falla"
        value={values.device}
        onChange={setField('device')}
        options={DEVICE_OPTIONS.map((device) => ({ value: device, label: device }))}
        placeholder="Selecciona el equipo"
        error={errors.device}
        required
      />
      <FormField
        id="f-marca"
        label="Marca del equipo"
        placeholder="Ej. LG, Samsung, Mabe…"
        value={values.brand}
        onChange={setField('brand')}
        error={errors.brand}
        required
        maxLength={40}
      />
      <div className="sm:col-span-2">
        <TextareaField
          id="f-falla"
          label="Describe la falla"
          placeholder="Ej. La nevera no enfría abajo y hace un ruido constante desde ayer…"
          value={values.problem}
          onChange={setField('problem')}
          error={errors.problem}
          required
          rows={3}
          maxLength={500}
        />
      </div>
      <FormField
        id="f-fecha"
        label="Fecha de la visita"
        type="date"
        value={values.date}
        onChange={setField('date')}
        min={minDate}
        max={maxDate}
        error={errors.date}
        hint={dateHint}
        required
      />
      <SelectField
        id="f-hora"
        label="Horario de la visita"
        value={values.time}
        onChange={setField('time')}
        options={timeOptions}
        placeholder={values.date ? 'Mañana o tarde' : 'Primero elige la fecha'}
        error={errors.time}
        required
      />

      <div className="sm:col-span-2">
        <TurnstileWidget
          key={turnstileKey}
          siteKey={TURNSTILE_SITE_KEY}
          onTokenChange={setTurnstileToken}
          error={turnstileToken ? undefined : turnstileError}
        />
      </div>

      {serverError && (
        <p role="alert" className="text-[13px] font-medium text-brick sm:col-span-2">
          {serverError}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className={buttonClass(
            'primary',
            'mt-0.5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {submitting ? 'Agendando…' : 'Agendar cita'}
        </button>
        <p className="mt-2 text-xs text-ink-soft">
          Te confirmaremos por WhatsApp o llamada, según lo que prefieras.
        </p>
      </div>
    </form>
  );
}
