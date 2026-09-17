export const MINUTE = 60_000;
export type Selection<T> = { record: T; method: 'exact' | 'nearest'; offsetMinutes: number };
export function nearest<T extends { time: number }>(records: T[], time: number, toleranceMinutes = 7): Selection<T> | null {
  const record = [...records].sort((a, b) => Math.abs(a.time-time)-Math.abs(b.time-time) || a.time-b.time)[0];
  if (!record || Math.abs(record.time-time) > toleranceMinutes*MINUTE) return null;
  return {record, method: record.time === time ? 'exact' : 'nearest', offsetMinutes: (record.time-time)/MINUTE};
}
export function playbackTimes(start: number, end: number, instants: number[]): number[] {
  const ticks: number[] = [];
  for (let time = start; time <= end; time += 10*MINUTE) ticks.push(time);
  return [...new Set([...ticks, end, ...instants.filter(t => t >= start && t <= end)])].sort((a,b)=>a-b);
}
export type Advisory = { id: string; productId: string; revision: number; componentId: string; kind: 'observed' | 'forecast'; observedAt: number; issuedAt: number; forecastValidAt?: number; lower: number; upper: number; coordinates: number[][] };
export function selectAdvisories(records: Advisory[], time: number): Advisory[] {
  // Revision resolution happens at source-product level, preserving all components.
  const latestRevision = new Map<string, number>();
  for (const r of records) if (r.issuedAt <= time) latestRevision.set(r.productId, Math.max(latestRevision.get(r.productId) ?? -1, r.revision));
  const eligible = records.filter(r => r.revision === latestRevision.get(r.productId) && r.issuedAt <= time);
  const observed = eligible.filter(r => r.kind === 'observed' && r.observedAt <= time);
  const latestObservation = Math.max(...observed.map(r=>r.observedAt));
  const obs = observed.filter(r => r.observedAt === latestObservation && time < r.observedAt+60*MINUTE);
  const forecasts = eligible.filter(r => r.kind === 'forecast' && r.forecastValidAt === time);
  const latestIssue = Math.max(...forecasts.map(r=>r.issuedAt));
  return [...obs, ...forecasts.filter(r=>r.issuedAt === latestIssue)];
}
export function overlaps(lower: number, upper: number, band: string): boolean {
  if (band === 'all') return true;
  const [low, high] = band.split('-').map(Number);
  return lower < high && upper > low;
}
export function formatTime(time: number, zone: 'WIB' | 'UTC', date = false): string {
  return new Intl.DateTimeFormat('en-GB', {timeZone: zone === 'WIB' ? 'Asia/Jakarta' : 'UTC', ...(date ? {day:'2-digit',month:'short'} : {}), hour:'2-digit',minute:'2-digit',hour12:false}).format(time);
}
