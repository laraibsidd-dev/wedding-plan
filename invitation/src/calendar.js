// A start-only event: equal endpoints avoid inventing an end time for the hosts.
export function googleCalendarUrl(event, title, description, location) {
  const instant = new Date(`${event.day}T${event.time}:00+05:30`)
    .toISOString().replace(/[-:]/g, '').replace('.000', '');
  const url = new URL('https://calendar.google.com/calendar/r/eventedit');
  url.search = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${title} — Laraib Siddiqui & Musharraf Jahan`,
    dates: `${instant}/${instant}`,
    ctz: 'Asia/Kolkata', stz: 'Asia/Kolkata', etz: 'Asia/Kolkata',
    details: [description, event.mapUrl].filter(Boolean).join('\n\n'),
    location: [location, event.mapUrl].filter(Boolean).join(' · ')
  });
  return url.toString();
}
