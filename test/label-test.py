# In-box name labels: a new answer starts with the writer's name; a second writer gets their own labelled line.
import json, urllib.request
from playwright.sync_api import sync_playwright
T=json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
F='#answer-events-event0Pain'
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    def ctx(who):
        c=b.new_context(viewport={'width':1300,'height':900},extra_http_headers={'Cf-Access-Jwt-Assertion':T[who]}); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.goto('http://localhost:8787/'); pg.wait_for_timeout(1200); pg.click('nav button[aria-label="Current events"]'); pg.wait_for_timeout(600); return pg
    j=ctx('jessie'); j.click(F); print('empty focus:', repr(j.locator(F).input_value())); j.locator('body').click(position={'x':5,'y':5}); j.wait_for_timeout(300); print('left:', repr(j.locator(F).input_value()))
    j.click(F); j.keyboard.type('Matching Zelle payments'); j.locator('body').click(position={'x':5,'y':5}); j.wait_for_timeout(2500)
    j.click(F); print('jessie again:', repr(j.locator(F).input_value())); j.locator('body').click(position={'x':5,'y':5})
    y=ctx('ying'); y.click(F); y.keyboard.type('More'); y.locator('body').click(position={'x':5,'y':5}); y.wait_for_timeout(2500); print('after ying:', repr(y.locator(F).input_value()))
    print(errs)
