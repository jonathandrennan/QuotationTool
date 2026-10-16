"""End-to-end UI check for quotation_tool.html (headless Edge).

Walks the wizard for a PRSA and an ARF quotation, checks validation blocks progress,
goes through the pack sub-flow (contents, cover letter, Statement of Suitability, review),
writes the SoS passages, checks the Edit/Preview tabs, opens the pack preview, waits for the
paginator and saves the pack
as PDF (tests/out/*.pdf) plus a screenshot of each step.
Fails on any JS console error, unfilled {token}, 'undefined' or 'NaN' in the pack.

Run:  python "Quotation Tool/tests/ui_test.py"
"""
import base64, pathlib, re, sys, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.print_page_options import PrintOptions

HERE = pathlib.Path(__file__).resolve().parent
QT = HERE.parent
OUT = HERE / 'out'
OUT.mkdir(exist_ok=True)
URL = (QT / 'quotation_tool.html').resolve().as_uri()

fails = []
FS_DATE = '31/08/2026'   # DMAS factsheet date in FUND_FACTSHEET
def check(cond, msg):
    if not cond:
        fails.append(msg); print('  FAIL', msg)

def driver():
    o = Options()
    o.add_argument('--headless=new')
    o.add_argument('--window-size=1440,1400')
    o.set_capability('ms:loggingPrefs', {'browser': 'ALL'})
    return webdriver.Edge(options=o)

def js(d, s, *a): return d.execute_script(s, *a)
def setv(d, id_, v):
    js(d, "var e=document.getElementById(arguments[0]); e.value=arguments[1]; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); e.dispatchEvent(new Event('blur'));", id_, str(v))
def click(d, el):
    d.execute_script("arguments[0].scrollIntoView({block:'center'})", el); el.click()
