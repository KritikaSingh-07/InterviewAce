/**
 * Timezone utility helpers for robust conversion between local times and UTC
 * without introducing library drift.
 */

/**
 * Convert local date-time strings into a UTC Date object.
 * @param {string} dateStr - local date formatted as "YYYY-MM-DD"
 * @param {string} timeStr - local time formatted as "HH:mm" (24h)
 * @param {string} timezone - target IANA timezone identifier (e.g. "Asia/Kolkata")
 * @returns {Date} UTC Date object
 */
export function getUtcDate(dateStr, timeStr, timezone) {
  const localDateTimeStr = `${dateStr}T${timeStr}:00`;
  const date = new Date(localDateTimeStr + 'Z');

  // Format the constructed date back using Intl to discover the difference
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formatted = formatter.format(date);

  // Format: "MM/DD/YYYY, HH:mm:ss"
  const match = formatted.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/);
  if (!match) return date;

  const [_, month, day, year, hour, minute, second] = match;

  // Create a UTC parsed representation of the formatted local values
  const localParsed = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ));

  // Diff in milliseconds = (input time in UTC zone) - (same numeric time adjusted in target zone)
  const diffMs = date.getTime() - localParsed.getTime();

  return new Date(date.getTime() + diffMs);
}

/**
 * Format a UTC Date into local date-time values.
 * @param {Date|string} utcDate - date to parse
 * @param {string} timezone - target IANA timezone identifier
 * @returns {Object} { dateStr: "YYYY-MM-DD", timeStr: "HH:mm", display: "MM/DD/YYYY HH:mm" }
 */
export function getLocalDateTime(utcDate, timezone) {
  const date = new Date(utcDate);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formatted = formatter.format(date);
  // Format: "MM/DD/YYYY, HH:mm"
  const match = formatted.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+)/);
  if (!match) {
    return {
      dateStr: date.toISOString().split('T')[0],
      timeStr: date.toISOString().split('T')[1].slice(0, 5),
      display: date.toUTCString(),
    };
  }

  const [_, month, day, year, hour, minute] = match;
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hour}:${minute}`,
    display: `${year}-${month}-${day} ${hour}:${minute}`,
  };
}

/**
 * Retrieve the day of the week in English matching a local date under the specified timezone.
 * @param {string} dateStr - local date formatted as "YYYY-MM-DD"
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} e.g. "Monday", "Tuesday", etc.
 */
export function getDayOfWeek(dateStr, timezone) {
  const parts = dateStr.split('-');
  const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  return formatter.format(date);
}
