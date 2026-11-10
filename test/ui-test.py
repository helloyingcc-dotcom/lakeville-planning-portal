import json, re, time
from playwright.sync_api import sync_playwright, expect
T = json.loads(open('/tmp/harness.log').read().split('TOKENS ')[1])
B = 'http://localhost:8787'
errors = []
results = []
def check(cond, msg):
    results.append((bool(cond), msg))
    if not cond: print('FAIL', msg)
with sync_playwright() as p:
    br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    def ctx(who, w=1440):
        c = br.new_context(viewport={'width': w, 'height': 1000}, extra_http_headers={'Cf-Access-Jwt-Assertion': T[who]})
        pg = c.new_page()
        pg.on('pageerror', lambda e: errors.append(f'{who}: {e}'))
        pg.on('console', lambda m: m.type == 'error' and errors.append(f'{who} console: {m.text}'))
        pg.on('response', lambda r: r.status == 404 and print('404 URL', who, r.url.split('?')[0], r.url.split('?')[1][:7] if '?' in r.url else ''))
        pg.on('dialog', lambda d: d.accept())
        pg.goto(B + '/'); return pg
    y = ctx('ying'); j = ctx('jessie')
    # name bar
    expect(y.locator('.namebar')).to_be_visible()
    y.fill('#yourName', 'Ying'); y.click('.namebar button[type=submit]')
    expect(y.locator('.namebar')).to_have_count(0)
    check('Signed in as Ying' in y.locator('footer').inner_text(), 'name saved and shown')
    j.fill('#yourName', 'Jessie'); j.click('.namebar button[type=submit]')
    # answers
    expect(y.locator('#answer-start-goal')).to_be_enabled()
    y.fill('#answer-start-goal', 'Make volunteer sign-ups easier')
    check(y.locator('#saveState').inner_text() == 'Unsaved changes', 'dirty state')
    check(y.locator('nav .unsaved').count() == 1, 'unsaved dot in nav')
    y.click('#saveBtn'); expect(y.locator('#notice')).to_have_text('Section saved online.')
    expect(j.locator('#answer-start-goal')).to_have_value('Make volunteer sign-ups easier', timeout=6000)
    check(True, 'answer synced to second person')
    y.screenshot(path='/tmp/shot-start.png', full_page=False)
    # intro comment
    y.click('#introComment')
    expect(y.locator('.compose-context strong')).to_have_text('Page introduction')
    y.fill('#team-comment', 'Can we make the welcome shorter?')
    y.click('#sendBtn')
    expect(y.locator('.chat-message')).to_have_count(1)
    expect(y.locator('#introComment')).to_contain_text('1 on intro', timeout=6000)
    check(True, 'intro count shows')
    # tools only on own messages
    check(y.locator('.message-tools').count() == 1, 'ying sees edit/delete on own message')
    # jessie sees & replies
    expect(j.locator('.thread-card')).to_have_count(1, timeout=6000)
    check(j.locator('.thread-card strong').inner_text() == 'Page introduction', 'sidebar label Page introduction')
    j.click('.thread-card')
    expect(j.locator('.chat-message')).to_have_count(1)
    check(j.locator('.message-tools').count() == 0, 'jessie sees no edit/delete on Ying message')
    j.fill('#team-comment', 'Agree, shorter please')
    j.click('#sendBtn'); expect(j.locator('.chat-message')).to_have_count(2)
    check(j.locator('.message-tools').count() == 1, 'jessie gets tools on her own reply only')
    expect(y.locator('.chat-message')).to_have_count(2, timeout=6000)
    check(True, 'reply appears live for Ying')
    # draft survives polling rerender
    y.fill('#team-comment', 'draft in progress'); time.sleep(4.5)
    check(y.locator('#team-comment').input_value() == 'draft in progress', 'reply draft survives live updates')
    y.fill('#team-comment', '')
    # edit
    y.locator('.message-tools button', has_text='Edit').click()
    y.fill('.message-edit textarea', 'Can we make the welcome text shorter?')
    time.sleep(2.5)  # polling while editing must not wipe the edit box
    check(y.locator('.message-edit textarea').input_value() == 'Can we make the welcome text shorter?', 'edit box survives live updates')
    y.locator('.message-edit button', has_text='Save').click()
    expect(y.locator('.chat-message p').first).to_have_text('Can we make the welcome text shorter?')
    check(y.locator('.edited').count() == 1, 'edited marker')
    expect(j.locator('.chat-message p').first).to_have_text('Can we make the welcome text shorter?', timeout=6000)
    check(True, 'edit visible to Jessie')
    y.screenshot(path='/tmp/shot-thread.png')
    # jump to intro
    y.click('.context-link')
    time.sleep(0.6)
    check('comment-highlight' in (y.locator('#answer-start-intro').get_attribute('class') or ''), 'jump outlines page intro')
    # attach + delete
    y.set_input_files('.attachment-tools input[type=file]', files=[{'name':'example.png','mimeType':'image/png','buffer':bytes([137,80,78,71,13,10,26,10,0,0,0,0])}])
    expect(y.locator('.draft-attachment')).to_have_count(1)
    y.fill('#team-comment', 'Here is an example'); y.click('#sendBtn')
    expect(y.locator('.chat-message')).to_have_count(3)
    check(y.locator('.file-link').count() == 1, 'attachment posted')
    y.locator('.chat-message').nth(2).locator('button', has_text='Delete').click()
    check('and its attachments' in y.locator('.message-confirm').inner_text(), 'delete confirm mentions attachments')
    y.locator('.message-confirm .danger').click()
    expect(y.locator('.chat-message')).to_have_count(2)
    check(True, 'delete own message')
    # delete whole thread: jessie deletes hers, ying deletes his → thread gone
    j.locator('.chat-message').nth(1).locator('button', has_text='Delete').click(); j.locator('.message-confirm .danger').click()
    expect(j.locator('.chat-message')).to_have_count(1)
    expect(y.locator('.chat-message')).to_have_count(1, timeout=6000)
    y.locator('.message-tools button', has_text='Delete').click(); y.locator('.message-confirm .danger').click()
    expect(y.locator('.thread-card')).to_have_count(0)
    expect(y.locator('#introComment')).to_have_text('Comment on intro', timeout=6000)
    expect(j.locator('.comment-empty')).to_be_visible(timeout=6000)
    check(True, 'thread removed for both after last delete')
    # field comment with selected text + other tabs
    y.click('nav button[aria-label="Current events"]')
    y.fill('#answer-events-event0Name', 'Holiday Gift Shop')
    y.locator('#answer-events-event0Name').evaluate("el=>el.setSelectionRange(0,7)")
    y.locator('[data-anchor="event0Name"]').click()
    check(y.locator('.compose-context blockquote').inner_text() == 'Holiday', 'selected words quoted')
    y.fill('#team-comment', 'Which year?'); y.click('#sendBtn')
    expect(y.locator('[data-anchor="event0Name"]')).to_have_text('1', timeout=6000)
    check(True, 'field comment count')
    for tab in ['Feature priorities','App preview','Workflow & roles','Questions & accounting']:
        y.click(f'nav button[aria-label="{tab}"]')
        check(y.locator('h1').inner_text() == tab, 'tab renders: ' + tab)
    y.screenshot(path='/tmp/shot-questions.png')
    # mobile layout sanity
    m = ctx('jessie', 390)
    expect(m.locator('#answer-start-goal')).to_be_enabled(); m.screenshot(path='/tmp/shot-mobile.png', full_page=False)
    br.close()
print('UI tests:', sum(1 for r in results if r[0]), 'passed,', sum(1 for r in results if not r[0]), 'failed')
print('page errors:', errors or 'none')
