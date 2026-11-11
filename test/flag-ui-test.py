import json, time
from playwright.sync_api import sync_playwright, expect
T = json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
B = 'http://localhost:8787'; errors = []; res = []
def check(c, m):
    res.append(bool(c)); print(('ok  ' if c else 'FAIL'), m)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    def ctx(who):
        c = br.new_context(viewport={'width': 1440, 'height': 1000}, extra_http_headers={'Cf-Access-Jwt-Assertion': T[who]})
        pg = c.new_page(); pg.on('pageerror', lambda e: errors.append(f'{who}: {e}')); pg.goto(B + '/'); return pg
    y = ctx('ying'); j = ctx('jessie')
    for pg in (y, j):
        expect(pg.locator('.scope-note')).to_be_visible()
    check('School-Year Essentials' in j.locator('.scope-note').inner_text(), 'Lakeville sees Essentials note')
    check(j.locator('.flag-anchor').count() == 0, 'Lakeville has no flag buttons')
    check(y.locator('.flag-anchor').count() > 0, 'owner has flag buttons')
    j.click('nav button[aria-label="Current events"]'); y.click('nav button[aria-label="Current events"]')
    ta = j.locator('#answer-events-event0Better'); ta.fill('We would love parents to pay by card in the app'); time.sleep(2.5)
    y.locator('.flag-anchor[data-target="field:events:event0Better"]').click()
    y.locator('#flag-field-events-event0Better-note').fill('Paying by card inside the app is part of a future upgrade.')
    y.click('text=Flag as beyond Essentials')
    expect(y.locator('[data-flag-target="field:events:event0Better"] .scope-flag')).to_be_visible()
    box = j.locator('[data-flag-target="field:events:event0Better"] .scope-flag')
    expect(box).to_be_visible(timeout=10000)
    check('future upgrade' in box.inner_text() and 'Only you see' not in box.inner_text(), 'Jessie sees the flag, without owner tools')
    box.locator('xpath=ancestor::div[contains(@class,"field")][1]').screenshot(path='/tmp/pv/flag-jessie.png')
    box.locator('input').fill('Yes, for the Car Show')
    box.locator('text=Yes, plan it').click()
    expect(y.locator('[data-flag-target="field:events:event0Better"] .flag-answer')).to_contain_text('Yes, plan it', timeout=10000)
    check(True, 'owner sees Jessie\'s answer live')
    # team message flag
    j.fill('#team-message', 'Could it also track vendor booths?'); j.click('#teamSend'); time.sleep(1)
    time.sleep(3)
    y.locator('.team-message', has_text='vendor booths').locator('.flag-anchor').click()
    y.locator('.team-message form.scope-flag button.primary').click()
    expect(j.locator('.team-message', has_text='vendor booths').locator('.scope-flag')).to_be_visible(timeout=10000)
    check(True, 'flag shows under team message for Jessie')
    y.click('nav button[aria-label="Pro tier planning"]')
    ov = y.locator('#flag-overview'); expect(ov).to_contain_text('2 flagged')
    check('1 want it planned' in ov.inner_text() and '1 waiting' in ov.inner_text(), 'Pro page overview counts')
    ov.screenshot(path='/tmp/pv/flag-overview.png')
    br.close()
print('errors', errors); print(f'flag UI: {sum(res)} passed, {len(res)-sum(res)} failed')
