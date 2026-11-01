import './styles.css';
import './styles/premium.css';
import { events, eventOrder, inviteChoices } from './data/events.js';
import { initializeMotion } from './motion.js';
import './styles/scroll.css';
import './styles/festival.css';
import { families } from './data/families.js';
import { androidCalendarIntent, googleCalendarUrl } from './calendar.js';
import { languages, messages } from './data/locales.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const aliases = { both: 'all', reception: 'walima', haldi: 'haldi-mehendi', mehendi: 'haldi-mehendi' };
const requestedInvite = aliases[params.get('invite')] || params.get('invite') || 'all';
const routeInvalid = !inviteChoices.includes(requestedInvite);
let invite = routeInvalid ? 'all' : requestedInvite;
const languageFromUrl = params.get('lang');
let language = languages.some(item => item.id === languageFromUrl)
  ? languageFromUrl
  : (localStorage.getItem('wedding-language') || 'en');
if (!languages.some(item => item.id === language)) language = 'en';
let guestName = '';
let toastTimeout;
const dirInfo = Object.fromEntries(languages.map(item => [item.id, item]));

function tr(key) { return messages[language][key] ?? messages.en[key] ?? key; }
function selectedEventIds() { return invite === 'all' ? eventOrder : [invite]; }
function escape(value) { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function escapeAttribute(value) { return escape(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function dateCopy(id) { return tr(`cardDate${id === 'haldi-mehendi' ? 'Haldi' : id[0].toUpperCase() + id.slice(1)}`); }

function updateCopy() {
  const rsvpNameInput = $('#rsvp-guest-name');
  const rsvpNameValue = rsvpNameInput?.value;
  const locale = dirInfo[language];
  document.documentElement.lang = language === 'hinglish' ? 'en' : language;
  document.documentElement.dir = locale.dir;
  document.documentElement.dataset.font = locale.font;
  document.title = `Laraib Siddiqui & Musharraf Jahan — ${tr('weddingInvitation')}`;
  $('#language-label').textContent = locale.native;
  $('#home-button').setAttribute('aria-label', tr('startOver'));
  $('#home-button .wordmark-copy b').textContent = 'Laraib Siddiqui & Musharraf Jahan';
  $('[data-copy="headerDate"]').textContent = tr('headerDate');
  $$('.quick-nav [data-copy]').forEach(element => element.textContent = tr(element.dataset.copy));
  $('#language-grid').setAttribute('aria-label', tr('chooseYourLanguage'));
  $('#print-card').setAttribute('aria-label', tr('personalizedPreview'));
  $('#close-language').setAttribute('aria-label', tr('close'));
  $$('#screen-language [data-copy], #screen-name [data-copy], #screen-welcome [data-copy], #screen-events [data-copy], #screen-keepsake [data-copy], #rsvp-form [data-copy], .skip-link[data-copy], #bottom-nav [data-copy], dialog [data-copy]')
    .forEach(element => element.textContent = tr(element.dataset.copy));
  $$('#screen-language [data-copy-html], #screen-name [data-copy-html], #screen-events [data-copy-html], #screen-keepsake [data-copy-html]')
    .forEach(element => element.innerHTML = tr(element.dataset.copyHtml));
  $$('[data-placeholder]').forEach(element => element.placeholder = tr(element.dataset.placeholder));
  $$('[data-copy-aria]').forEach(element => element.setAttribute('aria-label', tr(element.dataset.copyAria)));
  renderLanguages();
  renderEvents();
  renderGuest();
  renderRsvpName(rsvpNameInput ? true : !guestName.trim(), rsvpNameInput ? rsvpNameValue : guestName.trim());
  renderFamilies();
  renderInvalidChoices();

}

function renderFamilies() {
  const markup = families.map(family => `<div class="family-group">
    <p class="family-heading">${escape(tr(family.label))}</p>
    ${['father', 'mother'].map(role => {
      const relationName = family.child.split(/\s+/)[0];
      const relation = tr(`${role}Label`).replace('{name}', relationName);
      const fullRelation = tr(`${role}Of`).replace('{name}', family.child);
      return `<div class="parent-line"><strong><bdi lang="en" dir="ltr">${escape(family[role])}</bdi></strong><span class="parent-relation" aria-label="${escape(fullRelation)}">${escape(relation)}</span></div>`;
    }).join('')}
  </div>`).join('');
  $$('[data-families]').forEach(element => element.innerHTML = markup);
}

function renderLanguages() {
  $('#language-grid').innerHTML = languages.map(item => `
    <button class="language-card" type="button" data-language="${item.id}" aria-pressed="${item.id === language}">
      <span><b lang="${item.id === 'hinglish' ? 'en' : item.id}">${item.native}</b><small>${item.id === 'hinglish' ? tr('hinglishDescription') : item.label}</small></span><span aria-hidden="true">→</span>
    </button>`).join('');
  $('#dialog-languages').innerHTML = languages.map(item => `
    <button type="button" data-dialog-language="${item.id}" aria-current="${item.id === language}">
      <b lang="${item.id === 'hinglish' ? 'en' : item.id}">${item.native}</b><small>${item.id === 'hinglish' ? tr('hinglishDescription') : item.label}</small>
    </button>`).join('');
}

function eventWeekday(day) {
  return new Intl.DateTimeFormat(language === 'hinglish' ? 'en-IN' : language, { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

function eventLongDate(id) {
  const day = events[id].day;
  const formatted = new Intl.DateTimeFormat(language === 'hinglish' ? 'en-IN' : language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
  return formatted;
}

function eventCard(id, index, print = false) {
  const event = events[id];
  const name = tr(event.key);
  const description = tr(`${event.key}Line`);
  const place = tr(event.locationKey);
  if (print) return `<div class="card-event"><span>${escape(name)}</span><strong>${escape(dateCopy(id))}</strong><small>${escape(tr(event.locationKey))}<br>${escape(tr('eventTime'))}</small></div>`;
  const mapLink = event.mapUrl ? `<a class="map-link" href="${escape(event.mapUrl)}" target="_blank" rel="noopener noreferrer">${escape(tr('openMap'))}<span aria-hidden="true">↗</span></a>` : '';
  return `<article class="event-card ${event.tone}" style="--event-order:${index}" aria-labelledby="event-title-${id}">
    <div class="event-day" aria-hidden="true"><span>${event.day.slice(-2)}</span><small>DEC</small></div>
    <div class="event-icon" aria-hidden="true"><span>${event.icon}</span></div>
    <div class="event-copy">
      <span class="event-number">${String(index + 1).padStart(2,'0')} / ${escape(tr('celebration'))}</span>
      <h2 id="event-title-${id}">${escape(name)}</h2>
      <p>${escape(description)}</p>
    </div>
    <div class="event-detail">
      <span class="detail-label">${escape(tr('dateLabel'))}</span>
      <strong>${escape(eventLongDate(id))}</strong>
      <span class="detail-label place-label">${escape(tr('locationLabel'))}</span>
      <span>${escape(place)}</span>
      ${mapLink}
      <span class="pending-pill">${escape(tr('time'))} · ${escape(tr('eventTime'))}</span>
      <a class="calendar-file" href="${escape(androidCalendarIntent(event, name, `${description}\n\n${tr('calendarTimeNote')}\n${event.mapUrl}`, place, `${location.origin}/calendar/${id}.ics`))}">${escape(tr('androidCalendar'))}</a>
      <small class="calendar-time-note">${escape(tr('androidCalendarHelp'))}</small>
      <a class="calendar-button" href="${escape(googleCalendarUrl(event, tr(event.key), `${description}\n\n${tr('calendarTimeNote')}`, place))}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">＋</span> ${escape(tr('googleCalendar'))}<span aria-hidden="true">↗</span></a>
      <small class="calendar-time-note">${escape(tr('calendarTimeNote'))}</small>
      <a class="calendar-file" href="webcal://${escapeAttribute(location.host)}/calendar/${id}.ics">${escape(tr('appleCalendarSubscribe'))}</a>
      <small class="calendar-time-note">${escape(tr('appleCalendarHelp'))}</small>
      <a class="calendar-file" href="/calendar/${id}.ics" download>${escape(tr('calendarFile'))}</a><small class="calendar-time-note">${escape(tr('calendarFallbackHelp'))}</small>
    </div>
  </article>`;
}

function renderEvents() {
  if (!$('#event-list')) return;
  $('#event-list').innerHTML = selectedEventIds().map((id, index) => eventCard(id, index)).join('');
  const index = $('#event-index');
  index.setAttribute('aria-label', tr('eventDatesLabel'));
  index.innerHTML = selectedEventIds().map(id => `<a href="#event-title-${id}"><span>${events[id].day.slice(-2)} <small>DEC</small></span><b>${escape(tr(events[id].key))}</b><i aria-hidden="true">↗</i></a>`).join('');
  $('#card-events').innerHTML = selectedEventIds().map(id => eventCard(id, 0, true)).join('');
  observeReveal();
}

function renderGuest() {
  const safeName = guestName.trim();
  $('#card-guest').textContent = safeName || tr('ourDearGuest');
}

function renderRsvpName(editing = !guestName.trim(), value = guestName.trim()) {
  const slot = $('#rsvp-name-slot');
  if (!slot) return;
  slot.innerHTML = `<label for="rsvp-guest-name">${escape(tr('rsvpName'))}</label><input id="rsvp-guest-name" name="rsvpGuestName" type="text" maxlength="80" autocomplete="name" value="${escapeAttribute(value)}" required>`;
}

function renderInvalidChoices() {
  $('#link-fix-actions').innerHTML = inviteChoices.map(choice => {
    const key = choice === 'all' ? 'allEvents' : `choose${choice === 'haldi-mehendi' ? 'HaldiMehendi' : choice[0].toUpperCase() + choice.slice(1)}`;
    return `<button type="button" data-fix="${choice}">${escape(tr(key))}</button>`;
  }).join('');
}

function updateShareUrl() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('invite', invite);
  url.searchParams.set('lang', language);
  history.replaceState(null, '', url);
}

function setLanguage(id) {
  if (!dirInfo[id]) return;
  language = id;
  localStorage.setItem('wedding-language', language);
  updateCopy();
  updateShareUrl();
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

async function shareInvitation() {
  const url = new URL(location.href);
  url.hash = '';
  const shareData = { title: `${tr('weddingInvitation')} — Laraib Siddiqui & Musharraf Jahan`, text: tr('youAreInvited'), url: url.toString() };
  try {
    if (navigator.share) await navigator.share(shareData);
    else { await navigator.clipboard.writeText(url.toString()); toast(tr('shared')); }
  } catch (error) {
    if (error.name !== 'AbortError') toast(url.toString());
  }
}

let eventRevealObserver;
function observeReveal() {
  eventRevealObserver?.disconnect();
  const cards = $$('.event-card:not(.is-visible)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach(card => card.classList.add('is-visible'));
    return;
  }
  eventRevealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); eventRevealObserver.unobserve(entry.target); }
  }), { threshold: 0.06, rootMargin: '0px 0px 60px 0px' });
  cards.forEach(card => { card.classList.add('reveal-pending'); eventRevealObserver.observe(card); });
}

function initializeScroll() {
  const targets = $$('#screen-welcome .family-intro, #screen-welcome .family-lines, #screen-events .invitation-heading, .keepsake-intro, .rsvp-panel');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || motion.matches) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('scroll-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.04, rootMargin: '0px 0px 60px 0px' });
  targets.forEach(target => { target.classList.add('scroll-reveal'); observer.observe(target); });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      observer.disconnect();
      eventRevealObserver?.disconnect();
      targets.forEach(target => target.classList.remove('scroll-reveal'));
      $$('.event-card').forEach(card => card.classList.add('is-visible'));
    }
  });
}

