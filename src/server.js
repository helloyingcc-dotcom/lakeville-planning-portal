/*
 * Lakeville PTA – Events App planning portal
 * One-file Cloudflare Worker. Paste this whole file into the Worker's code editor and click Deploy.
 *
 * Needs (Worker → Settings → Bindings / Variables):
 *   DB                 D1 database binding (required) – tables are created automatically.
 *   BUCKET             R2 bucket binding (optional) – enables "Attach examples".
 *   ACCESS_TEAM_DOMAIN Cloudflare Access team domain, e.g. "lakeville" or "lakeville.cloudflareaccess.com".
 *   ACCESS_AUD         Cloudflare Access "Application Audience (AUD) tag".
 *   OWNER_EMAILS       Comma-separated emails that can see owner-only pages (e.g. Pro tier planning).
 * Sign-in is handled by Cloudflare Access (email one-time code). This file only checks the signed token.
 */
/*__MODEL__*/

const HTML = /*__HTML__*/"";
const PREVIEW_HTML = /*__PREVIEW__*/"";
const VERSION = /*__VERSION__*/"dev";

const json = (v, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(v);
const ownerOnly = s => MODEL.OWNER_SECTIONS.includes(s);
const validSection = s => typeof s === 'string' && (s === 'general' || (Object.hasOwn(MODEL.sections, s) && !ownerOnly(s)));
const nowIso = () => new Date().toISOString();
const SECURITY_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };

