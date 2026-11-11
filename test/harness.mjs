// Local stand-in for Cloudflare: D1 (node:sqlite), R2 (memory), Access (self-signed JWTs).
import http from 'node:http';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
const worker = (await import(process.argv[2] || new URL('../worker.js', import.meta.url).href)).default;
const port = Number(process.argv[3] || 8787);

const sql = new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
const isQuery = s => /^\s*(SELECT|WITH)/i.test(s) || /\bRETURNING\b/i.test(s);
function stmt(text, args = []) {
  const exec = () => {
    const p = sql.prepare(text);
    if (isQuery(text)) { const rows = p.all(...args); return { results: rows.map(r => ({ ...r })), meta: { changes: rows.length } }; }
    const r = p.run(...args); return { results: [], meta: { changes: Number(r.changes) } };
  };
  return { bind: (...a) => stmt(text, a), all: async () => exec(), run: async () => exec(), first: async col => { const r = exec().results[0]; return r == null ? null : col ? r[col] : r; }, _exec: exec };
}
const DB = { prepare: t => stmt(t), batch: async list => { sql.exec('BEGIN'); try { const out = list.map(s => s._exec()); sql.exec('COMMIT'); return out; } catch (e) { sql.exec('ROLLBACK'); throw e; } } };
const objects = new Map();
const BUCKET = { put: async (k, v) => { objects.set(k, Buffer.from(v)); }, get: async k => objects.has(k) ? { body: Readable.toWeb(Readable.from([objects.get(k)])) } : null, delete: async k => { objects.delete(k); } };

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256' };
const TEAM = 'https://lakeville.cloudflareaccess.com', AUD = 'aud-test-123';
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => String(url).startsWith(TEAM) ? new Response(JSON.stringify({ keys: [jwk] })) : realFetch(url, o);
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
export function token(email, { aud = AUD, exp = Math.floor(Date.now() / 1000) + 3600 } = {}) {
  const head = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT' }), body = b64({ email, aud: [aud], iss: TEAM, exp, iat: Math.floor(Date.now() / 1000) });
  return head + '.' + body + '.' + crypto.sign('sha256', Buffer.from(head + '.' + body), privateKey).toString('base64url');
}
const env = { OWNER_EMAILS: 'ying@example.com', DB, BUCKET: process.env.NO_BUCKET ? undefined : BUCKET, ACCESS_TEAM_DOMAIN: 'lakeville', ACCESS_AUD: AUD };
http.createServer(async (req, res) => {
  const url = 'http://localhost:' + port + req.url;
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const request = new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Readable.toWeb(req) : undefined, duplex: 'half' });
  const r = await worker.fetch(request, env, {});
  res.writeHead(r.status, Object.fromEntries(r.headers));
  if (r.body) for await (const c of r.body) res.write(c);
  res.end();
}).listen(port, () => {
  console.log('ready', port);
  console.log('TOKENS', JSON.stringify({ ying: token('ying@example.com'), jessie: token('jessie.smith@example.com'), badAud: token('x@example.com', { aud: 'other' }), expired: token('x@example.com', { exp: 1000 }) }));
});
