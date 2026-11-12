/* Lakeville PTA planning portal – browser code (no framework). */
(() => {
'use strict';
const {INCLUDED, AHEAD, INTEREST, MAX_EVENTS, EVENT_FIELDS, tabs: allTabs, features, steps, sections, PRIORITY, SIGNAL, TIERS, OWNER_SECTIONS, INTRO_KEY} = MODEL;
const ownerOnly = id => OWNER_SECTIONS.includes(id);
let tabs = allTabs.filter(t => !ownerOnly(t[0]));
const descriptions = {start:'A shared starting point for Lakeville and DBY.',events:'Tell us how Lakeville runs events today. Start with one or two you know well.',features:'Everything in your plan. Tell us which features matter most for your first event.',preview:'Only you can see this page. Shape the draft app here as Lakeville’s answers come in, and share it when it’s ready.',workflow:'Walk us through a real event and decide who needs access.',questions:'Help us shape the first version and understand the accounting needs.',ahead:'A few questions about what Lakeville might want one day. None of this is part of your current plan.',pro:'Only you can see this page. Sort what Lakeville asks for into the higher tier as their answers come in.'};

/* ---------- tiny DOM helpers ---------- */
const LION_IMG = 'data:image/png;base64,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';
const ICONS = {
  message:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  save:'<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  right:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  left:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  undo:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
};
function icon(name, size = 15) {
  const s = document.createElement('span');
  s.style.display = 'inline-flex';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return s;
}
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k === 'ref') v(el);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false || kid === '') continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const $ = id => document.getElementById(id);
const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(k => k != null && k !== false && k !== '').map(k => k instanceof Node ? k : document.createTextNode(String(k))));
const sectionName = id => id === 'general' ? 'General discussion' : tabs.find(t => t[0] === id)?.[1] || id;
function location(t) {
  const key = t.field_key || t.fieldKey;
  if (key === INTRO_KEY) return 'Page introduction';
  return key ? sections[t.section]?.find(f => f.key === key)?.label || sectionName(t.section) : sectionName(t.section);
}
const size = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const errMsg = (e, fallback) => e instanceof Error && e.message ? e.message : fallback;
async function api(url, opts = {}) {
  const r = await fetch(url, { cache: 'no-store', ...opts });
  let p = {};
  try { p = await r.json(); } catch { /* non-JSON */ }
  if (!r.ok) { const e = new Error(p.error || (p.conflict ? 'Someone else changed this answer.' : 'Something went wrong. Please try again.')); e.status = r.status; e.body = p; throw e; }
  return p;
}
const jsonOpts = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/* ---------- state ---------- */
const S = { base: {}, pending: {}, saving: {}, failed: {}, conflicts: {}, panelView: 'team', tab: 'start', data: {}, records: {}, files: [], fileBusy: {}, fileError: {}, dirty: {}, loaded: false, busy: false, error: '', notice: '', incoming: [], me: null, nameEditing: false, nameBusy: false, nameError: '', commentsOpen: window.innerWidth > 1100, counts: [] };
const C = { scope: 'all', threads: [], active: null, messages: [], drafts: {}, uploads: {}, error: '', connected: false, busy: false, uploading: false, showResolved: false, composing: false, newAnchor: null, nextThreads: null, nextMessages: null, me: null, editing: null, editText: '', confirmDelete: null, outgoing: null, scrollAtEnd: true, listKey: '', lastList: '', lastThread: '', gen: 0 };
const postTopic = () => T.filter === 'All' ? (T.topics.includes('General') ? 'General' : T.topics[0]) : T.filter;
const F = { flags: [], composing: null, answering: null, busy: false, error: '', last: '', drafts: {} };
const T = { messages: [], topics: ['General'], filter: 'All', drafts: {}, ref: null, me: null, readOnly: false, editing: null, editText: '', confirmDelete: null, busy: false, error: '', last: '', newTopic: null, nextBefore: null, scrollAtEnd: true, loaded: false };
const current = () => S.data[S.tab] || {};
const fieldId = (tab, key) => 'answer-' + tab + '-' + key;
const titleFor = tab => tab === 'start' ? 'Let’s build the right starting point.' : tabs.find(t => t[0] === tab)?.[1] || '';
const countFor = (section, key) => S.counts.find(c => c.section === section && c.field_key === key)?.count || 0;

/* ---------- layout ---------- */
const root = $('app');
function renderShell() {
  fill(root, h('div', { class: 'portal' },
    h('aside', { class: 'sidebar' },
      h('a', { href: '/', class: 'brand' }, h('span', { class: 'brandmark' }, h('img', { src: LION_IMG, alt: 'Lakeville lion', width: 44, height: 38 })), h('span', null, 'Lakeville PTA', h('small', null, 'EVENTS APP PLANNING'))),
      h('div', { class: 'navlabel' }, 'LET’S SHAPE IT TOGETHER'),
      h('nav', { 'aria-label': 'Planning sections', id: 'nav' }),
      h('div', { class: 'sidebottom' }, icon('book', 18), h('p', null, 'From ideas to a first concept.', h('br'), h('small', null, 'Then a call and agreed scope.')))),
    h('div', { id: 'workspace', class: 'workspace' },
      h('header', { class: 'topbar' },
        h('span', null, 'DBY ', h('span', { class: 'muted' }, '/ Lakeville PTA')),
        h('div', { class: 'topactions' },
          h('button', { class: 'quiet comments-toggle', id: 'commentsToggle', 'aria-label': 'Team chat and questions', onclick: () => { S.commentsOpen = !S.commentsOpen; renderLayoutState(); renderPanel(); } }, icon('message'), 'Team chat & questions ', h('span', { id: 'commentTotal' })),
          h('button', { class: 'quiet', id: 'reloadBtn', onclick: reload }, icon('refresh'), 'Reload saved'),
          h('button', { class: 'quiet', id: 'exportBtn', onclick: download }, icon('download'), 'Export answers'))),
      h('div', { class: 'content-layout' },
        h('main', { id: 'main' }),
        h('aside', { class: 'comments-panel', id: 'panel', 'aria-label': 'Team chat and questions for DBY' })))));
  renderNav(); renderMain(); renderLayoutState(); renderPanel();
}
function renderLayoutState() {
  $('workspace').className = S.commentsOpen ? 'workspace chat-visible' : 'workspace';
  $('panel').hidden = !S.commentsOpen;
  $('commentsToggle').setAttribute('aria-expanded', String(S.commentsOpen));
  $('commentTotal').textContent = S.counts.reduce((n, c) => n + c.count, 0) || '';
  $('reloadBtn').disabled = S.busy;
  $('exportBtn').disabled = !S.loaded;
}
function renderNav() {
  fill($('nav'), ...tabs.map(([id, title], i) => h('button', { 'aria-label': title, 'aria-current': S.tab === id ? 'page' : null, onclick: () => setTab(id) },
    h('span', { class: 'navnum' }, '0' + (i + 1)), title,
    S.dirty[id] ? h('span', { class: 'unsaved', 'aria-label': 'Unsaved changes' }) : S.records[id] ? h('span', { 'aria-label': 'Has saved answers', style: 'margin-left:auto;display:inline-flex' }, icon('check', 14)) : null)));
}
function setTab(id) { S.tab = id; S.error = ''; S.notice = ''; renderNav(); renderMain(); onSectionChange(); window.scrollTo(0, 0); }

