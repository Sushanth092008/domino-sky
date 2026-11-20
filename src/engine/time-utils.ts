// DOMINO SKY - Time Utilities

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.floor(minutes)) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function isTimeInRange(timeStr: string, startStr: string, durationMinutes: number): boolean {
  const t = timeToMinutes(timeStr);
  const start = timeToMinutes(startStr);
  const end = start + durationMinutes;
  return t >= start && t <= end;
}