def css(d, sel): return d.find_element(By.CSS_SELECTOR, sel)
def nxt(d): click(d, d.find_element(By.ID, 'btn-next')); time.sleep(0.15)
def step(d): return js(d, 'return S.step')
def msg(d): return d.find_element(By.ID, 'foot-msg').text
def next_label(d): return d.find_element(By.ID, 'btn-next').text
def console_errors(d):
    try:
        return [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
    except Exception:
        return []
# Contribution-type chips: click until the chosen parts match the target code (e.g. 'ofv_sp_rp')
def set_ct(d, product, ct):
    pre = 'p' if product == 'prsa' else 'i'
    for part in ['ofv', 'sp', 'rp']:
        want = part in ct.split('_')
        el = d.find_elements(By.CSS_SELECTOR, '#%s-ctchips [data-part=%s]' % (pre, part))
        if el and ('on' in el[0].get_attribute('class')) != want: click(d, el[0])
    check(js(d, 'return S[arguments[0]].ctype', product) == ct, 'chips set the contribution type to %s (%s)' % (ct, js(d, 'return S[arguments[0]].ctype', product)))

def fill_broker(d):
    nxt(d)
    check(step(d) == 1 and msg(d), 'step 1 should block with empty adviser details')
    check(not d.find_element(By.ID, 'btn-back').is_displayed(), 'no Back button on step 1')
    for k, v in dict(firm='Test Financial Ltd', name='Pat Adviser', email='pat@test.ie', phone='01 555 0000',
                     address='1 Main Street\nDublin 2', reg='Test Financial Ltd is regulated by the Central Bank of Ireland.').items():
        setv(d, 'b-' + k, v)
    lh = d.find_element(By.ID, 'lh').text
    check('Test Financial Ltd' in lh and 'Pat Adviser' in lh and 'pat@test.ie' in lh, 'letterhead preview follows the inputs: %r' % lh[:80])
    nxt(d)
    check(step(d) == 1 and 'declaration' in msg(d), 'step 1 should require consent')
    check('err' in d.find_element(By.ID, 'foot-msg').get_attribute('class'), 'footer error shown in red')
    click(d, d.find_element(By.ID, 'b-consent'))
    check(next_label(d).startswith('Continue to client'), 'footer button names the next step: %r' % next_label(d))
    nxt(d)
    check(step(d) == 2, 'step 1 -> 2')
    cap = js(d, "return document.querySelector('#stepnav .rs.done .cap').textContent")
    check(cap == 'Pat Adviser · Test Financial Ltd', 'rail caption for the adviser step: %r' % cap)

def fill_client(d, product, dob, nra=None):
    check(len(d.find_elements(By.CSS_SELECTOR, '#prod-cards [data-prod]')) == 3, 'product is three radio cards')
    click(d, css(d, '#prod-cards [data-prod=%s]' % product))
    check(js(d, 'return S.product') == product and 'on' in css(d, '#prod-cards [data-prod=%s]' % product).get_attribute('class'), 'product card sets the product')
    nxt(d)
    check(step(d) == 2, 'step 2 should block with empty client')
    setv(d, 'c-first', 'Alex'); setv(d, 'c-last', 'Murphy'); setv(d, 'c-dob', dob)
    setv(d, 'c-address', '22 Oak Road\nBlackrock\nCo. Dublin')
    if nra:
        setv(d, 'q-nra', nra + 1)
        click(d, css(d, '.stp button[aria-label^="Decrease"]'))
        check(js(d, 'return S.prsa.nra') == nra, 'retirement age stepper')
    setv(d, 'q-start', '2026-10-01')
    strip = d.find_element(By.ID, 'age-hint').text
    check('Age at start' in strip and (not nra or ('Term' in strip and 'Retires' in strip)), 'age / term strip: %r' % strip)
    check(d.find_element(By.ID, 'dob-age').text.startswith('Age '), 'age shown in the date of birth field')
    nxt(d)
    check(step(d) == 3, 'step 2 -> 3 (%s)' % msg(d))

def pick_sri(d, sri, esg=True):
    nxt(d)
    check(step(d) == 3 and 'assessed' in msg(d), 'step 3 asks how risk was assessed (%s)' % msg(d))
    check(not css(d, '#sri-card').is_displayed(), 'no rating picker until the method is chosen')
    click(d, css(d, '#rp-method [data-m=own]'))
    check(css(d, '#sri-card').is_displayed() and css(d, '#r-profiler-wrap').is_displayed() and css(d, '#rpm').get_attribute('hidden') is not None, 'own profiling shows the rating picker, no dialog')
    nxt(d)
    check(step(d) == 3, 'step 3 should require SRI')
    click(d, d.find_elements(By.CSS_SELECTOR, '.sri-t')[sri - 1])
    check('on' in d.find_elements(By.CSS_SELECTOR, '.sri-t')[sri - 1].get_attribute('class'), 'SRI tile selected')
    check(not d.find_elements(By.ID, 'sri-panel') and 'Risk profiling' not in css(d, '#step-3').text, 'no "suited to" panel or method caption')
    # What the ratings mean: the PRIIPs wording for each class
    click(d, css(d, '#sri-info-btn'))
    # wait for focus and for the .18s fade-in to finish (Selenium treats a near-transparent dialog as hidden)
    for _ in range(20):
        if js(d, "return document.activeElement.id") == 'sri-info-x' and css(d, '#sri-info').is_displayed() and 'medium-low level' in css(d, '#sri-info').text: break
        time.sleep(0.1)
    info = css(d, '#sri-info').text
    check(css(d, '#sri-info').is_displayed() and len(d.find_elements(By.CSS_SELECTOR, '#sri-info .rs-tbl tbody tr')) == 7 and
          'medium-low level' in info and '2017/653' in info and js(d, 'return document.activeElement.id') == 'sri-info-x', 'ratings dialog with the 7 PRIIPs classes')
    check('cl' in d.find_elements(By.CSS_SELECTOR, '#sri-info .rs-tbl tbody tr')[sri - 1].get_attribute('class'), "client's rating highlighted in the dialog")
    d.save_screenshot(str(OUT / 'sri_info.png'))
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    check(not css(d, '#sri-info').is_displayed() and js(d, 'return document.activeElement.id') == 'sri-info-btn', 'Escape closes the dialog and returns focus')
    nxt(d)
    check(step(d) == 3 and 'sustainability' in msg(d), 'step 3 requires the sustainability question (%s)' % msg(d))
    click(d, css(d, '#esg-seg [data-v=%s]' % ('yes' if esg else 'no')))
    check(js(d, 'return S.risk.esg') is esg, 'ESG answer stored')
    setv(d, 'r-profiler', 'Voyant risk questionnaire, 02/10/2026')
    check(js(d, 'return S.risk.profiler').startswith('Voyant'), 'risk profiler stored')
    d.save_screenshot(str(OUT / ('%s_step3.png' % js(d, 'return S.product'))))
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4')

def see_all_tabs(d):
    check(next_label(d).startswith('Next: Charges'), 'Next walks to the Charges tab: %r' % next_label(d))
    nxt(d)
    check(js(d, 'return S.resTab') == 'chg' and next_label(d).startswith('Next: Remuneration'), 'Next opened Charges, then offers Remuneration: %r' % next_label(d))
    check(js(d, "return !!document.querySelector('#res-body table.tbl') && !!document.querySelector('#res-body .chg-notes') && !document.querySelector('#res-body .vbar, #res-body .mk-bar')"), 'charges table with quiet notes and no side panel')
    check('reduce the assumed growth rate' in css(d, '#res-body .chg-notes').text or 'equivalent to reducing' in css(d, '#res-body .chg-notes').text, 'reduction in yield quoted')
    d.save_screenshot(str(OUT / ('%s_step6_chg.png' % js(d, 'return S.product'))))
    nxt(d)
    check(js(d, 'return S.resTab') == 'rem' and next_label(d).startswith('Build the quotation pack'), 'Next opened Remuneration, then offers the pack: %r' % next_label(d))
    check(js(d, "return document.querySelectorAll('#res-body .kcard').length") == 3 and js(d, "return !!document.querySelector('#res-body svg rect')"), 'remuneration cards and bar chart')
    click(d, css(d, '#res-body .rc-foot .lnk'))
    check(js(d, "return !!document.querySelector('#res-body table.tbl')"), 'Show table shows the remuneration table')
    check(d.find_element(By.ID, 'btn-next').get_attribute('disabled') is None and d.find_element(By.ID, 'res-tabs-hint').text == 'All three tabs reviewed', 'pack button enabled once all tabs are seen')

def pack_flow(d, tag):
    # 7.1 Contents
    check(js(d, 'return S.packStage') == 'contents' and css(d, '#pack-h').text == 'What goes in the pack', 'step 7 opens on Contents')
    for k in ['summary', 'funds', 'projection', 'charges', 'important', 'glossary']:
        check(js(d, "return S.sections[arguments[0]] && !document.querySelector('[data-sec=' + arguments[0] + ']')", k), 'section %s required (no toggle)' % k)
    # The remuneration statement is part of the quotation but can be switched off
    check(js(d, "return S.sections.remun && !!document.querySelector('[data-sec=remun]')"), 'remuneration statement on by default, with a toggle')
    click(d, css(d, '[data-sec=remun]'))
    check(js(d, "return !S.sections.remun && qtBuildPack(packData(true)).indexOf('data-sec=\"remun\"') < 0"), 'remuneration statement left out of the pack when switched off')
    check('Remuneration Statement' not in js(d, "return templateText('sos')") and 'remuneration we receive' not in js(d, "return templateText('cover')"), 'SoS and cover letter stop referring to it')
    click(d, css(d, '[data-sec=remun]'))
    check(js(d, 'return S.sections.remun'), 'remuneration statement switched back on')
    quo = [r.text for r in d.find_elements(By.CSS_SELECTOR, '#secs .prow') if 'Your Allianz quotation' in r.text]
    check(len(quo) == 1 and 'Required' in quo[0] and 'Glossary' in quo[0] and 'Remuneration' not in quo[0], 'the Allianz quotation is one required item: %s' % quo)
    for k in ['product', 'tax', 'appform']:
        check(js(d, "return !S.sections[arguments[0]] && !document.querySelector('[data-sec=' + arguments[0] + ']')", k), 'section %s coming soon and excluded' % k)
    # Factsheets are appended to the pack PDF and can be switched off; KIDs only exist for the Investment Bond
    check(js(d, "return S.sections.factsheets && !!document.querySelector('[data-sec=factsheets]')"), 'factsheets on by default with a toggle')
    kids_na = js(d, "return S.product !== 'ib'")
    check(js(d, "return !!document.querySelector('[data-sec=kids]')") == (not kids_na), 'KIDs toggle only for the Investment Bond')
    check(kids_na <= (len(d.find_elements(By.XPATH, "//*[@id='secs']//*[contains(@class,'pn')][normalize-space()='Key Information Documents']")) == 0), 'no KIDs row for PRSA / ARF')
    check(len(d.find_elements(By.CSS_SELECTOR, '#secs .pill.soon')) == 4 and len(d.find_elements(By.CSS_SELECTOR, '#secs .tag-new')) == 0, 'coming-soon tags and no New tags (the risk profile record shows "Complete the risk profiler" until Step 3 is done)')
    check(len(d.find_elements(By.CSS_SELECTOR, '#preset-seg')) == 0, 'no preset selector')
    n_order = lambda: len(d.find_elements(By.CSS_SELECTOR, '#pack-order ol:first-of-type li'))   # printed sections only, not attached PDFs
    order = [e.text for e in d.find_elements(By.CSS_SELECTOR, '#pack-order ol:first-of-type li')]
    check(n_order() == 3 and 'Your Allianz quotation' in order[2], 'pack order: cover letter, SoS, the quotation: %s' % order)
    att = [e.text for e in d.find_elements(By.CSS_SELECTOR, '#pack-order ol:nth-of-type(2) li')]
    check(len(att) == 1 and re.search(r'Fund factsheets \(\d+\)', att[0]), 'attached factsheets on one line: %s' % att)
    sw = css(d, '[data-sec=cover]')
    click(d, sw)
    check(not js(d, 'return S.sections.cover') and n_order() == 2 and 'Cover letter' not in css(d, '#pack-subs').text, 'cover letter toggled off drops its stage')
    click(d, css(d, '[data-sec=cover]'))
    check(js(d, 'return packStages()') == ['contents', 'cover', 'sos', 'review'], 'four stages with both documents on')
    d.save_screenshot(str(OUT / ('%s_step7.png' % tag)))
    check(next_label(d).startswith('Continue to cover letter'), 'contents footer: %r' % next_label(d))
    nxt(d)
    # 7.2 Cover letter
    check(js(d, 'return S.packStage') == 'cover' and css(d, '#pack-h').text == 'Cover letter', 'cover letter stage')
    cover = js(d, "return stripMarks(S.text.cover)")
    check('[[' not in cover and 'Enclosed:' in cover, 'cover letter has no prompts and lists enclosures')
    check('Your Allianz quotation:' in cover and cover.count('\n- ') == 2, 'enclosed list: the SoS and the quotation as one item')
    check(len(d.find_elements(By.CSS_SELECTOR, '#ed-cover .auto')) >= 2, 'auto-filled values shown in grey boxes')
    click(d, css(d, '#stage-cover .mode-row button:nth-child(2)'))
    check(js(d, 'return S.coverMode') == 'own' and css(d, '#ed-cover.own').is_displayed() and js(d, "return docIssues('cover')") == 1, 'Write your own: empty letter counts as unfinished')
    tb = [b.text for b in d.find_elements(By.CSS_SELECTOR, '#stage-cover .ed-tb .tb')]
    check(tb == ['B', 'Heading', '• List'] and not d.find_elements(By.CSS_SELECTOR, '#stage-cover .ed-tb .lnk'), 'Write your own has the formatting toolbar: %s' % tb)
    click(d, css(d, '#ed-cover')); css(d, '#ed-cover').send_keys('Dear Alex')
    click(d, d.find_elements(By.CSS_SELECTOR, '#stage-cover .ed-tb .tb')[1])
    check(js(d, 'return S.own.cover') == '## Dear Alex' and js(d, "return docIssues('cover')") == 0, 'Heading button formats own text: %r' % js(d, 'return S.own.cover'))
    js(d, "S.own.cover = ''")
    click(d, css(d, '#stage-cover .mode-row button:nth-child(1)'))
    check(js(d, 'return S.coverMode') == 'template' and js(d, "return docIssues('cover')") == 0, 'back to the template')
    nxt(d)
    # 7.3 Statement of Suitability
    check(js(d, 'return S.packStage') == 'sos', 'SoS stage')
    check(js(d, 'return QT_TEXT.sosNote') in css(d, '#stage-sos .sos-note').text and 'example only' in css(d, '#stage-sos .sos-note').text, 'SoS shows the "tailor this" note')
    check(not d.find_elements(By.CSS_SELECTOR, '#ed-sos .sug') and '[[' not in js(d, 'return S.text.sos'), 'SoS has no highlighted suggestions or [[prompts]]')
    check(js(d, "return docIssues('sos')") == 0 and not js(d, 'return sosEdited()'), 'SoS is not blocked, and counts as unedited')
    check('Example text' in msg(d), 'footer says it is example text: %r' % msg(d))
    # Leaving it untouched asks "are you sure"; going back keeps you here, continuing moves on
    nxt(d)
    check(not css(d, '#confirm-bg').get_attribute('hidden') and js(d, 'return S.packStage') == 'sos', 'unedited SoS asks for confirmation')
    check(css(d, '#confirm-t').text == js(d, 'return QT_TEXT.sosUneditedConfirm.title') and css(d, '#confirm-no').text == 'Go back and edit', 'confirmation uses the SoS wording')
    click(d, css(d, '#confirm-no'))
    check(css(d, '#confirm-bg').get_attribute('hidden') and js(d, 'return S.packStage') == 'sos', 'Go back and edit stays on the SoS')
    js(d, "var p=document.querySelector('#ed-sos p:last-of-type'); p.textContent = 'The client wants to retire with an income of 60% of salary.'; document.getElementById('ed-sos').dispatchEvent(new Event('input'));")
    check(js(d, 'return sosEdited()') and 'retire with an income of 60%' in js(d, 'return S.text.sos') and 'Edited' in msg(d), 'typing in the SoS counts as edited: %r' % msg(d))
    rows = d.find_elements(By.CSS_SELECTOR, '#ed-ol-sos .ol-row')
    check(len(rows) >= 8 and not any('to write' in r.text or 'Auto' in r.text for r in rows) and css(d, '#ed-prog-sos').get_attribute('hidden'), 'outline lists sections without passage counts')
    sos = js(d, 'return stripMarks(S.text.sos)')
    check('Your sustainability preferences' in sos and 'Voyant risk questionnaire' in sos, 'SoS has sustainability preferences and the risk profiler')
    d.save_screenshot(str(OUT / ('%s_step7_sos.png' % tag)))
    # Preview tab: the real pack renderer, this document only
    click(d, css(d, '#stage-sos .dv-tabs button:nth-child(2)'))
    check(js(d, 'return S.docView.sos') == 'preview' and css(d, '#pv-sos iframe') is not None, 'preview tab shows an A4 render')
    for _ in range(80):
        if 'page' in css(d, '#pv-meta-sos').text: break
        time.sleep(0.1)
    check(re.search(r'A4 . \d+ page', css(d, '#pv-meta-sos').text), 'preview paginates: %r' % css(d, '#pv-meta-sos').text)
    pv = js(d, "var f=document.querySelector('#pv-sos iframe'); return f.contentWindow.document.getElementById('pages').textContent")
    check('Statement of Suitability' in pv and 'retire with an income of 60%' in pv, 'preview shows the typed text')
    check('[[' not in pv, 'preview has no [[prompt]] markers')
    check(js(d, 'return S.broker.firm') in pv, 'preview uses the adviser letterhead')
    d.save_screenshot(str(OUT / ('%s_step7_sos_preview.png' % tag)))
    click(d, css(d, '#stage-sos .dv-tabs button:nth-child(1)'))
    check(js(d, 'return S.docView.sos') == 'edit' and css(d, '#ed-sos') is not None, 'back to the editor')
    nxt(d)
    # 7.4 Review & generate
    check(js(d, 'return S.packStage') == 'review' and css(d, '#confirm-bg').get_attribute('hidden'), 'review stage, no confirmation once the SoS is edited')
    check(d.find_element(By.ID, 'btn-generate').get_attribute('disabled') is None, 'generate allowed')
    check(not d.find_elements(By.CSS_SELECTOR, '#checklist .warn, #checklist .no'), 'checklist all green')
    click(d, css(d, '#pack-subs button.ss:nth-of-type(3)'))
    check(js(d, 'return S.packStage') == 'sos', 'sub-step indicator goes back to a done stage')
    nxt(d)
    # "Counting pages…" also contains "pages", so wait for a real count
    for _ in range(100):
        if re.search(r'\d+ page', css(d, '#fname').text): break
        time.sleep(0.1)
    fn = css(d, '#fname').text
    check(re.match(r'Quotation_Murphy_\d{4}-\d{2}-\d{2}\.pdf', fn) and re.search(r'\d+ pages', fn), 'file name and page count: %r' % fn)
    labels = [e.text for e in d.find_elements(By.CSS_SELECTOR, '#thumbs .lbl')]
    check(len(labels) == 3 and labels[0] == 'p. 1' and all(re.match(r'pp?\. \d', l) for l in labels), 'thumbnails (cover, SoS, the Allianz quotation) with page numbers: %s' % labels)
    check(d.find_element(By.ID, 'btn-generate').get_attribute('disabled') is None, 'generate enabled after passages written')
    check(not d.find_elements(By.CSS_SELECTOR, '#checklist .warn, #checklist .no') and css(d, '#gen-errs').text == '', 'checklist all green once written')
    d.save_screenshot(str(OUT / ('%s_step7_review.png' % tag)))
    main = d.current_window_handle
    click(d, d.find_element(By.ID, 'btn-preview'))
    time.sleep(0.5)
    wins = [w for w in d.window_handles if w != main]
    check(len(wins) == 1, 'pack window opened')
    if not wins: return
    d.switch_to.window(wins[0])
    for _ in range(50):
        if js(d, 'return window.__paginated'): break
        time.sleep(0.1)
    pages = js(d, 'return window.__paginated')
    check(pages and pages >= 11, '%s pack paginated (%s pages)' % (tag, pages))
    check(d.title == fn.split('.pdf')[0], 'pack title gives the PDF file name: %r' % d.title)
    txt = d.find_element(By.ID, 'pages').text
    toks = re.findall(r'\{[a-zA-Z]+\}', txt)
    check(not toks, '%s unfilled tokens: %s' % (tag, toks[:5]))
    check('undefined' not in txt and 'NaN' not in txt, '%s pack contains undefined/NaN' % tag)
    check('[[' not in txt and '' not in txt and '' not in txt, '%s pack contains [[prompt]] or editor markers' % tag)
    check('retire with an income of 60%' in txt, 'typed SoS text reaches the pack')
    check('About the product' not in txt and 'Tax information' not in txt, 'coming-soon sections left out of the pack')
    # Fund table leads with the largest holding, and the guarantee note names the funds it applies to
    # the funds table is the one whose LAST column is Allocation (the charges table has one too)
    allocs = js(d, "var t=[].slice.call(document.querySelectorAll('#pages table.num')).filter(function(x){"
                   "var h=x.querySelectorAll('thead th'); return h.length && /Allocation/.test(h[h.length-1].textContent); })[0];"
                   "return t ? [].slice.call(t.querySelectorAll('tbody tr')).map(function(r){"
                   "var c=r.querySelector('td:last-child'); return c ? parseFloat(c.textContent) : 0; }) : []")
    check(allocs and allocs == sorted(allocs, reverse=True), '%s funds listed largest holding first: %s' % (tag, allocs))
    titles = js(d, "return [].map.call(document.querySelectorAll('#pages .ptitle h2'), function(e){ return e.textContent; })")
    check('Your investment and risk' in titles and 'Projected benefits' in titles and titles.index('Your investment and risk') < titles.index('Projected benefits'),
          '%s investment section comes before the projection: %s' % (tag, titles))
    cards = js(d, "return document.querySelectorAll('#pages .fcard').length")
    check(cards == len(allocs), '%s one fund card per fund (%d cards, %d funds)' % (tag, cards, len(allocs)))
    check(('Indicative only' in txt or 'approximate' in txt) and 'How your money is split' in txt, '%s asset split shown and flagged as indicative' % tag)
    gnote = js(d, "var g=document.querySelector('#pages .gnote'); return g ? g.textContent : ''")
    if gnote:
        check(re.search(r'\d{2}%', gnote) and 'Allianz' in gnote and 'policy anniversary' in gnote,
              '%s guarantee note names the fund and its level: %r' % (tag, gnote))
        check('protects a percentage of your fund value' not in gnote, '%s guarantee note is not the generic wording' % tag)
    # "At a glance" is factual only: four label/value blocks, a fund table and the risk strip
    blocks = js(d, "return [].map.call(document.querySelectorAll('#pages .fbh'), function(e){ return e.textContent; })")
    check([b for b in blocks if b in ('YOU', 'YOUR PLAN', 'CONTRIBUTIONS', 'CHARGES', 'YOUR INVESTMENT')] and
          'YOU' in blocks and 'CHARGES' in blocks, '%s glance has the labelled blocks: %s' % (tag, blocks))
    glance = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ var h=p.querySelector('.ptitle h2'); return h && h.textContent === 'Your quotation at a glance'; })[0]; return p ? p.textContent : ''")
    check('Total annual charge' in glance and 'Your attitude to risk' in glance, '%s glance shows charges and the risk strip' % tag)
    check(not re.search(r'Projected value|today\'s money', glance), '%s glance carries no projections: %r' % (tag, glance[:100]))
    check(js(d, "return document.querySelectorAll('#pages .rstrip > div.on').length") == 1, '%s risk strip marks one cell' % tag)
    dec = re.findall(r'(?:SRI|Risk|risk)\s*:?\s*\d\.\d', txt)
    check(not dec, '%s pack shows a decimal risk figure outside the footnote: %s' % (tag, dec[:3]))
    wboxes = js(d, "return [].map.call(document.querySelectorAll('#pages .wbox'), function(e){ return e.textContent; })")
    check(len(wboxes) >= 3 and all('Warning:' in w for w in wboxes), '%s boxed warnings beside the figures (%d)' % (tag, len(wboxes)))
    lone = js(d, "return [].filter.call(document.querySelectorAll('#pages .page .pbody'), function(b){ return b.children.length === 1 && b.querySelector('.wbox'); }).length")
    check(lone == 0, '%s no page holds only a warnings box (%d)' % (tag, lone))
    # match on the page title, not the text: the cover letter's "Enclosed" list names this page too
    imp = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){"
                "var h=p.querySelector('.ptitle h2'); return h && h.textContent === 'Important information'; })[0];"
                "return p ? p.textContent : ''")
    for w in ['may go down as well as up', 'lose some or all', 'Past performance', 'estimates only']:
        check(w in imp, '%s Important information repeats the warning %r' % (tag, w))
    over = js(d, "return [].slice.call(document.querySelectorAll('.pbody')).filter(function(b){return b.scrollHeight > b.clientHeight + 1;}).length")
    check(over == 0, '%s pages with overflowing content: %s' % (tag, over))
    pn = js(d, "return [].slice.call(document.querySelectorAll('.pn')).map(function(e){return e.textContent})")
    grps = js(d, "return [].map.call(document.querySelectorAll('#pages .page'), function(p){ return p.getAttribute('data-grp') + '|' + ((p.querySelector('.pn')||{}).textContent || ''); })")
    adv = [g.split('|')[1] for g in grps if g.startswith('adv|')]
    agl = [g.split('|')[1] for g in grps if g.startswith('agl|')]
    check(adv and adv[0] == '1 / %d' % len(adv) and adv[-1] == '%d / %d' % (len(adv), len(adv)),
          '%s adviser documents numbered separately: %s' % (tag, adv))
    check(len(agl) >= 9 and agl[0] == '' and agl[-1] == '',
          '%s Allianz cover and back page carry no page number: %s' % (tag, agl[:2] + agl[-1:]))
    check(all(n.endswith('/ %d' % len(agl)) for n in agl if n),
          '%s Allianz pages numbered n / %d: %s' % (tag, len(agl), agl))
    check(js(d, "return document.querySelectorAll('#pages .cover').length") == 1 and
          js(d, "return document.querySelectorAll('#pages .backp').length") == 1,
          '%s pack has the Allianz cover and back page' % tag)
    brands = js(d, "return [].map.call(document.querySelectorAll('#pages .pfoot .fbrand'), function(e){ return e.textContent; })")
    check(brands and len(set(brands)) == 1, '%s one brand line in the Allianz footer: %s' % (tag, list(set(brands))))
    svgs = len(d.find_elements(By.CSS_SELECTOR, '#pages svg polyline'))
    check(svgs >= 1, '%s vector chart lines present (%d)' % (tag, svgs))
    check(len(d.find_elements(By.CSS_SELECTOR, '#pages canvas')) == 0, 'no canvas bitmaps in pack')
    for i, pg in enumerate(d.find_elements(By.CSS_SELECTOR, '#pages .page')):
        d.execute_script("arguments[0].scrollIntoView()", pg)
        pg.screenshot(str(OUT / ('%s_page%02d.png' % (tag, i + 1))))
    po = PrintOptions(); po.background = True; po.margin_top = po.margin_bottom = po.margin_left = po.margin_right = 0
    po.page_width = 21.0; po.page_height = 29.7
    pdf = base64.b64decode(d.print_page(po))
    (OUT / ('%s_pack.pdf' % tag)).write_bytes(pdf)
    pdf_pages = len(re.findall(rb'/Type\s*/Page[^s]', pdf))
    check(pdf_pages == pages, '%s PDF page count %d == paginator %d' % (tag, pdf_pages, pages))
    errs = console_errors(d)
    check(not errs, '%s pack console errors: %s' % (tag, errs))
    print('  %s pack: %d pages, saved %s' % (tag, pages, OUT / ('%s_pack.pdf' % tag)))
    d.close(); d.switch_to.window(main)

