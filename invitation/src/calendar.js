// Google Calendar needs an end time. Use a one-hour placeholder, not a confirmed finish time.
export function googleCalendarUrl(event, title, description, location) {
  const start = new Date(`${event.day}T${event.time}:00+05:30`);
  const format = date => date.toISOString().replace(/[-:]/g, '').replace('.000', '');
  const instant = format(start);
  const end = format(new Date(start.getTime() + 60 * 60 * 1000));
  const url = new URL('https://calendar.google.com/calendar/r/eventedit');
  url.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${title} — Laraib Siddiqui & Musharraf Jahan`,
    dates: `${instant}/${end}`,
    ctz: 'Asia/Kolkata', stz: 'Asia/Kolkata', etz: 'Asia/Kolkata',
    details: [description, event.mapUrl].filter(Boolean).join('\n\n'),
    location: [location, event.mapUrl].filter(Boolean).join(' · ')
  });
  return url.toString();
}
