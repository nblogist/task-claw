export function formatDate(iso: string, showTime = false): string {
  const d = new Date(iso);
  const now = new Date();
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' });
  const year = d.getFullYear();
  const currentYear = now.getFullYear();

  let result = `${day} ${month}`;
  if (year !== currentYear) result += ` ${year}`;
  if (showTime) {
    const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
    result += `, ${time}`;
  }
  return result;
}
