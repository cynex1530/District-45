import { BookedSlot, TimeOff, WorkingHours } from './types';

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface CalendarDay {
  key: string; // local 'YYYY-MM-DD'
  date: Date;
  weekday: string; // 'Mon'
  weekdayLong: string; // 'Monday'
  month: string; // 'Jul'
  dayNum: number;
  isToday: boolean;
  closed: boolean;
}

/** 0 = Monday … 6 = Sunday (matches the DB's weekday convention). */
export function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatDateLabel(day: CalendarDay): string {
  return `${day.weekdayLong}, ${day.month} ${day.dayNum}`;
}

/** '09:00:00' → '9:00 AM' */
export function timeToDisplay(t: string): string {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

/** '9:00 AM' → '09:00:00', or null when not parseable */
export function displayToTime(s: string): string | null {
  const m = s.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (h > 23 || min > 59) return null;
  if (m[3] === 'PM' && h < 12) h += 12;
  if (m[3] === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

/** 'YYYY-MM-DD', or null when not a valid date string */
export function normalizeDateInput(s: string): string | null {
  const m = s.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = parseInt(mo, 10);
  const day = parseInt(d, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

function isDayOff(key: string, timeOff: TimeOff[]): boolean {
  return timeOff.some((v) => v.start_date && v.end_date && key >= v.start_date && key <= v.end_date);
}

/**
 * Three weeks (21 consecutive days starting today) for the swipeable date
 * strip. A day is closed when the barber's weekday is closed or falls in a
 * time-off range.
 */
export function buildCalendarDays(
  hours: WorkingHours[],
  timeOff: TimeOff[],
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const wd = mondayFirstWeekday(d);
    const h = hours.find((x) => x.weekday === wd);
    const closed = !h || !h.is_open || isDayOff(toDateKey(d), timeOff);
    days.push({
      key: toDateKey(d),
      date: d,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      weekdayLong: d.toLocaleDateString('en-US', { weekday: 'long' }),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
      closed,
    });
  }
  return days;
}

export interface Slot {
  label: string; // '9:00 AM'
  startsAt: Date;
}

const SLOT_STEP_MIN = 30;

/**
 * Open 30-minute slots for one day: within working hours, long enough for the
 * service, not overlapping a booked appointment, and not in the past.
 */
export function buildSlots(
  day: CalendarDay,
  hours: WorkingHours[],
  booked: BookedSlot[],
  serviceDurationMin: number,
): Slot[] {
  if (day.closed) return [];
  const h = hours.find((x) => x.weekday === mondayFirstWeekday(day.date));
  if (!h || !h.is_open) return [];

  const open = parseTimeToMinutes(h.start_time);
  const close = parseTimeToMinutes(h.end_time);
  const now = Date.now();

  const ranges = booked.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const slots: Slot[] = [];
  for (let m = open; m + serviceDurationMin <= close; m += SLOT_STEP_MIN) {
    const start = new Date(day.date);
    start.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const end = start.getTime() + serviceDurationMin * 60_000;
    if (start.getTime() <= now) continue;
    const overlaps = ranges.some((r) => start.getTime() < r.end && end > r.start);
    if (overlaps) continue;
    slots.push({ label: formatTime(start), startsAt: start });
  }
  return slots;
}
