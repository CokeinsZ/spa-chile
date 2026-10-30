/** Clave de sessionStorage con la cita recién agendada; la escribe BookingForm, la leen GoogleAds y /gracias, y /gracias la borra. */
export const CONFIRMATION_STORAGE_KEY = 'booking-confirmation';

/** Cita recién agendada. `id` es el de la BD y se usa como transaction_id de la conversión. */
export interface BookingConfirmation {
  id: number;
  at: string;
  phone: string;
}
