/* Lakeville PTA planning portal – browser code (no framework). */
(() => {
'use strict';
const {tabs, features, steps, sections, PRIORITY, INTRO_KEY} = MODEL;
const descriptions = {start:'A shared starting point for Lakeville and DBY.',events:'Tell us how Lakeville runs events today. Start with one or two you know well.',features:'Choose what matters for the first version. You can leave anything undecided.',preview:'Explore one possible direction, then tell us what fits Lakeville.',workflow:'Walk us through a real event and decide who needs access.',questions:'Help us shape the first version and understand the accounting needs.'};

/* ---------- tiny DOM helpers ---------- */
const ICONS = {
  message:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  save:'<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
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
  if (!r.ok) { const e = new Error(p.error || 'Something went wrong. Please try again.'); e.status = r.status; throw e; }
  return p;
}
const jsonOpts = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/* ---------- state ---------- */
const S = { tab: 'start', data: {}, records: {}, files: [], fileBusy: {}, fileError: {}, dirty: {}, loaded: false, busy: false, error: '', notice: '', incoming: [], me: null, nameEditing: false, nameBusy: false, nameError: '', commentsOpen: window.innerWidth > 1100, counts: [] };
const C = { scope: 'current', threads: [], active: null, messages: [], drafts: {}, uploads: {}, error: '', connected: false, busy: false, uploading: false, showResolved: false, composing: false, newAnchor: null, nextThreads: null, nextMessages: null, me: null, editing: null, editText: '', confirmDelete: null, outgoing: null, scrollAtEnd: true, listKey: '', lastList: '', lastThread: '', gen: 0 };
const current = () => S.data[S.tab] || {};
const fieldId = (tab, key) => 'answer-' + tab + '-' + key;
const titleFor = tab => tab === 'start' ? 'Let’s build the right starting point.' : tabs.find(t => t[0] === tab)?.[1] || '';
const countFor = (section, key) => S.counts.find(c => c.section === section && c.field_key === key)?.count || 0;

/* ---------- layout ---------- */
const root = $('app');
function renderShell() {
  fill(root, h('div', { class: 'portal' },
    h('aside', { class: 'sidebar' },
      h('a', { href: '/', class: 'brand' }, h('span', { class: 'brandmark' }, icon('leaf', 22)), h('span', null, 'Lakeville PTA', h('small', null, 'EVENTS APP PLANNING'))),
      h('div', { class: 'navlabel' }, 'LET’S SHAPE IT TOGETHER'),
      h('nav', { 'aria-label': 'Planning sections', id: 'nav' }),
      h('div', { class: 'sidebottom' }, icon('book', 18), h('p', null, 'From ideas to a first concept.', h('br'), h('small', null, 'Then a call and agreed scope.')))),
    h('div', { id: 'workspace', class: 'workspace' },
      h('header', { class: 'topbar' },
        h('span', null, 'DBY ', h('span', { class: 'muted' }, '/ Lakeville PTA')),
        h('div', { class: 'topactions' },
          h('button', { class: 'quiet comments-toggle', id: 'commentsToggle', 'aria-label': 'Team comments', onclick: () => { S.commentsOpen = !S.commentsOpen; renderLayoutState(); } }, icon('message'), 'Team comments ', h('span', { id: 'commentTotal' })),
          h('button', { class: 'quiet', id: 'reloadBtn', onclick: reload }, icon('refresh'), 'Reload saved'),
          h('button', { class: 'quiet', id: 'exportBtn', onclick: download }, icon('download'), 'Export answers'))),
      h('div', { class: 'content-layout' },
        h('main', { id: 'main' }),
        h('aside', { class: 'comments-panel', id: 'panel', 'aria-label': 'Team comments' })))));
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
  const disabled = !S.loaded || S.busy;
  const control = f.options
    ? h('select', { id, 'aria-label': f.label, disabled, onchange: e => change(f.key, e.target.value) }, h('option', { value: '' }, 'Choose when ready'), f.options.map(o => h('option', { value: o }, o)))
    : h('textarea', { id, 'aria-label': f.label, rows: (f.key.includes('Name') || f.key === 'completedBy') ? 2 : 3, maxlength: 6000, disabled, placeholder: 'Your answer', oninput: e => change(f.key, e.target.value) });
  control.value = current()[f.key] || '';
  return h('div', { class: 'field' },
    h('div', { class: 'field-heading' }, h('label', { for: id }, f.label),
      h('button', { class: 'comment-anchor', type: 'button', 'data-anchor': f.key, 'aria-label': 'Comment on ' + (sections[tab].find(x => x.key === f.key)?.label || f.label), onclick: () => comment(f) }, icon('message', 13), count ? String(count) : 'Comment')),
    f.hint ? h('small', null, f.hint) : null, control,
    h('div', { class: 'answer-files', id: 'files-' + fieldId(tab, f.key) }, fileArea(tab, f.key)));
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
function tabBody(tab) {
  const sec = sections[tab];
  if (tab === 'start') return [
    h('section', { class: 'welcome' },
      h('div', null, h('span', { class: 'eyebrow' }, 'A SIMPLE FIRST STEP'), h('h2', null, 'Your events. Your priorities.', h('br'), 'A concept we can shape together.'),
        h('p', null, 'Short answers are enough. Add what you know now and return whenever you need. Everyone invited to this workspace can view and edit the same planning answers.'),
        h('button', { class: 'primary', onclick: () => setTab('events') }, 'Start with your events ', icon('right', 16))),
      h('div', { class: 'path' }, [['01', 'Share how things work today', 'Events, tools and what gets in the way.'], ['02', 'Explore a first concept', 'Review the sample app and priorities.'], ['03', 'Talk it through', 'Confirm the scope before an estimate.']].map(([n, a, b]) => h('div', null, h('span', null, n), h('p', null, h('strong', null, a), h('small', null, b)))))),
    h('section', { class: 'panel' }, h('h2', null, 'Your starting point'), h('p', { class: 'muted' }, 'Begin with the event you would most like to improve.'), fields(sec))];
  if (tab === 'events') return [
    h('details', { class: 'examples' }, h('summary', null, 'See illustrative event examples'),
      h('div', { class: 'examplegrid' }, [['Holiday Gift Shop', 'Paper forms / Excel', 'Tracking volunteers'], ['School Fundraiser', 'Google Forms', 'Managing payments'], ['Family Night', 'Email sign-ups', 'Tracking attendance']].map(e => h('div', null, h('strong', null, e[0]), h('p', null, e[1]), h('small', null, 'Possible challenge: ' + e[2])))),
      h('p', null, 'These are examples from the planning draft, not Lakeville-confirmed events or tools.')),
    [0, 1, 2].map(i => h('section', { class: 'panel' }, h('h2', null, 'Event ' + (i + 1)), fields(sec.slice(i * 5, i * 5 + 5)))),
    h('section', { class: 'panel' }, h('h2', null, 'Your tools & other events'), fields(sec.slice(15)))];
  if (tab === 'features') return [
    h('div', { class: 'prioritykey' }, h('span', null, h('strong', null, 'Must Have'), ' Needed in the first version'), h('span', null, h('strong', null, 'Nice to Have'), ' Can wait'), h('span', null, h('strong', null, 'Not Sure'), ' Discuss together')),
    h('div', { class: 'featurelist' }, features.map(([id, title, desc]) => h('section', { class: 'feature' }, h('div', null, h('h2', null, title), h('p', null, desc)),
      h('div', null, field({ key: id + 'Priority', label: 'PTA priority', options: PRIORITY }), field({ key: id + 'Notes', label: 'What would Lakeville need?', hint: 'Optional notes or changes' }))))),
    h('section', { class: 'panel' }, field(sec.at(-1)))];
  if (tab === 'preview') return [
    h('div', { class: 'previewintro' }, h('p', null, 'Try Events, Volunteers and My Sign-ups. Switch “Preview as” to see PTA Admin. Sample sign-ups stay inside this demo.'), h('a', { href: '/app-preview.html', target: '_blank', rel: 'noreferrer' }, 'Open preview in a new tab ↗')),
    h('iframe', { title: 'Illustrative Lakeville Events App', src: '/app-preview.html', class: 'appframe' }),
    h('section', { class: 'panel' }, h('h2', null, 'Your reaction to the concept'), fields(sec))];
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
        h('button', { class: introCount ? 'comment-anchor intro-comment has-comments' : 'comment-anchor intro-comment', type: 'button', id: 'introComment', 'aria-label': 'Comment on the page introduction' + (introCount ? ` (${introCount} open)` : ''), onclick: commentIntro }, icon('message', 13), introCount ? introCount + ' on intro' : 'Comment on intro'))),
    h('div', { class: 'context' }, h('span', { class: 'dot' }), h('span', null, 'Examples are illustrative. Lakeville’s confirmed details belong in the answer fields.'),
      h('button', { class: 'comment-anchor section-comment', onclick: () => comment() }, icon('message', 14), 'Discuss this section')),
    h('div', { id: 'incoming' }),
    !S.loaded && !S.error ? h('p', { role: 'status' }, 'Loading shared answers…') : null,
    S.error ? h('div', { class: 'error', role: 'alert' }, S.error + ' ', h('button', { class: 'quiet', onclick: reload }, 'Reload saved answers')) : null,
    tabBody(tab),
    h('div', { class: 'savebar' },
      h('div', null, h('strong', { id: 'saveState' }), h('small', { id: 'saveMeta' }), h('span', { role: 'status', id: 'notice' })),
      h('button', { class: 'primary', id: 'saveBtn', onclick: save }, icon('save', 16), h('span', { id: 'saveLabel' }))),
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
  const el = $('incoming'); if (!el) return;
  fill(el, S.incoming.includes(S.tab) ? h('div', { class: 'incoming', role: 'status' }, 'New saved answers are available in this section. Your unsaved draft is kept. Save or export your draft before using Reload saved.') : '');
}
function renderSaveBar() {
  const record = S.records[S.tab];
  $('saveState').textContent = S.dirty[S.tab] ? 'Unsaved changes' : record ? 'Saved online' : 'Ready when you are';
  $('saveMeta').textContent = record ? `Last saved by ${record.updated_by} · ${new Date(record.updated_at).toLocaleString()}` : 'Use Save section to share your answers.';
  $('notice').textContent = S.notice;
  $('saveBtn').disabled = !S.loaded || S.busy || !S.dirty[S.tab];
  $('saveLabel').textContent = S.busy ? 'Saving…' : 'Save section';
}
function setFieldsDisabled() { document.querySelectorAll('#main .field textarea, #main .field select').forEach(el => { el.disabled = !S.loaded || S.busy; }); }
function change(key, value) {
  S.data = { ...S.data, [S.tab]: { ...S.data[S.tab], [key]: value } };
  const wasDirty = S.dirty[S.tab]; S.dirty = { ...S.dirty, [S.tab]: true }; S.notice = '';
  if (!wasDirty) renderNav();
  renderSaveBar();
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
    S.data = Object.fromEntries(p.sections.map(s => [s.id, s.content]));
    S.files = p.files || [];
    S.dirty = {}; S.incoming = []; S.loaded = true; S.notice = 'Saved answers loaded.';
  } catch (e) { S.error = errMsg(e, 'Could not load your answers.'); }
  renderNav(); renderMain();
}
async function save() {
  const tab = S.tab;
  if (!S.dirty[tab] || S.busy) return;
  S.busy = true; S.error = ''; renderSaveBar(); setFieldsDisabled(); renderLayoutState();
  try {
    const p = await api('/api/plan', jsonOpts('PUT', { section: tab, content: S.data[tab] || {}, revision: S.records[tab]?.revision || 0 }));
    S.records = { ...S.records, [tab]: p.section }; S.dirty = { ...S.dirty, [tab]: false }; S.incoming = S.incoming.filter(x => x !== tab); S.notice = 'Section saved online.';
  } catch (e) { S.error = errMsg(e, 'Could not save your answers.'); }
  finally { S.busy = false; }
  renderNav(); renderMain();
}
function reload() {
  if (Object.values(S.dirty).some(Boolean) && !confirm('Reload saved answers? Unsaved changes in all sections will be replaced.')) return;
  load();
}
function download() {
  const payload = { project: 'Lakeville PTA Events App planning', exportedAt: new Date().toISOString(), sections: tabs.map(([id, title]) => ({ section: title, hasUnsavedChanges: !!S.dirty[id], lastSavedBy: S.records[id]?.updated_by || null, lastSavedAt: S.records[id]?.updated_at || null, answers: sections[id].filter(f => S.data[id]?.[f.key] || S.files.some(x => x.section === id && x.field_key === f.key)).map(f => ({ question: f.label, answer: S.data[id]?.[f.key] || '', files: S.files.filter(x => x.section === id && x.field_key === f.key).map(x => x.name) })) })) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = h('a', { href: url, download: 'lakeville-planning-responses.json' }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
let planSyncing = false;
async function syncPlan() {
  if (!S.loaded || document.hidden || planSyncing || S.busy) return;
  planSyncing = true;
  try {
    const p = await api('/api/plan');
    const changed = p.sections.filter(s => s.revision !== (S.records[s.id]?.revision || 0));
    const incoming = changed.filter(s => S.dirty[s.id]).map(s => s.id);
    const clean = changed.filter(s => !S.dirty[s.id]);
    if (incoming.join() !== S.incoming.join()) { S.incoming = incoming; renderIncoming(); }
    if (JSON.stringify(p.files || []) !== JSON.stringify(S.files)) { S.files = p.files || []; renderAllFileAreas(); }
    if (clean.length) {
      for (const s of clean) { S.records[s.id] = s; S.data[s.id] = s.content; }
      refreshFieldValues(S.tab); renderNav(); renderSaveBar();
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
  C.newAnchor = anchor; C.active = null; C.messages = []; C.composing = true; C.error = ''; C.editing = null; C.confirmDelete = null;
  C.scope = anchor.section === 'general' ? 'general' : 'current';
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
    b.lastChild.textContent = n ? String(n) : 'Comment';
  }
  const intro = $('introComment');
  if (intro) { const n = countFor(S.tab, INTRO_KEY); intro.className = n ? 'comment-anchor intro-comment has-comments' : 'comment-anchor intro-comment'; intro.lastChild.textContent = n ? n + ' on intro' : 'Comment on intro'; intro.setAttribute('aria-label', 'Comment on the page introduction' + (n ? ` (${n} open)` : '')); }
}

/* ---------- comments panel ---------- */
const listSection = () => C.scope === 'current' ? S.tab : C.scope === 'general' ? 'general' : 'all';
const target = () => C.newAnchor || { section: C.scope === 'general' ? 'general' : S.tab, fieldKey: null, quote: '' };
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
function renderPanel() {
  const panel = $('panel'); if (!panel) return;
  // keep focus, caret and scroll positions across re-renders
  const active = document.activeElement, focusId = active && panel.contains(active) ? active.id : null;
  const caret = focusId && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
  const listScroll = panel.querySelector('.thread-list')?.scrollTop || 0;
  const feedOld = panel.querySelector('.message-feed'), feedScroll = feedOld?.scrollTop || 0;
  const visible = C.threads.filter(t => C.showResolved || !t.resolved);
  const a = C.active;
  fill(panel, 
    h('div', { class: 'comments-heading' },
      h('div', null, h('h2', null, icon('message', 18), 'Team comments'), h('span', { id: 'connState' })),
      h('button', { class: 'quiet iconbutton', 'aria-label': 'Close comments', onclick: () => { S.commentsOpen = false; renderLayoutState(); } }, icon('x', 18))),
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
      h('div', { class: 'comments-filters' },
        h('label', null, 'Show', h('select', { 'aria-label': 'Discussion scope', onchange: e => { C.scope = e.target.value; C.newAnchor = null; C.composing = false; C.error = ''; onSectionChange(); } },
          [['current', 'This section'], ['all', 'All sections'], ['general', 'General discussion']].map(([v, l]) => { const o = h('option', { value: v }, l); o.selected = C.scope === v; return o; }))),
        h('label', { class: 'resolved-filter' }, h('input', { type: 'checkbox', checked: C.showResolved, onchange: e => { C.showResolved = e.target.checked; renderPanel(); } }), 'Include resolved')),
      h('div', { class: 'thread-list' },
        !visible.length ? h('div', { class: 'comment-empty' }, icon('message', 24), h('strong', null, `No ${C.showResolved ? '' : 'open '}discussions yet`), h('p', null, 'Start a section discussion, or use Comment beside a question to keep your note attached to it.')) : null,
        visible.map(t => h('button', { class: 'thread-card', onclick: () => openThread(t) }, h('small', null, sectionName(t.section) + (t.resolved ? ' · Resolved' : '')), h('strong', null, location(t)), h('p', null, t.first_message || 'Attached examples'), h('span', null, `${t.created_name} · ${t.message_count} ${t.message_count === 1 ? 'comment' : 'comments'}`))),
        C.nextThreads ? h('button', { class: 'quiet', disabled: C.busy, onclick: () => older('threads') }, 'Load older discussions') : null),
      h('button', { class: 'new-discussion', onclick: () => { C.newAnchor = null; C.composing = !C.composing; renderPanel(); if (C.composing) setTimeout(() => $('team-comment')?.focus(), 0); } }, icon('plus', 16), C.composing ? 'Hide new discussion' : 'New discussion')
    ],
    (a && !a.resolved) || (!a && C.composing) ? composeView() : null);
  renderPanelHeader();
  const list = panel.querySelector('.thread-list'); if (list) list.scrollTop = listScroll;
  const feed = panel.querySelector('.message-feed'); if (feed) feed.scrollTop = C.scrollAtEnd ? feed.scrollHeight : feedScroll;
  if (focusId) { const el = $(focusId); if (el && !el.disabled) { el.focus({ preventScroll: true }); if (caret && 'selectionStart' in el) try { el.setSelectionRange(caret[0], caret[1]); } catch { /* not a text input */ } } }
}

/* ---------- start ---------- */
window.addEventListener('beforeunload', e => {
  const unsentComments = C.uploading || Object.values(C.drafts).some(v => v.trim()) || Object.values(C.uploads).some(v => v.length);
  if (Object.values(S.dirty).some(Boolean) || unsentComments) { e.preventDefault(); e.returnValue = ''; }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { syncPlan(); pollList(); pollThread(); } });
setInterval(() => { syncPlan(); pollList(); pollThread(); }, 2000);
renderShell();
api('/api/me').then(me => { S.me = me; renderMain(); renderPanel(); }).catch(e => { S.error = errMsg(e, 'Could not check your sign-in.'); renderMain(); });
load();
})();