def prsa_flow(d):
    print('PRSA flow')
    d.get(URL); js(d, "localStorage.clear()"); d.get(URL); js(d, 'setLite(false)')   # the tool opens in lite mode
    fill_broker(d)
    fill_client(d, 'prsa', '1980-03-15', 65)
    pick_sri(d, 3)
    nxt(d)
    check(step(d) == 4, 'step 4 should block with no contributions')
    check('type' in msg(d), 'step 4 asks for the contribution type first (%s)' % msg(d))
    vis = lambda: js(d, "return [].filter.call(document.querySelectorAll('#p-ctfields [data-ct]'), function(e){ return e.getBoundingClientRect().height > 0; }).map(function(e){ return e.querySelector('input,select').id; })")
    check(vis() == [], 'no amount boxes before a contribution type is chosen: %s' % vis())
    check(len(d.find_elements(By.CSS_SELECTOR, '#p-ctchips .ctchip')) == 3, 'three contribution chips')
    set_ct(d, 'prsa', 'sp')
    check(d.find_element(By.ID, 'plan-errs').text == '', 'choosing a type clears the old error')
    check(vis() == ['p-sp'], 'single contribution shows only its box: %s' % vis())
    set_ct(d, 'prsa', 'rp')
    check(vis() == ['p-rp', 'p-freq', 'p-esc'], 'regular shows amount, frequency and increase: %s' % vis())
    set_ct(d, 'prsa', 'ofv_sp_rp')
    check(vis() == ['p-ofv', 'p-sp', 'p-rp', 'p-freq', 'p-esc'], 'transfer + single + regular shows all boxes: %s' % vis())
    sp = d.find_element(By.ID, 'p-sp'); click(d, sp); sp.send_keys('1234567')
    check(sp.get_attribute('value') == '1,234,567', 'thousands separator added while typing: %r' % sp.get_attribute('value'))
    check(js(d, 'return S.prsa.sp') == 1234567, 'formatted amount still parses')
    setv(d, 'p-sp', '50000'); setv(d, 'p-rp', '500'); setv(d, 'p-ofv', '20000')
    # Plan summary (engine figures)
    summ = d.find_element(By.ID, 'plan-sum').text
    check('€76,000' in summ and 'Total to age 65' in summ and 'Initial commission' in summ, 'plan summary: year 1 and totals: %r' % summ)
    # Commission: a one-line overview that expands to inline steppers
    check(not d.find_element(By.ID, 'p-commbody').is_displayed() and 'AMC 1.15%' in css(d, '#p-codeinfo .comm-h').text, 'commission panel collapsed to a one-line overview')
    click(d, css(d, '#p-codeinfo .comm-h'))
    check(d.find_element(By.ID, 'p-commbody').is_displayed(), 'commission panel expands')
    click(d, d.find_elements(By.CSS_SELECTOR, '#p-codeinfo .cstep button')[0])
    check(js(d, 'return S.prsa.spUpOverride') == 0.035, 'SP initial stepper -0.5%')
    info = d.find_element(By.ID, 'p-codeinfo').text
    check('Edited' in info and 'standard 4.00%' in info, 'edited commission flagged with the standard rate: %r' % info[:200])
    check('Edited' in css(d, '#p-codeinfo .comm-h').text and '3.50% single' in css(d, '#p-codeinfo .comm-h').text, 'overview line shows the edited rate')
    d.save_screenshot(str(OUT / 'prsa_step4_comm.png'))
    click(d, css(d, '#p-codeinfo .ovr .lnk'))
    check(js(d, 'return S.prsa.spUpOverride') is None, 'Reset restores the standard rate')
    click(d, d.find_elements(By.CSS_SELECTOR, '#p-codeinfo .cstep button')[0])
    check('–' not in js(d, "return document.getElementById('p-level').options[0].text"), 'no descriptions on product codes')
    click(d, css(d, '#ptype-cards [data-v=standard]'))
    check(js(d, 'return S.prsa.prsaType') == 'standard' and js(d, 'return S.prsa.code').startswith('E'), 'Standard PRSA radio card')
    click(d, css(d, '#ptype-cards [data-v=nonstandard]'))
    js(d, "setCode('prsa', 'A5')"); click(d, d.find_elements(By.CSS_SELECTOR, '#p-codeinfo .cstep button')[0])
    d.save_screenshot(str(OUT / 'prsa_step4.png'))
    nxt(d)
    check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))
    check('Non-Standard A5 · €70k + €500/m' in js(d, "return document.querySelectorAll('#stepnav .rs')[3].textContent"), 'rail caption for plan details')
    ra = lambda: js(d, "var pf=portfolioState(); return !pf.ready ? 'Not ready' : !pf.mismatch ? 'Aligned ✓' : overrideValid() ? 'Override recorded' : 'Review required ⚠';")
    shown = lambda sel: js(d, "var e=document.querySelector(arguments[0]); return !!e && e.getBoundingClientRect().height > 1 && !e.closest('[inert]')", sel)
    views = lambda: js(d, "return ['strat','managed','pick','alloc'].filter(function(v){ return !document.getElementById('pf-view-' + v).hidden; })")
    # Landing: two equal boxes, Build Your Own and Managed strategies, each opening its own selector
    boxes = js(d, "return [].map.call(document.querySelectorAll('#strats > .strat'), function(e){ var r=e.getBoundingClientRect(); return [e.getAttribute('data-strat') || e.getAttribute('data-way'), Math.round(r.width), Math.round(r.height)]; })")
    check([x[0] for x in boxes] == ['diy', 'managed'] and boxes[0][1:] == boxes[1][1:], 'two equal boxes: %s' % boxes)
    check('funds available' not in css(d, '#strats').text, 'no fund count on Build Your Own')
    check(not d.find_element(By.ID, 'pf-side').is_displayed(), 'no Portfolio at a glance until something is chosen')
    check(css(d, '#strat-h').text == 'How would you like to invest?', 'heading')
    check(views() == ['strat'], 'landing view only')
    check(not d.find_element(By.ID, 'btn-next').is_displayed() and 'Choose how to invest' in msg(d), 'footer waits for a choice (%r)' % msg(d))
    d.save_screenshot(str(OUT / 'prsa_step5_initial.png'))
    # Managed strategies: DIS / Autopilot / Life Cycle with their options, in their own view
    click(d, css(d, '[data-way=managed] .strat-main')); time.sleep(0.5)
    check(views() == ['managed'] and js(d, 'return document.activeElement.id') == 'managed-h', 'Managed strategies view opens (%s)' % views())
    top = js(d, "return [].map.call(document.querySelectorAll('#strat-opts > .strat'), function(e){ return e.getAttribute('data-strat') || e.getAttribute('data-fam'); })")
    check(top == ['dis', 'ap', 'lc'], 'three managed cards: %s' % top)
    check(len(d.find_elements(By.CSS_SELECTOR, '[data-fam=ap] .sopt')) == 3 and shown('[data-strat=ap_op]'), 'Autopilot options listed on the card')
    check(len(d.find_elements(By.CSS_SELECTOR, '[data-fam=ap] .sopt .radio-dot')) == 3 and 'Choose an option' in css(d, '[data-fam=ap]').text, 'options shown as radio choices')
    check('ok' in css(d, '[data-strat=ap_dy] .rg').get_attribute('class') and 'ok' not in css(d, '[data-strat=lc_op] .rg').get_attribute('class'), 'ranges that suit the client are marked')
    check('Suits ratings 3–4' in css(d, '[data-strat=dis] .suit').text, 'DIS suitable range pill')
    check(not re.search(r'SRI', js(d, "return document.getElementById('strat-opts').textContent")), 'no SRI values on strategy cards')
    check(js(d, "return document.querySelectorAll('#strat-opts [data-fam] > .info-btn').length") == 2, 'family cards have info buttons')
    check(ra() == 'Not ready' and not d.find_element(By.ID, 'pf-side').is_displayed(), 'nothing selected yet, no glance panel (%s)' % ra())
    d.save_screenshot(str(OUT / 'prsa_step5_managed.png'))
    click(d, css(d, '#pf-view-managed .back-link')); time.sleep(0.5)
    check(views() == ['strat'], 'back to the two boxes')
    # Build Your Own opens the fund picker straight away
    click(d, css(d, '[data-strat=diy] .strat-main')); time.sleep(0.5)
    check(js(d, 'return S.prsa.strat') == 'diy', 'Build Your Own chosen')
    check(views() == ['pick'], 'Choose funds view (%s)' % views())
    check(js(d, 'return document.activeElement.id') == 'pick-h', 'focus moves to the builder heading')
    check(js(d, "return document.querySelectorAll('#pick-funds .fcat-h[aria-expanded=true]').length") == 4, 'four brochure fund categories, expanded')
    check(js(d, "return document.querySelectorAll('#pick-funds [data-fund], #pick-funds [data-gtee]').length") == 0, 'no % boxes or guarantee switches on Choose funds')
    nxt(d)
    check(views() == ['pick'] and 'choose at least one fund' in msg(d), 'Next needs at least one ticked fund (%s)' % msg(d))
    g = 'ss50'
    tick = lambda fid: click(d, css(d, '#pick-funds [data-sel=%s]' % fid))
    tick(g); tick('cash')
    check(msg(d) == '2 funds selected' and len(d.find_elements(By.CSS_SELECTOR, '#pick-list .sf')) == 2, 'selected count and list: %r' % msg(d))
    check(css(d, '#pick-next').text.startswith('Allocate 2 funds'), 'side button names the count')
    check('on' in css(d, '[data-pick=%s]' % g).get_attribute('class'), 'ticked row highlighted')
    multi = js(d, "return [].map.call(document.querySelectorAll('#pick-funds [data-cat=pg] [data-pick]'), function(e){ return e.getAttribute('data-pick'); })")
    check(sorted(multi) == ['ss30', 'ss50', 'ss75'], 'Strategy Select listed under Protected Growth: %s' % multi)
    ma = js(d, "return [].map.call(document.querySelectorAll('#pick-funds [data-cat=ma] [data-pick]'), function(e){ return e.getAttribute('data-pick'); })")
    check(sorted(ma) == ['dm15', 'dm50', 'dm75'], 'DMAS listed under Multi-Asset Solutions: %s' % ma)
    dm = js(d, "var s=assetSplit([{fund:FUNDS_MAP.dm75,weight:1}]); return [Math.round(s.eq*1000)/10, Math.round((s.eq+s.fi+s.cash+s.com+s.alt)*1000)/10, qtAssetNote([{fund:FUNDS_MAP.dm75,weight:1}])]")
    check(dm[0] == 82.1 and dm[1] == 100 and 'rescaled to 100%' in dm[2] and FS_DATE in dm[2], 'DMAS split from rescaled factsheet exposure: %s' % dm)
    ss = js(d, "var s=assetSplit([{fund:FUNDS_MAP.ss75,weight:1}]); return [s.eq, s.fi]")
    check(ss == [0.75, 0.25], 'Strategy Select stays at its target mix: %s' % ss)
    check('Optional Annual Guarantee' in css(d, '[data-cat=pg] .fcat-note').text and 'Guarantee available' in css(d, '[data-pick=ss50]').text, 'guarantee note and sub-line')
    check(css(d, '[data-pick=dm50] .fn small').text.startswith('Volatility 6–12%'), 'volatility sub-line')
    check('Volatility' not in css(d, '[data-pick=ss50] .fn small').text, 'no volatility range on Strategy Select')
    # Sustainability preference: noted, but no fund is greyed out (it is judged on the blended portfolio)
    check(css(d, '#esg-pill').is_displayed() and not d.find_elements(By.CSS_SELECTOR, '#pick-funds .dim'), 'no funds greyed out when the client has sustainability preferences')
    check(css(d, '[data-pick=etfw] .sfdr').text == 'Art. 6', 'ETF shows SFDR Article 6')
    setv(d, 'fund-search', 'strategy')
    vis_rows = js(d, "return [].filter.call(document.querySelectorAll('#pick-funds [data-pick]'), function(r){ return r.getBoundingClientRect().height > 0; }).length")
    check(vis_rows == 3, 'search filters the fund list (%d)' % vis_rows)
    setv(d, 'fund-search', '')
    # Fund info popover — clicking the name must not toggle the tick box
    pop = d.find_element(By.ID, 'qt-pop')
    click(d, css(d, '[data-finfo=ss75]'))
    time.sleep(0.25)
    for t in ['Allianz Strategy Select 75', 'Protected Growth', '75% international stocks']:
        check(t.lower() in pop.text.lower(), 'fund popover has %r' % t)
    check(not js(d, "return S.prsa.diySel.ss75 || false"), 'clicking the fund name does not tick it')
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    time.sleep(0.25)
    check(not pop.is_displayed() and js(d, "return document.activeElement.getAttribute('data-finfo')") == 'ss75', 'Escape closes the fund popover and returns focus')
    click(d, css(d, '[data-cat=idx] .fcat-h'))
    check(js(d, "return document.querySelector('[data-cat=idx] .fcat-h').getAttribute('aria-expanded')") == 'false' and js(d, "return document.getElementById('fundcat-idx').classList.contains('closed')"), 'category collapses')
    click(d, css(d, '[data-cat=idx] .fcat-h'))
    d.save_screenshot(str(OUT / 'prsa_step5_pick.png'))
    nxt(d)
    time.sleep(0.5)
    check(views() == ['alloc'] and step(d) == 5, 'Next on Choose funds goes to Allocate (%s)' % views())
    check(js(d, 'return document.activeElement.id') == 'alloc-h', 'focus moves to the Allocate heading')
    rows = js(d, "return [].filter.call(document.querySelectorAll('#diy-funds [data-row]'), function(r){ return !r.hidden; }).map(function(r){ return r.getAttribute('data-row'); })")
    check(sorted(rows) == sorted([g, 'cash']), 'Allocate lists only the ticked funds: %s' % rows)
    check(js(d, "return !!document.querySelector('#side-alloc #pf-side')") and shown('#ps-full'), 'glance panel shown in full on Allocate')
    check('0% allocated' in d.find_element(By.ID, 'alloc-text').text, 'progress starts at 0%')
    setalloc = lambda fid, v: js(d, "var e=document.querySelector('[data-fund='+arguments[0]+']'); e.value=arguments[1]; e.dispatchEvent(new Event('input'));", fid, str(v))
    prog = lambda: js(d, "return document.getElementById('alloc-prog').className")
    setalloc(g, '33.55')
    check(js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 33.5 and js(d, "return document.querySelector('[data-fund=' + arguments[0] + ']').value", g) == '33.5', 'allocation limited to one decimal place')
    setalloc('cash', '66.5')
    check('full' in prog(), '33.5 + 66.5 = 100 is fully allocated')
    check(len(d.find_elements(By.CSS_SELECTOR, '#alloc-bar > div')) == 2, 'one bar segment per allocated fund')
    setalloc('cash', '')
    setalloc(g, '250')
    check(js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 100, 'allocation capped at 100')
    click(d, d.find_element(By.ID, 'alloc-split'))
    check(js(d, 'return S.prsa.diyAllocs[arguments[0]] + S.prsa.diyAllocs.cash', g) == 100 and js(d, 'return S.prsa.diyAllocs.cash') == 50, 'Split equally: 50 / 50')
    js(d, "S.prsa.diySel.etfw = true; splitEqually()")
    check(sorted(js(d, "return [S.prsa.diyAllocs[arguments[0]], S.prsa.diyAllocs.cash, S.prsa.diyAllocs.etfw]", g)) == [33.3, 33.3, 33.4], 'Split equally across 3: 33.4 / 33.3 / 33.3')
    js(d, "delete S.prsa.diySel.etfw; delete S.prsa.diyAllocs.etfw; syncDiyFunds(); renderPfSummary();")
    setalloc(g, 60); setalloc('cash', '')
    check('part' in prog() and '40% left to allocate' in d.find_element(By.ID, 'alloc-rem').text, 'amber at 60%% (%s)' % prog())
    check('active' in css(d, '[data-row=%s]' % g).get_attribute('class'), 'allocated fund row becomes active')
    setalloc('cash', 50)
    check('over' in prog() and d.find_element(By.ID, 'alloc-err').is_displayed(), 'red with an error over 100%')
    setalloc('cash', 40)
    check('full' in prog(), 'green at 100%')
    sw = css(d, '[data-gtee=%s]' % g)
    check(sw.is_displayed(), 'guarantee switch shown on Allocate')
    check(re.fullmatch(r'\d', js(d, "return document.getElementById('ps-risk').firstChild.textContent").strip()), 'portfolio risk shown as a whole number')
    click(d, sw)
    check(sw.get_attribute('role') == 'switch' and sw.is_selected() and 'on' in css(d, '[data-g=%s]' % g).get_attribute('class'), 'guarantee switch turns the strip on')
    row = css(d, '[data-row=%s]' % g).text
    check('fund charge 0.25%' in row and 'Optional Annual Guarantee' in row and re.search(r'\d{2}% protected', row) and 'extra charge 0.75%' in row, 'guarantee fund row content: %r' % row)
    cl = lambda i: js(d, "return parseFloat(document.querySelector('#' + arguments[0] + ' .cl-val').textContent)", i)
    check(js(d, "return !document.getElementById('ps-gch').hidden") and abs(cl('ps-amc') + cl('ps-fmc') + cl('ps-gch') - cl('ps-total')) < 0.011, 'charge breakdown adds up: %s + %s + %s = %s' % (cl('ps-amc'), cl('ps-fmc'), cl('ps-gch'), cl('ps-total')))
    check('incl. 0.25% trail' in css(d, '#ps-amc .cl-label').text, 'trail shown as part of the AMC, not a separate charge')
    check(css(d, '#ps-sfdr').text.startswith('100% Article 8'), 'SFDR summary from the allocations')
    # Guarantee info popover
    click(d, css(d, '[data-ginfo=%s]' % g))
    time.sleep(0.4)
    for t in ['How it works', 'Guarantee levels', '93% protected', '85% protected', 'below the protected percentage']:
        check(t.lower() in pop.text.lower(), 'guarantee popover has %r' % t)
    check(len(pop.text) < 900, 'guarantee popover is short (%d chars)' % len(pop.text))
    click(d, d.find_element(By.ID, 'alloc-h'))
    time.sleep(0.25)
    check(not pop.is_displayed(), 'outside click closes the popover')
    d.save_screenshot(str(OUT / 'prsa_step5_build.png'))
    # Change funds: back to the tick list, allocation kept; unticking drops a fund's allocation
    # How to invest: straight back to the strategy choice from Allocate, allocation kept
    check(d.find_element(By.ID, 'alloc-back-strat').is_displayed(), 'Allocate offers a link back to How to invest')
    click(d, d.find_element(By.ID, 'alloc-back-strat'))
    time.sleep(0.5)
    check(views() == ['strat'] and js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 60, 'How to invest goes back from Allocate with the allocation kept (%s)' % views())
    click(d, css(d, '[data-strat=diy] .strat-main')); time.sleep(0.5)
    click(d, d.find_element(By.ID, 'btn-next')); time.sleep(0.5)
    click(d, d.find_element(By.ID, 'alloc-back-pick'))
    time.sleep(0.5)
    check(views() == ['pick'] and js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 60, 'Change funds goes back with allocation kept')
    tick('etfw'); tick('etfw')
    check(not js(d, "return 'etfw' in S.prsa.diySel || 'etfw' in S.prsa.diyAllocs"), 'unticking removes the fund')
    click(d, d.find_element(By.ID, 'pf-back'))
    time.sleep(0.5)
    check(views() == ['strat'], 'back to strategy selection')
    badge = css(d, '[data-strat=diy] .prog').text
    check(badge == '2 funds selected · 100%', 'work-in-progress badge: %r' % badge)
    check(next_label(d).startswith('See results'), 'complete custom portfolio: footer goes to results')
    check('on' in css(d, '[data-strat=diy]').get_attribute('class') and d.find_element(By.ID, 'pf-side').is_displayed(), 'Build Your Own box marked, glance panel shown')
    # Choosing a managed strategy over a custom allocation asks first
    click(d, css(d, '[data-way=managed] .strat-main')); time.sleep(0.5)
    click(d, css(d, '[data-strat=dis] .strat-main'))
    check(d.find_element(By.ID, 'confirm-bg').is_displayed() and js(d, 'return document.activeElement.id') == 'confirm-no', 'replace confirmation shown, focus on Cancel')
    click(d, d.find_element(By.ID, 'confirm-no'))
    check(js(d, 'return S.prsa.strat') == 'diy' and js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 60, 'Cancel keeps the custom allocation')
    click(d, css(d, '[data-strat=dis] .strat-main'))
    click(d, d.find_element(By.ID, 'confirm-yes'))
    check(js(d, 'return S.prsa.strat') == 'dis' and js(d, 'return Object.keys(S.prsa.diyAllocs).length + Object.keys(S.prsa.diySel).length') == 0 and ra() == 'Aligned ✓', 'DIS replaces the allocation and is aligned for SRI 3 (%s)' % ra())
    check(views() == ['managed'] and not js(d, "return document.querySelector('[data-strat=diy] .prog').hidden === false"), 'managed strategy stays on its view; Build Your Own badge cleared')
    check(shown('#ps-full') and css(d, '#ps-risk-k').text == 'Strategy' and '→' in css(d, '#ps-risk').text, 'glance panel shows the strategy risk path')
    check('Aligned' in css(d, '#ps-align').text, 'alignment pill')
    check(not d.find_element(By.ID, 'mismatch-card').is_displayed(), 'no mismatch banner when aligned')
    # Info popover
    click(d, css(d, '[data-fam=ap] > .info-btn'))
    time.sleep(0.25)
    for t in ['Autopilot', 'rolling one-year guarantees', 'Approach', 'Options', 'Medium–Higher', '3–5', 'SFDR Classification', 'Article 8', 'Guarantee levels', '90% protected']:
        check(t.lower() in pop.text.lower(), 'strategy popover has %r' % t)
    check(js(d, 'return S.prsa.strat') == 'dis', 'info button does not select the strategy')
    d.save_screenshot(str(OUT / 'prsa_step5_info.png'))
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    time.sleep(0.25)
    check(not pop.is_displayed() and js(d, "return document.activeElement.getAttribute('data-info')") == 'fam:ap', 'Escape closes the popover and returns focus')
    click(d, css(d, '[data-strat=dis] .info-btn'))
    time.sleep(0.25)
    check('Lifecycle until 8 years before' in pop.text and 'Two-phase glidepath' in pop.text and '3–4' in pop.text, 'Non-Standard DIS popover copy and ratings')
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    click(d, css(d, '[data-strat=ap_op]'))
    check(ra() == 'Aligned ✓' and 'on' in css(d, '[data-fam=ap]').get_attribute('class'), 'Autopilot Opportunity aligned for SRI 3 (%s)' % ra())
    # Life Cycle Opportunity (4–5) vs SRI 3: flagged in the summary at once; the warning appears when trying to proceed
    click(d, css(d, '[data-strat=lc_op]'))
    check(ra() == 'Review required ⚠', 'risk alignment: review required (%s)' % ra())
    check('reason is needed' in css(d, '#ps-align').text, 'alignment pill flags the mismatch')
    check(not d.find_element(By.ID, 'mismatch-card').is_displayed(), 'no inline warning until the adviser tries to proceed')
    nxt(d)
    check(step(d) == 5, 'mismatch requires reason')
    mt = d.find_element(By.ID, 'mismatch-text').text
    check(d.find_element(By.ID, 'mismatch-card').is_displayed() and 'risk rating of 3 — Low to Medium' in mt and 'ratings 4–5' in mt, 'warning shown on Next: %r' % mt)
    check(js(d, 'return document.activeElement.id') == 'mismatch-reason', 'focus moves to the reason box')
    check('Choose another strategy' in d.find_element(By.ID, 'mm-back').text and d.find_element(By.ID, 'mm-proceed').text.startswith('Proceed'), 'warning buttons')
    click(d, d.find_element(By.ID, 'mm-back'))
    check(js(d, 'return S.prsa.strat') is None and not d.find_element(By.ID, 'mismatch-card').is_displayed() and shown('[data-strat=lc_op]'), 'Go Back clears the selection')
    click(d, css(d, '[data-strat=lc_op]'))
    nxt(d)
    click(d, d.find_element(By.ID, 'mm-proceed'))
    check(js(d, 'return S.risk.override') is None and 'invalid' in d.find_element(By.ID, 'mismatch-reason').get_attribute('class'), 'Proceed needs a reason')
    setv(d, 'mismatch-reason', 'The client has a long term to retirement and other cautious assets.')
    click(d, d.find_element(By.ID, 'mm-proceed'))
    ov = js(d, 'return S.risk.override')
    check(ov and ov['key'] == 'lc_op' and ov['clientSri'] == 3 and ov['direction'] == 'higher' and ov['reason'].startswith('The client has') and ov['recordedAt'], 'override recorded: %s' % ov)
    check(ra() == 'Override recorded' and d.find_element(By.ID, 'mm-done').is_displayed(), 'banner shows recorded override')
    d.save_screenshot(str(OUT / 'prsa_step5.png'))
    nxt(d)
    check(step(d) == 6, 'step 5 -> 6 (%s)' % msg(d))
    d.save_screenshot(str(OUT / 'prsa_step6.png'))
    # Quote summary card replaces the KPI band and carries the fund list
    cols = js(d, "return [].map.call(document.querySelectorAll('#res-band .qs-h span'), function(e){ return e.textContent; })")
    check(cols == ['Client', 'Plan', 'Funds'], 'quote summary card columns: %s' % cols)
    band = d.find_element(By.ID, 'res-band').text
    check('Mr Alex Murphy' in band and 'Allianz Vantage PRSA' in band and 'Attitude to risk' in band,
          'summary card shows the quotation inputs: %r' % band[:120])
    check(js(d, "return document.querySelectorAll('#res-band .qs-h .lnk').length") == 3, 'each summary column has an Edit link')
    check(not any(t in band for t in ['Paid by', 'Management charge', 'Trail commission', 'Single contribution', 'Transfer value']), 'summary card leaves out charges, commission and the contribution breakdown')
    check("Income in today's money" in d.find_element(By.ID, 'res-body').text, 'income labelled as today\'s money')
    # Projection: figures panel, chart and a collapsed year-by-year table
    check(js(d, "return !!document.querySelector('#res-body .pj-hero b')") and
          js(d, "return !!document.querySelector('#res-body .pj-assume')"), 'projection panel with assumptions')
    check(js(d, "return document.querySelectorAll('#res-body table.tbl tbody tr').length") == 0, 'year-by-year table collapsed by default')
    click(d, css(d, '#res-body .tcard-h .btn'))
    check(js(d, "return document.querySelectorAll('#res-body table.tbl tbody tr').length") > 15, 'Show table reveals every year')
    cols2 = js(d, "return [].map.call(document.querySelectorAll('#res-body table.tbl thead th'), function(e){ return e.textContent; })")
    check(cols2 == ['Year', 'Age', 'Total paid in', 'Projected value'], 'table drops growth and effect-of-charges columns: %s' % cols2)
    warns = js(d, "return document.querySelectorAll('.warnpanel div span').length")
    check(warns == 6, 'important warnings panel under the tab (%d)' % warns)
    see_all_tabs(d)
    nxt(d)
    check(step(d) == 7, 'step 6 -> 7')
    sos = js(d, "return stripMarks(S.text.sos)")
    check('The client has a long term' in sos, 'mismatch reason flows into SoS')
    check('Transfer of your existing pension' in sos, 'transfer section added when a transfer value is entered')
    check('Article 8' in sos, 'SoS sustainability section from the SFDR classification')
    pack_flow(d, 'prsa')
    check(not console_errors(d), 'PRSA main console errors')

