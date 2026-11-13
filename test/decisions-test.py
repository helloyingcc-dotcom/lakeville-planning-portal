# DBY's response inside a question: chart rows Lakeville approves one by one (or all), responds to; a "DBY asks" tab they answer; editing a row re-opens it.
import json
from playwright.sync_api import sync_playwright
T=json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
G='.field:has(#answer-start-goal)'
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    def ctx(who):
        c=b.new_context(viewport={'width':1400,'height':1000},extra_http_headers={'Cf-Access-Jwt-Assertion':T[who]}); c.add_init_script('window.__noAutoLabel = true'); pg=c.new_page(); pg.on('pageerror',lambda e:errs.append(who+': '+str(e))); pg.goto('http://localhost:8787/'); pg.wait_for_timeout(1500); return pg
    j=ctx('jessie'); j.fill('#answer-start-goal','Digital payment tracking; QR check-in; walk-ins; a standard for all events'); j.wait_for_timeout(2500)
    y=ctx('ying'); y.wait_for_timeout(500)
    y.locator(G+' .respond-anchor').click(); y.wait_for_timeout(300)
    rows=[('Digital payment tracking','Verified / Pending / Not paid, with reminders.'),('QR check-in','Volunteers scan family QR codes on their phones.'),('Walk-ins','Added at the check-in desk with name and payment.')]
    for i,(a,hw) in enumerate(rows):
        if i: y.click(G+' >> text=+ Add row')
        y.locator(G+' .dec-edrow:not(.ask) input').nth(i).fill(a); y.locator(G+' .dec-edrow:not(.ask) textarea').nth(i).fill(hw)
    y.click(G+' >> text=+ Add a question'); y.locator(G+' .dec-edrow.ask textarea').fill('Do you mean (a) same experience for parents, or (b) PTA-wide rules every chair follows?')
    y.select_option(G+' .dec-prevpick select','dash'); y.click(G+' >> text=Send to Lakeville'); y.wait_for_timeout(1500)
    print('owner tabs:', y.locator(G+' .dec-tabs').inner_text().replace('\n',' | '))
    j.wait_for_timeout(6500)
    print('banner:', j.locator('#dec-banner').inner_text().replace('\n',' '))
    print('jessie tab shown:', j.locator(G+' .dec-tabs [aria-selected=true]').inner_text(), '| answer hidden:', not j.locator('#answer-start-goal').is_visible())
    j.locator(G+' .dec-tr.st-waiting .mini.approve').first.click(); j.wait_for_timeout(1500)
    j.locator(G+' .dec-tr.st-waiting').first.locator('.mini', has_text='💬').click(); j.locator(G+' .dreply textarea').fill('Can volunteers also see who is still missing?'); j.click(G+' >> text=Send response'); j.wait_for_timeout(1500)
    j.locator(G+' .dec-tabs button', has_text='DBY asks').click(); j.locator(G+' .dreply textarea').fill('(b), the Board sets the rules once'); j.click(G+' >> text=Send answer'); j.wait_for_timeout(1500)
    j.locator(G+' .dec-tabs button', has_text='DBY’s response').click(); j.wait_for_timeout(300)
    j.locator(G).screenshot(path='/tmp/pv/zone-lake.png')
    print('rows status:', [x.get_attribute('class').split()[-1] for x in j.locator(G+' .dec-tr:not(.dec-th)').all()])
    y.wait_for_timeout(6500); print('owner badge:', y.locator('.dec-badge').inner_text() if y.locator('.dec-badge').count() else '-', '| owner banner:', y.locator('#dec-banner').inner_text().replace('\n',' ')[:80])
    y.locator(G+' .dec-tabs button', has_text='DBY’s response').click(); y.wait_for_timeout(200)
    y.click(G+' >> text=✎ Edit response'); y.locator(G+' .dec-edrow:not(.ask) textarea').nth(0).fill('Verified / Pending / Not paid, with automatic reminders.'); y.click(G+' >> text=Save changes'); y.wait_for_timeout(1500)
    print('after edit:', [x.get_attribute('class').split()[-1] for x in y.locator(G+' .dec-tr:not(.dec-th)').all()])
    y.click('nav button[aria-label="Decisions"]'); y.wait_for_timeout(400); print('summary:', y.locator('.dec-sumrow').inner_text().replace('\n',' | '))
    j.wait_for_timeout(6500); j.click('nav button[aria-label="Start here"]'); j.wait_for_timeout(400); j.locator(G+' .dec-tabs button', has_text='DBY’s response').click()
    if j.locator(G+' >> text=✓ Approve all').count(): j.click(G+' >> text=✓ Approve all'); j.wait_for_timeout(2000)
    print('final:', [x.get_attribute('class').split()[-1] for x in j.locator(G+' .dec-tr:not(.dec-th)').all()], j.locator('#start-progress .dec-progress-top').inner_text().replace('\n',' '))
    print(errs)
