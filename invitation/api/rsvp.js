import { neon } from '@neondatabase/serverless';

const allowedInvites = new Set(['all', 'haldi-mehendi', 'nikah', 'walima']);
const allowedLanguages = new Set(['en', 'hinglish']);

export async function insertRsvp(sql, { name, attending, partySize, plusOne, arrivalDate, invite, language }) {
  await sql`INSERT INTO wedding_rsvps (guest_name, attending, party_size, plus_one, arrival_date, invite_route, language)
    VALUES (${name}, ${attending}, ${attending ? partySize : 0}, ${attending && plusOne}, ${attending ? arrivalDate || null : null}, ${invite}, ${language})`;
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'Forbidden' });
    } catch {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (typeof body.website === 'string' && body.website.trim()) return res.status(200).json({ ok: true });

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const attending = body.attending;
  const partySize = Number(body.partySize);
  const plusOne = body.plusOne;
  const arrivalDate = body.arrivalDate;
  const invite = body.invite;
  const language = body.language;

  if (!name || name.length > 80 || typeof attending !== 'boolean' ||
      !allowedInvites.has(invite) || !allowedLanguages.has(language) ||
      (attending && (typeof plusOne !== 'boolean' || partySize !== (plusOne ? 2 : 1))) ||
      (arrivalDate !== '' && arrivalDate !== null && arrivalDate !== undefined &&
        !isCalendarDate(arrivalDate)) ||
      (!attending && partySize !== 0)) {
    return res.status(400).json({ error: 'Please check your RSVP details.' });
  }

  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'RSVP storage is not configured.' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    await insertRsvp(sql, { name, attending, partySize, plusOne, arrivalDate, invite, language });
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('RSVP submission failed', error);
    return res.status(503).json({ error: 'RSVP could not be saved.' });
  }
}
