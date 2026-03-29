export function parseClockTime(timeText) {
  if (!timeText) {
    return null;
  }

  const normalized = String(timeText).trim().replace(/\s+/g, ' ').toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (hours === 12) {
      hours = meridiem === 'AM' ? 0 : 12;
    } else if (meridiem === 'PM') {
      hours += 12;
    }
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return { hours, minutes };
}

export function isValidClockTime(timeText) {
  return Boolean(parseClockTime(timeText));
}

export function parseTimeToMinutes(timeText) {
  const parsed = parseClockTime(timeText);
  if (!parsed) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed.hours * 60 + parsed.minutes;
}
