import { languages, messages, requiredKeys } from '../src/data/locales.js';
import { events, eventOrder, inviteChoices } from '../src/data/events.js';

const expectedLocales = ['en', 'hinglish'];
const errors = [];
const expectedDays = { 'haldi-mehendi': '2026-12-26', nikah: '2026-12-27', walima: '2026-12-28' };
if (languages.map(({ id }) => id).join(',') !== expectedLocales.join(',')) errors.push('Only English and Hinglish should be offered.');
if (Object.keys(messages).join(',') !== expectedLocales.join(',')) errors.push('Language copy and language choices must match.');
for (const locale of expectedLocales) {
  if (!messages[locale]) { errors.push(`Missing locale: ${locale}`); continue; }
  for (const key of requiredKeys) {
    if (typeof messages[locale][key] !== 'string' || !messages[locale][key].trim()) errors.push(`${locale} is missing ${key}`);
  }
  for (const key of Object.keys(messages[locale])) if (!requiredKeys.includes(key)) errors.push(`${locale} has unknown key ${key}`);
  for (const key of ['fatherOf', 'motherOf']) {
    if (!messages[locale][key]?.includes('{name}')) errors.push(`${locale} is missing the parent relationship name placeholder in ${key}`);
  }
  if (!messages[locale]?.groomFamilyLabel?.includes('Laraib Siddiqui')) errors.push(`${locale} is missing the full groom name`);
  for (const key of ['fatherLabel', 'motherLabel']) {
    if (!messages[locale]?.[key]?.includes('{name}')) errors.push(`${locale} is missing the child name in ${key}`);
  }
}
for (const eventId of eventOrder) {
  const event = events[eventId];
  if (!event || !messages.en[event.key] || !messages.en[`${event.key}Line`] || !messages.en[event.locationKey]) errors.push(`Invalid event data: ${eventId}`);
  if (event.mapUrl && !/^https:\/\/maps\.app\.goo\.gl\//.test(event.mapUrl)) errors.push(`Invalid Google Maps directions link for ${eventId}`);
  if (!event.mapUrl) errors.push(`Missing Google Maps directions link for ${eventId}`);
  if (event.day !== expectedDays[eventId]) errors.push(`Unexpected event day for ${eventId}: ${event.day}`);
  const suffix = eventId === 'haldi-mehendi' ? 'Haldi' : eventId[0].toUpperCase() + eventId.slice(1);
  const routeSuffix = eventId === 'haldi-mehendi' ? 'HaldiMehendi' : suffix;
  for (const locale of expectedLocales) {
    if (!messages[locale]?.[event.key] || !messages[locale]?.[`${event.key}Line`] || !messages[locale]?.[event.locationKey]) errors.push(`${locale} is missing event copy for ${eventId}`);
    if (!messages[locale]?.[`cardDate${suffix}`] || !messages[locale]?.[`choose${routeSuffix}`]) errors.push(`${locale} is missing event route or card date for ${eventId}`);
  }
}
for (const eventId of eventOrder) {
  if (events[eventId]?.time !== '19:00') errors.push(`${eventId} must start at 19:00.`);
  if (events[eventId]?.endTime !== '22:00') errors.push(`${eventId} must end at 22:00.`);
  for (const locale of expectedLocales) if (!messages[locale]?.eventTime?.trim()) errors.push(`${locale} is missing the event time copy.`);
}
if (inviteChoices.length !== eventOrder.length + 1 || inviteChoices[0] !== 'all') errors.push('Invite routes do not cover all events plus the all-events route.');
if (eventOrder.includes('reception')) errors.push('Reception must be represented by the Walima event, not a separate event.');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Content check passed: English and Hinglish, ${eventOrder.length} events, ${inviteChoices.length} invite routes.`);
