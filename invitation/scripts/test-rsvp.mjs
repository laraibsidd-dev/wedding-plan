import assert from 'node:assert/strict';
import handler, { insertRsvp } from '../api/rsvp.js';

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.payload = value; return this; }
  };
}

async function invoke(method, body = {}, headers = {}) {
  const res = responseMock();
  await handler({ method, body, headers }, res);
  return res;
}

const originalDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
try {
  assert.equal((await invoke('GET')).statusCode, 405, 'reject methods other than POST');
  assert.equal((await invoke('POST', {}, { origin: 'https://attacker.example', host: 'invite.example' })).statusCode, 403, 'reject cross-origin posts');
  assert.equal((await invoke('POST', { website: 'bot filled this' })).statusCode, 200, 'quietly discard honeypot submissions');
  const base = { name: 'The Example Family', invite: 'nikah', language: 'en', arrivalDate: '' };
  assert.equal((await invoke('POST', { ...base, attending: true, partySize: 2, plusOne: false })).statusCode, 400, 'reject inconsistent plus-one count');
  assert.equal((await invoke('POST', { ...base, attending: true, partySize: 1, plusOne: false, arrivalDate: '2026-02-31' })).statusCode, 400, 'reject invalid calendar dates');
  assert.equal((await invoke('POST', { ...base, attending: true, partySize: 2, plusOne: true })).statusCode, 503, 'do not report success when storage is missing');

  for (const language of ['en', 'hinglish']) {
    assert.equal((await invoke('POST', { ...base, language, attending: true, partySize: 1, plusOne: false })).statusCode, 503, `${language} passes validation and reaches storage`);
  }
  for (const language of ['hi', 'ur', 'kn', 'ta', 'ml', 'mr']) {
    assert.equal((await invoke('POST', { ...base, language, attending: true, partySize: 1, plusOne: false })).statusCode, 400, `${language} is no longer supported`);
  }
  assert.equal((await invoke('POST', { ...base, language: 'unknown', attending: true, partySize: 1, plusOne: false })).statusCode, 400, 'reject unknown language');

  let inserted;
  const fakeSql = async (strings, ...values) => { inserted = { query: strings.join('?'), values }; };
  await insertRsvp(fakeSql, { name: 'The Example Family', attending: true, partySize: 2, plusOne: true, arrivalDate: '2026-12-25', invite: 'all', language: 'hinglish' });
  assert.match(inserted.query, /INSERT INTO wedding_rsvps/);
  assert.deepEqual(inserted.values, ['The Example Family', true, 2, true, '2026-12-25', 'all', 'hinglish'], 'parameterize names and persist plus-one and arrival date');
} finally {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
}

console.log('RSVP checks passed: method, origin, honeypot, validation, missing-storage failure, and parameterized insert.');
