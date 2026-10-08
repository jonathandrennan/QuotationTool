"""End-to-end UI check for quotation_tool.html (headless Edge).

Walks the wizard for a PRSA and an ARF quotation, checks validation blocks progress,
fills the Statement of Suitability prompts, opens the pack preview, waits for the
paginator and saves the pack as PDF (tests/out/*.pdf) plus a screenshot of each step.
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
def check(cond, msg):
    if not cond:
        fails.append(msg); print('  FAIL', msg)

def driver():
    o = Options()
    o.add_argument('--headless=new')
    o.add_argument('--window-size=1400,1400')
    o.set_capability('ms:loggingPrefs', {'browser': 'ALL'})
    return webdriver.Edge(options=o)

def js(d, s, *a): return d.execute_script(s, *a)
def setv(d, id_, v):
    js(d, "var e=document.getElementById(arguments[0]); e.value=arguments[1]; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); e.dispatchEvent(new Event('blur'));", id_, str(v))
def click(d, el):
    d.execute_script("arguments[0].scrollIntoView({block:'center'})", el); el.click()
def nxt(d): click(d, d.find_element(By.ID, 'btn-next')); time.sleep(0.15)
def step(d): return js(d, 'return S.step')
def msg(d): return d.find_element(By.ID, 'foot-msg').text
def console_errors(d):
    try:
        return [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
    except Exception:
        return []

def fill_broker(d):
    nxt(d)
    check(step(d) == 1 and msg(d), 'step 1 should block with empty adviser details')
    for k, v in dict(firm='Test Financial Ltd', name='Pat Adviser', email='pat@test.ie', phone='01 555 0000',
                     address='1 Main Street\nDublin 2', reg='Test Financial Ltd is regulated by the Central Bank of Ireland.').items():
        setv(d, 'b-' + k, v)
    nxt(d)
    check(step(d) == 1 and 'declaration' in msg(d), 'step 1 should require consent')
    click(d, d.find_element(By.ID, 'b-consent'))
    nxt(d)
    check(step(d) == 2, 'step 1 -> 2')

def fill_client(d, product, dob, nra=None):
    click(d, d.find_element(By.CSS_SELECTOR, '#prod-seg button[data-p="%s"]' % product))
    nxt(d)
    check(step(d) == 2, 'step 2 should block with empty client')
    setv(d, 'c-first', 'Alex'); setv(d, 'c-last', 'Murphy'); setv(d, 'c-dob', dob)
    setv(d, 'c-address', '22 Oak Road\nBlackrock\nCo. Dublin')
    if nra: setv(d, 'q-nra', nra)
    setv(d, 'q-start', '2026-10-01')
    nxt(d)
    check(step(d) == 3, 'step 2 -> 3 (%s)' % msg(d))

def pick_sri(d, sri):
    nxt(d)
    check(step(d) == 3, 'step 3 should require SRI')
    click(d, d.find_elements(By.CSS_SELECTOR, '.sri-card')[sri - 1])
    d.save_screenshot(str(OUT / ('%s_step3.png' % js(d, 'return S.product'))))
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4')

def fill_sos_and_preview(d, tag):
    check(d.find_element(By.ID, 'btn-generate').get_attribute('disabled') is not None, 'generate disabled while prompts remain')
    n_chips = len(d.find_elements(By.CSS_SELECTOR, '#sos-chips .chip:not(.ok)'))
    check(n_chips >= 4, 'SoS prompt chips shown (%d)' % n_chips)
    click(d, d.find_elements(By.CSS_SELECTOR, '#sos-chips .chip')[0])
    sel = js(d, "var t=document.getElementById('ta-sos'); return t.value.slice(t.selectionStart,t.selectionEnd)")
    check(sel.startswith('[[') and sel.endswith(']]'), 'chip click selects prompt')
    click(d, d.find_element(By.ID, 'next-sos'))
    sel2 = js(d, "var t=document.getElementById('ta-sos'); return [t.selectionStart, t.value.slice(t.selectionStart,t.selectionEnd)]")
    check(sel2[1].startswith('[[') and sel2[1].endswith(']]'), 'Next prompt selects a prompt')
    cover = js(d, "return document.getElementById('ta-cover').value")
    check('[[' not in cover, 'cover letter has no prompts')
    check('Enclosed:' in cover, 'cover letter lists enclosures')
    # required sections are locked; presets set the expected keys
    for k in ['projection', 'charges', 'remun', 'important']:
        check(js(d, "var e=document.querySelector('[data-sec=%s]'); return e.disabled && e.checked" % k), 'section %s locked on' % k)
    click(d, d.find_element(By.CSS_SELECTOR, '#preset-seg button[data-preset="quote"]'))
    secs = js(d, 'return S.sections')
    check(not secs['cover'] and not secs['sos'] and secs['projection'], 'Quotation-only preset drops adviser documents')
    click(d, d.find_element(By.CSS_SELECTOR, '#preset-seg button[data-preset="full"]'))
    check(all(js(d, 'return S.sections').values()), 'Full preset selects all sections')
    js(d, "var t=document.getElementById('ta-sos'); t.value=t.value.replace(/\\[\\[[^\\]]*\\]\\]/g,'The client confirmed this in our meeting.'); t.dispatchEvent(new Event('input'));")
    check(d.find_element(By.ID, 'btn-generate').get_attribute('disabled') is None, 'generate enabled after prompts filled')
    d.save_screenshot(str(OUT / ('%s_step7.png' % tag)))
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
    check(pages and pages >= 8, '%s pack paginated (%s pages)' % (tag, pages))
    txt = d.find_element(By.ID, 'pages').text
    toks = re.findall(r'\{[a-zA-Z]+\}', txt)
    check(not toks, '%s unfilled tokens: %s' % (tag, toks[:5]))
    check('undefined' not in txt and 'NaN' not in txt, '%s pack contains undefined/NaN' % tag)
    check('[[' not in txt, '%s pack contains [[prompt]]' % tag)
    dec = re.findall(r'(?:SRI|Risk|risk)\s*:?\s*\d\.\d', txt)
    check(not dec, '%s pack shows a decimal risk figure outside the footnote: %s' % (tag, dec[:3]))
    summ = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){return p.textContent.indexOf('Your personalised quotation')>=0})[0]; return p ? p.textContent : ''")
    check('Key warnings' in summ and 'In this pack' in summ and 'not guaranteed' in summ, '%s summary fits on one page with contents, warnings and disclaimer' % tag)
    over = js(d, "return [].slice.call(document.querySelectorAll('.pbody')).filter(function(b){return b.scrollHeight > b.clientHeight + 1;}).length")
    check(over == 0, '%s pages with overflowing content: %s' % (tag, over))
    pn = js(d, "return [].slice.call(document.querySelectorAll('.pn')).map(function(e){return e.textContent})")
    check(pn[-1] == 'Page %d of %d' % (pages, pages), 'page numbering')
    svgs = len(d.find_elements(By.CSS_SELECTOR, '#pages svg polyline'))
    check(svgs >= 2, '%s vector chart lines present (%d)' % (tag, svgs))
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
    d.get(URL); js(d, "localStorage.clear()"); d.get(URL)
    fill_broker(d)
    fill_client(d, 'prsa', '1980-03-15', 65)
    pick_sri(d, 3)
    nxt(d)
    check(step(d) == 4, 'step 4 should block with no contributions')
    sp = d.find_element(By.ID, 'p-sp'); click(d, sp); sp.send_keys('1234567')
    check(sp.get_attribute('value') == '1,234,567', 'thousands separator added while typing: %r' % sp.get_attribute('value'))
    check(js(d, 'return S.prsa.sp') == 1234567, 'formatted amount still parses')
    setv(d, 'p-sp', '50000'); setv(d, 'p-rp', '500'); setv(d, 'p-ofv', '20000')
    # commission override stepper in the Edit commission pop-out
    check(not d.find_element(By.CSS_SELECTOR, '#p-commwrap .pop').is_displayed(), 'commission pop-out closed by default')
    click(d, d.find_element(By.CSS_SELECTOR, '#p-commwrap > button'))
    click(d, d.find_elements(By.CSS_SELECTOR, '#p-commwrap .stepper button')[0])
    check(js(d, 'return S.prsa.spUpOverride') == 0.035, 'SP initial stepper -0.5%')
    check(d.find_element(By.CSS_SELECTOR, '#p-commwrap .pop').is_displayed(), 'pop-out stays open while stepping')
    d.save_screenshot(str(OUT / 'prsa_step4_comm.png'))
    check('edited' in d.find_element(By.ID, 'p-codeinfo').text, 'edited commission flagged in summary line')
    click(d, d.find_element(By.ID, 'plan-lead'))
    check(not d.find_element(By.CSS_SELECTOR, '#p-commwrap .pop').is_displayed(), 'pop-out closes on outside click')
    check('–' not in js(d, "return document.getElementById('p-level').options[0].text"), 'no descriptions on product codes')
    d.save_screenshot(str(OUT / 'prsa_step4.png'))
    nxt(d)
    check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))
    ra = lambda: js(d, "return document.querySelector('#pf-ra .ra').textContent")
    shown = lambda sel: js(d, "var e=document.querySelector(arguments[0]); return !!e && e.getBoundingClientRect().height > 1 && !e.closest('[inert]')", sel)
    # First view: Build Your Own on top, then DIS / Autopilot / Life Cycle; no sub-options or SRIs on cards
    check(shown('#strats .strat-hero[data-strat=diy]'), 'Build Your Own card shown first')
    top = js(d, "return [].map.call(document.querySelectorAll('#strats > .strat-row > .strat'), function(e){ return e.getAttribute('data-strat') || e.getAttribute('data-fam'); })")
    check(top == ['dis', 'ap', 'lc'], 'three managed cards below the divider: %s' % top)
    check(not shown('[data-strat=ap_op]') and js(d, "return document.querySelectorAll('.strat-sub.open').length") == 0, 'sub-options collapsed on load')
    check(not re.search(r'SRI', js(d, "return document.getElementById('strats').textContent")), 'no SRI values on strategy cards')
    check(ra() == 'No strategy selected', 'risk alignment: nothing selected (%s)' % ra())
    check(d.find_element(By.ID, 'pf-lead').text == 'Build your portfolio, your way.' and d.find_element(By.ID, 'strat-h').text == 'How would you like to invest?', 'benefit-led headings')
    check(js(d, "return document.querySelector('#pf-sheet h3').textContent") == 'Your portfolio at a glance', 'panel title')
    check(js(d, "return document.querySelectorAll('#strats [data-fam] .info-btn').length") == 2 and not js(d, "return !!document.querySelector('[data-strat=dis] .sm')"), 'family cards have info buttons; DIS has no subtitle')
    check(js(d, "return document.getElementById('pf-view-build').hidden"), 'fund builder hidden on strategy selection')
    d.save_screenshot(str(OUT / 'prsa_step5_initial.png'))
    nxt(d)
    check(step(d) == 5 and 'strategy' in msg(d), 'step 5 requires a strategy')
    # Build Your Own swaps the area to the fund builder
    views = lambda: js(d, "return [document.getElementById('pf-view-strat').hidden, document.getElementById('pf-view-build').hidden]")
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=diy] .strat-main'))
    time.sleep(0.5)
    check(views() == [True, False] and js(d, 'return S.prsa.strat') == 'diy', 'Build Your Own swaps to the fund builder')
    check(js(d, 'return document.activeElement.id') == 'build-h', 'focus moves to the builder heading')
    check('0% of 100% allocated' in d.find_element(By.ID, 'alloc-text').text, 'progress starts at 0%')
    check(js(d, "return document.querySelectorAll('#diy-funds .fundcat-h[aria-expanded=true]').length") == 3, 'all fund categories expanded')
    g = js(d, "return document.querySelector('#diy-funds [data-gtee]').getAttribute('data-gtee')")
    setalloc = lambda fid, v: js(d, "var e=document.querySelector('[data-fund='+arguments[0]+']'); e.value=arguments[1]; e.dispatchEvent(new Event('input'));", fid, str(v))
    prog = lambda: js(d, "return document.getElementById('alloc-prog').className")
    setalloc(g, 60)
    check(prog() == 'alloc part' and 'Remaining: 40%' in d.find_element(By.ID, 'alloc-rem').text, 'amber at 60%% (%s)' % prog())
    check(js(d, "return document.querySelector('[data-row=' + arguments[0] + ']').classList.contains('active')", g), 'allocated fund row becomes active')
    setalloc('cash', 50)
    check(prog() == 'alloc over' and d.find_element(By.ID, 'alloc-err').is_displayed(), 'red with an error over 100%')
    setalloc('cash', 40)
    check(prog() == 'alloc full', 'green at 100%')
    sw = d.find_element(By.CSS_SELECTOR, '[data-gtee=%s]' % g)
    eff = lambda: js(d, "return document.getElementById('eff-' + arguments[0]).textContent", g)
    eff0 = eff()
    click(d, sw)
    check(sw.get_attribute('role') == 'switch' and sw.is_selected() and eff() != eff0 and 'guarantee' in eff(), 'guarantee switch updates the effective charge: %r' % eff())
    time.sleep(0.3)
    check(js(d, "return document.querySelectorAll('#ps-funds .sf:not(.leave)').length") == 2, 'summary lists the two selected funds')
    shield = js(d, "var e=document.querySelector('#ps-funds [data-sf=' + arguments[0] + '] .sh'); return e ? e.textContent : ''", g)
    check(re.match(r'\d{2}%$', shield), 'guarantee shield with protection level in the summary: %r' % shield)
    check(js(d, "return document.querySelector('#ps-alloc').className") == 'alloc sm full', 'summary allocation bar at 100%')
    # Fund rows: FMC label, SFDR badges, guarantee card with protection level
    row = d.find_element(By.CSS_SELECTOR, '[data-row=%s]' % g).text
    check('FMC ' in row and 'Art.8' in row and 'Optional Annual Guarantee' in row and re.search(r'\d{2}% of policy value protected', row), 'guarantee fund row content: %r' % row)
    check(js(d, "return document.querySelector('[data-row=etfw] .sfdr').textContent") == 'Art.6', 'ETF shows SFDR Article 6')
    # Charge breakdown: AMC + blended FMC + guarantee = total
    cl = lambda i: js(d, "return parseFloat(document.querySelector('#' + arguments[0] + ' .cl-val').textContent)", i)
    check(js(d, "return !document.getElementById('ps-gch').hidden") and abs(cl('ps-amc') + cl('ps-fmc') + cl('ps-gch') - cl('ps-total')) < 0.011, 'charge breakdown adds up: %s + %s + %s = %s' % (cl('ps-amc'), cl('ps-fmc'), cl('ps-gch'), cl('ps-total')))
    check(cl('ps-trail') == 0.25, 'trail shown under AMC')
    # Fund and guarantee info popovers
    pop = d.find_element(By.ID, 'qt-pop')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-finfo=ss50]'))
    time.sleep(0.25)
    for t in ['Allianz Strategy Select 50', 'Protected Growth', '50% international stocks and 50% medium-term EUR bonds']:
        check(t.lower() in pop.text.lower(), 'fund popover has %r' % t)
    check(js(d, "return document.querySelectorAll('#qt-pop table, #qt-pop ul').length") == 0, 'fund popover is description only (no table or lists)')
    check(len(pop.text) < 400, 'fund popover is short (%d chars)' % len(pop.text))
    gh = js(d, "return document.querySelector('[data-g=' + arguments[0] + ']').getBoundingClientRect().height", g)
    check(gh < 50, 'guarantee card is one compact row (%spx)' % gh)
    d.save_screenshot(str(OUT / 'prsa_step5_fundinfo.png'))
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    time.sleep(0.25)
    check(not pop.is_displayed() and js(d, "return document.activeElement.getAttribute('data-finfo')") == 'ss50', 'Escape closes the fund popover and returns focus')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-ginfo=%s]' % g))
    time.sleep(0.25)
    for t in ['When markets are down', 'When markets are up', 'Guarantee levels', '93% protected', '85% protected', 'CPPI', 'Death benefit']:
        check(t.lower() in pop.text.lower(), 'guarantee popover has %r' % t)
    click(d, d.find_element(By.ID, 'build-h'))
    time.sleep(0.25)
    check(not pop.is_displayed(), 'outside click closes the popover')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-cat=eq] .fundcat-h'))
    check(js(d, "return document.querySelector('[data-cat=eq] .fundcat-h').getAttribute('aria-expanded')") == 'false' and js(d, "return document.getElementById('fundcat-eq').classList.contains('closed')"), 'category collapses')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-cat=eq] .fundcat-h'))
    d.save_screenshot(str(OUT / 'prsa_step5_build.png'))
    # Back to strategy selection: allocation kept, badge shown
    click(d, d.find_element(By.ID, 'pf-back'))
    time.sleep(0.5)
    check(views() == [False, True], 'back to strategy selection')
    badge = d.find_element(By.CSS_SELECTOR, '[data-strat=diy] .prog').text
    check(badge == '2 funds selected · 100%', 'work-in-progress badge: %r' % badge)
    # Choosing a managed strategy over a custom allocation asks first
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=dis] .strat-main'))
    check(d.find_element(By.ID, 'confirm-bg').is_displayed() and js(d, 'return document.activeElement.id') == 'confirm-no', 'replace confirmation shown, focus on Cancel')
    click(d, d.find_element(By.ID, 'confirm-no'))
    check(js(d, 'return S.prsa.strat') == 'diy' and js(d, 'return S.prsa.diyAllocs[arguments[0]]', g) == 60, 'Cancel keeps the custom allocation')
    # Expand / collapse: one family at a time, focus moves into the options
    click(d, d.find_element(By.CSS_SELECTOR, '[data-fam=ap] .strat-main'))
    time.sleep(0.4)
    check(js(d, "return document.querySelector('[data-fam=ap] .strat-main').getAttribute('aria-expanded')") == 'true' and shown('[data-strat=ap_op]'), 'Autopilot expands')
    check(js(d, "return !!document.activeElement.closest('#strat-sub-ap')"), 'focus moves into the Autopilot options')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-fam=lc] .strat-main'))
    time.sleep(0.4)
    check(shown('[data-strat=lc_op]') and not shown('[data-strat=ap_op]'), 'opening Life Cycle collapses Autopilot')
    click(d, d.find_element(By.CSS_SELECTOR, '#strat-sub-lc .strat-sub-h .link'))
    time.sleep(0.4)
    check(not shown('[data-strat=lc_op]') and js(d, "return document.activeElement.closest('[data-fam]').getAttribute('data-fam')") == 'lc', 'Back to strategies collapses and returns focus')
    # DIS: one click (confirming the custom allocation is replaced), aligned for SRI 3, stays on this view
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=dis] .strat-main'))
    click(d, d.find_element(By.ID, 'confirm-yes'))
    check(js(d, 'return S.prsa.strat') == 'dis' and js(d, 'return Object.keys(S.prsa.diyAllocs).length') == 0 and ra() == 'Aligned ✓', 'DIS replaces the allocation and is aligned for SRI 3 (%s)' % ra())
    check(views() == [False, True] and not d.find_element(By.CSS_SELECTOR, '[data-strat=diy] .prog').is_displayed(), 'managed strategy stays on strategy selection; badge cleared')
    check(d.find_element(By.ID, 'ps-alloc').text.startswith('100%'), 'managed strategy shows 100% allocated')
    check(not d.find_element(By.ID, 'mismatch-card').is_displayed(), 'no mismatch banner when aligned')
    # Info popover
    click(d, d.find_element(By.CSS_SELECTOR, '[data-fam=ap] .strat-main')); time.sleep(0.4)
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=ap_op] .info-btn'))
    time.sleep(0.25)
    for t in ['Autopilot Opportunity', 'rolling one-year guarantees', 'Risk Profile', 'Medium–Higher', 'Approach', 'Suitable Risk Ratings', '3–5', 'SFDR Classification', 'Article 8', 'Guarantee levels', '90% protected']:
        check(t.lower() in pop.text.lower(), 'strategy popover has %r' % t)
    check(js(d, 'return S.prsa.strat') == 'dis', 'info button does not select the strategy')
    d.save_screenshot(str(OUT / 'prsa_step5_info.png'))
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    time.sleep(0.25)
    check(not pop.is_displayed() and js(d, "return document.activeElement.getAttribute('data-info')") == 'ap_op', 'Escape closes the popover and returns focus')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=dis] .info-btn'))
    time.sleep(0.25)
    check('Lifecycle until 8 years before' in pop.text and 'Two-phase glidepath' in pop.text and '3–4' in pop.text, 'Non-Standard DIS popover copy and ratings')
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))")
    # New mapping: Autopilot Opportunity suits 3–5, so it is aligned for SRI 3
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=ap_op] .strat-main'))
    check(ra() == 'Aligned ✓', 'Autopilot Opportunity aligned for SRI 3 (%s)' % ra())
    # Life Cycle Opportunity (4–5) vs SRI 3: flagged in the summary at once; the warning appears when trying to proceed
    click(d, d.find_element(By.CSS_SELECTOR, '[data-fam=lc] .strat-main')); time.sleep(0.4)
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=lc_op] .strat-main'))
    check(ra() == 'Review required ⚠', 'risk alignment: review required (%s)' % ra())
    check(not d.find_element(By.ID, 'mismatch-card').is_displayed(), 'no inline warning until the adviser tries to proceed')
    check(js(d, "return document.querySelector('[data-fam=lc] .go').textContent").startswith('Opportunity selected'), 'parent card shows the chosen option')
    nxt(d)
    check(step(d) == 5, 'mismatch requires reason')
    mt = d.find_element(By.ID, 'mismatch-text').text
    check(d.find_element(By.ID, 'mismatch-card').is_displayed() and 'risk rating of 3 — Low to Medium' in mt and 'ratings 4–5' in mt, 'warning shown on Next: %r' % mt)
    check(js(d, 'return document.activeElement.id') == 'mismatch-reason', 'focus moves to the reason box')
    check(d.find_element(By.ID, 'mm-back').text.startswith('← Choose another strategy') and d.find_element(By.ID, 'mm-proceed').text.startswith('Proceed'), 'warning buttons')
    click(d, d.find_element(By.ID, 'mm-back'))
    check(js(d, 'return S.prsa.strat') is None and not d.find_element(By.ID, 'mismatch-card').is_displayed() and shown('[data-strat=lc_op]'), 'Go Back clears the selection, options stay open')
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=lc_op] .strat-main'))
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
    for t in ['chg', 'rem']:
        click(d, d.find_element(By.CSS_SELECTOR, '#res-tabs button[data-t="%s"]' % t))
    nxt(d)
    check(step(d) == 7, 'step 6 -> 7')
    sos = js(d, "return document.getElementById('ta-sos').value")
    check('The client has a long term' in sos, 'mismatch reason flows into SoS')
    check('Transfer of your existing pension' in sos, 'transfer section added when a transfer value is entered')
    check('Capacity for loss' in sos or 'capacity for loss' in sos, 'SoS prompts for capacity for loss')
    fill_sos_and_preview(d, 'prsa')
    check(not console_errors(d), 'PRSA main console errors')

def arf_flow(d):
    print('ARF flow')
    d.get(URL)
    check(js(d, "return document.getElementById('b-firm').value") == 'Test Financial Ltd', 'broker details persisted')
    click(d, d.find_element(By.ID, 'b-consent'))
    nxt(d)
    fill_client(d, 'arf', '1960-04-10')
    pick_sri(d, 4)
    setv(d, 'a-contrib', '300000')
    setv(d, 'a-itype', 'custom_amount'); setv(d, 'a-ival', '15000')
    nxt(d)
    check(step(d) == 5, 'ARF step 4 -> 5 (%s)' % msg(d))
    check(js(d, "return document.getElementById('pf-view-strat').hidden && !document.getElementById('pf-view-build').hidden && document.getElementById('pf-back').hidden"), 'ARF opens on the fund builder, no back link')
    setv(d, 'mismatch-reason', '')
    js(d, "var e=document.querySelector('[data-fund=ss50]'); e.value=60; e.dispatchEvent(new Event('input'));")
    nxt(d)
    check(step(d) == 5 and '100%' in msg(d), 'ARF allocations must total 100')
    js(d, "var e=document.querySelector('[data-fund=afie]'); e.value=40; e.dispatchEvent(new Event('input'));")
    js(d, "var e=document.querySelector('[data-gtee=ss50]'); e.click();")
    # 60% SRI 4 + 40% SRI 2 = 3.2 -> rounds to 3, lower than the client's 4
    check(js(d, "return document.querySelector('#pf-ra .ra').textContent") == 'Review required ⚠', 'lower-risk mismatch flagged in the summary')
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
    d.save_screenshot(str(OUT / 'arf_step6.png'))
    nxt(d)
    check(step(d) == 7, 'ARF step 6 -> 7')
    fill_sos_and_preview(d, 'arf')
    check(not console_errors(d), 'ARF main console errors')

def standard_prsa_funds(d):
    """Standard PRSA: Non-Standard-only funds are greyed out and can't be allocated."""
    print('Standard PRSA fund availability')
    d.get(URL)
    time.sleep(0.4)
    js(d, "S.client.first='A'; S.client.last='B'; S.client.dobStr='1980-03-15'; S.startStr='2026-10-01'; S.risk.sri=3; "
          "setProduct('prsa'); setPrsaType('standard'); showStep(5); openBuilder();")
    time.sleep(0.5)
    st = js(d, "var o={}; document.querySelectorAll('#diy-funds [data-row]').forEach(function(r){ o[r.getAttribute('data-row')] = [r.classList.contains('unavail'), r.querySelector('[data-fund]').disabled]; }); return o;")
    for fid in ['afie', 'dm15', 'dm50', 'dm75', 'bsri']:
        check(st.get(fid) == [True, True], 'Standard: %s greyed out and disabled (%s)' % (fid, st.get(fid)))
    for fid in ['cash', 'afisd', 'ss30', 'ss50', 'ss75', 'etfe', 'etfw', 'etfs']:
        check(st.get(fid) == [False, False], 'Standard: %s available (%s)' % (fid, st.get(fid)))
    check('Non-Standard PRSA only' in d.find_element(By.CSS_SELECTOR, '[data-row=dm75]').text, 'unavailable fund is labelled')
    check(js(d, "return document.querySelectorAll('#diy-funds [data-gtee]').length") == 0, 'no guarantee toggles on a Standard PRSA')
    js(d, "setPfView('strat', false)")
    click(d, d.find_element(By.CSS_SELECTOR, '[data-strat=dis] .info-btn'))
    time.sleep(0.25)
    check('Dynamic Lifecycle Strategy' in d.find_element(By.ID, 'qt-pop').text, 'Standard DIS popover copy')
    check(not console_errors(d), 'Standard PRSA console errors')

d = driver()
try:
    prsa_flow(d)
    arf_flow(d)
    standard_prsa_funds(d)
finally:
    d.quit()
print('\n%d failure(s)' % len(fails))
sys.exit(1 if fails else 0)
