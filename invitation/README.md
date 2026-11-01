# Laraib & Musharraf wedding invitation

A static, mobile-first invitation built with Vite. Guests choose English or Hinglish, optionally add a guest or family name to the card, explore their invited events, then print or save an A5 PDF. If they skip the name step, they enter their name once in the RSVP form. Guests do not need an account. RSVP replies are handled by the serverless API and stored in the existing Neon database.

## Local development

```sh
npm ci
npm run dev
```

`npm run check` verifies the English and Hinglish copy and event routes. `npm run build` runs the same validation before generating `dist/`.
`npm run test:rsvp` checks RSVP validation and persistence-query behavior without submitting a real guest response.

## Structure

- `src/data/locales.js` holds all guest-facing copy for English and Hinglish. Hinglish uses Roman letters.
- `src/data/events.js` is the ceremony schedule and invitation-route allowlist.
- The soundtrack player is temporarily disabled. The provided audio file remains in `public/` for possible later use.
- `api/rsvp.js` validates and stores the guest/family name, attendance, +1, optional arrival date, invitation route, and language. A name entered for the card is reused; guests who skip that step enter a name once in the RSVP form.
- `db/schema.sql` documents the RSVP table and includes additive upgrades for +1 and arrival-date fields. Its connection string is stored as a sensitive Vercel environment variable, never in the browser bundle.
- `src/main.js` handles the no-account guest flow, language switching, print card, Google Calendar links, calendar-file download, event filtering, and sharing.
- `src/styles.css` contains responsive presentation, reduced-motion behavior, RTL layout, and A5 print rules.

Guest names remain in memory for the current visit. The URL only contains the selected event route and language. A generated share URL never includes the guest name.

## Updating wedding details

Edit the event records and locale strings together. Haldi + Mehendi is on 26 December, Nikah is on 27 December, and Walima is on 28 December; all events start at 7 pm. The combined Walima uses the Dawar Farms Google Maps pin. Keep RSVP collection limited to details needed for planning. Music is disabled. The user-provided audio is retained locally and omitted from deployment.

RSVP responses are stored in the `laraib-musharraf-rsvp` Neon project, in the Singapore region, using the `wedding_rsvps` table. The public API supports inserts only; review responses through the Neon console. The form tells guests their response is shared with the wedding hosts for planning.

## Vercel

The site is deployed to production in the dedicated `laraib-musharraf-invitation` Vercel project at https://laraib-musharraf-invitation.vercel.app/. Source files are uploaded through the Vercel API; the project has no Git connection. To enable Git-based automatic previews later, connect the `website` Git repository in Vercel and set the project root to `invitation`, build command to `npm run build`, install command to `npm ci`, and output directory to `dist`. This checkout has not been pushed or linked to Git by this task.

## Visual motion

`src/art/jaali-mandala.svg` is original ornamental artwork used as an animated, CSS-driven layer. Floating light, drifting petals, the mandala rotation, screen entrances, and event seals are generated in `src/styles/premium.css`; all motion stops when the visitor requests reduced motion. The effects do not depend on downloaded GIFs or third-party animation scripts, and decorative layers are hidden from print.

## Languages

The invitation offers English and Hinglish. The RSVP API accepts only those two language codes. The fresh-install schema allows only those values; an existing database may retain a wider CHECK constraint for older entries, but the API will not accept submissions in retired languages.

## RSVP function region

The RSVP API runs in Singapore (`sin1`) alongside the existing Singapore Neon database. The source pins `regions: ["sin1"]`; the Vercel project also sets `resourceConfig.functionDefaultRegions` to `["sin1"]`. Verify the actual deployment region and live API routing after region changes; the legacy deployment override did not change the runtime region in this project.
