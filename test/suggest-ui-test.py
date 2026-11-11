import json, time, urllib.request
from playwright.sync_api import sync_playwright, expect
T = json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
B = 'http://localhost:8787'; errors = []; res = []
def check(c, m): res.append(bool(c)); print(('ok  ' if c else 'FAIL'), m)
def api(who, path, body=None, method='GET'):
    r = urllib.request.Request(B + path, method=method, data=json.dumps(body).encode() if body else None, headers={'Cf-Access-Jwt-Assertion': T[who], 'Origin': B, 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(r).read())
import uuid
api('jimmy', '/api/plan', {'section': 'events', 'key': 'event0Better', 'value': 'Parents pay by card when they sign up', 'base': ''}, 'PATCH')
api('ying', '/api/flags', {'id': str(uuid.uuid4()), 'target': 'field:events:event0Better', 'note': 'Card payments in the app would be part of a future upgrade.', 'why': 'Processing card payments is Pro', 'suggested': True}, 'POST')
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    def ctx(who):
        c = br.new_context(viewport={'width': 1440, 'height': 1000}, extra_http_headers={'Cf-Access-Jwt-Assertion': T[who]})
        pg = c.new_page(); pg.on('pageerror', lambda e: errors.append(f'{who}: {e}')); pg.goto(B + '/'); return pg
    y = ctx('ying'); j = ctx('jessie')
    for pg in (y, j): pg.click('nav button[aria-label="Current events"]')
    sug = y.locator('[data-flag-target="field:events:event0Better"] .scope-flag.suggested')
    expect(sug).to_be_visible(timeout=8000); check('can’t see this yet' in sug.inner_text(), 'owner sees AI suggestion on question')
    time.sleep(1); check(j.locator('[data-flag-target="field:events:event0Better"] .scope-flag').count() == 0, 'Jessie does not see suggestion')
    y.click('nav button[aria-label="Pro tier planning"]')
    ov = y.locator('#flag-overview'); expect(ov).to_contain_text('AI suggestions waiting for you (1)')
    ov.screenshot(path='/tmp/pv/sugg-overview.png')
    ov.locator('li.sugg >> text=Approve').click()
    expect(ov).not_to_contain_text('AI suggestions waiting', timeout=8000); check(True, 'approve from overview')
    box = j.locator('[data-flag-target="field:events:event0Better"] .scope-flag')
    expect(box).to_be_visible(timeout=10000); check('future upgrade' in box.inner_text(), 'Jessie sees flag after approval')
    br.close()
print('errors', errors); print(f'suggest UI: {sum(res)} passed, {len(res)-sum(res)} failed')
