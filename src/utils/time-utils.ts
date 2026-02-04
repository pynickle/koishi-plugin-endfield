// Time unit map
const TIME_UNITS: Record<string, number> = {
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
};

export function parseCustomTime(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const s = timeStr.toLowerCase();

  const unitOrder = ['d', 'h', 'm', 's'];

  let i = 0;
  let totalMs = 0;
  let lastIndex = -1;

  while (i < s.length) {
    const numStart = i;
    while (i < s.length && s.charCodeAt(i) >= 48 && s.charCodeAt(i) <= 57) {
      // '0' ~ '9'
      i++;
    }

    if (i === numStart) {
      return null;
    }

    const value = parseInt(s.substring(numStart, i), 10);

    if (i >= s.length) {
      return null;
    }

    const unit = s[i];
    i++;

    if (!(unit in TIME_UNITS)) {
      return null;
    }

    const currentIndex = unitOrder.indexOf(unit);
    if (lastIndex !== -1 && currentIndex < lastIndex) {
      return null;
    }

    totalMs += value * TIME_UNITS[unit];
    lastIndex = currentIndex;
  }

  return totalMs;
}