def arf_flow(d):
    print('ARF flow')
    d.get(URL); js(d, 'setLite(false)')   # the tool opens in lite mode
    check(js(d, "return document.getElementById('b-firm').value") == 'Test Financial Ltd', 'broker details persisted')
    click(d, d.find_element(By.ID, 'b-consent'))
    nxt(d)
    fill_client(d, 'arf', '1960-04-10')
    pick_sri(d, 4, esg=False)
    setv(d, 'a-contrib', '300000')
    setv(d, 'a-itype', 'custom_amount'); setv(d, 'a-ival', '15000')
    check('€300,000' in d.find_element(By.ID, 'plan-sum').text, 'ARF plan summary')
    nxt(d)
    check(step(d) == 5, 'ARF step 4 -> 5 (%s)' % msg(d))
    check(js(d, "return document.getElementById('pf-view-strat').hidden && !document.getElementById('pf-view-pick').hidden && document.getElementById('pf-back').hidden"), 'ARF opens on Choose funds, no back link')
    check(not css(d, '#esg-pill').is_displayed() and not d.find_elements(By.CSS_SELECTOR, '#pick-funds .dim'), 'no sustainability note without sustainability preferences')
    setv(d, 'mismatch-reason', '')
    click(d, css(d, '#pick-funds [data-sel=ss50]'))
    click(d, css(d, '#pick-funds [data-sel=afsd]'))
    nxt(d); time.sleep(0.5)
    check(js(d, "return !document.getElementById('pf-view-alloc').hidden"), 'ARF Next goes to Allocate')
    js(d, "var e=document.querySelector('[data-fund=ss50]'); e.value=60; e.dispatchEvent(new Event('input'));")
    nxt(d)
    check(step(d) == 5 and '100%' in msg(d), 'ARF allocations must total 100')
    js(d, "var e=document.querySelector('[data-fund=afsd]'); e.value=40; e.dispatchEvent(new Event('input'));")
    js(d, "var e=document.querySelector('[data-gtee=ss50]'); e.click();")
    # 60% SRI 4 + 40% SRI 2 = 3.2 -> rounds to 3, lower than the client's 4
    check(js(d, "return portfolioState().mismatch && portfolioState().direction") == 'lower', 'lower-risk mismatch detected')
    nxt(d)
    check(step(d) == 5, 'lower-risk mismatch also requires a reason')
    check(d.find_element(By.ID, 'mismatch-card').is_displayed(), 'lower-risk mismatch warning shown on Next')
    setv(d, 'mismatch-reason', 'Client prefers a lower-risk portfolio for income stability.')
    nxt(d)
    check(step(d) == 6, 'ARF step 5 -> 6 (%s)' % msg(d))
    ov = js(d, 'return S.risk.override')
    check(ov and ov['key'] == 'arf:diy' and ov['direction'] == 'lower', 'reason + Next records the override: %s' % ov)
    setv(d, 'rate1', '5')
    check(abs(js(d, 'return S.arf.rate1Override') - 0.05) < 1e-9, 'ARF rate 1 editable')
    check('At 5.00% growth' in d.find_element(By.ID, 'res-body').text, 'projection follows the edited rate')
    check(js(d, "return [].filter.call(document.querySelectorAll('#res-band .qs-rows div'), function(r){ return r.textContent.indexOf('Guarantee') >= 0; }).length") == 1, 'guarantee marked on the guaranteed fund')
    check(js(d, "return document.querySelectorAll('#res-band .qs-rows .g').length") >= 1, 'guarantee marked green in the summary card')
    d.save_screenshot(str(OUT / 'arf_step6.png'))
    see_all_tabs(d)
    nxt(d)
    check(step(d) == 7, 'ARF step 6 -> 7')
    check('do not have sustainability preferences' in js(d, "return stripMarks(S.text.sos)"), 'ARF SoS records no sustainability preferences')
    pack_flow(d, 'arf')
    check(not console_errors(d), 'ARF main console errors')

