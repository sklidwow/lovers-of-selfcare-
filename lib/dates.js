// Business day boundaries in the salon's own timezone, independent of the
// server's or the viewer's local time.
const TIMEZONE = 'Europe/Moscow';

function nowInTimezone() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  // A UTC Date whose fields equal the timezone's wall-clock time, so plain
  // getUTC*() day-of-week/month math works without a timezone library.
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function businessDateRanges() {
  const now = nowInTimezone();
  const today = toDateString(now);

  const dayOfWeek = now.getUTCDay(); // 0 = Sunday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysSinceMonday);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return { today, weekStart: toDateString(weekStart), monthStart: toDateString(monthStart) };
}

module.exports = { businessDateRanges };
