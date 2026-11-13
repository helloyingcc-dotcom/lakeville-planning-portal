# Decisions: DBY posts an answer (with a clean preview), Lakeville sees banner + badge, asks, approves; editing resets to waiting.
import json
from playwright.sync_api import sync_playwright
T=json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    def ctx(who):
        c=b.new_context(viewport={'width':1400,'height':1000},extra_http_headers={'Cf-Access-Jwt-Assertion':T[who]}); c.add_init_script('window.__noAutoLabel = true'); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(who+': '+str(e))); pg.goto('http://localhost:8787/'); pg.wait_for_timeout(1500); return pg
    j=ctx('jessie'); j.click('nav button[aria-label="Feature priorities"]'); j.wait_for_timeout(500)
    j.fill('#answer-features-checkinNotes','Would it work offline / without good internet connection?'); j.wait_for_timeout(2500)
    y=ctx('ying'); y.click('nav button[aria-label="Feature priorities"]'); y.wait_for_timeout(800)
    y.locator('.field:has(#answer-features-checkinNotes) .respond-anchor').click(); y.wait_for_timeout(400)
    y.fill('.dec-compose input >> nth=0','Does check-in work without internet?')
    y.fill('#dec-answer','Yes. Before the event, each volunteer phone saves the guest list.\n\nIf the school Wi-Fi drops, check-in keeps working and syncs later.')
    y.select_option('.dec-compose select >> nth=1','desk')
    y.click('text=Post for approval'); y.wait_for_timeout(1500)
    y.screenshot(path='/tmp/pv/dec-owner.png', full_page=True)
    j.wait_for_timeout(6500)
    print('jessie banner:', j.locator('#dec-banner').inner_text()[:120]); print('pointer:', j.locator('.dec-pointer').first.inner_text())
    print('nav badge:', j.locator('.dec-badge').inner_text())
    j.click('#dec-banner button'); j.wait_for_timeout(2500)
    j.screenshot(path='/tmp/pv/dec-lake.png', full_page=True)
    fr=j.frame_locator('.dprev-frame'); print('preview has door QR?', fr.locator('text=Door QR').count(), ' has VIP:', fr.locator('text=VIP guests').count(), ' menu visible:', fr.locator('.side>button').first.is_visible())
    j.click('text=💬 Ask a question'); j.fill('#dec-note-'+j.locator('.decision').first.get_attribute('id').replace('D','x') if False else '.dreply textarea','What if a phone dies?'); j.click('text=Send question'); j.wait_for_timeout(1500)
    y.wait_for_timeout(6500); print('owner banner:', y.locator('#dec-banner').inner_text()[:80] if y.locator('#dec-banner').count() else '-'); print('owner badge:', y.locator('.dec-badge').inner_text() if y.locator('.dec-badge').count() else '-')
    j.click('button.approve'); j.wait_for_timeout(1500); print('status:', j.locator('.dstatus').first.inner_text(), '| progress:', j.locator('.dec-progress-top span').inner_text())
    y.wait_for_timeout(1000); y.click('nav button[aria-label="Decisions"]'); y.wait_for_timeout(500); y.click('text=Edit answer'); y.fill('#dec-answer','Yes, and a printable door list is the backup.'); y.click('.dec-compose >> text=Save'); y.wait_for_timeout(1500)
    print('after edit:', y.locator('.dstatus').first.inner_text())
    print(errs)