/* ---------- main content ---------- */
function field(f) {
  const tab = S.tab, id = fieldId(tab, f.key), count = countFor(tab, f.key);
  const disabled = !S.loaded;
  const dyn = tab === 'workflow' && f.key === 'event' ? [...new Set([...eventNames(), ...(current()[f.key] ? [current()[f.key]] : [])])] : null;
  const control = dyn
    ? h('select', { id, 'aria-label': f.label, disabled, onchange: e => change(f.key, e.target.value) }, h('option', { value: '' }, dyn.length ? 'Choose an event' : 'Add events on the Current events page first'), dyn.map(o => h('option', { value: o }, o)))
    : f.options
    ? h('select', { id, 'aria-label': f.label, disabled, onchange: e => change(f.key, e.target.value) }, h('option', { value: '' }, 'Choose one'), f.options.map(o => h('option', { value: o }, o)))
    : h('textarea', { id, 'aria-label': f.label, rows: (f.key.includes('Name') || f.key === 'completedBy') ? 2 : 3, maxlength: 6000, disabled, placeholder: 'Your answer', oninput: e => change(f.key, e.target.value) });
  control.value = current()[f.key] || '';
  return h('div', { class: 'field' },
    h('div', { class: 'field-heading' }, h('label', { for: id }, f.label),
      ownerOnly(tab) ? null : h('span', { class: 'anchor-group' },
        flagButton('field:' + tab + ':' + f.key),
        S.me ? h('button', { class: 'comment-anchor team-anchor', type: 'button', 'aria-label': 'Discuss with the Lakeville team: ' + (sections[tab].find(x => x.key === f.key)?.label || f.label), onclick: () => openTeam({ section: tab, field: f.key, label: titleFor(tab) + ' › ' + (sections[tab].find(x => x.key === f.key)?.label || f.label) }) }, icon('users', 13), 'Discuss with team') : null,
        h('button', { class: 'comment-anchor', type: 'button', 'data-anchor': f.key, 'aria-label': 'Ask DBY about ' + (sections[tab].find(x => x.key === f.key)?.label || f.label), onclick: () => comment(f) }, icon('message', 13), count ? String(count) : 'Ask DBY'))),
    f.hint ? h('small', null, f.hint) : null, control,
    h('div', { id: 'conflict-' + id }),
    ownerOnly(tab) ? null : flagSlot('field:' + tab + ':' + f.key),
    h('div', { class: 'history', id: 'history-' + id }, historyLink(tab, f.key)),
    f.options || ownerOnly(tab) ? null : h('div', { class: 'answer-files', id: 'files-' + fieldId(tab, f.key) }, fileArea(tab, f.key)));
}
const fileUrl = id => '/api/answer-files?id=' + id;
const answerImages = new Map();
function answerImage(file) {
  if (!answerImages.has(file.id)) answerImages.set(file.id, h('img', { src: fileUrl(file.id), alt: file.name, loading: 'lazy' }));
  return answerImages.get(file.id);
}
function fileArea(tab, key) {
  const k = tab + ':' + key, files = S.files.filter(x => x.section === tab && x.field_key === key);
  const canUpload = !!S.me?.attachments, busy = !!S.fileBusy[k];
  if (!canUpload && !files.length) return [];
  let input;
  return [
    files.length ? h('div', { class: 'answer-file-list' }, files.map(file => {
      const isImage = file.content_type.startsWith('image/');
      return h('div', { class: isImage ? 'answer-file is-image' : 'answer-file' },
        h('a', { href: fileUrl(file.id), target: '_blank', rel: 'noreferrer', class: 'answer-file-link', title: 'Open ' + file.name },
          isImage ? answerImage(file) : h('span', { class: 'answer-file-icon' }, icon('file', 18)),
          h('span', { class: 'answer-file-text' }, h('strong', null, file.name), h('small', null, `${size(file.size)} · ${file.author_name} · ${fmtTime(file.created_at)}`))),
        S.me && file.author_id === S.me.email ? h('button', { class: 'quiet iconbutton', type: 'button', disabled: busy, 'aria-label': 'Remove ' + file.name, title: 'Remove file', onclick: () => removeAnswerFile(tab, key, file) }, icon('trash', 14)) : null);
    })) : null,
    canUpload ? h('div', { class: 'answer-file-tools' },
      h('input', { type: 'file', hidden: true, multiple: true, accept: '.jpg,.jpeg,.png,.pdf,.xls,.xlsx', ref: el => { input = el; }, onchange: e => uploadAnswerFiles(tab, key, e.target.files) }),
      h('button', { class: 'quiet attach-answer', type: 'button', disabled: busy || files.length >= 10, onclick: () => input.click() }, icon('clip', 13), busy ? 'Uploading…' : 'Attach file'),
      h('small', null, S.fileError[k] || 'JPG, PNG, PDF or Excel · up to 20 MB each')) : null];
}
function renderFileArea(tab, key) { const el = $('files-' + fieldId(tab, key)); if (el) fill(el, fileArea(tab, key)); }
function renderAllFileAreas() { for (const el of document.querySelectorAll('#main .answer-files')) { const key = el.id.slice(('files-' + fieldId(S.tab, '')).length); fill(el, fileArea(S.tab, key)); } }
async function uploadAnswerFiles(tab, key, list) {
  const k = tab + ':' + key;
  if (!list?.length || S.fileBusy[k]) return;
  S.fileBusy[k] = true; S.fileError[k] = ''; renderFileArea(tab, key);
  try {
    for (const file of Array.from(list)) {
      if (file.size > 20 * 1024 * 1024) throw new Error(file.name + ' is larger than 20 MB.');
      const form = new FormData(); form.append('file', file); form.append('section', tab); form.append('fieldKey', key);
      const p = await api('/api/answer-files', { method: 'POST', body: form });
      S.files = [...S.files.filter(x => x.id !== p.file.id), p.file];
      renderFileArea(tab, key);
    }
  } catch (e) { S.fileError[k] = errMsg(e, 'Upload failed. Please try again.'); }
  finally { S.fileBusy[k] = false; renderFileArea(tab, key); }
}
async function removeAnswerFile(tab, key, file) {
  const k = tab + ':' + key;
  if (!confirm('Remove "' + file.name + '"? Everyone will stop seeing it.')) return;
  S.fileBusy[k] = true; S.fileError[k] = ''; renderFileArea(tab, key);
  try { await api('/api/answer-files?id=' + file.id, { method: 'DELETE' }); S.files = S.files.filter(x => x.id !== file.id); }
  catch (e) { S.fileError[k] = errMsg(e, 'Could not remove the file.'); }
  finally { S.fileBusy[k] = false; renderFileArea(tab, key); }
}
const fields = list => h('div', { class: 'fields' }, list.map(field));
const SHORT = ['Event name', 'Who runs it?', 'How do you run it today?', 'What is the hardest part?', 'What would make it easier?', 'Which event should we set up in the app first?'];
const eventFilled = i => sections.events.slice(i * EVENT_FIELDS, (i + 1) * EVENT_FIELDS).some(f => (S.data.events?.[f.key] || '').trim());
const eventNames = () => Array.from({ length: MAX_EVENTS }, (_, i) => (S.data.events?.['event' + i + 'Name'] || '').trim()).filter(Boolean);
function visibleEventCount() {
  let last = -1; for (let i = 0; i < MAX_EVENTS; i++) if (eventFilled(i)) last = i;
  return Math.min(MAX_EVENTS, Math.max(last + 2, S.eventSlots || 1));
}
function eventCards(sec) {
  const n = visibleEventCount();
  return [
    Array.from({ length: n }, (_, i) => {
      const name = (S.data.events?.['event' + i + 'Name'] || '').trim();
      return h('section', { class: 'panel event-card', id: 'event-card-' + i },
        h('div', { class: 'event-card-head' }, h('span', { class: 'event-num' }, String(i + 1)), h('h2', { id: 'event-title-' + i }, name || (eventFilled(i) ? 'Event ' + (i + 1) : 'New event'))),
        h('div', { class: 'fields' }, sec.slice(i * EVENT_FIELDS, (i + 1) * EVENT_FIELDS).map((f, k) => field({ ...f, label: SHORT[k] }))));
    }),
    n < MAX_EVENTS ? h('button', { class: 'add-event', type: 'button', onclick: () => { S.eventSlots = n + 1; renderMain(); setTimeout(() => { const el = $(fieldId('events', 'event' + n + 'Name')); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus({ preventScroll: true }); }, 50); } }, icon('plus', 16), 'Add another event') : h('p', { class: 'muted' }, 'That’s the most events this page holds. Add others under “Anything else about your events?”.')];
}
const DEVICES = [['phone', 'Phone', '390 × 844'], ['tablet', 'Tablet', '820 × 1180'], ['desktop', 'Desktop', 'Full width']];
function devicePicker() {
  return h('div', { class: 'device-picker', role: 'group', 'aria-label': 'Preview size' },
    DEVICES.map(([id, label, size]) => h('button', { type: 'button', class: 'device-btn', 'aria-pressed': String((S.device || 'desktop') === id), onclick: () => { S.device = id; const st = document.querySelector('.device-stage'); if (st) st.className = 'device-stage device-' + id; document.querySelectorAll('.device-btn').forEach(b => b.setAttribute('aria-pressed', String(b.textContent.startsWith(label)))); } }, label, h('small', null, size))),
    h('button', { type: 'button', class: 'quiet', onclick: () => { const f = $('appframe'); if (f) f.src = '/app-preview.html'; } }, icon('refresh', 13), 'Restart demo'));
}
function tabBody(tab) {
  const sec = sections[tab];
  if (tab === 'start') return [
    h('section', { class: 'welcome' },
      h('div', null, h('span', { class: 'eyebrow' }, 'A SIMPLE FIRST STEP'), h('h2', null, 'Your events. Your priorities.', h('br'), 'A concept we can shape together.'),
        h('p', null, 'Short answers are enough. Add what you know now and return whenever you need. Everyone invited to this workspace can view and edit the same planning answers.'),
        h('p', null, 'Everything here plans your ' + TIERS.base.name + ' app (' + TIERS.base.price + '). Tell us everything you wish for anyway: if something goes beyond this plan, DBY will flag it ⚑ and ask whether you’d like it saved for a future upgrade.'),
        null),
      h('div', { class: 'path' }, [['01', 'Share how things work today', 'Events, tools and what gets in the way.'], ['02', 'Explore a first concept', 'Review the sample app and priorities.'], ['03', 'Talk it through', 'Confirm the scope before an estimate.']].map(([n, a, b]) => h('div', null, h('span', null, n), h('p', null, h('strong', null, a), h('small', null, b)))))),
    h('section', { class: 'panel included', id: 'whats-included' },
      h('span', { class: 'eyebrow' }, 'YOUR PLAN'),
      h('h2', null, 'What’s included in ' + TIERS.base.name),
      h('p', { class: 'muted' }, TIERS.base.price + '. Everything below is part of your plan. These questions help us set it up the way Lakeville runs events.'),
      h('div', { class: 'included-grid' }, INCLUDED.map(([group, items]) => h('div', { class: 'included-group' },
        h('h3', null, group), h('ul', null, items.map(i => h('li', null, i))))))),
    h('section', { class: 'panel', id: 'team-goal' }, h('h2', null, 'Your team & goal'), h('p', { class: 'muted' }, 'Tell us who’s helping and what matters most.'), fields(sec))];
  if (tab === 'events') return [
    h('details', { class: 'examples' }, h('summary', null, 'See illustrative event examples'),
      h('div', { class: 'examplegrid' }, [['Holiday Gift Shop', 'Paper forms / Excel', 'Tracking volunteers'], ['School Fundraiser', 'Google Forms', 'Managing payments'], ['Family Night', 'Email sign-ups', 'Tracking attendance']].map(e => h('div', null, h('strong', null, e[0]), h('p', null, e[1]), h('small', null, 'Possible challenge: ' + e[2])))),
      h('p', null, 'These are examples from the planning draft, not Lakeville-confirmed events or tools.')),
    eventCards(sec),
    h('section', { class: 'panel' }, h('h2', null, 'Your tools & other notes'), fields(sec.slice(MAX_EVENTS * EVENT_FIELDS)))];
  if (tab === 'features') {
    const card = ([id, title, desc]) => h('section', { class: 'feature' },
      h('div', null, h('span', { class: 'tier-badge base' }, 'Included'), h('h2', null, title), h('p', null, desc)),
      h('div', null, field({ key: id + 'Priority', label: 'Priority for your first event', options: PRIORITY }), field({ key: id + 'Notes', label: 'What would Lakeville need?', hint: 'Optional notes' })));
    return [
      h('div', { class: 'tier-head' }, h('div', null, h('span', { class: 'eyebrow' }, 'YOUR PLAN'), h('h2', null, TIERS.base.name), h('p', null, TIERS.base.blurb)), h('span', { class: 'tier-price base' }, TIERS.base.price)),
      h('div', { class: 'prioritykey' }, [['Must Have', 'Needed for your first event'], ['Nice to Have', 'Can wait'], ['Not Sure', 'Discuss together']].map(([a, b]) => h('span', null, h('strong', null, a), ' ' + b))),
      h('div', { class: 'featurelist' }, features.filter(x => x[3] === 'base').map(card)),
      h('section', { class: 'panel' }, field(sec.at(-1)))];
  }
  if (tab === 'pro') {
    const pro = features.filter(x => x[3] === 'pro');
    return [
      h('div', { class: 'owner-note' }, '🔒 Only you can see this page. Jessie and Jimmy never see the Pro tier, its fields or your notes.'),
      h('div', { class: 'tier-head' }, h('div', null, h('span', { class: 'eyebrow' }, 'HIGHER TIER · NOT BUILT'), h('h2', null, TIERS.pro.name), h('p', null, 'Mark how strongly Lakeville’s answers point to each feature. Strong signals across enough features make the case for building Pro.')), h('span', { class: 'tier-price pro' }, TIERS.pro.price)),
      h('div', { class: 'prioritykey' }, [['Strong signal', 'They clearly asked for it'], ['Some signal', 'Hinted at it'], ['No signal yet', 'Not mentioned']].map(([a, b]) => h('span', null, h('strong', null, a), ' ' + b))),
      h('div', { class: 'featurelist' }, pro.map(([id, title, desc]) => h('section', { class: 'feature tier-pro' },
        h('div', null, h('span', { class: 'tier-badge pro' }, 'Pro'), h('h2', null, title), h('p', null, desc),
          AHEAD.some(a => a[0] === id) ? h('p', { class: 'ahead-says' }, 'Lakeville on “Looking ahead”: ', h('strong', null, S.data.ahead?.[id + 'Interest'] || 'not answered yet'), S.data.ahead?.[id + 'AheadNotes'] ? ' · “' + S.data.ahead[id + 'AheadNotes'] + '”' : '') : null),
        h('div', null, field({ key: id + 'Signal', label: 'Signal from Lakeville', options: SIGNAL }), field({ key: id + 'Evidence', label: 'Evidence', hint: 'What they said and where' }))))),
      h('section', { class: 'panel', id: 'flag-overview' }, flagOverview()),
      h('section', { class: 'panel' }, h('h2', null, 'Pricing & ideas'), fields(sec.slice(-3)))];
  }
  if (tab === 'ahead') {
    const byId = Object.fromEntries(features.map(x => [x[0], x]));
    return [
      h('section', { class: 'ahead-intro' }, h('span', { class: 'eyebrow' }, 'OPTIONAL · FUTURE UPGRADES'),
        h('h2', null, 'Thinking beyond your first year'),
        h('p', null, 'Your ' + TIERS.base.name + ' plan (' + TIERS.base.price + ') covers sign-ups, tickets, check-in, payment tracking and reports. The ideas below are ', h('strong', null, 'not'), ' part of it and aren’t built. They could become a future upgrade. Tell us which ones you’d actually use, so we only build what helps. Skip any that don’t apply.')),
      h('div', { class: 'featurelist' }, AHEAD.map(([id]) => h('section', { class: 'feature ahead-card' },
        h('div', null, h('span', { class: 'tier-badge ahead' }, 'Future idea'), h('h2', null, byId[id]?.[1] || id), h('p', null, byId[id]?.[2] || '')),
        h('div', null, fields(sec.filter(f => f.key === id + 'Interest' || f.key === id + 'AheadNotes')))))),
      h('section', { class: 'panel' }, fields(sec.slice(-1)))];
  }
  if (tab === 'preview') return [
    h('div', { class: 'owner-note' }, '🔒 Only you can see this page. Jessie and Jimmy don’t see the App preview until you choose to share it.'),
    h('div', { class: 'previewintro' }, h('p', null, 'Try Events, Volunteers and My Sign-ups. Switch “Preview as” to see PTA Admin. Sample sign-ups stay inside this demo.'), h('a', { href: '/app-preview.html', target: '_blank', rel: 'noreferrer' }, 'Open preview in a new tab ↗')),
    devicePicker(),
    h('div', { class: 'device-stage device-' + (S.device || 'desktop') }, h('div', { class: 'device-frame' }, h('iframe', { title: 'Illustrative Lakeville Events App', src: '/app-preview.html', class: 'appframe', id: 'appframe' }))),
    h('section', { class: 'panel' }, h('h2', null, 'Your notes on this draft'), fields(sec))];
  if (tab === 'workflow') {
    const journey = ['PTA lead creates details and capacity.', 'An administrator approves publication.', 'PTA shares the event link.', 'Parents register their family.', 'Volunteers choose time slots.', 'PTA checks tasks and sends updates.', 'Assigned helpers mark arrivals.', 'PTA reviews attendance and financial follow-up.'];
    return [
      h('details', { class: 'examples' }, h('summary', null, 'See a possible event journey and roles'), h('ol', null, steps.map((s, i) => h('li', null, h('strong', null, s), ' — ' + journey[i]))),
        h('p', null, 'Possible access: PTA leads manage assigned events. Administrators manage publishing and access. Volunteers see assigned duties. Parents manage their own family. Lakeville should confirm or change this.')),
      h('section', { class: 'panel' }, h('h2', null, 'Lakeville’s event journey'), fields(sec.slice(0, 10))),
      h('section', { class: 'panel' }, h('h2', null, 'Who needs to do what?'), fields(sec.slice(10)))];
  }
  return [
    h('section', { class: 'panel' }, h('h2', null, 'Before we define the first version'), fields(sec.slice(0, 8))),
    h('section', { class: 'panel accounting' }, h('span', { class: 'eyebrow' }, 'A FUTURE CONNECTION'), h('h2', null, 'Events and accounting, together?'),
      h('p', null, 'The Events App can remain a separate project while a future connection links registrations and transactions. We need to confirm which system owns the financial records.'), fields(sec.slice(8)))];
}
function nameBar() {
  if (!S.me || (S.me.named && !S.nameEditing)) return null;
  let input;
  const submit = async e => {
    e.preventDefault(); const name = input.value.trim(); if (!name || S.nameBusy) return;
    S.nameBusy = true; S.nameError = ''; renderMain();
    try { S.me = { ...S.me, ...await api('/api/me', jsonOpts('PUT', { name })) }; S.nameEditing = false; }
    catch (err) { S.nameError = errMsg(err, 'Could not save your name.'); }
    finally { S.nameBusy = false; renderMain(); }
  };
  return h('form', { class: 'namebar', onsubmit: submit },
    h('label', { for: 'yourName' }, S.me.named ? 'Change your name' : 'What should the team call you?'),
    h('input', { id: 'yourName', maxlength: 60, value: S.me.name, ref: el => { input = el; }, autocomplete: 'name' }),
    h('button', { class: 'primary', type: 'submit', disabled: S.nameBusy }, S.nameBusy ? 'Saving…' : 'Save name'),
    S.me.named ? h('button', { class: 'quiet', type: 'button', onclick: () => { S.nameEditing = false; renderMain(); } }, 'Cancel') : null,
    h('small', null, S.nameError || 'Shown beside your comments and saved answers.'));
}
function renderMain() {
  const tab = S.tab, record = S.records[tab], introCount = countFor(tab, INTRO_KEY);
  fill($('main'), 
    nameBar(),
    h('div', { class: 'eyebrow' }, 'PLANNING WORKSPACE'),
    h('div', { class: 'heading intro-anchor', id: fieldId(tab, INTRO_KEY), tabindex: '-1' },
      h('div', null, h('h1', null, titleFor(tab)), h('p', null, descriptions[tab])),
      h('div', { class: 'heading-side' }, h('span', { class: 'statusbadge' }, 'Discovery stage'),
        null)),
    h('div', { class: 'context' }, h('span', { class: 'dot' }), h('span', null, 'Examples are illustrative. Lakeville’s confirmed details belong in the answer fields.'),
      null),
    ownerOnly(tab) ? null : h('div', { class: 'scope-note' }, h('span', { class: 'flag-icon', 'aria-hidden': 'true' }, '⚑'),
      h('span', null, 'These questions plan your ', h('strong', null, TIERS.base.name), ' app (' + TIERS.base.price + '). If something you describe goes beyond it, DBY will flag it like this and ask whether you’d like it planned for a future upgrade. Your current plan doesn’t change.')),
    h('div', { class: 'autosave-note' }, icon('save', 14), h('span', null, 'Answers save automatically as you type. Deleted something by mistake? Use ', h('strong', null, 'Earlier versions'), ' under the question to bring it back.')),
    h('div', { id: 'incoming' }),
    !S.loaded && !S.error ? h('p', { role: 'status' }, 'Loading shared answers…') : null,
    S.error ? h('div', { class: 'error', role: 'alert' }, S.error + ' ', h('button', { class: 'quiet', onclick: reload }, 'Reload saved answers')) : null,
    tabBody(tab),
    h('div', { class: 'savebar' },
      h('div', null, h('strong', { id: 'saveState', role: 'status' }), h('small', { id: 'saveMeta' }), h('span', { id: 'notice' }))),
    pageNav(tab),
    h('footer', null,
      h('span', { class: 'whoami' }, 'Signed in as ' + (S.me?.name || '…'), S.me?.named ? h('button', { class: 'quiet', type: 'button', onclick: () => { S.nameEditing = true; renderMain(); $('yourName')?.focus(); } }, '(change name)') : null, ' · ', h('a', { href: '/cdn-cgi/access/logout' }, 'Sign out')),
      h('span', null, 'No family or student personal details are needed.')));
  renderIncoming(); renderSaveBar(); renderLayoutState();
}
function pageNav(tab) {
  const i = tabs.findIndex(t => t[0] === tab), prev = tabs[i - 1], next = tabs[i + 1];
  return h('nav', { class: 'pagenav', 'aria-label': 'Page navigation' },
    prev ? h('button', { class: 'pagenav-btn', type: 'button', onclick: () => setTab(prev[0]) }, icon('left', 15), h('span', null, h('small', null, 'Previous'), prev[1])) : h('span'),
    h('span', { class: 'pagenav-count' }, `${i + 1} of ${tabs.length}`),
    next ? h('button', { class: 'pagenav-btn next', type: 'button', onclick: () => setTab(next[0]) }, h('span', null, h('small', null, 'Next'), next[1]), icon('right', 15)) : h('span'));
}
function renderIncoming() {
  const el = $('incoming'); if (!el) return; S.incoming = [];
  fill(el, S.incoming.includes(S.tab) ? h('div', { class: 'incoming', role: 'status' }, 'New saved answers are available in this section. Your unsaved draft is kept. Save or export your draft before using Reload saved.') : '');
}
const inTab = (obj, tab) => Object.keys(obj).some(k => k.startsWith(tab + ':') && obj[k]);
function renderSaveBar() {
  const el = $('saveState'); if (!el) return;
  const tab = S.tab, record = S.records[tab];
  const busy = inTab(S.pending, tab) || inTab(S.saving, tab), failed = inTab(S.failed, tab), conflict = inTab(S.conflicts, tab);
  el.textContent = conflict ? 'One answer needs your decision ↑' : failed ? 'Couldn’t save. Retrying…' : busy ? 'Saving…' : record ? 'All changes saved ✓' : 'Answers save automatically';
  el.className = conflict || failed ? 'save-warn' : busy ? '' : 'save-ok';
  $('saveMeta').textContent = record ? `Last change by ${record.updated_by} · ${new Date(record.updated_at).toLocaleString()}` : 'Type your answers. Everything is saved as you go.';
  $('notice').textContent = S.notice;
}
function change(key, value) {
  const m = S.tab === 'events' && /^event(\d+)Name$/.exec(key);
  if (m) { const t = $('event-title-' + m[1]); if (t) t.textContent = value.trim() || 'Event ' + (+m[1] + 1); }
  const tab = S.tab, k = tab + ':' + key;
  S.data = { ...S.data, [tab]: { ...S.data[tab], [key]: value } };
  S.notice = '';
  clearTimeout(S.pending[k]);
  const isChoice = sections[tab].find(f => f.key === key)?.options || (tab === 'workflow' && key === 'event');
  S.pending[k] = setTimeout(() => saveField(tab, key), isChoice ? 0 : 900);
  markDirty(tab); renderSaveBar();
}
function markDirty(tab) {
  const d = inTab(S.pending, tab) || inTab(S.saving, tab) || inTab(S.failed, tab) || inTab(S.conflicts, tab);
  if (!!S.dirty[tab] !== d) { S.dirty = { ...S.dirty, [tab]: d }; renderNav(); }
}
async function saveField(tab, key, overrideBase) {
  const k = tab + ':' + key;
  delete S.pending[k];
  if (S.saving[k]) { S.pending[k] = setTimeout(() => saveField(tab, key), 300); return; }
  const value = S.data[tab]?.[key] || '', base = overrideBase ?? (S.base[tab]?.[key] || '');
  S.saving[k] = true; delete S.failed[k]; renderSaveBar();
  try {
    const p = await api('/api/plan', jsonOpts('PATCH', { section: tab, key, value, base }));
    S.base[tab] = { ...S.base[tab], [key]: value };
    if (p.section) mergeSection(p.section, key);
    delete S.conflicts[k]; renderConflict(tab, key);
  } catch (e) {
    if (e.status === 409 && e.body?.conflict) { S.conflicts[k] = { current: e.body.current, by: e.body.by }; renderConflict(tab, key); }
    else if (e.status === 400) { S.notice = errMsg(e, 'That answer could not be saved.'); delete S.failed[k]; }
    else { S.failed[k] = true; S.pending[k] = setTimeout(() => saveField(tab, key), 4000); }
  } finally { delete S.saving[k]; markDirty(tab); renderSaveBar(); }
}
function historyLink(tab, key) {
  return h('button', { class: 'quiet history-link', type: 'button', onclick: () => openHistory(tab, key) }, icon('undo', 12), 'Earlier versions');
}
async function openHistory(tab, key) {
  const box = $('history-' + fieldId(tab, key)); if (!box) return;
  fill(box, h('small', { class: 'muted' }, 'Loading earlier versions…'));
  try {
    const p = await api('/api/plan/history?section=' + encodeURIComponent(tab) + '&key=' + encodeURIComponent(key));
    fill(box, h('div', { class: 'history-list' },
      h('div', { class: 'history-head' }, h('strong', null, p.versions.length ? 'Earlier versions' : 'No earlier versions yet'), h('button', { class: 'quiet', type: 'button', onclick: () => fill(box, historyLink(tab, key)) }, 'Close')),
      p.versions.map(v => h('div', { class: 'history-item' },
        h('p', null, v.value),
        h('small', null, `Replaced by ${v.replaced_by} · ${fmtTime(v.replaced_at)}`),
        h('button', { class: 'quiet', type: 'button', onclick: () => { const el = $(fieldId(tab, key)); if (el) el.value = v.value; change(key, v.value); fill(box, historyLink(tab, key)); S.notice = 'Earlier version restored.'; renderSaveBar(); } }, 'Restore')))));
  } catch (e) { fill(box, h('small', { class: 'muted' }, errMsg(e, 'Could not load earlier versions.')), ' ', historyLink(tab, key)); }
}
function renderConflict(tab, key) {
  const box = $('conflict-' + fieldId(tab, key)); if (!box) return;
  const c = S.conflicts[tab + ':' + key];
  fill(box, c ? h('div', { class: 'conflict', role: 'alert' },
    h('strong', null, `${c.by || 'Someone'} just changed this answer.`),
    h('p', null, 'Their version: ', h('em', null, c.current || '(empty)')),
    h('div', null,
      h('button', { class: 'primary', type: 'button', onclick: () => { saveField(tab, key, c.current); } }, 'Keep mine'),
      h('button', { class: 'quiet', type: 'button', onclick: () => { S.data[tab] = { ...S.data[tab], [key]: c.current }; S.base[tab] = { ...S.base[tab], [key]: c.current }; delete S.conflicts[tab + ':' + key]; const el = $(fieldId(tab, key)); if (el) el.value = c.current; renderConflict(tab, key); markDirty(tab); renderSaveBar(); } }, 'Use theirs'))) : '');
}
function refreshFieldValues(tab) {
  if (tab !== S.tab) return;
  for (const f of document.querySelectorAll('#main .field textarea, #main .field select')) {
    const key = f.id.slice(fieldId(tab, '').length), v = S.data[tab]?.[key] || '';
    if (f.value !== v) f.value = v;
  }
}

