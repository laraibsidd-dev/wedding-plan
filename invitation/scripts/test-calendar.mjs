import assert from 'node:assert/strict';
import { googleCalendarUrl } from '../src/calendar.js';
import { events, eventOrder } from '../src/data/events.js';
import { readFileSync } from 'node:fs';

for (const id of eventOrder) {
  const url = new URL(googleCalendarUrl(events[id], 'Title', 'Description', 'Place'));
  assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render',
    `${id}: must use /calendar/render (the /r/eventedit form opens the Android app at the current month)`);
  assert.equal(url.searchParams.get('action'), 'TEMPLATE', `${id}: action=TEMPLATE is required on /render`);
  const [start, end] = url.searchParams.get('dates').split('/');
  assert.match(start, /^\d{8}T\d{6}Z$/, `${id}: start must be UTC with a Z suffix`);
  assert.match(end, /^\d{8}T\d{6}Z$/, `${id}: end must be UTC with a Z suffix`);
  assert.ok(end > start, `${id}: end after start`);
  // 7 pm IST is 13:30 UTC
  assert.equal(start.slice(9), '133000Z', `${id}: events start at 7 pm IST`);
  assert.equal(end.slice(9), '163000Z', `${id}: events end at 10 pm IST`);
  const ics = readFileSync(new URL(`../public/calendar/${id}.ics`, import.meta.url), 'utf8');
  const day = events[id].day.replaceAll('-', '');
  assert.ok(ics.includes(`DTSTART:${day}T133000Z\r\n`), `${id}: calendar file start`);
  assert.ok(ics.includes(`DTEND:${day}T163000Z\r\n`), `${id}: calendar file end`);
  assert.ok(url.searchParams.get('text').includes('Laraib Siddiqui & Musharraf Jahan'), `${id}: title`);
}
console.log(`calendar links ok for ${eventOrder.length} events`);
