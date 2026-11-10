import { readFileSync, writeFileSync } from 'node:fs';
const r = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const model = r('./src/model.js');
const version = new Date().toISOString().slice(0, 16).replace('T', ' ');
const html = r('./src/page.html')
  .replace('/*__CSS__*/', () => r('./src/styles.css'))
  .replace('/*__MODEL__*/', () => model)
  .replace('/*__CLIENT__*/', () => r('./src/client.js').replace(/<\/script/gi, '<\\/script'));
const worker = r('./src/server.js')
  .replace('/*__MODEL__*/', () => model)
  .replace('/*__HTML__*/""', () => JSON.stringify(html))
  .replace('/*__PREVIEW__*/""', () => JSON.stringify(r('./src/preview.html')))
  .replace('/*__VERSION__*/"dev"', () => JSON.stringify(version));

writeFileSync(new URL('./worker.js', import.meta.url), worker);
console.log('worker.js', worker.length, 'bytes, version', version);
