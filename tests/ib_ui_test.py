"""End-to-end UI check for the Investment Bond product in quotation_tool.html (headless Edge).

Walks the wizard for an Investment Bond quotation: product/client/risk, an RP-enabled
version with both a single and regular contribution, mutual-exclusivity validation against
income, portfolio, results (including the single growth-rate override), and the report/pack
generation. Fails on any JS console error, unfilled {token}, 'undefined' or 'NaN' in the pack.

Run:  python "Quotation Tool/tests/ib_ui_test.py"
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
    for k, v in dict(firm='Test Financial Ltd', name='Pat Adviser', email='pat@test.ie', phone='01 555 0000',
                     address='1 Main Street\nDublin 2', reg='Test Financial Ltd is regulated by the Central Bank of Ireland.').items():
        setv(d, 'b-' + k, v)
    click(d, d.find_element(By.ID, 'b-consent'))
    nxt(d)
    check(step(d) == 2, 'step 1 -> 2')

def fill_sos_and_preview(d, tag):
    n_chips = len(d.find_elements(By.CSS_SELECTOR, '#sos-chips .chip:not(.ok)'))
    check(n_chips >= 3, 'SoS prompt chips shown (%d)' % n_chips)
    sos = js(d, "return document.getElementById('ta-sos').value")
    check('Your sustainability preferences' in sos, 'IB SoS has sustainability preferences section')
    cover = js(d, "return document.getElementById('ta-cover').value")
    check('retirement' not in cover.lower(), 'IB cover letter does not mention retirement')
    check('[[' not in cover, 'cover letter has no prompts')
    js(d, "var t=document.getElementById('ta-sos'); t.value=t.value.replace(/\\[\\[[^\\]]*\\]\\]/g,'The client confirmed this in our meeting.'); t.dispatchEvent(new Event('input'));")
    check(d.find_element(By.ID, 'btn-generate').get_attribute('disabled') is None, 'generate enabled after prompts filled')
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
    check(pages and pages >= 6, '%s pack paginated (%s pages)' % (tag, pages))
    txt = d.find_element(By.ID, 'pages').text
    toks = re.findall(r'\{[a-zA-Z]+\}', txt)
    check(not toks, '%s unfilled tokens: %s' % (tag, toks[:5]))
    check('undefined' not in txt and 'NaN' not in txt, '%s pack contains undefined/NaN' % tag)
    check('[[' not in txt, '%s pack contains [[prompt]]' % tag)
    check(not re.search(r'contribution\s*€0\b', txt), '%s pack shows a €0 contribution' % tag)
    summ = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){return p.textContent.indexOf('Your personalised quotation')>=0})[0]; return p ? p.textContent : ''")
    check('Key warnings' in summ and 'In this pack' in summ and 'not guaranteed' in summ, '%s summary fits on one page with contents, warnings and disclaimer' % tag)
    for i, pg in enumerate(d.find_elements(By.CSS_SELECTOR, '#pages .page')[:6]):
        d.execute_script("arguments[0].scrollIntoView()", pg)
        pg.screenshot(str(OUT / ('%s_page%02d.png' % (tag, i + 1))))
    dec = re.findall(r'(?:SRI|Risk|risk)\s*:?\s*\d\.\d', txt)
    check(not dec, '%s pack shows a decimal risk figure outside the footnote: %s' % (tag, dec[:3]))
    over = js(d, "return [].slice.call(document.querySelectorAll('.pbody')).filter(function(b){return b.scrollHeight > b.clientHeight + 1;}).length")
    check(over == 0, '%s pages with overflowing content: %s' % (tag, over))
    po = PrintOptions(); po.background = True; po.margin_top = po.margin_bottom = po.margin_left = po.margin_right = 0
    po.page_width = 21.0; po.page_height = 29.7
    pdf = base64.b64decode(d.print_page(po))
    (OUT / ('%s_pack.pdf' % tag)).write_bytes(pdf)
    errs = console_errors(d)
    check(not errs, '%s pack console errors: %s' % (tag, errs))
    print('  %s pack: %d pages, saved %s' % (tag, pages, OUT / ('%s_pack.pdf' % tag)))
    d.close(); d.switch_to.window(main)

def ib_flow(d):
    print('Investment Bond flow')
    d.get(URL); js(d, "localStorage.clear()"); d.get(URL)
    fill_broker(d)
    setv(d, 'c-product', 'ib')
    nxt(d)
    check(step(d) == 2, 'step 2 should block with empty client')
    setv(d, 'c-first', 'Jordan'); setv(d, 'c-last', 'Byrne'); setv(d, 'c-dob', '1980-01-01')
    setv(d, 'q-start', '2026-10-01')
    nxt(d)
    check(step(d) == 3, 'step 2 -> 3 (%s)' % msg(d))
    click(d, d.find_elements(By.CSS_SELECTOR, '.sri-card')[2])
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4')

    nxt(d)
    check(step(d) == 4, 'step 4 should block with no contributions')
    # Regular contribution options are disabled on a version without RP
    rpdis = lambda: js(d, "return [].filter.call(document.getElementById('i-ctype').options, function(o){ return o.disabled && o.value; }).map(function(o){ return o.value; })")
    check(js(d, 'return ibCodeAllowsRp(S.ib.code)') or rpdis() == ['rp', 'sp_rp'], 'RP options disabled on a non-RP version: %s' % rpdis())
    # Income set first, then an RP type: income is switched off and locked
    setv(d, 'i-ctype', 'sp'); setv(d, 'i-sp', '50000')
    setv(d, 'i-itype', 'custom_pct'); setv(d, 'i-ival', '5')
    setv(d, 'i-series', 'K'); setv(d, 'i-level', 'K1')
    check(rpdis() == [], 'RP options enabled on K1')
    setv(d, 'i-ctype', 'sp_rp')
    check(js(d, 'return S.ib.incomeType') == 'none' and js(d, "return document.getElementById('i-itype').disabled") and d.find_element(By.ID, 'i-income-note').is_displayed(), 'RP type turns income off and locks it')
    check(js(d, 'return S.ib.contribution') == 50000, 'single contribution kept when adding regular')
    setv(d, 'i-rp', '500')
    check(js(d, "return document.getElementById('i-rp-warn').textContent").strip() == '', 'no RP warning when income is off')
    click(d, d.find_elements(By.CSS_SELECTOR, '#i-ptype-seg button')[0])
    check(js(d, 'return S.ib.policyholderType') == 'individual', 'policyholder type seg wired up')
    # commission override stepper next to the code picker
    stepper_before = js(d, "return S.ib.spUpOverride")
    click(d, d.find_element(By.CSS_SELECTOR, '#i-commwrap > button'))
    click(d, d.find_elements(By.CSS_SELECTOR, '#i-commwrap .stepper button')[0])
    check(js(d, 'return S.ib.spUpOverride') != stepper_before, 'SP initial commission stepper overrides')
    # regular contributions only, so the summary must not list "Single contribution €0"
    setv(d, 'i-ctype', 'rp')
    check(js(d, 'return S.ib.contribution') == 0 and js(d, 'return S.ib.rp') == 500, 'switching to regular only clears the single contribution')
    nxt(d)
    check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))

    click(d, d.find_element(By.CSS_SELECTOR, '#pick-funds [data-sel=ss50]'))
    click(d, d.find_element(By.CSS_SELECTOR, '#pick-funds [data-sel=cash]'))
    nxt(d); time.sleep(0.5)
    js(d, "var e=document.querySelector('[data-fund=ss50]'); e.value=60; e.dispatchEvent(new Event('input'));")
    nxt(d)
    check(step(d) == 5 and '100%' in msg(d), 'IB allocations must total 100 (%s)' % msg(d))
    js(d, "var e=document.querySelector('[data-fund=cash]'); e.value=40; e.dispatchEvent(new Event('input'));")
    nxt(d)
    check(step(d) == 6, 'step 5 -> 6 (%s)' % msg(d))

    d.save_screenshot(str(OUT / 'ib_step6.png'))
    setv(d, 'i-rate', '4.5')
    check(abs(js(d, 'return S.ib.rateOverride') - 0.045) < 1e-9, 'IB growth rate editable')
    for t in ['chg', 'rem']:
        click(d, d.find_element(By.CSS_SELECTOR, '#res-tabs button[data-t="%s"]' % t))
        time.sleep(0.1)
        check(not console_errors(d), 'IB results tab %s console errors' % t)
    nxt(d)
    check(step(d) == 7, 'step 6 -> 7')
    fill_sos_and_preview(d, 'ib')
    check(not console_errors(d), 'IB main console errors')

d = driver()
try:
    ib_flow(d)
finally:
    d.quit()
print('\n%d failure(s)' % len(fails))
sys.exit(1 if fails else 0)
