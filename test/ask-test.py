# Ask box (run harness with MOCK_AI=1): Lakeville asks in the demo, gets an answer + Show me; "not in plan" → Yes, I'd like this; owner sees spend + requests.
import json
from playwright.sync_api import sync_playwright
T=json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    def ctx(who, url):
        c=b.new_context(viewport={'width':1400,'height':950},extra_http_headers={'Cf-Access-Jwt-Assertion':T[who]}); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(who+': '+str(e))); pg.goto(url); pg.wait_for_timeout(1500); return pg
    d=ctx('jessie','http://localhost:8787/demo'); print('toggle:', d.locator('.demo-toggle').inner_text())
    d.click('.demo-toggle'); d.fill('#demo-q','How do we record a check payment?'); d.click('.demo-ask button'); d.wait_for_timeout(1200)
    print('answer:', d.locator('.demo-ans').inner_text().replace('\n',' | ')[:200])
    d.click('text=Show me'); d.wait_for_timeout(500); print('screen now:', d.locator('h1').first.inner_text())
    d.fill('#demo-q','Can parents pay with Venmo?'); d.click('.demo-ask button'); d.wait_for_timeout(1200)
    d.click('text=Yes, I’d like this'); d.wait_for_timeout(500); print('after want:', d.locator('.demo-ans').inner_text().replace('\n',' | ')[:160])
    d.screenshot(path='/tmp/pv/ask.png')
    y=ctx('ying','http://localhost:8787/'); y.click('nav button[aria-label*="Pro"]'); y.wait_for_timeout(22000)
    print('owner panel:', y.locator('#ai-usage').inner_text().replace('\n',' | ')[:500])
    print(errs)
