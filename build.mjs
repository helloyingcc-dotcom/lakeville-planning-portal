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
if (/\bPro\b|\$249|\$499|upgrade/i.test(previewClean.replace(/<img[^>]+>/g, '').replace(/LION = '[^']*'/, ''))) throw new Error('clean preview still mentions Pro / prices');
const worker = r('./src/server.js')
  .replace('/*__MODEL__*/', () => model)
  .replace('/*__HTML__*/""', () => JSON.stringify(html))
  .replace('/*__PREVIEW__*/""', () => JSON.stringify(preview))
  .replace('/*__PREVIEW_CLEAN__*/""', () => JSON.stringify(previewClean))
  .replace('/*__VERSION__*/"dev"', () => JSON.stringify(version));

writeFileSync(new URL('./worker.js', import.meta.url), worker);
console.log('worker.js', worker.length, 'bytes, version', version);
