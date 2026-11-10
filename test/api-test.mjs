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
ok((await (await call('ying', '/app-preview.html')).r.text()).includes('lakeville-concept'), 'preview served');

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
console.log(`API tests: ${pass} passed, ${fail} failed`);
