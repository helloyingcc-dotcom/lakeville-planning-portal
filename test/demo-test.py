# App demo (/demo): clean prototype for Lakeville; "What's on this screen" shows plan status + "For you"; links go both ways.
import json
from playwright.sync_api import sync_playwright
T=json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
G='.field:has(#answer-start-goal)'
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    def ctx(who, url='http://localhost:8787/'):
        c=b.new_context(viewport={'width':1400,'height':950},extra_http_headers={'Cf-Access-Jwt-Assertion':T[who]}); c.add_init_script('window.__noAutoLabel = true'); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(who+': '+str(e))); pg.goto(url); pg.wait_for_timeout(1500); return c, pg
    _, j=ctx('jessie'); j.fill('#answer-start-goal','Cash collected at the door, with names'); j.wait_for_timeout(2500)
    _, y=ctx('ying'); y.locator(G+' .respond-anchor').click(); y.wait_for_timeout(300)
    y.locator(G+' .dec-edrow:not(.ask) input').fill('Cash collected at the door'); y.locator(G+' .dec-edrow:not(.ask) textarea').fill('Saved with name, amount, who collected it and time.')
    y.locator(G+' .dec-edrow:not(.ask) select').nth(1).select_option('payment')
    y.click(G+' >> text=Send to Lakeville'); y.wait_for_timeout(1500)
    print('owner sees For line:', y.locator(G+' .dec-for').inner_text(), '| see-it link:', y.locator(G+' .see-it').get_attribute('href'))
    jc, d=ctx('jessie','http://localhost:8787/demo#screen=pay'); d.wait_for_timeout(1500)
    print('demo bar:', d.locator('.proto-bar').inner_text()[:120].replace('\n',' '))
    print('toggle:', d.locator('.demo-toggle').inner_text())
    d.click('.demo-toggle'); d.wait_for_timeout(300)
    print('panel:', d.locator('.demo-panel').inner_text()[:400].replace('\n',' | '))
    d.screenshot(path='/tmp/pv/demo.png')
    print('demo has Pro text:', d.locator('text=/\\bPro\\b/').count(), '| door QR:', d.locator('text=Door QR').count())
    with jc.expect_page() as np: d.click('.demo-item a')
    q=np.value; q.wait_for_timeout(3500)
    print('jumped to question tab:', q.locator(G+' .dec-tabs [aria-selected=true]').inner_text())
    print(errs)
