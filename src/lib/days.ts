import type { DailyClicks } from '../api/client';

export function lastNDays(daily: DailyClicks[], today: Date, n = 30): DailyClicks[] {
  const byDay = new Map(daily.map((d) => [d.day, d.clicks]));
  const result: DailyClicks[] = [];
  for (let offset = n - 1; offset >= 0; offset--) {
    // Date.UTC normaliza dia negativo (ex.: 12 - 29 → mês anterior).
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    const day = date.toISOString().slice(0, 10);
    result.push({ day, clicks: byDay.get(day) ?? 0 });
  }
  return result;
}