document.addEventListener('click', event => {
  const languageCard = event.target.closest('[data-language]');
  if (languageCard) { setLanguage(languageCard.dataset.language); }
  const dialogLanguage = event.target.closest('[data-dialog-language]');
  if (dialogLanguage) { setLanguage(dialogLanguage.dataset.dialogLanguage); $('#language-dialog').close(); }
  const fix = event.target.closest('[data-fix]');
  if (fix) { invite = fix.dataset.fix; updateShareUrl(); renderEvents(); $('#invalid-dialog').close(); }
});

$('#guest-name').addEventListener('input', event => {
  guestName = event.target.value;
  renderGuest();
  $('#rsvp-guest-name').value = guestName;
});
$('#rsvp-name-slot').addEventListener('input', event => {
  if (event.target.id !== 'rsvp-guest-name') return;
  guestName = event.target.value;
  $('#guest-name').value = guestName;
  renderGuest();
});
// Build a separate, readable two-page card instead of shrinking the website into a PDF.
function preparePdfCard() {
  $('#pdf-invitation')?.remove();
  const source = $('#print-card');
  const pdf = document.createElement('div');
  pdf.id = 'pdf-invitation';
  pdf.setAttribute('aria-hidden', 'true');
  const sheet = () => {
    const page = document.createElement('section');
    page.className = 'pdf-sheet';
    const content = document.createElement('div');
    content.className = 'pdf-sheet-inner';
    page.append(content);
    pdf.append(page);
    return content;
  };
  const copy = (destination, selector) => {
    const node = source.querySelector(selector)?.cloneNode(true);
    if (!node) return;
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    destination.append(node);
  };
  const first = sheet();
  ['.bismillah', '.card-kicker', '.card-to', '.card-names', '.card-message', '.card-families'].forEach(selector => copy(first, selector));
  const second = sheet();
  ['.card-kicker', '.card-names', '.card-events', '.card-loved-ones', '.card-city', '.card-note'].forEach(selector => copy(second, selector));
  document.body.append(pdf);
  return pdf;
}
window.addEventListener('beforeprint', preparePdfCard);
$('#save-pdf').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  const pdfContent = preparePdfCard();
  pdfContent.classList.add('pdf-rendering');
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    await document.fonts.ready;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5', compress: true });
    const pages = $$('.pdf-sheet', pdfContent);
    for (let index = 0; index < pages.length; index++) {
      const canvas = await html2canvas(pages[index], {
        scale: 2, backgroundColor: '#fffaf1', useCORS: true, logging: false,
        onclone: doc => {
          const clone = doc.getElementById('pdf-invitation');
          clone.style.position = 'absolute';
          clone.style.left = '0';
          clone.style.top = '0';
          clone.style.zIndex = '1';
          clone.querySelectorAll('.pdf-sheet').forEach((page, pageIndex) => {
            if (pageIndex !== index) page.remove();
          });
        }
      });
      if (index) pdf.addPage();
      const scale = Math.min(148 / canvas.width, 210 / canvas.height);
      const width = canvas.width * scale;
      pdf.addImage(canvas.toDataURL('image/jpeg', .94), 'JPEG', (148 - width) / 2, 0, width, canvas.height * scale);
    }
    pdf.save('Laraib-Musharraf-invitation.pdf');
  } catch (error) {
    console.error('Could not generate invitation PDF', error);
    toast(tr('pdfDownloadError'));
  } finally {
    pdfContent.remove();
    button.disabled = false;
  }
});
$('#share-invitation').addEventListener('click', shareInvitation);
$('#rsvp-form').addEventListener('change', event => {
  if (event.target.name !== 'attending') return;
  const attending = $('#rsvp-form').elements.attending.value === 'yes';
  $('#rsvp-party-wrap').hidden = !attending;
});
$('#rsvp-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = $('#rsvp-status');
  const submit = form.querySelector('[type="submit"]');
  const formData = new FormData(form);
  const nameInput = $('#rsvp-guest-name');
  const name = nameInput ? nameInput.value.trim() : guestName.trim();
  const attending = formData.get('attending') === 'yes';
  if (!name) { status.textContent = tr('rsvpNameRequired'); nameInput?.focus(); return; }
  if (!formData.get('attending')) { status.textContent = tr('rsvpChoiceRequired'); form.querySelector('[name="attending"]').focus(); return; }

  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.textContent = tr('rsvpSending');
  try {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name,
        attending,
        partySize: attending ? (formData.get('plusOne') === 'on' ? 2 : 1) : 0,
        plusOne: attending && formData.get('plusOne') === 'on',
        arrivalDate: attending ? String(formData.get('arrivalDate') || '') : '',
        invite,
        language,
        website: String(formData.get('website') || '')
      })
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('RSVP request failed');
    guestName = name;
    renderGuest();
    form.reset();
    $('#rsvp-guest-name').value = name;
    $('#guest-name').value = name;
    status.textContent = tr('rsvpSuccess');
    $('#rsvp-party-wrap').hidden = true;
  } catch {
    status.textContent = tr('rsvpUnavailable');
  } finally {
    submit.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
$('#language-button').addEventListener('click', () => $('#language-dialog').showModal());
$('#close-language').addEventListener('click', () => $('#language-dialog').close());
$('#home-button').addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
initializeMotion();
updateCopy();
initializeScroll();
if (routeInvalid) $('#invalid-dialog').showModal();
