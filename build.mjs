import { readFileSync, writeFileSync } from 'node:fs';
const r = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const model = r('./src/model.js');
const lion = r('./src/client.js').match(/const LION_IMG = '([^']+)'/)[1];
const version = new Date().toISOString().slice(0, 16).replace('T', ' ');
const html = r('./src/page.html')
  .replace('/*__CSS__*/', () => r('./src/styles.css'))
  .replace('/*__MODEL__*/', () => model)
  .replace('/*__CLIENT__*/', () => r('./src/client.js').replace(/<\/script/gi, '<\\/script'));
const preview = r('./src/preview.html').replace('__LION_DATA__', () => lion);
// Lakeville-safe copy: Pro-only parts (between /*PRO*/ and /*ORP*/) removed, always single-screen.
const previewClean = preview.replace(/\/\*PRO\*\/[\s\S]*?\/\*ORP\*\//g, '').replace('const CLEAN = false', 'const CLEAN = true');
if (/\bPro\b|\$249|\$499|(?<!future )upgrade/i.test(previewClean.replace(/<img[^>]+>/g, '').replace(/LION = '[^']*'/, ''))) throw new Error('clean preview still mentions Pro / prices');
const worker = r('./src/server.js')
  .replace('/*__MODEL__*/', () => model)
  .replace('/*__HTML__*/""', () => JSON.stringify(html))
  .replace('/*__PREVIEW__*/""', () => JSON.stringify(preview))
  .replace('/*__PREVIEW_CLEAN__*/""', () => JSON.stringify(previewClean))
  .replace('/*__VERSION__*/"dev"', () => JSON.stringify(version));

writeFileSync(new URL('./worker.js', import.meta.url), worker);
// Shareable copy for other schools: no Lakeville name or logo, no demo panel / Ask box (those only run at /demo on the portal).
const logo = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1f2f57"/><path d="M32 14 8 26l24 12 18-9v13h4V26z" fill="#fff"/><path d="M18 36v8c0 4 6 8 14 8s14-4 14-8v-8l-14 7z" fill="#f2b84b"/></svg>');
const share = previewClean.replace(lion, () => logo)
  .replace(/Lakeville Events App · Essentials prototype/g, 'PTA Events App · preview by Designs By Ying')
  .replace(/Lakeville PTA/g, 'Your School PTA').replace(/lakeville-pta/g, 'your-school-pta').replace(/Lakeville Elementary/g, 'Your School').replace(/Lakeville/g, 'your PTA').replace(/lakeville/g, 'your-school')
  .replace(/Sweetheart Dance/g, 'Spring Dance').replace(/Car Show/g, 'Spring Carnival').replace(/Literacy Night/g, 'Science Night');
if (/lakeville/i.test(share)) throw new Error('share preview still mentions Lakeville');
import('node:fs').then(fs => { fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true }); fs.writeFileSync(new URL('./dist/share-preview.html', import.meta.url), share); });
console.log('worker.js', worker.length, 'bytes, version', version);
