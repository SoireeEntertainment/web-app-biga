/**
 * Slot orari per consegna a domicilio.
 * Fascia 19:00–19:45 (slot ogni 5 min), fascia 20:00–20:45.
 * Cutoff: 18:40 per fascia 19xx; 20:40 per fascia 20xx.
 * Timezone: Europe/Rome.
 */

const TZ = "Europe/Rome";

function toRomeDate(d: Date): Date {
  const s = d.toLocaleString("en-CA", { timeZone: TZ });
  return new Date(s + "Z");
}

function getRomeHoursMinutes(now: Date): { h: number; m: number } {
  const fmt = new Intl.DateTimeFormat("it-IT", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { h, m };
}

/** Slot da 19:00 a 19:45 (19:00, 19:05, ..., 19:45) */
const SLOTS_19 = Array.from({ length: 10 }, (_, i) => {
  const m = i * 5;
  return { label: `19:${m.toString().padStart(2, "0")}`, value: `19:${m.toString().padStart(2, "0")}` };
});

/** Slot da 20:00 a 20:45 */
const SLOTS_20 = Array.from({ length: 10 }, (_, i) => {
  const m = i * 5;
  return { label: `20:${m.toString().padStart(2, "0")}`, value: `20:${m.toString().padStart(2, "0")}` };
});

/** Fino alle 18:40 si può ordinare per fascia 19; dalle 18:41 no */
const CUTOFF_19_MINUTES = 18 * 60 + 41;
/** Fino alle 20:40 si può ordinare per fascia 20; dalle 20:41 no */
const CUTOFF_20_MINUTES = 20 * 60 + 41;

/**
 * Restituisce gli slot disponibili in base all'orario corrente (Europe/Rome).
 * Prima delle 18:41 → fascia 19 e 20.
 * Dalle 18:41 alle 20:40 → solo fascia 20.
 * Dopo le 20:40 → nessuno.
 */
export function getAvailableDeliverySlots(now: Date): { label: string; value: string }[] {
  const { h, m } = getRomeHoursMinutes(now);
  const minutesSinceMidnight = h * 60 + m;

  if (minutesSinceMidnight < CUTOFF_19_MINUTES) return [...SLOTS_19, ...SLOTS_20];
  if (minutesSinceMidnight < CUTOFF_20_MINUTES) return [...SLOTS_20];
  return [];
}

export function isDeliveryOrderingAvailable(now: Date): boolean {
  return getAvailableDeliverySlots(now).length > 0;
}

/**
 * Messaggio da mostrare quando non è possibile ordinare per consegna (fuori orario).
 */
export function getDeliveryOrderingMessage(now: Date): string | null {
  if (isDeliveryOrderingAvailable(now)) return null;
  return "Al momento gli ordini online per la consegna a domicilio non sono disponibili. Chiama il ristorante per verificare la disponibilità.";
}

/**
 * Verifica che uno slot sia tra quelli attualmente validi (per validazione server).
 */
export function isValidDeliverySlot(now: Date, slot: string): boolean {
  const available = getAvailableDeliverySlots(now);
  return available.some((s) => s.value === slot);
}
