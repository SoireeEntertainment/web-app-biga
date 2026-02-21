const TZ = "Europe/Rome";

export type RecencyBadgeType = "never" | "today" | "recent" | "stale";

export type RecencyBadge = {
  label: string;
  type: RecencyBadgeType;
};

/** Format date as YYYY-MM-DD in given timezone */
function toDateString(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}

/** Days between two date strings YYYY-MM-DD */
function daysBetween(a: string, b: string): number {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.floor((t2 - t1) / (24 * 60 * 60 * 1000));
}

/**
 * Compute customer recency badge from last order date (Europe/Rome).
 * - null → "Mai ordinato" (never)
 * - today → "Ha ordinato oggi" (today, green)
 * - yesterday → "Non ordina da 1 giorno" (recent)
 * - else → "Non ordina da X giorni" (stale)
 */
export function computeCustomerRecencyBadge(
  lastOrderAt: Date | null,
  now: Date = new Date()
): RecencyBadge {
  if (!lastOrderAt) {
    return { label: "Mai ordinato", type: "never" };
  }
  const todayStr = toDateString(now, TZ);
  const lastStr = toDateString(lastOrderAt, TZ);
  const diffDays = daysBetween(lastStr, todayStr);

  if (diffDays === 0) {
    return { label: "Ha ordinato oggi", type: "today" };
  }
  if (diffDays === 1) {
    return { label: "Non ordina da 1 giorno", type: "recent" };
  }
  return {
    label: `Non ordina da ${diffDays} giorni`,
    type: "stale",
  };
}