def standard_prsa_funds(d):
    """Standard PRSA: Non-Standard-only funds are greyed out and can't be allocated."""
    print('Standard PRSA fund availability')
    d.get(URL); js(d, 'setLite(false)')   # the tool opens in lite mode
    time.sleep(0.4)
    js(d, "S.client.first='A'; S.client.last='B'; S.client.dobStr='1980-03-15'; S.startStr='2026-10-01'; S.risk.sri=3; S.risk.esg=false; "
          "setProduct('prsa'); setPrsaType('standard'); showStep(5); openBuilder();")
    time.sleep(0.5)
    st = js(d, "var o={}; document.querySelectorAll('#pick-funds [data-pick]').forEach(function(r){ o[r.getAttribute('data-pick')] = [r.classList.contains('unavail'), r.querySelector('[data-sel]').disabled]; }); return o;")
    for fid in ['afie', 'dm15', 'dm50', 'dm75', 'bsri']:
        check(st.get(fid) == [True, True], 'Standard: %s greyed out and disabled (%s)' % (fid, st.get(fid)))
    for fid in ['cash', 'afisd', 'ss30', 'ss50', 'ss75', 'etfe', 'etfw', 'etfs']:
        check(st.get(fid) == [False, False], 'Standard: %s available (%s)' % (fid, st.get(fid)))
    check('Non-Standard PRSA only' in css(d, '[data-pick=dm75]').text, 'unavailable fund is labelled')
    check(not d.find_elements(By.CSS_SELECTOR, '[data-cat=pg] .fcat-note'), 'no guarantee note on a Standard PRSA')
    # A single ticked fund starts at 100%
    click(d, css(d, '#pick-funds [data-sel=ss50]'))
    js(d, 'pfToAlloc()'); time.sleep(0.5)
    check(js(d, 'return S.prsa.diyAllocs.ss50') == 100 and 'full' in js(d, "return document.getElementById('alloc-prog').className"), 'one fund ticked -> 100% allocated')
    check(js(d, "return document.querySelectorAll('#diy-funds [data-gtee]').length") == 0, 'no guarantee toggles on a Standard PRSA')
    js(d, "setPfView('managed', false)")
    fams = js(d, "return [].map.call(document.querySelectorAll('#strat-opts [data-fam]'), function(e){ return e.getAttribute('data-fam'); })")
    check(fams == ['lc'], 'Standard PRSA: DIS and Life Cycle only (%s)' % fams)
    click(d, css(d, '[data-strat=dis] .info-btn'))
    time.sleep(0.25)
    check('Dynamic Lifecycle Strategy' in d.find_element(By.ID, 'qt-pop').text, 'Standard DIS popover copy')
    check(not console_errors(d), 'Standard PRSA console errors')

