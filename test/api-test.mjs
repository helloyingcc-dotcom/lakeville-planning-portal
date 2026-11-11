import { readFileSync } from 'node:fs';
const T = JSON.parse(readFileSync('/tmp/harness.log', 'utf8').split('TOKENS ')[1]);
const B = 'http://localhost:8787', O = { Origin: B };
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const call = async (who, path, opts = {}) => { const r = await fetch(B + path, { ...opts, headers: { ...(who ? { 'Cf-Access-Jwt-Assertion': T[who] } : {}), ...(opts.method && opts.method !== 'GET' ? O : {}), ...(opts.body && typeof opts.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...opts.headers } }); let j = null; try { j = await r.clone().json(); } catch {} return { s: r.status, j, r }; };
const J = (method, body) => ({ method, body: JSON.stringify(body) });
const id = () => crypto.randomUUID();

// sign-in
ok((await call(null, '/')).s === 403, 'no token → blocked');
ok((await call('badAud', '/api/me')).s === 401, 'wrong audience rejected');
ok((await call('expired', '/api/me')).s === 401, 'expired token rejected');
const tampered = T.ying.slice(0, -4) + 'AAAA';
ok((await fetch(B + '/api/me', { headers: { 'Cf-Access-Jwt-Assertion': tampered } })).status === 401, 'tampered signature rejected');
ok((await fetch(B + '/api/me', { headers: { Cookie: 'CF_Authorization=' + T.ying } })).status === 200, 'cookie token accepted');
let me = await call('jessie', '/api/me');
ok(me.j.name === 'Jessie Smith' && me.j.named === false && me.j.attachments === true, 'default name from email ' + JSON.stringify(me.j));
ok((await call('jessie', '/api/me', J('PUT', { name: 'Jessie' }))).j.name === 'Jessie', 'set name');
ok((await call('jessie', '/api/me', { method: 'PUT', body: JSON.stringify({ name: 'X' }), headers: { Origin: 'https://evil.example' } })).s === 403, 'cross-origin write blocked');
const page = await call('ying', '/');
ok(page.s === 200 && (await page.r.text()).includes('<div id="app">'), 'page served');
ok((await (await call('ying', '/app-preview.html')).r.text()).includes('lakeville-concept'), 'preview served to owner');
ok((await call('jessie', '/app-preview.html')).s === 404, 'preview hidden from Lakeville');

// planning answers
ok((await call('ying', '/api/plan', J('PUT', { section: 'start', content: { goal: 'Easier sign-ups' }, revision: 0 }))).s === 200, 'first save');
ok((await call('jessie', '/api/plan', J('PUT', { section: 'start', content: { goal: 'other' }, revision: 0 }))).s === 409, 'stale save → conflict');
ok((await call('jessie', '/api/plan', J('PUT', { section: 'start', content: { goal: 'Both' }, revision: 1 }))).j.section.updated_by === 'Jessie', 'second save by Jessie');
ok((await call('ying', '/api/plan', J('PUT', { section: 'start', content: { nope: 'x' }, revision: 2 }))).s === 400, 'unknown field rejected');
ok((await call('ying', '/api/plan', J('PUT', { section: 'features', content: { calendarPriority: 'Maybe' }, revision: 0 }))).s === 400, 'bad option rejected');
ok((await call('ying', '/api/plan')).j.sections[0].content.goal === 'Both', 'read back');

// comments + intro anchor
const t1 = id();
ok((await call('ying', '/api/comments', J('POST', { requestId: t1, body: 'Intro question', section: 'start', fieldKey: 'intro', quote: 'Heading' }))).j.threadId === t1, 'intro thread created');
ok((await call('ying', '/api/comments', J('POST', { requestId: id(), body: 'x', section: 'general', fieldKey: 'intro', quote: '' }))).s === 400, 'intro on general rejected');
ok((await call('ying', '/api/comments', J('POST', { requestId: id(), body: 'x', section: 'start', fieldKey: 'bogus', quote: '' }))).s === 400, 'bogus anchor rejected');
const reply = id();
ok((await call('jessie', '/api/comments', J('POST', { requestId: reply, body: 'Jessie reply', threadId: t1 }))).s === 200, 'reply');
let list = await call('jessie', '/api/comments?section=start');
ok(list.j.counts.some(c => c.field_key === 'intro' && c.count === 1) && list.j.me === 'jessie.smith@example.com', 'counts + me');
ok(list.j.threads[0].created_name === 'Ying', 'name resolved at read time: ' + list.j.threads[0].created_name);

// edit
ok((await call('ying', '/api/comments', J('PATCH', { messageId: reply, body: 'hijack' }))).s === 403, 'cannot edit others');
ok((await call('jessie', '/api/comments', J('PATCH', { messageId: reply, body: '  ' }))).s === 400, 'empty edit rejected');
const ed = await call('jessie', '/api/comments', J('PATCH', { messageId: reply, body: 'Jessie reply (fixed)' }));
ok(ed.s === 200 && ed.j.message.edited_at, 'edit own');
let th = await call('ying', '/api/comments?thread=' + t1);
ok(th.j.messages.map(m => m.body).join('|') === 'Intro question|Jessie reply (fixed)' && th.j.messages[1].author_name === 'Jessie', 'thread content after edit');

// attachments
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
const form = new FormData(); form.append('file', new Blob([png], { type: 'image/png' }), 'example.png');
const up = await call('ying', '/api/attachments', { method: 'POST', body: form });
ok(up.s === 200, 'upload ' + JSON.stringify(up.j));
const fake = new FormData(); fake.append('file', new Blob(['hello'], { type: 'application/pdf' }), 'fake.pdf');
ok((await call('ying', '/api/attachments', { method: 'POST', body: fake })).s === 400, 'mismatched file rejected');
ok((await call('jessie', '/api/attachments?id=' + up.j.attachment.id)).s === 404, 'unposted upload private to uploader');
const m2 = id();
ok((await call('ying', '/api/comments', J('POST', { requestId: m2, body: 'with file', threadId: t1, attachmentIds: [up.j.attachment.id] }))).s === 200, 'post with attachment');
ok((await call('jessie', '/api/attachments?id=' + up.j.attachment.id)).s === 200, 'posted file visible to team');

// delete
ok((await call('jessie', '/api/comments?message=' + m2, { method: 'DELETE' })).s === 403, 'cannot delete others');
let d = await call('ying', '/api/comments?message=' + m2, { method: 'DELETE' });
ok(d.s === 200 && !d.j.threadDeleted, 'delete own with attachment');
ok((await call('ying', '/api/attachments?id=' + up.j.attachment.id)).s === 404, 'attachment gone');
await call('ying', '/api/comments?message=' + t1, { method: 'DELETE' });
d = await call('jessie', '/api/comments?message=' + reply, { method: 'DELETE' });
ok(d.j.threadDeleted === true, 'last delete removes thread');
ok((await call('ying', '/api/comments?thread=' + t1)).s === 404, 'thread 404 afterwards');
// resolve
const t2 = id(); await call('ying', '/api/comments', J('POST', { requestId: t2, body: 'q', section: 'events', fieldKey: 'tools', quote: '' }));
const rs = await call('jessie', '/api/comments', J('PATCH', { threadId: t2, resolved: true, revision: 1 }));
ok(rs.j.thread.resolved === 1, 'resolve');
ok((await call('jessie', '/api/comments', J('POST', { requestId: id(), body: 'late', threadId: t2 }))).s === 409, 'no replies on resolved');
// files attached to answers
const af = (who, section, fieldKey, name, bytes, type) => { const f = new FormData(); f.append('file', new Blob([bytes], { type }), name); f.append('section', section); f.append('fieldKey', fieldKey); return call(who, '/api/answer-files', { method: 'POST', body: f }); };
const xlsx = new Uint8Array([80, 75, 3, 4, 1, 2, 3]);
let a1 = await af('jessie', 'events', 'event0Process', 'signup-sheet.xlsx', xlsx, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
ok(a1.s === 200 && a1.j.file.author_name === 'Jessie', 'excel attached to answer ' + JSON.stringify(a1.j));
ok((await af('jessie', 'events', 'event0Process', 'flyer.png', png, 'image/png')).s === 200, 'png attached to answer');
ok((await af('jessie', 'events', 'event0Process', 'notes.docx', xlsx, 'application/msword')).s === 400, 'word not allowed on answers');
ok((await af('jessie', 'events', 'nope', 'x.png', png, 'image/png')).s === 400, 'unknown question rejected');
ok((await af('jessie', 'events', 'event0Process', 'fake.pdf', new Uint8Array([1, 2, 3]), 'application/pdf')).s === 400, 'fake pdf rejected');
let plan = await call('ying', '/api/plan');
ok(plan.j.files.length === 2 && plan.j.files[0].name === 'signup-sheet.xlsx', 'files listed with answers');
ok((await call('ying', '/api/answer-files?id=' + a1.j.file.id)).s === 200, 'teammate can open file');
ok((await call('ying', '/api/answer-files?id=' + a1.j.file.id, { method: 'DELETE' })).s === 403, 'cannot remove someone else\'s file');
ok((await call('jessie', '/api/answer-files?id=' + a1.j.file.id, { method: 'DELETE' })).s === 200, 'uploader removes own file');
ok((await call('ying', '/api/answer-files?id=' + a1.j.file.id)).s === 404, 'removed file gone');
ok((await call('ying', '/api/plan')).j.files.length === 1, 'list updated after removal');
// owner-only Pro planning
ok((await call('ying', '/api/me')).j.isOwner === true && (await call('jessie', '/api/me')).j.isOwner === false, 'owner flag');
ok((await call('jessie', '/api/plan', J('PUT', { section: 'pro', content: { vendorsSignal: 'Strong signal' }, revision: 0 }))).s === 400, 'non-owner cannot save Pro');
ok((await call('ying', '/api/plan', J('PUT', { section: 'pro', content: { vendorsSignal: 'Strong signal', vendorsEvidence: 'Asked about receipts' }, revision: 0 }))).s === 200, 'owner saves Pro');
ok(!(await call('jessie', '/api/plan')).j.sections.some(x => x.id === 'pro'), 'Pro hidden from non-owner');
ok((await call('ying', '/api/plan')).j.sections.some(x => x.id === 'pro'), 'Pro visible to owner');
ok((await call('ying', '/api/comments', J('POST', { requestId: id(), body: 'x', section: 'pro', fieldKey: null, quote: '' }))).s === 400, 'no shared comments on Pro page');
ok((await af('ying', 'pro', 'vendorsEvidence', 'x.png', png, 'image/png')).s === 400, 'no shared files on Pro page');
ok((await call('ying', '/api/plan', J('PUT', { section: 'features', content: { vendorsPriority: 'Must Have' }, revision: 0 }))).s === 400, 'Pro features not on client feature page');
// autosave per field + history
ok((await call('jimmy', '/api/plan', J('PATCH', { section: 'questions', key: 'timing', value: 'Spring', base: '' }))).s === 200, 'patch one answer');
ok((await call('jessie', '/api/plan', J('PATCH', { section: 'questions', key: 'volume', value: '10 events', base: '' }))).s === 200, 'patch another answer same section, no conflict');
let cf = await call('jessie', '/api/plan', J('PATCH', { section: 'questions', key: 'timing', value: 'Fall', base: '' }));
ok(cf.s === 409 && cf.j.current === 'Spring' && cf.j.by === 'Jimmy T', 'stale base on same answer = conflict ' + JSON.stringify(cf.j));
ok((await call('jessie', '/api/plan', J('PATCH', { section: 'questions', key: 'timing', value: 'Fall', base: 'Spring' }))).s === 200, 'keep mine with current base');
const hist = await call('ying', '/api/plan/history?section=questions&key=timing');
ok(hist.j.versions[0].value === 'Spring' && hist.j.versions[0].replaced_by === 'Jessie', 'history keeps replaced value');
ok((await call('jessie', '/api/plan/history?section=pro&key=vendorsSignal')).s === 400, 'no history on owner-only page for others');
ok((await call('jessie', '/api/plan', J('PATCH', { section: 'pro', key: 'vendorsSignal', value: 'Strong signal', base: '' }))).s === 400, 'no patch on owner-only page for others');
// team chat
let tg = await call('jessie', '/api/team');
ok(tg.j.topics.includes('Car Show') && tg.j.readOnly === false, 'team topics seeded');
ok((await call('ying', '/api/team')).j.readOnly === false, 'owner can write');
const tm = id();
ok((await call('jessie', '/api/team', J('POST', { id: tm, topic: 'Car Show', body: 'Do we need 3 entrances?', ref: { section: 'events', field: 'event0Process' } }))).s === 200, 'post team message with question link');
const ownerMsg = id(); ok((await call('ying', '/api/team', J('POST', { id: ownerMsg, topic: 'General', body: 'Hi team' }))).s === 200, 'owner can post'); await call('ying', '/api/team?id=' + ownerMsg, { method: 'DELETE' });
ok((await call('jessie', '/api/team', J('POST', { id: id(), topic: 'Nope', body: 'x' }))).s === 400, 'unknown topic rejected');
ok((await call('jessie', '/api/team', J('POST', { id: id(), topic: 'General', body: 'x', ref: { section: 'pro', field: 'vendorsSignal' } }))).s === 400, 'cannot link owner-only question');
tg = await call('ying', '/api/team');
ok(tg.j.messages.length === 1 && tg.j.messages[0].ref_label === 'Current events › Event 1 · How do you run it today?' && tg.j.messages[0].author_name === 'Jessie', 'owner reads message with label ' + JSON.stringify(tg.j.messages[0]?.ref_label));
ok((await call('jimmy', '/api/team', J('PATCH', { id: tm, body: 'hijack' }))).s === 403, 'cannot edit others team msg');
ok((await call('jessie', '/api/team', J('PATCH', { id: tm, body: 'Do we need 3 entrances or 2?' }))).s === 200, 'edit own team msg');
ok((await call('jimmy', '/api/team/topics', J('POST', { name: '  Spring  Carnival ' }))).j.name === 'Spring Carnival', 'add topic');
ok((await call('jimmy', '/api/team/topics', J('POST', { name: 'spring carnival' }))).j.name === 'Spring Carnival', 'duplicate topic reuses existing');
ok((await call('ying', '/api/team/topics', J('POST', { name: 'Owner topic' }))).s === 200, 'owner can add topic');
ok((await call('jimmy', '/api/team?id=' + tm, { method: 'DELETE' })).s === 403, 'cannot delete others team msg');
ok((await call('jessie', '/api/team?id=' + tm, { method: 'DELETE' })).s === 200 && (await call('ying', '/api/team')).j.messages.length === 0, 'delete own team msg');

// beyond-Essentials flags
await call('jessie', '/api/plan', J('PATCH', { section: 'events', key: 'event0Better', value: 'Parents pay by card in the app', base: (await call('jessie', '/api/plan')).j.sections.find(x => x.id === 'events')?.content.event0Better ?? '' }));
const fid = id();
ok((await call('jessie', '/api/flags', J('POST', { id: fid, target: 'field:events:event0Better', note: 'x' }))).s === 403, 'Lakeville cannot create flags');
ok((await call('ying', '/api/flags', J('POST', { id: fid, target: 'field:pro:onlinepaySignal', note: 'x' }))).s === 400, 'cannot flag owner-only field');
ok((await call('ying', '/api/flags', J('POST', { id: fid, target: 'field:events:nope', note: 'x' }))).s === 400, 'cannot flag unknown field');
ok((await call('ying', '/api/flags', J('POST', { id: fid, target: 'field:events:event0Better', note: 'Card payments are a future upgrade.' }))).s === 200, 'owner flags a field');
let fl = (await call('jessie', '/api/flags')).j.flags;
ok(fl.length === 1 && fl[0].excerpt === 'Parents pay by card in the app' && fl[0].label.includes('Current events') && fl[0].answer === '' && !('created_by' in fl[0]), 'Lakeville sees flag with excerpt ' + JSON.stringify(fl[0]));
ok((await call('ying', '/api/flags', J('POST', { id: id(), target: 'field:events:event0Better', note: 'Updated note' }))).s === 200 && (await call('ying', '/api/flags')).j.flags.length === 1, 'reflagging same target updates, no duplicate');
ok((await call('jessie', '/api/flags', J('PATCH', { id: fid, answer: 'maybe' }))).s === 400, 'invalid answer rejected');
ok((await call('jessie', '/api/flags', J('PATCH', { id: fid, answer: 'plan', note: 'Yes for the Car Show' }))).s === 200, 'Lakeville answers flag');
fl = (await call('ying', '/api/flags')).j.flags;
ok(fl[0].answer === 'plan' && fl[0].answered_name === 'Jessie' && fl[0].answer_note === 'Yes for the Car Show' && fl[0].note === 'Updated note', 'answer recorded with name ' + JSON.stringify(fl[0]));
const tmf = id(); await call('jimmy', '/api/team', J('POST', { id: tmf, topic: 'General', body: 'Could it track vendor booths?' }));
ok((await call('ying', '/api/flags', J('POST', { id: id(), target: 'team:' + tmf, note: '' }))).s === 200 && (await call('ying', '/api/flags')).j.flags.some(f => f.kind === 'team' && f.excerpt.includes('vendor') && f.note.includes('Essentials')), 'owner flags a team message (default note)');
ok((await call('jessie', '/api/flags?id=' + fid, { method: 'DELETE' })).s === 403, 'Lakeville cannot remove flags');
ok((await call('ying', '/api/flags?id=' + fid, { method: 'DELETE' })).s === 200 && (await call('ying', '/api/flags')).j.flags.length === 1, 'owner removes flag');
ok((await call('jessie', '/api/flags', J('PATCH', { id: fid, answer: 'skip' }))).s === 404, 'answering removed flag → 404');

// AI-suggested flags (owner-only until approved)
await call('jimmy', '/api/plan', J('PATCH', { section: 'events', key: 'event1Better', value: 'Volunteers sign up for shifts in the app', base: (await call('jimmy', '/api/plan')).j.sections.find(x => x.id === 'events')?.content.event1Better ?? '' }));
const sid = id();
ok((await call('jessie', '/api/flags', J('POST', { id: sid, target: 'field:events:event1Better', note: 'x', suggested: true }))).s === 403, 'Lakeville cannot suggest');
let sr = await call('ying', '/api/flags', J('POST', { id: sid, target: 'field:events:event1Better', note: 'Volunteer shift sign-ups are a future upgrade.', why: 'Shift sign-ups are a Pro feature', suggested: true }));
ok(sr.j.created === true && sr.j.status === 'suggested', 'AI suggestion created');
ok(!(await call('jessie', '/api/flags')).j.flags.some(f => f.id === sid), 'suggestion hidden from Lakeville');
const yf = (await call('ying', '/api/flags')).j.flags.find(f => f.id === sid);
ok(yf?.status === 'suggested' && yf.why.includes('Pro') && yf.source === 'ai', 'owner sees suggestion with why');
ok(!('why' in ((await call('jessie', '/api/flags')).j.flags[0] || {})), 'why/source hidden from Lakeville');
ok((await call('jessie', '/api/flags', J('PATCH', { id: sid, answer: 'plan' }))).s === 404, 'Lakeville cannot answer a suggestion');
ok((await call('jessie', '/api/flags', J('PATCH', { id: sid, status: 'live' }))).s === 403, 'Lakeville cannot approve');
ok((await call('ying', '/api/flags', J('POST', { id: id(), target: 'field:events:event1Better', note: 'dup', suggested: true }))).j.created === false, 'repeat suggestion is ignored');
ok((await call('ying', '/api/flags', J('PATCH', { id: sid, status: 'live', note: 'Edited: shift sign-ups would be a future upgrade.' }))).s === 200, 'owner approves with edited note');
let jf = (await call('jessie', '/api/flags')).j.flags.find(f => f.id === sid);
ok(jf?.status === 'live' && jf.note.startsWith('Edited'), 'approved flag visible to Lakeville with edited note');
ok((await call('jessie', '/api/flags', J('PATCH', { id: sid, answer: 'skip' }))).s === 200, 'Lakeville answers approved flag');
const did2 = id(); await call('ying', '/api/flags', J('POST', { id: did2, target: 'team:' + tmf, note: 'n', suggested: true }));
const tmf2 = id(); await call('jimmy', '/api/team', J('POST', { id: tmf2, topic: 'General', body: 'Could families pay by card?' }));
const d2 = id(); await call('ying', '/api/flags', J('POST', { id: d2, target: 'team:' + tmf2, note: 'n', suggested: true }));
ok((await call('ying', '/api/flags', J('PATCH', { id: d2, status: 'dismissed' }))).s === 200 && !(await call('ying', '/api/flags')).j.flags.some(f => f.id === d2), 'dismissed suggestion hidden');
ok((await call('ying', '/api/flags', J('POST', { id: id(), target: 'team:' + tmf2, note: 'n', suggested: true }))).j.created === false, 'dismissed item not re-suggested');
ok((await call('ying', '/api/flags?all=1')).j.flags.some(f => f.id === d2 && f.status === 'dismissed') && !(await call('jessie', '/api/flags?all=1')).j.flags.some(f => f.id === d2), 'all=1 shows dismissed to owner only');
console.log(`API tests: ${pass} passed, ${fail} failed`);