/* ---------------- database ---------------- */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS planning_sections (id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL, revision INTEGER NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS comment_threads (seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id TEXT NOT NULL UNIQUE, section TEXT NOT NULL, field_key TEXT, quote TEXT NOT NULL, resolved INTEGER DEFAULT 0 NOT NULL, revision INTEGER DEFAULT 1 NOT NULL, created_by TEXT NOT NULL, created_name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS comment_messages (seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, request_id TEXT NOT NULL UNIQUE, thread_id TEXT NOT NULL REFERENCES comment_threads(id), author_id TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, edited_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS comment_attachments (id TEXT PRIMARY KEY NOT NULL, object_key TEXT NOT NULL, author_id TEXT NOT NULL, name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL, message_id TEXT REFERENCES comment_messages(request_id))`,
  `CREATE TABLE IF NOT EXISTS people (email TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS comment_messages_thread ON comment_messages(thread_id, seq)`,
  `CREATE TABLE IF NOT EXISTS answer_files (id TEXT PRIMARY KEY NOT NULL, object_key TEXT NOT NULL, section TEXT NOT NULL, field_key TEXT NOT NULL, author_id TEXT NOT NULL, author_name TEXT NOT NULL, name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS answer_files_field ON answer_files(section, field_key, created_at)`,
  `CREATE TABLE IF NOT EXISTS answer_history (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, section TEXT NOT NULL, field_key TEXT NOT NULL, value TEXT NOT NULL, replaced_by TEXT NOT NULL, replaced_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS answer_history_field ON answer_history(section, field_key, id)`,
  `CREATE TABLE IF NOT EXISTS team_topics (name TEXT PRIMARY KEY NOT NULL COLLATE NOCASE, created_by TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS team_messages (seq INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id TEXT NOT NULL UNIQUE, topic TEXT NOT NULL, ref_section TEXT, ref_field TEXT, ref_label TEXT, author_id TEXT NOT NULL, author_name TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, edited_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS scope_flags (id TEXT PRIMARY KEY NOT NULL, target TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, section TEXT, field_key TEXT, label TEXT NOT NULL, excerpt TEXT NOT NULL, note TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, answer TEXT DEFAULT '' NOT NULL, answer_note TEXT, answered_by TEXT, answered_at TEXT)`,
  `INSERT OR IGNORE INTO team_topics (name,created_by,created_at) VALUES ('General','system','2026-11-11T00:00:00Z'),('Family Game Night','system','2026-11-11T00:00:01Z'),('Sweetheart Dance','system','2026-11-11T00:00:02Z'),('Car Show','system','2026-11-11T00:00:03Z'),('Literacy Night','system','2026-11-11T00:00:04Z')`,
];
let schemaReady = null;
// Columns added after launch: ALTER fails harmlessly once the column exists.
const ADDED_COLUMNS = ['ALTER TABLE planning_sections ADD COLUMN field_by TEXT', "ALTER TABLE scope_flags ADD COLUMN status TEXT DEFAULT 'live' NOT NULL", 'ALTER TABLE scope_flags ADD COLUMN why TEXT', 'ALTER TABLE scope_flags ADD COLUMN source TEXT'];
function ensureSchema(db) {
  if (!schemaReady) schemaReady = db.batch(SCHEMA.map(s => db.prepare(s)))
    .then(() => Promise.all(ADDED_COLUMNS.map(sql => db.prepare(sql).run().catch(() => null))))
    .catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

/* ---------------- sign-in (Cloudflare Access) ---------------- */
let jwksCache = { at: 0, keys: null, url: '' };
const b64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
function teamOrigin(env) {
  let d = String(env.ACCESS_TEAM_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!d) return '';
  if (!d.includes('.')) d += '.cloudflareaccess.com';
  return 'https://' + d;
}
async function accessKeys(origin) {
  const url = origin + '/cdn-cgi/access/certs';
  if (jwksCache.keys && jwksCache.url === url && Date.now() - jwksCache.at < 3600_000) return jwksCache.keys;
  const r = await fetch(url);
  if (!r.ok) throw new Error('certs');
  const body = await r.json();
  jwksCache = { at: Date.now(), keys: body.keys || [], url };
  return jwksCache.keys;
}
async function verifyAccess(token, env) {
  const origin = teamOrigin(env), aud = String(env.ACCESS_AUD || '').trim();
  if (!origin || !aud || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try { header = JSON.parse(new TextDecoder().decode(b64url(parts[0]))); claims = JSON.parse(new TextDecoder().decode(b64url(parts[1]))); } catch { return null; }
  if (header.alg !== 'RS256') return null;
  let keys = await accessKeys(origin);
  let jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) { jwksCache.at = 0; keys = await accessKeys(origin); jwk = keys.find(k => k.kid === header.kid); }
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) return null;
  const now = Math.floor(Date.now() / 1000);
  const audOk = Array.isArray(claims.aud) ? claims.aud.includes(aud) : claims.aud === aud;
  if (!audOk || claims.iss !== origin || typeof claims.exp !== 'number' || claims.exp < now - 60 || (claims.nbf && claims.nbf > now + 60)) return null;
  if (typeof claims.email !== 'string' || !claims.email.includes('@')) return null;
  return claims.email.toLowerCase();
}
function nameFromEmail(email) {
  return email.split('@')[0].split(/[._-]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || email;
}
async function getUser(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || (request.headers.get('Cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1];
  let email = null;
  try { email = await verifyAccess(token, env); } catch { return { error: 'signin_unavailable' }; }
  if (!email) return null;
  const row = await env.DB.prepare('SELECT name FROM people WHERE email=?').bind(email).first();
  const owners = String(env.OWNER_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  return { userId: email, email, displayName: row?.name || nameFromEmail(email), named: !!row, isOwner: owners.includes(email) };
}

/* ---------------- planning answers ---------------- */
async function planGet(env, user) {
  const r = await env.DB.prepare('SELECT * FROM planning_sections').all();
  r.results = r.results.filter(row => user.isOwner || !ownerOnly(row.id));
  const files = await env.DB.prepare(`SELECT f.id,f.section,f.field_key,f.author_id,${NAME('f', 'author_id', 'author_name')} AS author_name,f.name,f.content_type,f.size,f.created_at FROM answer_files f ORDER BY f.created_at`).all();
  return json({ sections: r.results.map(({ field_by, ...row }) => ({ ...row, content: JSON.parse(row.content) })), files: files.results });
}
async function planPut(request, env, user) {
  const raw = await request.text();
  if (raw.length > 65000) return json({ error: 'This response is too large.' }, 413);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid response.' }, 400); }
  const { section, content, revision } = body ?? {};
  if (ownerOnly(section) && !user.isOwner) return json({ error: 'Invalid planning section.' }, 400);
  if (!Object.hasOwn(MODEL.sections, section) || !Number.isSafeInteger(revision) || revision < 0 || !content || typeof content !== 'object' || Array.isArray(content)) return json({ error: 'Invalid planning section.' }, 400);
  for (const [key, value] of Object.entries(content)) {
    const field = MODEL.sections[section].find(f => f.key === key);
    if (!field || typeof value !== 'string' || value.length > 6000 || (field.options && value !== '' && !field.options.includes(value))) return json({ error: 'Please check your answer values.' }, 400);
  }
  const row = revision === 0
    ? await env.DB.prepare('INSERT INTO planning_sections (id,content,revision,updated_by,updated_at) VALUES (?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING *').bind(section, JSON.stringify(content), user.displayName, nowIso()).first()
    : await env.DB.prepare('UPDATE planning_sections SET content=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=? AND revision=? RETURNING *').bind(JSON.stringify(content), user.displayName, nowIso(), section, revision).first();
  if (!row) return json({ error: 'Someone else saved this section. Reload the saved version before making your changes again.' }, 409);
  return json({ section: { ...row, content: JSON.parse(row.content) } });
}

// Save ONE answer. `base` is the value this person last saw; if someone else has
// changed that same answer since, nothing is saved and the current value comes back.
async function planPatch(request, env, user) {
  let p; try { p = await readJson(request, 20000); } catch { return json({ error: 'Invalid answer.' }, 400); }
  const { section, key, value } = p ?? {}, base = p?.base ?? '';
  if (ownerOnly(section) && !user.isOwner) return json({ error: 'Invalid planning section.' }, 400);
  const field = Object.hasOwn(MODEL.sections, section) ? MODEL.sections[section].find(f => f.key === key) : null;
  if (!field || typeof value !== 'string' || value.length > 6000 || typeof base !== 'string' || (field.options && value !== '' && !field.options.includes(value))) return json({ error: 'Please check your answer.' }, 400);
  for (let attempt = 0; attempt < 6; attempt++) {
    const row = await env.DB.prepare('SELECT * FROM planning_sections WHERE id=?').bind(section).first();
    const content = row ? JSON.parse(row.content) : {}, cur = content[key] ?? '';
    let fieldBy = {}; try { fieldBy = JSON.parse(row?.field_by || '{}') || {}; } catch { fieldBy = {}; }
    const strip = r => { const { field_by, ...rest } = r; return { ...rest, content: JSON.parse(r.content) }; };
    if (cur === value) return json({ section: row ? strip(row) : null, saved: true });
    if (cur !== base) return json({ conflict: true, current: cur, by: fieldBy[key] || row.updated_by, at: row.updated_at }, 409);
    if (value === '') delete content[key]; else content[key] = value;
    fieldBy[key] = user.displayName;
    const saved = row
      ? await env.DB.prepare('UPDATE planning_sections SET content=?,field_by=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=? AND revision=? RETURNING *').bind(JSON.stringify(content), JSON.stringify(fieldBy), user.displayName, nowIso(), section, row.revision).first()
      : await env.DB.prepare('INSERT INTO planning_sections (id,content,field_by,revision,updated_by,updated_at) VALUES (?,?,?,1,?,?) ON CONFLICT(id) DO NOTHING RETURNING *').bind(section, JSON.stringify(content), JSON.stringify(fieldBy), user.displayName, nowIso()).first();
    if (saved) {
      if (cur) {
        try {
          await env.DB.batch([
            env.DB.prepare('INSERT INTO answer_history (section,field_key,value,replaced_by,replaced_at) VALUES (?,?,?,?,?)').bind(section, key, cur, user.displayName, nowIso()),
            env.DB.prepare('DELETE FROM answer_history WHERE section=? AND field_key=? AND id NOT IN (SELECT id FROM answer_history WHERE section=? AND field_key=? ORDER BY id DESC LIMIT 25)').bind(section, key, section, key)]);
        } catch (e) { console.error('history', e); }
      }
      return json({ section: strip(saved), saved: true });
    }
    // someone saved a different answer in this section at the same moment: merge again
  }
  return json({ error: 'Busy saving. Please try again.' }, 503);
}

async function planHistory(request, env, user) {
  const url = new URL(request.url), section = url.searchParams.get('section'), key = url.searchParams.get('key');
  if ((ownerOnly(section) && !user.isOwner) || !Object.hasOwn(MODEL.sections, section) || !MODEL.sections[section].some(f => f.key === key)) return json({ error: 'Invalid question.' }, 400);
  const rows = await env.DB.prepare('SELECT value,replaced_by,replaced_at FROM answer_history WHERE section=? AND field_key=? ORDER BY id DESC LIMIT 25').bind(section, key).all();
  return json({ versions: rows.results });
}

/* ---------------- comments ---------------- */
const NAME = (alias, idCol, fallback) => `COALESCE((SELECT name FROM people WHERE email=${alias}.${idCol}), ${alias}.${fallback})`;
async function commentsGet(request, env, user) {
  const url = new URL(request.url), section = url.searchParams.get('section') || 'all', id = url.searchParams.get('thread'), before = Number(url.searchParams.get('before') || 0);
  if (!Number.isSafeInteger(before) || before < 0 || (section !== 'all' && !validSection(section)) || (id && !uuid(id))) return json({ error: 'Invalid discussion filter.' }, 400);
  if (id) {
    const thread = await env.DB.prepare(`SELECT t.*, ${NAME('t', 'created_by', 'created_name')} AS created_name FROM comment_threads t WHERE id=?`).bind(id).first();
    if (!thread) return json({ error: 'Discussion not found.' }, 404);
    const messages = await env.DB.prepare(`SELECT * FROM (SELECT m.*, ${NAME('m', 'author_id', 'author_name')} AS author_name FROM comment_messages m WHERE thread_id=? AND (?=0 OR seq<?) ORDER BY seq DESC LIMIT 101) ORDER BY seq`).bind(id, before, before).all();
    const more = messages.results.length > 100, rows = more ? messages.results.slice(1) : messages.results;
    const files = rows.length ? await env.DB.prepare('SELECT a.id,a.name,a.content_type,a.size,a.message_id FROM comment_attachments a JOIN comment_messages m ON a.message_id=m.request_id WHERE m.thread_id=? AND m.seq>=? AND m.seq<=?').bind(id, rows[0].seq, rows.at(-1).seq).all() : { results: [] };
    return json({ thread, me: user.userId, messages: rows.map(m => ({ ...m, attachments: files.results.filter(a => a.message_id === m.request_id) })), nextBefore: more ? rows[0].seq : null });
  }
  const query = await env.DB.prepare(`SELECT t.*, ${NAME('t', 'created_by', 'created_name')} AS created_name, (SELECT count(*) FROM comment_messages m WHERE m.thread_id=t.id) AS message_count, (SELECT body FROM comment_messages m WHERE m.thread_id=t.id ORDER BY seq LIMIT 1) AS first_message FROM comment_threads t WHERE (?='all' OR section=?) AND (?=0 OR t.seq<?) ORDER BY t.seq DESC LIMIT 51`).bind(section, section, before, before).all();
  const rows = query.results.slice(0, 50);
  const counts = await env.DB.prepare('SELECT section,field_key,count(*) AS count FROM comment_threads WHERE resolved=0 GROUP BY section,field_key').all();
  return json({ threads: rows, me: user.userId, counts: counts.results, nextBefore: query.results.length > 50 ? rows.at(-1).seq : null });
}
async function readJson(request, max = 18000) { const t = await request.text(); if (t.length > max) throw new Error('size'); return JSON.parse(t); }
async function commentsPost(request, env, user) {
  let p; try { p = await readJson(request); } catch { return json({ error: 'Invalid or oversized comment.' }, 400); }
  const ids = p.attachmentIds || [];
  if (!Array.isArray(ids) || ids.length > 5 || ids.some(id => !uuid(id)) || new Set(ids).size !== ids.length) return json({ error: 'Attach up to five files.' }, 400);
  if (!uuid(p.requestId) || typeof p.body !== 'string' || (!p.body.trim() && !ids.length) || p.body.length > 4000) return json({ error: 'Enter a comment or attach an example. Comments can be up to 4,000 characters.' }, 400);
  const now = nowIso(), DB = env.DB;
  const existing = await DB.prepare('SELECT * FROM comment_messages WHERE request_id=?').bind(p.requestId).first();
  if (existing) return existing.author_id === user.userId ? json({ message: existing, threadId: existing.thread_id }) : json({ error: 'Comment identifier already used.' }, 409);
  const marks = ids.map(() => '?').join(',');
  const guard = ids.length ? `(SELECT count(*) FROM comment_attachments WHERE id IN (${marks}) AND author_id=? AND message_id IS NULL)=?` : '1=1', args = ids.length ? [...ids, user.userId, ids.length] : [];
  const attach = ids.length ? [DB.prepare(`UPDATE comment_attachments SET message_id=? WHERE id IN (${marks}) AND author_id=? AND message_id IS NULL AND EXISTS(SELECT 1 FROM comment_messages WHERE request_id=? AND author_id=?)`).bind(p.requestId, ...ids, user.userId, p.requestId, user.userId)] : [];
  if (p.threadId) {
    if (!uuid(p.threadId)) return json({ error: 'Invalid discussion.' }, 400);
    const results = await DB.batch([
      DB.prepare(`INSERT INTO comment_messages (request_id,thread_id,author_id,author_name,body,created_at) SELECT ?,id,?,?,?,? FROM comment_threads WHERE id=? AND resolved=0 AND ${guard} ON CONFLICT(request_id) DO NOTHING`).bind(p.requestId, user.userId, user.displayName, p.body.trim(), now, p.threadId, ...args),
      DB.prepare('UPDATE comment_threads SET updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM comment_messages WHERE request_id=?)').bind(now, p.threadId, p.requestId), ...attach]);
    if (!results[0].meta.changes) return json({ error: 'This discussion is resolved or an attachment is unavailable. Reopen it or remove the unavailable file before retrying.' }, 409);
  } else {
    const fk = p.fieldKey;
    const fieldOk = fk == null || (typeof fk === 'string' && !ownerOnly(p.section) && ((fk === MODEL.INTRO_KEY && p.section !== 'general') || MODEL.sections[p.section]?.some(f => f.key === fk)));
    if (!validSection(p.section) || !fieldOk || typeof p.quote !== 'string' || p.quote.length > 500) return json({ error: 'Choose a valid section or question.' }, 400);
    await DB.batch([
      DB.prepare(`INSERT INTO comment_threads (id,section,field_key,quote,resolved,revision,created_by,created_name,created_at,updated_at) SELECT ?,?,?,?,0,1,?,?,?,? WHERE ${guard} ON CONFLICT(id) DO NOTHING`).bind(p.requestId, p.section, fk || null, p.quote, user.userId, user.displayName, now, now, ...args),
      DB.prepare(`INSERT INTO comment_messages (request_id,thread_id,author_id,author_name,body,created_at) SELECT ?,id,?,?,?,? FROM comment_threads WHERE id=? AND created_by=? AND ${guard} ON CONFLICT(request_id) DO NOTHING`).bind(p.requestId, user.userId, user.displayName, p.body.trim(), now, p.requestId, user.userId, ...args), ...attach]);
  }
  const message = await DB.prepare('SELECT * FROM comment_messages WHERE request_id=? AND author_id=?').bind(p.requestId, user.userId).first();
  if (!message) return json({ error: 'Comment not sent. Please retry.' }, 409);
  return json({ message, threadId: message.thread_id });
}
async function commentsPatch(request, env, user) {
  let p; try { p = await readJson(request); } catch { return json({ error: 'Invalid update.' }, 400); }
  if (p.messageId !== undefined) {
    if (!uuid(p.messageId) || typeof p.body !== 'string' || p.body.length > 4000) return json({ error: 'Invalid comment edit.' }, 400);
    const hasFiles = await env.DB.prepare('SELECT 1 FROM comment_attachments WHERE message_id=? LIMIT 1').bind(p.messageId).first();
    if (!p.body.trim() && !hasFiles) return json({ error: 'A comment cannot be empty. Use Delete to remove it.' }, 400);
    const message = await env.DB.prepare('UPDATE comment_messages SET body=?,edited_at=? WHERE request_id=? AND author_id=? RETURNING *').bind(p.body.trim(), nowIso(), p.messageId, user.userId).first();
    if (!message) return json({ error: 'You can only edit your own comments.' }, 403);
    await env.DB.prepare('UPDATE comment_threads SET updated_at=? WHERE id=?').bind(nowIso(), message.thread_id).run();
    return json({ message });
  }
  if (!uuid(p.threadId) || typeof p.resolved !== 'boolean' || !Number.isSafeInteger(p.revision) || p.revision < 1) return json({ error: 'Invalid discussion update.' }, 400);
  const thread = await env.DB.prepare('UPDATE comment_threads SET resolved=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING *').bind(p.resolved ? 1 : 0, nowIso(), p.threadId, p.revision).first();
  return thread ? json({ thread }) : json({ error: 'This discussion changed. Refresh and try again.' }, 409);
}
async function commentsDelete(request, env, user) {
  const id = new URL(request.url).searchParams.get('message');
  if (!uuid(id)) return json({ error: 'Invalid comment.' }, 400);
  const message = await env.DB.prepare('SELECT * FROM comment_messages WHERE request_id=?').bind(id).first();
  if (!message) return json({ deleted: true, threadDeleted: false });
  if (message.author_id !== user.userId) return json({ error: 'You can only delete your own comments.' }, 403);
  const files = await env.DB.prepare('SELECT object_key FROM comment_attachments WHERE message_id=?').bind(id).all();
  const results = await env.DB.batch([
    env.DB.prepare('DELETE FROM comment_attachments WHERE message_id=?').bind(id),
    env.DB.prepare('DELETE FROM comment_messages WHERE request_id=? AND author_id=?').bind(id, user.userId),
    env.DB.prepare('DELETE FROM comment_threads WHERE id=? AND NOT EXISTS(SELECT 1 FROM comment_messages WHERE thread_id=?)').bind(message.thread_id, message.thread_id)]);
  for (const f of files.results) { try { await env.BUCKET?.delete(f.object_key); } catch { /* storage cleanup is best-effort */ } }
  return json({ deleted: true, threadDeleted: !!results[2].meta.changes });
}

/* ---------------- attachments (optional R2) ---------------- */
const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
const LIMIT = 20 * 1024 * 1024;
const ANSWER_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];
// Reads one uploaded file, checks type by extension AND file signature. Returns {error,status} or {name,ext,contentType,bytes,size}.
async function readUpload(request, form, allowed) {
  const file = form.get('file');
  if (!file || typeof file === 'string') return { error: 'Choose a file to upload.', status: 400 };
  const name = String(file.name || 'file').replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0, 180), ext = name.split('.').at(-1)?.toLowerCase() || '', contentType = TYPES[ext];
  if (!contentType || !allowed.includes(ext)) return { error: allowed.includes('doc') ? 'Choose a Word, Excel, PDF, JPG or PNG file.' : 'Choose a JPG, PNG, PDF or Excel file.', status: 400 };
  if (!file.size || file.size > LIMIT) return { error: 'Each file must be between 1 byte and 20 MB.', status: 413 };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const starts = sig => sig.every((v, i) => bytes[i] === v);
  const valid = ext === 'pdf' ? starts([0x25, 0x50, 0x44, 0x46, 0x2d]) : ext === 'png' ? starts([137, 80, 78, 71, 13, 10, 26, 10]) : ['jpg', 'jpeg'].includes(ext) ? starts([255, 216, 255]) : ['doc', 'xls'].includes(ext) ? starts([208, 207, 17, 224, 161, 177, 26, 225]) : starts([80, 75, 3, 4]);
  if (!valid) return { error: 'The file contents do not match its extension. Please choose the original document or image.', status: 400 };
  return { name, ext, contentType, bytes, size: file.size };
}
function serveFile(file, row) {
  const inline = ['application/pdf', 'image/png', 'image/jpeg'].includes(row.content_type);
  return new Response(file.body, { headers: { 'Content-Type': row.content_type, 'Content-Length': String(row.size), 'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(row.name)}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:" } });
}
async function attachPost(request, env, user) {
  if (!env.BUCKET) return json({ error: 'File attachments are not switched on for this portal.' }, 503);
  if (Number(request.headers.get('content-length')) > LIMIT + 100000) return json({ error: 'Each file must be 20 MB or smaller.' }, 413);
  let form; try { form = await request.formData(); } catch { return json({ error: 'Choose a file to upload.' }, 400); }
  const up = await readUpload(request, form, Object.keys(TYPES));
  if (up.error) return json({ error: up.error }, up.status);
  const id = crypto.randomUUID(), key = 'examples/' + id;
  await env.BUCKET.put(key, up.bytes, { httpMetadata: { contentType: up.contentType } });
  try {
    await env.DB.prepare('INSERT INTO comment_attachments (id,object_key,author_id,name,content_type,size,created_at,message_id) VALUES (?,?,?,?,?,?,?,NULL)').bind(id, key, user.userId, up.name, up.contentType, up.size, nowIso()).run();
  } catch (e) { try { await env.BUCKET.delete(key); } catch { /* ignore */ } throw e; }
  return json({ attachment: { id, name: up.name, content_type: up.contentType, size: up.size } });
}
async function attachGet(request, env, user) {
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid file.' }, 400);
  const row = await env.DB.prepare('SELECT * FROM comment_attachments WHERE id=? AND (message_id IS NOT NULL OR author_id=?)').bind(id, user.userId).first();
  if (!row || !env.BUCKET) return json({ error: 'File not found.' }, 404);
  const file = await env.BUCKET.get(row.object_key);
  if (!file) return json({ error: 'File not found.' }, 404);
  return serveFile(file, row);
}
async function attachDelete(request, env, user) {
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid file.' }, 400);
  const row = await env.DB.prepare('DELETE FROM comment_attachments WHERE id=? AND author_id=? AND message_id IS NULL RETURNING object_key').bind(id, user.userId).first();
  if (!row) return json({ error: 'This file is already posted or unavailable.' }, 409);
  try { await env.BUCKET?.delete(row.object_key); } catch { /* ignore */ }
  return json({ removed: true });
}

/* ---------------- files attached to answers (optional R2) ---------------- */
const MAX_FILES_PER_QUESTION = 10;
async function answerFilePost(request, env, user) {
  if (!env.BUCKET) return json({ error: 'File uploads are not switched on for this portal yet.' }, 503);
  if (Number(request.headers.get('content-length')) > LIMIT + 100000) return json({ error: 'Each file must be 20 MB or smaller.' }, 413);
  let form; try { form = await request.formData(); } catch { return json({ error: 'Choose a file to upload.' }, 400); }
  const section = String(form.get('section') || ''), fieldKey = String(form.get('fieldKey') || '');
  if (ownerOnly(section) || !Object.hasOwn(MODEL.sections, section) || !MODEL.sections[section].some(f => f.key === fieldKey)) return json({ error: 'Choose a valid question.' }, 400);
  const count = await env.DB.prepare('SELECT count(*) AS n FROM answer_files WHERE section=? AND field_key=?').bind(section, fieldKey).first('n');
  if (count >= MAX_FILES_PER_QUESTION) return json({ error: `This question already has ${MAX_FILES_PER_QUESTION} files. Remove one before adding another.` }, 409);
  const up = await readUpload(request, form, ANSWER_EXTS);
  if (up.error) return json({ error: up.error }, up.status);
  const id = crypto.randomUUID(), key = 'answers/' + id, now = nowIso();
  await env.BUCKET.put(key, up.bytes, { httpMetadata: { contentType: up.contentType } });
  try {
    await env.DB.prepare('INSERT INTO answer_files (id,object_key,section,field_key,author_id,author_name,name,content_type,size,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id, key, section, fieldKey, user.userId, user.displayName, up.name, up.contentType, up.size, now).run();
  } catch (e) { try { await env.BUCKET.delete(key); } catch { /* ignore */ } throw e; }
  return json({ file: { id, section, field_key: fieldKey, author_id: user.userId, author_name: user.displayName, name: up.name, content_type: up.contentType, size: up.size, created_at: now } });
}
async function answerFileGet(request, env) {
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid file.' }, 400);
  const row = await env.DB.prepare('SELECT * FROM answer_files WHERE id=?').bind(id).first();
  if (!row || !env.BUCKET) return json({ error: 'File not found.' }, 404);
  const file = await env.BUCKET.get(row.object_key);
  if (!file) return json({ error: 'File not found.' }, 404);
  return serveFile(file, row);
}
async function answerFileDelete(request, env, user) {
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid file.' }, 400);
  const row = await env.DB.prepare('SELECT * FROM answer_files WHERE id=?').bind(id).first();
  if (!row) return json({ removed: true });
  if (row.author_id !== user.userId) return json({ error: 'Only the person who uploaded a file can remove it.' }, 403);
  await env.DB.prepare('DELETE FROM answer_files WHERE id=? AND author_id=?').bind(id, user.userId).run();
  try { await env.BUCKET?.delete(row.object_key); } catch { /* storage cleanup is best-effort */ }
  return json({ removed: true });
}

/* ---------------- Lakeville team chat (owner reads, team writes) ---------------- */
const TEAM_PAGE = 300, MAX_TOPICS = 40;
/* ---------- "beyond Essentials" flags: DBY flags an ask, Lakeville says whether to plan it for a future upgrade ---------- */
const FLAG_ANSWERS = ['', 'plan', 'skip'];
async function flagsGet(request, env, user) {
  const all = user.isOwner && new URL(request.url).searchParams.get('all') === '1';
  const r = await env.DB.prepare(`SELECT f.*, (SELECT name FROM people WHERE email=f.answered_by) AS person_name FROM scope_flags f WHERE f.status='live' OR (?1 AND f.status='suggested') OR ?2 ORDER BY f.created_at`).bind(user.isOwner ? 1 : 0, all ? 1 : 0).all();
  return json({ flags: r.results.map(({ created_by, answered_by, person_name, why, source, ...f }) => ({ ...f, ...(user.isOwner ? { why, source } : {}), answered_name: answered_by ? person_name || nameFromEmail(answered_by) : null })) });
}
async function flagsPost(request, env, user) {
  if (!user.isOwner) return json({ error: 'Only DBY can flag items.' }, 403);
  let p; try { p = await readJson(request, 4000); } catch { return json({ error: 'Invalid flag.' }, 400); }
  if (!uuid(p.id) || typeof p.target !== 'string' || typeof p.note !== 'string' || p.note.length > 1000 || (p.why != null && (typeof p.why !== 'string' || p.why.length > 1000))) return json({ error: 'Invalid flag.' }, 400);
  const suggested = p.suggested === true;
  const [kind, a, b] = p.target.split(':');
  let section = null, key = null, label, excerpt;
  if (kind === 'field') {
    const f = !ownerOnly(a) && Object.hasOwn(MODEL.sections, a) ? MODEL.sections[a].find(x => x.key === b) : null;
    if (!f) return json({ error: 'That question no longer exists.' }, 400);
    const row = await env.DB.prepare('SELECT content FROM planning_sections WHERE id=?').bind(a).first();
    section = a; key = b; label = (MODEL.tabs.find(t => t[0] === a)?.[1] || a) + ' › ' + f.label; excerpt = String(JSON.parse(row?.content || '{}')[b] || '');
  } else if (kind === 'team' && uuid(a)) {
    const m = await env.DB.prepare('SELECT body, ref_section, ref_field FROM team_messages WHERE id=?').bind(a).first();
    if (!m) return json({ error: 'That message no longer exists.' }, 400);
    section = m.ref_section; key = m.ref_field; label = 'Team chat'; excerpt = m.body;
  } else if (kind === 'ask' && uuid(a)) {
    const m = await env.DB.prepare('SELECT m.body, t.section, t.field_key FROM comment_messages m JOIN comment_threads t ON t.id=m.thread_id WHERE m.request_id=?').bind(a).first();
    if (!m) return json({ error: 'That question no longer exists.' }, 400);
    section = m.section === 'general' ? null : m.section; key = m.field_key; label = 'Questions for DBY'; excerpt = m.body;
  } else return json({ error: 'Invalid flag.' }, 400);
  const note = p.note.trim() || 'This goes beyond the School-Year Essentials plan.';
  // An AI suggestion never overrides an existing flag, suggestion or dismissal on the same item.
  const r = await env.DB.prepare(`INSERT INTO scope_flags (id,target,kind,section,field_key,label,excerpt,note,created_by,created_at,status,why,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(target) DO ${suggested ? 'NOTHING' : "UPDATE SET note=excluded.note, excerpt=excluded.excerpt, status='live'"} RETURNING id`)
    .bind(p.id, p.target, kind, section, key, label, excerpt.slice(0, 600), note, user.userId, nowIso(), suggested ? 'suggested' : 'live', p.why?.trim() || null, suggested ? 'ai' : 'dby').first();
  return json({ ok: true, created: !!r, status: suggested ? (r ? 'suggested' : 'exists') : 'live' });
}
async function flagsPatch(request, env, user) {
  let p; try { p = await readJson(request, 3000); } catch { return json({ error: 'Invalid answer.' }, 400); }
  if (p.status != null) {
    if (!user.isOwner) return json({ error: 'Only DBY can approve flags.' }, 403);
    if (!uuid(p.id) || !['live', 'dismissed'].includes(p.status) || (p.note != null && (typeof p.note !== 'string' || !p.note.trim() || p.note.length > 1000))) return json({ error: 'Invalid update.' }, 400);
    const row = await env.DB.prepare('UPDATE scope_flags SET status=?, note=COALESCE(?, note), created_at=CASE WHEN status=\'suggested\' AND ?=\'live\' THEN ? ELSE created_at END WHERE id=? RETURNING id').bind(p.status, p.note?.trim() || null, p.status, nowIso(), p.id).first();
    return row ? json({ ok: true }) : json({ error: 'That flag was removed.' }, 404);
  }
  if (!uuid(p.id) || !FLAG_ANSWERS.includes(p.answer) || (p.note != null && (typeof p.note !== 'string' || p.note.length > 1000))) return json({ error: 'Invalid answer.' }, 400);
  const row = await env.DB.prepare("UPDATE scope_flags SET answer=?, answer_note=?, answered_by=?, answered_at=? WHERE id=? AND status='live' RETURNING id")
    .bind(p.answer, p.answer ? (p.note || '').trim() || null : null, p.answer ? user.userId : null, p.answer ? nowIso() : null, p.id).first();
  return row ? json({ ok: true }) : json({ error: 'That flag was removed.' }, 404);
}
async function flagsDelete(request, env, user) {
  if (!user.isOwner) return json({ error: 'Only DBY can remove flags.' }, 403);
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid flag.' }, 400);
  await env.DB.prepare('DELETE FROM scope_flags WHERE id=?').bind(id).run();
  return json({ ok: true });
}
async function teamGet(request, env, user) {
  const before = Number(new URL(request.url).searchParams.get('before') || 0);
  if (!Number.isSafeInteger(before) || before < 0) return json({ error: 'Invalid request.' }, 400);
  const rows = await env.DB.prepare(`SELECT * FROM (SELECT m.seq,m.id,m.topic,m.ref_section,m.ref_field,m.ref_label,m.author_id,${NAME('m', 'author_id', 'author_name')} AS author_name,m.body,m.created_at,m.edited_at FROM team_messages m WHERE (?=0 OR m.seq<?) ORDER BY m.seq DESC LIMIT ${TEAM_PAGE + 1}) ORDER BY seq`).bind(before, before).all();
  const more = rows.results.length > TEAM_PAGE, messages = more ? rows.results.slice(1) : rows.results;
  const topics = await env.DB.prepare('SELECT name FROM team_topics ORDER BY created_at').all();
  return json({ messages, topics: topics.results.map(t => t.name), me: user.userId, readOnly: false, isOwner: user.isOwner, nextBefore: more ? messages[0].seq : null });
}
async function teamPost(request, env, user) {
  let p; try { p = await readJson(request); } catch { return json({ error: 'Invalid message.' }, 400); }
  if (!uuid(p.id) || typeof p.body !== 'string' || !p.body.trim() || p.body.length > 4000 || typeof p.topic !== 'string') return json({ error: 'Write a message (up to 4,000 characters).' }, 400);
  const topic = await env.DB.prepare('SELECT name FROM team_topics WHERE name=?').bind(p.topic).first('name');
  if (!topic) return json({ error: 'Choose a topic.' }, 400);
  let ref = null;
  if (p.ref != null) {
    const sec = p.ref.section, key = p.ref.field, field = validSection(sec) && sec !== 'general' ? (key === MODEL.INTRO_KEY ? { label: 'Page introduction' } : MODEL.sections[sec].find(f => f.key === key)) : null;
    if (!field) return json({ error: 'That question no longer exists.' }, 400);
    ref = [sec, key, (MODEL.tabs.find(t => t[0] === sec)?.[1] || sec) + ' › ' + field.label];
  }
  await env.DB.prepare('INSERT INTO team_messages (id,topic,ref_section,ref_field,ref_label,author_id,author_name,body,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(p.id, topic, ref?.[0] ?? null, ref?.[1] ?? null, ref?.[2] ?? null, user.userId, user.displayName, p.body.trim(), nowIso()).run();
  return json({ ok: true });
}
async function teamPatch(request, env, user) {
  let p; try { p = await readJson(request); } catch { return json({ error: 'Invalid edit.' }, 400); }
  if (!uuid(p.id) || typeof p.body !== 'string' || !p.body.trim() || p.body.length > 4000) return json({ error: 'A message cannot be empty. Use Delete to remove it.' }, 400);
  const row = await env.DB.prepare('UPDATE team_messages SET body=?,edited_at=? WHERE id=? AND author_id=? RETURNING id').bind(p.body.trim(), nowIso(), p.id, user.userId).first();
  return row ? json({ ok: true }) : json({ error: 'You can only edit your own messages.' }, 403);
}
async function teamDelete(request, env, user) {
  const id = new URL(request.url).searchParams.get('id');
  if (!uuid(id)) return json({ error: 'Invalid message.' }, 400);
  const row = await env.DB.prepare('SELECT author_id FROM team_messages WHERE id=?').bind(id).first();
  if (!row) return json({ ok: true });
  if (row.author_id !== user.userId) return json({ error: 'You can only delete your own messages.' }, 403);
  await env.DB.prepare('DELETE FROM team_messages WHERE id=? AND author_id=?').bind(id, user.userId).run();
  return json({ ok: true });
}
async function teamTopicPost(request, env, user) {
  let p; try { p = await readJson(request, 2000); } catch { return json({ error: 'Invalid topic.' }, 400); }
  const name = typeof p.name === 'string' ? p.name.replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
  if (!name) return json({ error: 'Name the topic, e.g. the event.' }, 400);
  const count = await env.DB.prepare('SELECT count(*) AS n FROM team_topics').first('n');
  if (count >= MAX_TOPICS) return json({ error: 'There are already ' + MAX_TOPICS + ' topics.' }, 409);
  await env.DB.prepare('INSERT OR IGNORE INTO team_topics (name,created_by,created_at) VALUES (?,?,?)').bind(name, user.userId, nowIso()).run();
  const saved = await env.DB.prepare('SELECT name FROM team_topics WHERE name=?').bind(name).first('name');
  return json({ name: saved });
}

/* ---------------- people ---------------- */
async function mePut(request, env, user) {
  let p; try { p = await readJson(request, 2000); } catch { return json({ error: 'Invalid name.' }, 400); }
  const name = typeof p.name === 'string' ? p.name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 60) : '';
  if (!name) return json({ error: 'Enter a name.' }, 400);
  await env.DB.prepare('INSERT INTO people (email,name,updated_at) VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,updated_at=excluded.updated_at').bind(user.email, name, nowIso()).run();
  return json({ email: user.email, name, named: true });
}

/* ---------------- pages ---------------- */
function page(html, status = 200) {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS } });
}
function setupPage(title, lines) {
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return page(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lakeville PTA Planning</title><style>body{font-family:Arial,sans-serif;background:#f6f7f3;color:#243c35;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px}div{max-width:560px;background:#fff;border:1px solid #dde3d6;border-radius:12px;padding:28px}h1{font-family:Georgia,serif;font-weight:400}li{margin:8px 0;line-height:1.5}</style></head><body><div><h1>${esc(title)}</h1><ul>${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div></body></html>`, 403);
}

/* ---------------- router ---------------- */
async function handle(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (path === '/healthz') return json({ ok: true, version: VERSION });
  if (!env.DB) return setupPage('Almost there: add the database', ['In Cloudflare, open this Worker → Settings → Bindings → Add → D1 database.', 'Variable name: DB. Choose (or create) a database, then save and redeploy.']);
  if (!teamOrigin(env) || !env.ACCESS_AUD) return setupPage('Almost there: turn on sign-in', ['Cloudflare Access is not connected yet.', 'Add the variables ACCESS_TEAM_DOMAIN and ACCESS_AUD to this Worker (Settings → Variables and Secrets), then deploy again.']);
  await ensureSchema(env.DB);
  const user = await getUser(request, env);
  if (user?.error) return json({ error: 'Sign-in could not be checked. Please try again.' }, 503);
  if (!user) {
    if (path.startsWith('/api/')) return json({ error: 'Your sign-in has expired. Reload the page to sign in again.' }, 401);
    return setupPage('Sign-in required', ['This portal is private. Open it from the link you were sent and sign in with your invited email address.', 'If you just signed in, reload the page.']);
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (origin !== url.origin) return json({ error: 'Request not allowed.' }, 403);
  }
  try {
    if (path === '/' && method === 'GET') return page(HTML);
    if (path === '/app-preview.html' && method === 'GET') return user.isOwner ? page(PREVIEW_HTML) : json({ error: 'Not found.' }, 404);
    if (path === '/api/me') {
      if (method === 'GET') return json({ email: user.email, name: user.displayName, named: user.named, isOwner: user.isOwner, attachments: !!env.BUCKET, version: VERSION });
      if (method === 'PUT') return mePut(request, env, user);
    }
    if (path === '/api/plan') { if (method === 'GET') return await planGet(env, user); if (method === 'PATCH') return await planPatch(request, env, user); if (method === 'PUT') return await planPut(request, env, user); }
    if (path === '/api/comments') {
      if (method === 'GET') return await commentsGet(request, env, user);
      if (method === 'POST') return await commentsPost(request, env, user);
      if (method === 'PATCH') return await commentsPatch(request, env, user);
      if (method === 'DELETE') return await commentsDelete(request, env, user);
    }
    if (path === '/api/plan/history' && method === 'GET') return await planHistory(request, env, user);
    if (path === '/api/team') {
      if (method === 'GET') return await teamGet(request, env, user);
      if (method === 'POST') return await teamPost(request, env, user);
      if (method === 'PATCH') return await teamPatch(request, env, user);
      if (method === 'DELETE') return await teamDelete(request, env, user);
    }
    if (path === '/api/flags') {
      if (method === 'GET') return await flagsGet(request, env, user);
      if (method === 'POST') return await flagsPost(request, env, user);
      if (method === 'PATCH') return await flagsPatch(request, env, user);
      if (method === 'DELETE') return await flagsDelete(request, env, user);
    }
    if (path === '/api/team/topics' && method === 'POST') return await teamTopicPost(request, env, user);
    if (path === '/api/answer-files') {
      if (method === 'GET') return await answerFileGet(request, env);
      if (method === 'POST') return await answerFilePost(request, env, user);
      if (method === 'DELETE') return await answerFileDelete(request, env, user);
    }
    if (path === '/api/attachments') {
      if (method === 'GET') return await attachGet(request, env, user);
      if (method === 'POST') return await attachPost(request, env, user);
      if (method === 'DELETE') return await attachDelete(request, env, user);
    }
    return json({ error: 'Not found.' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong. Your draft is kept. Please try again.' }, 503);
  }
}

export default { fetch: handle };
