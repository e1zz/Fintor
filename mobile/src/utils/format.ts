const pad = (n: number) => String(n).padStart(2, '0');

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** $12,500.00 */
export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0) || 0;
  const amount = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? '-' : ''}$${amount}`;
}

/** $0, $5k, $10k, $1.5M — chart axis labels */
export function formatCompactMoney(n: number): string {
  if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${+(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

/** 10/12/2026 (day/month/year, as used in Mexico) */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** 2027-12-31 */
export function formatIsoDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Dec 12, 2026 */
export function formatMediumDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** December 2026 */
export function formatMonthYear(value: Date): string {
  return value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Today, 09:32 / Yesterday, 18:05 / Dec 12, 2026, 09:32 */
export function formatRelativeDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${formatMediumDate(d)}, ${time}`;
}

/** A12F903B…7E4C */
export function formatUuid(uuid: string | null | undefined): string {
  if (!uuid) return '—';
  const compact = uuid.toUpperCase();
  return compact.length > 12 ? `${compact.slice(0, 8)}…${compact.slice(-4)}` : compact;
}