/* ---------- planning data ---------- */
async function load() {
  S.loaded = false; S.error = ''; renderMain();
  try {
    const p = await api('/api/plan');
    S.records = Object.fromEntries(p.sections.map(s => [s.id, s]));
    S.data = Object.fromEntries(p.sections.map(s => [s.id, { ...s.content }]));
    S.base = Object.fromEntries(p.sections.map(s => [s.id, { ...s.content }]));
    S.files = p.files || [];
    S.dirty = {}; S.incoming = []; S.loaded = true; S.notice = 'Saved answers loaded.';
  } catch (e) { S.error = errMsg(e, 'Could not load your answers.'); }
  renderNav(); renderMain();
}
function reload() {
  if ((Object.keys(S.pending).length || Object.keys(S.saving).length || Object.keys(S.conflicts).length) && !confirm('Some answers are still saving or need a decision. Reload anyway?')) return;
  Object.values(S.pending).forEach(clearTimeout); S.pending = {}; S.failed = {}; S.conflicts = {};
  load();
}
function download() {
  const payload = { project: 'Lakeville PTA Events App planning', exportedAt: new Date().toISOString(), sections: tabs.map(([id, title]) => ({ section: title, hasUnsavedChanges: !!S.dirty[id], lastSavedBy: S.records[id]?.updated_by || null, lastSavedAt: S.records[id]?.updated_at || null, answers: sections[id].filter(f => S.data[id]?.[f.key] || S.files.some(x => x.section === id && x.field_key === f.key)).map(f => ({ question: f.label, answer: S.data[id]?.[f.key] || '', files: S.files.filter(x => x.section === id && x.field_key === f.key).map(x => x.name) })) })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = h('a', { href: url, download: 'lakeville-planning-responses.json' }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
let planSyncing = false;
// Bring other people's answers in, field by field, without touching anything I'm still editing.
function mergeSection(sec, skipKey) {
  S.records[sec.id] = sec;
  const active = document.activeElement;
  const keys = new Set([...Object.keys(sec.content), ...Object.keys(S.base[sec.id] || {})]);
  for (const key of keys) {
    if (key === skipKey) continue;
    const k = sec.id + ':' + key, server = sec.content[key] || '', base = S.base[sec.id]?.[key] || '', mine = S.data[sec.id]?.[key] || '';
    if (server === base) continue;
    if (mine === base && !S.pending[k] && !S.saving[k]) {
      S.data[sec.id] = { ...S.data[sec.id], [key]: server }; S.base[sec.id] = { ...S.base[sec.id], [key]: server };
      const el = sec.id === S.tab && $(fieldId(sec.id, key));
      if (el && (el !== active || el.value === base) && el.value !== server) el.value = server;
    } else if (mine === server) { S.base[sec.id] = { ...S.base[sec.id], [key]: server }; }
  }
}
async function syncPlan() {
  if (!S.loaded || document.hidden || planSyncing) return;
  planSyncing = true;
  try {
    const p = await api('/api/plan');
    if (JSON.stringify(p.files || []) !== JSON.stringify(S.files)) { S.files = p.files || []; renderAllFileAreas(); }
    const changed = p.sections.filter(s => s.revision !== (S.records[s.id]?.revision || 0));
    if (!changed.length) return;
    const active = document.activeElement;
    for (const sec of changed) mergeSection(sec);
    renderNav(); renderSaveBar();
    if (S.tab === 'events') {
      const shown = document.querySelectorAll('#main .event-card').length, typing = active && $('main').contains(active);
      if (shown !== visibleEventCount() && !typing) renderMain();
      else for (let i = 0; i < shown; i++) { const t = $('event-title-' + i), n = (S.data.events?.['event' + i + 'Name'] || '').trim(); if (t && n) t.textContent = n; }
    }
  } catch { /* try again next tick */ }
  finally { planSyncing = false; }
}

/* ---------- comment anchors on the page ---------- */
function comment(f) {
  const tab = S.tab, el = f ? $(fieldId(tab, f.key)) : null;
  const selected = el instanceof HTMLTextAreaElement && el.selectionEnd > el.selectionStart ? el.value.slice(el.selectionStart, el.selectionEnd) : '';
  const text = selected || (f ? (S.data[tab]?.[f.key] || sections[tab].find(x => x.key === f.key)?.label || f.label) : '');
  openComposer({ section: tab, fieldKey: f?.key || null, quote: text.slice(0, 500) });
}
function commentIntro() { openComposer({ section: S.tab, fieldKey: INTRO_KEY, quote: (titleFor(S.tab) + ' — ' + descriptions[S.tab]).slice(0, 500) }); }
function openComposer(anchor) {
  S.panelView = 'dby'; C.newAnchor = anchor; C.active = null; C.messages = []; C.composing = true; C.error = ''; C.editing = null; C.confirmDelete = null;
  S.commentsOpen = true; renderLayoutState(); onSectionChange(true);
  setTimeout(() => $('team-comment')?.focus(), 30);
}
function jump(section, key) {
  if (S.tab !== section) setTab(section);
  setTimeout(() => {
    const el = key ? $(fieldId(section, key)) : document.querySelector('main h1');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelectorAll('.comment-highlight').forEach(e => e.classList.remove('comment-highlight'));
    el?.classList.add('comment-highlight');
    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
  }, 120);
}
function updateCounts(counts) {
  const before = JSON.stringify(S.counts); S.counts = counts || [];
  if (before === JSON.stringify(S.counts)) return;
  renderLayoutState();
  for (const b of document.querySelectorAll('#main [data-anchor]')) {
    const n = countFor(S.tab, b.getAttribute('data-anchor'));
    b.lastChild.textContent = n ? String(n) : 'Ask DBY';
  }
  const intro = $('introComment');
  if (intro) { const n = countFor(S.tab, INTRO_KEY); intro.className = n ? 'comment-anchor intro-comment has-comments' : 'comment-anchor intro-comment'; intro.lastChild.textContent = n ? n + ' on intro' : 'Comment on intro'; intro.setAttribute('aria-label', 'Comment on the page introduction' + (n ? ` (${n} open)` : '')); }
}

/* ---------- comments panel ---------- */
const listSection = () => 'all';
const target = () => C.newAnchor || { section: 'general', fieldKey: null, quote: '' };
const draftKey = () => C.active ? 'reply:' + C.active.id : 'new:' + target().section + ':' + (target().fieldKey || '');
function onSectionChange(force) {
  const key = listSection();
  if (key !== C.listKey || force) { C.listKey = key; C.threads = []; C.nextThreads = null; C.lastList = ''; C.connected = false; }
  renderPanel(); pollList(); if (C.active) pollThread();
}
let listBusy = false, threadBusy = false;
async function pollList() {
  if (listBusy || document.hidden) return;
  listBusy = true; const key = listSection(), gen = C.gen;
  try {
    const p = await api('/api/comments?section=' + key);
    if (key !== listSection() || gen !== C.gen) return;
    if (p.me) C.me = p.me;
    updateCounts(p.counts);
    const snapshot = JSON.stringify([p.threads, p.nextBefore]);
    const wasConnected = C.connected; C.connected = true;
    if (snapshot !== C.lastList || !wasConnected) {
      C.lastList = snapshot;
      const lastSeq = p.threads.at(-1)?.seq || 0;
      C.threads = [...p.threads, ...C.threads.filter(t => t.seq < lastSeq && !p.threads.some(x => x.id === t.id))];
      if (C.nextThreads == null || p.threads.length) C.nextThreads = p.nextBefore;
      if (!C.active) renderPanel(); else renderPanelHeader();
    }
  } catch (e) { const was = C.connected; C.connected = false; if (e.status) C.error = e.message; if (was || e.status) renderPanel(); }
  finally { listBusy = false; }
}
async function pollThread() {
  if (!C.active || threadBusy || document.hidden) return;
  threadBusy = true; const id = C.active.id, gen = C.gen;
  try {
    const p = await api('/api/comments?thread=' + id);
    if (C.active?.id !== id || gen !== C.gen) return;
    if (p.me) C.me = p.me;
    const snapshot = JSON.stringify([p.thread, p.messages]);
    if (snapshot !== C.lastThread) {
      C.lastThread = snapshot; C.active = p.thread;
      const first = p.messages[0]?.seq || 0;
      C.messages = [...C.messages.filter(m => m.seq < first), ...p.messages];
      if (C.nextMessages == null || p.messages.length) C.nextMessages = p.nextBefore;
      if (!C.editing && !C.confirmDelete) renderPanel();
    }
    C.connected = true;
  } catch (e) {
    if (gen !== C.gen) { /* superseded */ }
    else if (e.status === 404 && C.active?.id === id) { C.active = null; C.messages = []; C.lastList = ''; renderPanel(); pollList(); }
    else { C.connected = false; if (e.status) { C.error = e.message; renderPanel(); } }
  } finally { threadBusy = false; }
}
function openThread(t) { C.active = t; C.messages = []; C.nextMessages = null; C.lastThread = ''; C.composing = false; C.error = ''; C.editing = null; C.confirmDelete = null; C.scrollAtEnd = true; renderPanel(); pollThread(); }
function backToList() { C.active = null; C.messages = []; C.error = ''; C.editing = null; C.confirmDelete = null; C.lastList = ''; renderPanel(); pollList(); }

async function upload(files) {
  const key = draftKey(), staged = C.uploads[key] || [];
  if (!files?.length || C.busy || C.uploading) return;
  if (files.length + staged.length > 5) { C.error = 'Attach up to five files per comment.'; renderPanel(); return; }
  C.uploading = true; C.error = ''; renderPanel();
  try {
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) throw new Error('Each file must be 20 MB or smaller.');
      const form = new FormData(); form.append('file', file);
      const p = await api('/api/attachments', { method: 'POST', body: form });
      C.uploads = { ...C.uploads, [key]: [...(C.uploads[key] || []), p.attachment] };
    }
  } catch (e) { C.error = errMsg(e, 'Upload failed. Please try again.'); }
  finally { C.uploading = false; renderPanel(); }
}
async function removeUpload(id) {
  const key = draftKey(); C.uploading = true; C.error = ''; renderPanel();
  try { await api('/api/attachments?id=' + id, { method: 'DELETE' }); C.uploads = { ...C.uploads, [key]: (C.uploads[key] || []).filter(f => f.id !== id) }; }
  catch (e) { C.error = errMsg(e, 'Could not remove upload.'); }
  finally { C.uploading = false; renderPanel(); }
}
async function send(e) {
  e.preventDefault(); C.gen++;
  const key = draftKey(), draft = (C.drafts[key] || '').trim(), files = C.uploads[key] || [];
  if ((!draft && !files.length) || C.busy || C.uploading) return;
  C.busy = true; C.error = ''; renderPanel();
  const signature = JSON.stringify([draft, files.map(f => f.id)]);
  if (C.outgoing?.key !== key || C.outgoing?.body !== signature) C.outgoing = { key, body: signature, id: crypto.randomUUID() };
  try {
    const t = target();
    const p = await api('/api/comments', jsonOpts('POST', { requestId: C.outgoing.id, body: draft, attachmentIds: files.map(f => f.id), ...(C.active ? { threadId: C.active.id } : { section: t.section, fieldKey: t.fieldKey, quote: t.quote }) }));
    C.drafts = { ...C.drafts, [key]: '' }; C.uploads = { ...C.uploads, [key]: [] }; C.outgoing = null; C.scrollAtEnd = true;
    const d = await api('/api/comments?thread=' + p.threadId);
    C.active = d.thread; C.messages = d.messages; C.nextMessages = d.nextBefore; C.lastThread = JSON.stringify([d.thread, d.messages]); C.composing = false; C.newAnchor = null; C.lastList = '';
  } catch (err) { C.error = errMsg(err, 'Comment not sent. Please try again.'); }
  finally { C.busy = false; renderPanel(); pollList(); }
}
async function resolve() { C.gen++;
  if (!C.active || C.busy) return;
  C.busy = true; C.error = ''; renderPanel();
  try { const p = await api('/api/comments', jsonOpts('PATCH', { threadId: C.active.id, resolved: !C.active.resolved, revision: C.active.revision })); C.active = p.thread; C.lastThread = ''; C.lastList = ''; }
  catch (e) { C.error = errMsg(e, 'Could not update discussion.'); }
  finally { C.busy = false; renderPanel(); pollList(); }
}
async function saveEdit(m) { C.gen++;
  if (C.busy) return;
  const body = C.editText.trim();
  if (!body && !m.attachments?.length) { C.error = 'A comment cannot be empty. Use Delete to remove it.'; renderPanel(); return; }
  C.busy = true; C.error = ''; renderPanel();
  try {
    const p = await api('/api/comments', jsonOpts('PATCH', { messageId: m.request_id, body }));
    C.messages = C.messages.map(x => x.request_id === m.request_id ? { ...x, body: p.message.body, edited_at: p.message.edited_at } : x);
    C.editing = null; C.lastThread = ''; C.lastList = '';
  } catch (e) { C.error = errMsg(e, 'Could not edit the comment.'); }
  finally { C.busy = false; renderPanel(); pollList(); }
}
async function removeMessage(m) { C.gen++;
  if (C.busy) return;
  C.busy = true; C.error = ''; renderPanel();
  try {
    const p = await api('/api/comments?message=' + m.request_id, { method: 'DELETE' });
    C.confirmDelete = null; C.lastList = '';
    if (p.threadDeleted) { const gone = C.active?.id; C.active = null; C.messages = []; C.threads = C.threads.filter(t => t.id !== gone); }
    else { C.messages = C.messages.filter(x => x.request_id !== m.request_id); C.lastThread = ''; }
  } catch (e) { C.error = errMsg(e, 'Could not delete the comment.'); }
  finally { C.busy = false; renderPanel(); pollList(); }
}
async function older(kind) {
  const before = kind === 'threads' ? C.nextThreads : C.nextMessages;
  if (!before || C.busy) return;
  C.busy = true; C.error = ''; renderPanel();
  try {
    if (kind === 'threads') { const p = await api('/api/comments?section=' + listSection() + '&before=' + before); C.threads = [...C.threads, ...p.threads.filter(t => !C.threads.some(o => o.id === t.id))]; C.nextThreads = p.nextBefore; }
    else { const p = await api('/api/comments?thread=' + C.active.id + '&before=' + before); C.scrollAtEnd = false; C.messages = [...p.messages.filter(m => !C.messages.some(o => o.seq === m.seq)), ...C.messages]; C.nextMessages = p.nextBefore; }
  } catch (e) { C.error = errMsg(e, 'Could not load older comments.'); }
  finally { C.busy = false; renderPanel(); }
}

function renderPanelHeader() {
  const el = $('connState'); if (!el) return;
  el.className = C.connected ? 'connection online' : 'connection';
  el.textContent = C.connected ? 'Updates automatically' : 'Connecting / retrying';
}
const fmtTime = iso => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const imageCache = new Map();
function cachedImage(file) {
  if (!imageCache.has(file.id)) imageCache.set(file.id, h('img', { class: 'attachment-image', src: '/api/attachments?id=' + file.id, alt: file.name, loading: 'lazy' }));
  return imageCache.get(file.id);
}
function messageView(m) {
  const mine = C.me && m.author_id === C.me;
  const editing = C.editing === m.request_id, confirming = C.confirmDelete === m.request_id;
  return h('article', { class: 'chat-message' },
    h('div', { class: 'message-head' }, h('strong', null, m.author_name), h('time', { datetime: m.created_at }, fmtTime(m.created_at), m.edited_at ? h('span', { class: 'edited' }, '(edited)') : null)),
    editing
      ? h('div', { class: 'message-edit' }, h('label', { class: 'sr-only', for: 'edit-' + m.request_id }, 'Edit comment'),
        h('textarea', { id: 'edit-' + m.request_id, value: C.editText, disabled: C.busy, maxlength: 4000, rows: 3, oninput: e => { C.editText = e.target.value; } }),
        h('div', null, h('button', { class: 'quiet', type: 'button', disabled: C.busy, onclick: () => { C.editing = null; renderPanel(); } }, 'Cancel'),
          h('button', { class: 'primary', type: 'button', disabled: C.busy, onclick: () => saveEdit(m) }, C.busy ? 'Saving…' : 'Save')))
      : m.body ? h('p', null, m.body) : null,
    flagSlot('ask:' + m.request_id),
    !mine && S.me?.isOwner ? h('div', { class: 'message-tools' }, flagButton('ask:' + m.request_id)) : null,
    m.attachments?.length ? h('div', { class: 'message-attachments' }, m.attachments.map(file => h('div', null,
      file.content_type.startsWith('image/') ? h('a', { href: '/api/attachments?id=' + file.id, target: '_blank', rel: 'noreferrer' }, cachedImage(file)) : null,
      h('a', { class: 'file-link', href: '/api/attachments?id=' + file.id, target: '_blank', rel: 'noreferrer' }, icon('file', 17), h('span', null, file.name, h('small', null, size(file.size) + ' · ' + (file.content_type.startsWith('image/') || file.content_type === 'application/pdf' ? 'Open example' : 'Download example'))))))) : null,
    mine && !editing ? (confirming
      ? h('div', { class: 'message-confirm', role: 'group', 'aria-label': 'Confirm delete' }, h('span', null, 'Delete this comment' + (m.attachments?.length ? ' and its attachments' : '') + '?'),
        h('button', { class: 'quiet', type: 'button', disabled: C.busy, onclick: () => { C.confirmDelete = null; renderPanel(); } }, 'Cancel'),
        h('button', { class: 'danger', type: 'button', disabled: C.busy, onclick: () => removeMessage(m) }, C.busy ? 'Deleting…' : 'Delete'))
      : h('div', { class: 'message-tools' },
        h('button', { class: 'quiet', type: 'button', disabled: C.busy, onclick: () => { C.editing = m.request_id; C.editText = m.body; C.confirmDelete = null; C.error = ''; renderPanel(); setTimeout(() => $('edit-' + m.request_id)?.focus(), 0); } }, icon('pencil', 12), 'Edit'),
        h('button', { class: 'quiet', type: 'button', disabled: C.busy, onclick: () => { C.confirmDelete = m.request_id; C.editing = null; C.error = ''; renderPanel(); } }, icon('trash', 12), 'Delete'))) : null);
}
function composeView() {
  const key = draftKey(), files = C.uploads[key] || [], draft = C.drafts[key] || '', t = target();
  let fileInput;
  const canAttach = !!S.me?.attachments;
  return h('form', { class: 'comment-compose', onsubmit: send },
    !C.active ? h('div', { class: 'compose-context' }, h('small', null, 'COMMENTING ON'), h('strong', null, location(t)), t.quote ? h('blockquote', null, t.quote) : null) : null,
    h('label', { class: 'sr-only', for: 'team-comment' }, C.active ? 'Reply to discussion' : 'New comment'),
    h('textarea', { id: 'team-comment', value: draft, disabled: C.busy, maxlength: 4000, rows: 3, placeholder: C.active ? 'Write a reply…' : 'Share a question or suggestion…', oninput: e => { C.drafts[key] = e.target.value; const b = $('sendBtn'); if (b) b.disabled = C.busy || C.uploading || (!e.target.value.trim() && !files.length); } }),
    canAttach ? h('div', { class: 'attachment-tools' },
      h('input', { type: 'file', accept: '.doc,.docx,.xls,.xlsx,.pdf,.jpg,.jpeg,.png', multiple: true, hidden: true, ref: el => { fileInput = el; }, onchange: e => upload(e.target.files) }),
      h('button', { class: 'quiet', type: 'button', disabled: C.busy || C.uploading || files.length >= 5, onclick: () => fileInput.click() }, icon('clip', 14), C.uploading ? 'Uploading…' : 'Attach examples'),
      h('small', null, 'Up to 5 files · 20 MB each')) : null,
    files.length ? h('div', { class: 'draft-attachments' }, files.map(file => h('div', { class: 'draft-attachment' }, icon('file', 14), h('span', null, `${file.name} (${size(file.size)})`),
      h('button', { class: 'quiet iconbutton', type: 'button', disabled: C.busy || C.uploading, 'aria-label': 'Remove ' + file.name, onclick: () => removeUpload(file.id) }, icon('x', 14))))) : null,
    h('div', null, h('small', null, 'Visible to everyone with portal access'),
      h('button', { class: 'primary', id: 'sendBtn', type: 'submit', disabled: C.busy || C.uploading || (!draft.trim() && !files.length) }, icon('send', 14), C.busy ? 'Sending…' : C.active ? 'Reply' : 'Post comment')));
}
function panelHeader() {
  const tab = (id, label, ic) => h('button', { class: 'panel-tab', role: 'tab', 'aria-selected': String(S.panelView === id), type: 'button', onclick: () => { if (S.panelView !== id) { S.panelView = id; renderPanel(); if (id === 'team') pollTeam(); else pollList(); } } }, icon(ic, 15), label);
  return h('div', { class: 'comments-heading' },
    h('div', { class: 'panel-tabs', role: 'tablist' }, tab('team', 'Team chat', 'users'), tab('dby', 'Questions for DBY', 'message')),
    h('div', { class: 'panel-head-right' }, h('span', { id: 'connState' }),
      h('button', { class: 'quiet iconbutton', 'aria-label': 'Close sidebar', onclick: () => { S.commentsOpen = false; renderLayoutState(); } }, icon('x', 18))));
}
function renderPanel() {
  const panel = $('panel'); if (!panel) return;
  if (S.panelView === 'team') return renderTeam(panel);
  // keep focus, caret and scroll positions across re-renders
  const active = document.activeElement, focusId = active && panel.contains(active) ? active.id : null;
  const caret = focusId && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const listScroll = panel.querySelector('.thread-list')?.scrollTop || 0;
  const feedOld = panel.querySelector('.message-feed'), feedScroll = feedOld?.scrollTop || 0;
  const visible = C.threads.filter(t => C.showResolved || !t.resolved);
  const a = C.active;
  fill(panel, 
    panelHeader(),
    C.error ? h('div', { role: 'alert', class: 'comment-error' }, C.error) : null,
    a ? [
      h('div', { class: 'thread-top' }, h('button', { class: 'quiet', onclick: backToList }, icon('left', 14), 'All discussions'), h('span', { class: a.resolved ? 'thread-status resolved' : 'thread-status' }, a.resolved ? 'Resolved' : 'Open')),
      h('div', { class: 'thread-context' }, h('small', null, sectionName(a.section)),
        h('button', { class: 'context-link', disabled: a.section === 'general', onclick: () => jump(a.section, a.field_key) }, location(a)),
        a.quote ? h('blockquote', null, a.quote, h('small', null, 'Quote captured when commented')) : null),
      h('div', { class: 'message-feed', 'aria-live': 'polite', 'aria-relevant': 'additions text', onscroll: e => { const el = e.target; C.scrollAtEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 60; } },
        C.nextMessages ? h('button', { class: 'quiet', disabled: C.busy, onclick: () => older('messages') }, 'Load older replies') : null,
        C.messages.map(messageView)),
      h('div', { class: 'thread-actions' }, h('button', { class: 'quiet', disabled: C.busy, onclick: resolve }, icon(a.resolved ? 'undo' : 'check', 14), a.resolved ? ' Reopen discussion' : ' Resolve discussion'))
    ] : [
      h('div', { class: 'comments-filters dby-bar' },
        h('span', { class: 'dby-count' }, visible.length ? `${visible.length} ${C.showResolved ? '' : 'open '}${visible.length === 1 ? 'discussion' : 'discussions'}` : ''),
        h('label', { class: 'resolved-filter' }, h('input', { type: 'checkbox', checked: C.showResolved, onchange: e => { C.showResolved = e.target.checked; renderPanel(); } }), 'Show resolved')),
      h('div', { class: 'thread-list' },
        !visible.length ? h('div', { class: 'comment-empty' }, icon('message', 24), h('strong', null, `No ${C.showResolved ? '' : 'open '}discussions yet`), h('p', null, 'Use “Ask DBY” beside any question, or ask something general below. DBY’s replies appear here.')) : null,
        visible.map(t => h('button', { class: 'thread-card', onclick: () => openThread(t) }, h('small', null, sectionName(t.section) + (t.resolved ? ' · Resolved' : '')), h('strong', null, location(t)), h('p', null, t.first_message || 'Attached examples'), h('span', null, `${t.created_name} · ${t.message_count} ${t.message_count === 1 ? 'comment' : 'comments'}`))),
        C.nextThreads ? h('button', { class: 'quiet', disabled: C.busy, onclick: () => older('threads') }, 'Load older discussions') : null),
      h('button', { class: 'new-discussion', onclick: () => { C.newAnchor = null; C.composing = !C.composing; renderPanel(); if (C.composing) setTimeout(() => $('team-comment')?.focus(), 0); } }, icon('plus', 16), C.composing ? 'Cancel' : 'Ask a general question')
    ],
    (a && !a.resolved) || (!a && C.composing) ? composeView() : null);
  renderPanelHeader();
  const list = panel.querySelector('.thread-list'); if (list) list.scrollTop = listScroll;
  const feed = panel.querySelector('.message-feed'); if (feed) feed.scrollTop = C.scrollAtEnd ? feed.scrollHeight : feedScroll;
  if (focusId) { const el = $(focusId); if (el && !el.disabled) { el.focus({ preventScroll: true }); if (caret && 'selectionStart' in el) try { el.setSelectionRange(caret[0], caret[1]); } catch { /* not a text input */ } } }
}

/* ---------- Lakeville team chat ---------- */
function openTeam(ref) {
  S.panelView = 'team'; S.commentsOpen = true; T.ref = ref; T.error = '';
  renderLayoutState(); renderPanel(); pollTeam();
  setTimeout(() => $('team-message')?.focus(), 30);
}
let teamBusy = false;
async function pollTeam() {
  if (teamBusy || document.hidden) return;
  teamBusy = true;
  try {
    const p = await api('/api/team');
    T.me = p.me; T.readOnly = !!p.readOnly; T.loaded = true; C.connected = true;
    if (T.filter !== 'All' && !p.topics.includes(T.filter)) T.filter = 'All';
    const snap = JSON.stringify([p.messages, p.topics]);
    if (snap !== T.last) {
      T.last = snap;
      const first = p.messages[0]?.seq || 0;
      T.messages = [...T.messages.filter(m => m.seq < first && !p.messages.some(x => x.id === m.id)), ...p.messages];
      if (T.nextBefore == null || p.messages.length) T.nextBefore = p.nextBefore;
      T.topics = p.topics;
      if (S.panelView === 'team' && !T.editing && !T.confirmDelete) renderPanel();
    }
  } catch (e) { C.connected = false; if (e.status && S.panelView === 'team') { T.error = e.message; renderPanel(); } }
  finally { teamBusy = false; }
}
async function teamCall(fn, fallback) {
  if (T.busy) return;
  T.busy = true; T.error = ''; renderPanel();
  try { await fn(); T.last = ''; }
  catch (e) { T.error = errMsg(e, fallback); }
  finally { T.busy = false; renderPanel(); pollTeam(); }
}
function sendTeam(e) {
  e.preventDefault();
  const topic = postTopic(), body = (T.drafts[topic] || '').trim();
  if (!body) return;
  const id = crypto.randomUUID(), ref = T.ref;
  teamCall(async () => {
    await api('/api/team', jsonOpts('POST', { id, topic, body, ref: ref ? { section: ref.section, field: ref.field } : null }));
    T.drafts[topic] = ''; T.ref = null; T.scrollAtEnd = true;
  }, 'Message not sent. Please try again.');
}
function addTopic(e) {
  e.preventDefault();
  const name = (T.newTopic || '').trim(); if (!name) return;
  teamCall(async () => { const p = await api('/api/team/topics', jsonOpts('POST', { name })); if (!T.topics.includes(p.name)) T.topics = [...T.topics, p.name]; T.filter = p.name; T.newTopic = null; }, 'Could not add the topic.');
}
function teamMessageView(m) {
  const mine = T.me && m.author_id === T.me, editing = T.editing === m.id, confirming = T.confirmDelete === m.id;
  return h('article', { class: 'chat-message team-message' },
    h('div', { class: 'message-head' }, h('strong', null, m.author_name), h('time', { datetime: m.created_at }, fmtTime(m.created_at), m.edited_at ? h('span', { class: 'edited' }, '(edited)') : null)),
    h('div', { class: 'team-tags' }, h('span', { class: 'topic-chip' }, m.topic),
      m.ref_label ? h('button', { class: 'ref-link', type: 'button', title: 'Go to this question', onclick: () => jump(m.ref_section, m.ref_field) }, 'Re: ' + m.ref_label) : null),
    editing
      ? h('div', { class: 'message-edit' }, h('label', { class: 'sr-only', for: 'tedit-' + m.id }, 'Edit message'),
        h('textarea', { id: 'tedit-' + m.id, value: T.editText, disabled: T.busy, maxlength: 4000, rows: 3, oninput: e => { T.editText = e.target.value; } }),
        h('div', null, h('button', { class: 'quiet', type: 'button', disabled: T.busy, onclick: () => { T.editing = null; renderPanel(); } }, 'Cancel'),
          h('button', { class: 'primary', type: 'button', disabled: T.busy, onclick: () => teamCall(async () => { await api('/api/team', jsonOpts('PATCH', { id: m.id, body: T.editText })); T.editing = null; }, 'Could not edit the message.') }, T.busy ? 'Saving…' : 'Save')))
      : h('p', null, m.body),
    flagSlot('team:' + m.id),
    !mine && S.me?.isOwner ? h('div', { class: 'message-tools' }, flagButton('team:' + m.id)) : null,
    mine && !editing ? (confirming
      ? h('div', { class: 'message-confirm', role: 'group', 'aria-label': 'Confirm delete' }, h('span', null, 'Delete this message?'),
        h('button', { class: 'quiet', type: 'button', disabled: T.busy, onclick: () => { T.confirmDelete = null; renderPanel(); } }, 'Cancel'),
        h('button', { class: 'danger', type: 'button', disabled: T.busy, onclick: () => teamCall(async () => { await api('/api/team?id=' + m.id, { method: 'DELETE' }); T.confirmDelete = null; T.messages = T.messages.filter(x => x.id !== m.id); }, 'Could not delete the message.') }, T.busy ? 'Deleting…' : 'Delete'))
      : h('div', { class: 'message-tools' },
        h('button', { class: 'quiet', type: 'button', disabled: T.busy, onclick: () => { T.editing = m.id; T.editText = m.body; T.confirmDelete = null; renderPanel(); setTimeout(() => $('tedit-' + m.id)?.focus(), 0); } }, icon('pencil', 12), 'Edit'),
        h('button', { class: 'quiet', type: 'button', disabled: T.busy, onclick: () => { T.confirmDelete = m.id; T.editing = null; renderPanel(); } }, icon('trash', 12), 'Delete'))) : null);
}
function renderTeam(panel) {
  const active = document.activeElement, focusId = active && panel.contains(active) ? active.id : null;
  const caret = focusId && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const feedOld = panel.querySelector('.message-feed'), feedScroll = feedOld?.scrollTop || 0;
  const shown = T.filter === 'All' ? T.messages : T.messages.filter(m => m.topic === T.filter);
  const topicSelect = (id, value, onchange, withAll) => { const sel = h('select', { id, onchange }, withAll ? h('option', { value: 'All' }, 'All topics') : null, T.topics.map(t => h('option', { value: t }, t))); sel.value = value; return sel; };
  fill(panel,
    panelHeader(),
    h('div', { class: 'team-note' }, S.me?.isOwner ? 'Lakeville’s team space. You can read everything and post as DBY; your messages show your name.' : 'Your Lakeville team space: talk it through here, then put the final answer in the question. DBY can read along.'),
    T.error ? h('div', { role: 'alert', class: 'comment-error' }, T.error) : null,
    h('div', { class: 'comments-filters team-filters' },
      h('label', null, 'Topic', topicSelect('teamFilter', T.filter, e => { T.filter = e.target.value; T.scrollAtEnd = true; renderPanel(); }, true)),
      T.readOnly ? null : (T.newTopic == null
        ? h('button', { class: 'quiet', type: 'button', onclick: () => { T.newTopic = ''; renderPanel(); setTimeout(() => $('newTopic')?.focus(), 0); } }, icon('plus', 13), 'New topic')
        : h('form', { class: 'new-topic', onsubmit: addTopic }, h('input', { id: 'newTopic', maxlength: 40, placeholder: 'e.g. Spring Carnival', value: T.newTopic, oninput: e => { T.newTopic = e.target.value; } }),
          h('button', { class: 'primary', type: 'submit', disabled: T.busy }, 'Add'), h('button', { class: 'quiet', type: 'button', onclick: () => { T.newTopic = null; renderPanel(); } }, 'Cancel')))),
    h('div', { class: 'message-feed', 'aria-live': 'polite', onscroll: e => { const el = e.target; T.scrollAtEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 60; } },
      T.nextBefore ? h('button', { class: 'quiet', disabled: T.busy, onclick: () => teamCall(async () => { const p = await api('/api/team?before=' + T.nextBefore); T.messages = [...p.messages.filter(m => !T.messages.some(o => o.id === m.id)), ...T.messages]; T.nextBefore = p.nextBefore; T.scrollAtEnd = false; }, 'Could not load older messages.') }, 'Load older messages') : null,
      !T.loaded ? h('p', { class: 'comment-empty' }, 'Loading…') : !shown.length ? h('div', { class: 'comment-empty' }, icon('users', 24), h('strong', null, T.filter === 'All' ? 'No team messages yet' : 'Nothing about ' + T.filter + ' yet'), h('p', null, 'Start the conversation below, or use “Discuss with team” beside any question.')) : null,
      shown.map(teamMessageView)),
    T.readOnly ? null : h('form', { class: 'comment-compose team-compose', onsubmit: sendTeam },
      T.ref ? h('div', { class: 'team-ref' }, h('span', null, 'Re: ' + T.ref.label), h('button', { class: 'quiet iconbutton', type: 'button', 'aria-label': 'Remove question link', onclick: () => { T.ref = null; renderPanel(); } }, icon('x', 13))) : null,
      h('label', { class: 'sr-only', for: 'team-message' }, 'Message to the Lakeville team'),
      h('textarea', { id: 'team-message', value: T.drafts[postTopic()] || '', disabled: T.busy, maxlength: 4000, rows: 3, placeholder: 'Message the Lakeville team…', oninput: e => { T.drafts[postTopic()] = e.target.value; const b = $('teamSend'); if (b) b.disabled = T.busy || !e.target.value.trim(); } }),
      h('div', null, h('small', null, 'Posting in: ', h('strong', { id: 'postingIn' }, postTopic()), ' · seen by the Lakeville team and DBY'),
        h('button', { class: 'primary', id: 'teamSend', type: 'submit', disabled: T.busy || !(T.drafts[postTopic()] || '').trim() }, icon('send', 14), T.busy ? 'Sending…' : 'Send'))));
  renderPanelHeader();
  const feed = panel.querySelector('.message-feed'); if (feed) feed.scrollTop = T.scrollAtEnd ? feed.scrollHeight : feedScroll;
  if (focusId) { const el = $(focusId); if (el && !el.disabled) { el.focus({ preventScroll: true }); if (caret && 'selectionStart' in el) try { el.setSelectionRange(caret[0], caret[1]); } catch { /* not text */ } } }
}

/* ---------- "beyond Essentials" flags ---------- */
const flagOf = target => F.flags.find(f => f.target === target);
const flagDomId = target => 'flag-' + target.replace(/[^a-z0-9]/gi, '-');
const ANSWER_TEXT = { plan: 'Yes, plan it for a future upgrade', skip: 'No, not needed' };
function flagButton(target) {
  if (!S.me?.isOwner) return null;
  const f = flagOf(target);
  return h('button', { class: 'comment-anchor flag-anchor' + (f ? ' on' : ''), type: 'button', 'data-target': target, title: 'Flag as beyond the Essentials plan (only you can flag)', onclick: () => { F.composing = F.composing === target ? null : target; F.drafts[target] ??= f?.note || 'This goes beyond the School-Year Essentials plan.'; F.error = ''; renderFlagSlots(true); setTimeout(() => $(flagDomId(target) + '-note')?.focus(), 0); } }, '⚑ ', f?.status === 'suggested' ? 'AI suggests' : f ? 'Flagged' : 'Beyond Essentials?');
}
function flagSlot(target) { return h('div', { class: 'flag-slot', 'data-flag-target': target }, flagView(target)); }
function flagView(target) {
  const f = flagOf(target), did = flagDomId(target), owner = S.me?.isOwner;
  const err = F.error && (F.composing === target || F.answering === f?.id || f?.status === 'suggested') ? h('div', { class: 'comment-error', role: 'alert' }, F.error) : null;
  if (owner && F.composing === target) return h('form', { class: 'scope-flag composing', onsubmit: e => { e.preventDefault(); flagCall(async () => { await api('/api/flags', jsonOpts('POST', { id: f?.id || crypto.randomUUID(), target, note: F.drafts[target] || '' })); F.composing = null; delete F.drafts[target]; }); } },
    h('label', { for: did + '-note' }, '⚑ Note to Lakeville (they’ll see this)'),
    h('textarea', { id: did + '-note', rows: 2, maxlength: 1000, value: F.drafts[target] || '', oninput: e => { F.drafts[target] = e.target.value; } }),
    err,
    h('div', { class: 'flag-actions' }, h('button', { class: 'primary', type: 'submit', disabled: F.busy }, f ? 'Save note' : 'Flag as beyond Essentials'), h('button', { class: 'quiet', type: 'button', onclick: () => { F.composing = null; renderFlagSlots(true); } }, 'Cancel')));
  if (!f) return null;
  if (f.status === 'suggested') {
    if (!owner) return null;
    const skey = 'sug:' + f.id; F.drafts[skey] ??= f.note;
    const setStatus = status => flagCall(async () => { await api('/api/flags', jsonOpts('PATCH', { id: f.id, status, note: status === 'live' ? (F.drafts[skey] || '').trim() || f.note : undefined })); delete F.drafts[skey]; });
    return h('div', { class: 'scope-flag suggested' },
      h('strong', null, '🤖 AI suggestion: Lakeville can’t see this yet'),
      f.why ? h('p', { class: 'flag-why' }, 'Why: ' + f.why) : null,
      h('label', { for: did + '-sug' }, 'Note Lakeville will see if you approve'),
      h('textarea', { id: did + '-sug', rows: 2, maxlength: 1000, value: F.drafts[skey], oninput: e => { F.drafts[skey] = e.target.value; } }),
      err,
      h('div', { class: 'flag-actions' },
        h('button', { class: 'primary', type: 'button', disabled: F.busy, onclick: () => setStatus('live') }, 'Approve & show Lakeville'),
        h('button', { class: 'quiet', type: 'button', disabled: F.busy, onclick: () => setStatus('dismissed') }, 'Dismiss')));
  }
  const asking = !f.answer || F.answering === f.id, nkey = 'ans:' + f.id;
  const answer = a => flagCall(async () => { await api('/api/flags', jsonOpts('PATCH', { id: f.id, answer: a, note: F.drafts[nkey] || '' })); F.answering = null; delete F.drafts[nkey]; });
  return h('div', { class: 'scope-flag' + (f.answer ? ' answered ' + f.answer : '') },
    h('strong', null, '⚑ Beyond your Essentials plan'),
    h('p', null, f.note),
    asking ? [
      h('p', { class: 'flag-q' }, 'Should DBY plan this for a future upgrade? Your current plan doesn’t change either way.'),
      h('label', { class: 'sr-only', for: did + '-ans' }, 'Optional note'),
      h('input', { id: did + '-ans', maxlength: 1000, placeholder: 'Optional: add a note for DBY', value: F.drafts[nkey] || '', oninput: e => { F.drafts[nkey] = e.target.value; } }),
      err,
      h('div', { class: 'flag-actions' },
        h('button', { class: 'primary', type: 'button', disabled: F.busy, onclick: () => answer('plan') }, 'Yes, plan it'),
        h('button', { class: 'quiet', type: 'button', disabled: F.busy, onclick: () => answer('skip') }, 'No, not needed'),
        f.answer ? h('button', { class: 'quiet', type: 'button', onclick: () => { F.answering = null; renderFlagSlots(true); } }, 'Cancel') : null)]
    : h('p', { class: 'flag-answer' }, h('span', null, (f.answered_name || 'Lakeville') + ': ' + ANSWER_TEXT[f.answer] + (f.answer_note ? ' · “' + f.answer_note + '”' : '')),
      h('button', { class: 'quiet', type: 'button', onclick: () => { F.answering = f.id; F.drafts[nkey] = f.answer_note || ''; renderFlagSlots(true); } }, 'Change answer')),
    owner ? h('div', { class: 'flag-owner' }, h('small', null, 'Only you see this row:'),
      h('button', { class: 'quiet', type: 'button', onclick: () => { F.composing = target; F.drafts[target] = f.note; renderFlagSlots(true); } }, 'Edit note'),
      h('button', { class: 'quiet', type: 'button', disabled: F.busy, onclick: () => flagCall(async () => { await api('/api/flags?id=' + f.id, { method: 'DELETE' }); F.flags = F.flags.filter(x => x.id !== f.id); }) }, 'Remove flag')) : null);
}
function flagOverview() {
  const sugg = F.flags.filter(f => f.status === 'suggested'), list = F.flags.filter(f => f.status !== 'suggested'), count = a => list.filter(f => f.answer === a).length;
  const where = f => f.kind === 'field' ? f.label : f.label + (f.section ? ' (' + (allTabs.find(t => t[0] === f.section)?.[1] || f.section) + ')' : '');
  const sugView = sugg.length ? [h('h3', { class: 'sugg-head' }, '🤖 AI suggestions waiting for you (' + sugg.length + ')'),
    h('p', { class: 'muted' }, 'Lakeville can’t see these until you approve them. Edit the note under each question, or approve here.'),
    h('ul', { class: 'flag-list' }, sugg.map(f => h('li', { class: 'sugg' },
      h('span', { class: 'flag-status suggested' }, 'Suggested'),
      h('div', null, h('strong', null, where(f)), h('p', null, '“' + (f.excerpt.length > 220 ? f.excerpt.slice(0, 220) + '…' : f.excerpt) + '”'), f.why ? h('small', null, 'Why: ' + f.why) : null, h('small', null, 'Note to Lakeville: ' + f.note)),
      h('div', { class: 'flag-actions' },
        h('button', { class: 'primary', type: 'button', disabled: F.busy, onclick: () => flagCall(() => api('/api/flags', jsonOpts('PATCH', { id: f.id, status: 'live' }))) }, 'Approve'),
        h('button', { class: 'quiet', type: 'button', disabled: F.busy, onclick: () => flagCall(() => api('/api/flags', jsonOpts('PATCH', { id: f.id, status: 'dismissed' }))) }, 'Dismiss'),
        f.kind === 'field' ? h('button', { class: 'quiet', type: 'button', onclick: () => jump(f.section, f.field_key) }, 'Go to question') : null)))),
    F.error ? h('div', { class: 'comment-error', role: 'alert' }, F.error) : null] : null;
  return [h('h2', null, 'Flagged beyond Essentials'), sugView,
    sugg.length ? h('h3', { class: 'sugg-head' }, 'Shown to Lakeville') : null,
    h('p', { class: 'muted' }, list.length ? `${list.length} flagged · ${count('plan')} want it planned · ${count('skip')} not needed · ${count('')} waiting for Lakeville` : 'Nothing flagged yet. Use ⚑ Beyond Essentials? next to any answer, team message or question to ask Lakeville.'),
    list.length ? h('ul', { class: 'flag-list' }, list.map(f => h('li', null,
      h('span', { class: 'flag-status ' + (f.answer || 'waiting') }, f.answer === 'plan' ? 'Plan it' : f.answer === 'skip' ? 'Not needed' : 'Waiting'),
      h('div', null, h('strong', null, where(f)), h('p', null, '“' + (f.excerpt.length > 220 ? f.excerpt.slice(0, 220) + '…' : f.excerpt || '(empty answer)') + '”'), f.answer_note ? h('small', null, (f.answered_name || '') + ': ' + f.answer_note) : null),
      f.kind === 'field' ? h('button', { class: 'quiet', type: 'button', onclick: () => jump(f.section, f.field_key) }, 'Go to question') : null))) : null];
}
function renderFlagSlots(force) {
  const active = document.activeElement;
  for (const el of document.querySelectorAll('[data-flag-target]')) { if (!force && active && el.contains(active)) continue; fill(el, flagView(el.dataset.flagTarget)); }
  for (const el of document.querySelectorAll('.flag-anchor')) el.replaceWith(flagButton(el.dataset.target) || el);
  const ov = $('flag-overview'); if (ov) fill(ov, flagOverview());
}
async function pollFlags() {
  if (document.hidden || F.busy) return;
  try { const p = await api('/api/flags'), snap = JSON.stringify(p.flags); if (snap !== F.last) { F.last = snap; F.flags = p.flags; renderFlagSlots(); } } catch { /* next tick */ }
}
async function flagCall(fn) {
  if (F.busy) return; F.busy = true; F.error = '';
  try { await fn(); } catch (e) { F.error = errMsg(e, 'Could not save. Please try again.'); }
  finally { F.busy = false; F.last = ''; renderFlagSlots(true); pollFlags(); }
}

/* ---------- start ---------- */
window.addEventListener('beforeunload', e => {
  const unsentComments = Object.values(T.drafts).some(v => v.trim()) || C.uploading || Object.values(C.drafts).some(v => v.trim()) || Object.values(C.uploads).some(v => v.length);
  if (Object.keys(S.pending).length || Object.keys(S.saving).length || Object.keys(S.conflicts).length || unsentComments) { e.preventDefault(); e.returnValue = ''; }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { pollFlags(); syncPlan(); pollList(); pollThread(); pollTeam(); } });
let flagTick = 0;
setInterval(() => { syncPlan(); pollList(); pollThread(); if (++flagTick % 3 === 0) pollFlags(); if (S.commentsOpen && S.panelView === 'team') pollTeam(); }, 2000);
renderShell();
api('/api/me').then(me => { S.me = me; tabs = me.isOwner ? allTabs : allTabs.filter(t => !ownerOnly(t[0])); renderNav(); renderMain(); renderPanel(); pollTeam(); }).catch(e => { S.error = errMsg(e, 'Could not check your sign-in.'); renderMain(); });
load();
pollFlags();
})();
