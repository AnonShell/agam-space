export function formatLastSeen(
  iso: string | null | undefined,
  locale?: string,
  fallback = 'Never'
): { relative: string; exact: string | null } {
  if (!iso) {
    return { relative: fallback, exact: null };
  }

  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime(); // negative if in past
  const abs = Math.abs(diffMs);

  const sec = Math.round(abs / 1000);
  const min = Math.round(sec / 60);
  const hour = Math.round(min / 60);
  const day = Math.round(hour / 24);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);

  const rtf = new Intl.RelativeTimeFormat(
    locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'),
    { numeric: 'auto' }
  );

  let relative: string;
  if (sec < 60) relative = rtf.format(-sec, 'second');
  else if (min < 60) relative = rtf.format(-min, 'minute');
  else if (hour < 24) relative = rtf.format(-hour, 'hour');
  else if (day < 30) relative = rtf.format(-day, 'day');
  else if (month < 12) relative = rtf.format(-month, 'month');
  else relative = rtf.format(-year, 'year');

  const exact = date.toLocaleString(
    locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'),
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return { relative, exact };
}