def responsive_check(d):
    """The content column is viewport - 272px rail - 128px padding, so a 1280px laptop only has
    ~1000px to work with. Fields must reflow onto new lines, never shrink below a usable width."""
    print('Responsive (1024px and up)')
    js(d, "localStorage.clear()")
    d.get(URL); js(d, 'setLite(false)')   # the tool opens in lite mode
    fill_broker(d)
    fill_client(d, 'prsa', '1980-04-12', 65)
    pick_sri(d, 4)
    set_ct(d, 'prsa', 'ofv_sp_rp')
    setv(d, 'p-ofv', '20000'); setv(d, 'p-sp', '50000'); setv(d, 'p-rp', '500')
    for w in (1440, 1280, 1152, 1024):
        d.set_window_rect(width=w, height=1000)
        time.sleep(0.25)
        for n in (1, 2, 3, 4):
            js(d, 'goStep(arguments[0])', n)
            time.sleep(0.1)
            over = js(d, "return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
            check(over == 0, 'no sideways scroll at %dpx on step %d (overflow %dpx)' % (w, n, over))
            narrow = js(d, "return [].filter.call(document.querySelectorAll('input[type=text],input[type=number],input[type=date],select'),"
                           "function(e){ var r = e.getBoundingClientRect(); return r.width > 0 && r.width < 100; })"
                           ".map(function(e){ return e.id + ':' + Math.round(e.getBoundingClientRect().width); })")
            check(not narrow, 'no crushed inputs at %dpx on step %d: %s' % (w, n, narrow))
    # containment on .wrap must not re-anchor the overlays inside it
    js(d, 'goStep(5)')
    m = js(d, "var bg = document.getElementById('confirm-bg'); bg.removeAttribute('hidden');"
              "var r = bg.getBoundingClientRect(); bg.setAttribute('hidden', '');"
              "return [Math.round(r.left), Math.round(r.width), document.documentElement.clientWidth];")
    check(m[0] == 0 and m[1] == m[2], 'modal overlay still covers the viewport under containment: %s' % m)
    d.set_window_rect(width=1440, height=1400)

d = driver()
try:
    prsa_flow(d)
    arf_flow(d)
    standard_prsa_funds(d)
    responsive_check(d)
finally:
    d.quit()
print('\n%d failure(s)' % len(fails))
sys.exit(1 if fails else 0)
