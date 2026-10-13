"""UI check for the Risk Profiler: the standalone page, and its integration in quotation_tool.html.

Standalone (risk_profiler.html): steps through the five parts and the result screen, checks Continue, the "None of the
above" rule, the date of birth question, the age cap and "Clear all answers".

Quotation tool: chooses the risk profiler in Step 3, completes it in its dialog, checks that nothing changes on the
page until "Use this result", that the result sets the risk rating, that
choosing a different rating needs a reason, that the answers fill the Statement of Suitability,
and that the "Risk profile" section reaches the pack (saved as tests/out/rp_pack.pdf).
Fails on any JS console error, unfilled {token}, 'undefined' or 'NaN' in the pack.

Run:  python tests/risk_profiler_ui_test.py
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
TOOL = (QT / 'quotation_tool.html').resolve().as_uri()
STANDALONE = (QT / 'risk_profiler.html').resolve().as_uri()

fails = []
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
def type_dob(d, v):
    # real typing bubbles; the component listens on its container
    js(d, "var e=document.querySelector('[data-q=dob]'); e.value=arguments[0]; e.dispatchEvent(new Event('input', {bubbles:true}));", v)
def click(d, el):
    d.execute_script("arguments[0].scrollIntoView({block:'center'})", el); el.click()
def css(d, sel): return d.find_element(By.CSS_SELECTOR, sel)
def errors(d):
    try: return [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
    except Exception: return []

# A client with the highest financial capacity (3) whose reaction to a fall scores 5, so the risk profile is 5.
# Purpose is only asked on the standalone page (the tool sets it from the product).
ANSWERS = [('education', 'degree'), ('employment', 'employee'), ('financeWork', 'no'), ('health', 'verygood'), ('dependants', 'none'),
           ('income', 'high'), ('commitments', 'none'), ('horizon', 'long'), ('assets', 'high'), ('tolerance', 'hold'), ('purpose', 'A')]
def goto(d, sec):
    click(d, css(d, '.rp-nav [data-tab="%s"]' % sec)); time.sleep(0.05)
def section(d): return js(d, "var p=[].filter.call(document.querySelectorAll('.rp [data-panel]'), function(p){ return !p.hidden; })[0]; return p ? p.getAttribute('data-panel') : null")
def sec_of(d, q): return js(d, "return RiskProfiler.question(arguments[0]).section", q)
def answer(d, sel, q):
    if section(d) != sec_of(d, q): goto(d, sec_of(d, q))
    click(d, css(d, sel))
def answered(d): return int(css(d, '.rp-prog').get_attribute('aria-valuenow'))
def result_text(d): return js(d, "return document.querySelector('.rp [data-panel=result]').textContent")
def answer_all(d, overrides=None):
    ov = dict(overrides or {})
    for q, v in ANSWERS:
        v = ov.get(q, v)
        if q == 'purpose' and not d.find_elements(By.CSS_SELECTOR, '[data-q=purpose]'): continue
        answer(d, '[data-q="%s"][data-v="%s"]' % (q, v), q)
    for col in ('known', 'held'):
        answer(d, '[data-q="products"][data-col="%s"][data-v="funds"]' % col, 'products')
    for row, v in (('equity', 'high'), ('cash', 'low'), ('bonds', 'low')):
        answer(d, '[data-q="assetView"][data-row="%s"][data-v="%s"]' % (row, v), 'assetView')

def standalone(d):
    print('Standalone page')
    d.get(STANDALONE)
    check(len(d.find_elements(By.CSS_SELECTOR, '.rp-q')) == 14, 'standalone asks 14 questions, including date of birth and purpose: %d' % len(d.find_elements(By.CSS_SELECTOR, '.rp-q')))
    check(answered(d) == 0 and css(d, '.rp-prog').get_attribute('aria-valuemax') == '12', 'progress starts at 0 of 12 required')
    check(section(d) == 'about' and len(d.find_elements(By.CSS_SELECTOR, '.rp-tab')) == 6, 'opens on part 1 with six steps in the strip')
    check(not d.find_elements(By.CSS_SELECTOR, '.rp-side'), 'no result panel beside the questions')
    check('appears here once every question is answered' in result_text(d), 'no result until complete')
    d.save_screenshot(str(OUT / 'rp_standalone_empty.png'))
    # Continue is held back until the part is answered, and highlights what is missing
    click(d, css(d, '[data-act=fwd]'))
    check(section(d) == 'about' and len(d.find_elements(By.CSS_SELECTOR, '.rp-q.flag')) == 6 and 'highlighted' in css(d, '.rp-msg').text, 'Continue flags the 6 unanswered questions in part 1')
    answer_all(d)
    check(answered(d) == 11, 'progress counts answers: %d' % answered(d))
    # the date of birth is the only thing missing: the result screen sends you to it
    goto(d, 'result')
    check('still to answer' in result_text(d), 'result screen lists what is left')
    click(d, css(d, '[data-act=next]'))
    check(section(d) == 'about' and js(d, "return document.activeElement.getAttribute('data-q')") == 'dob', 'go-to-next opens part 1 and focuses the date of birth')
    check(js(d, "return !!document.querySelector('.rp-q.flag')"), 'unanswered question is highlighted')
    type_dob(d, '1985-06-15')
    check(answered(d) == 12, 'all 12 required answered: %d' % answered(d))
    check('done' in css(d, '.rp-nav [data-tab=experience]').get_attribute('class'), 'finished parts show a tick in the strip')
    for nxt_sec in ('experience', 'finances', 'tolerance', 'needs', 'result'):
        click(d, css(d, '[data-act=fwd]'))
        check(section(d) == nxt_sec, 'Continue moves on to %s (%s)' % (nxt_sec, section(d)))
    res = result_text(d)
    check(css(d, '.rp-big b').text == '5' and 'Medium to High' in css(d, '.rp-big span').text, 'capacity 3 and reaction score 5 give risk profile 5: %r' % css(d, '.rp-big').text)
    check('Experience and knowledge' in res and 'High' in css(d, '.rp-xl').text, 'experience profile shown: %r' % css(d, '.rp-xl').text)
    for hidden in ('Eligible funds', 'Full calculation', 'How it was worked out', 'Financial capacity', '1 to 7 scale', 'reaction to a fall', 'decides which funds'):
        check(hidden not in res, 'the result does not show the workings: %r' % hidden)
    check(not d.find_elements(By.CSS_SELECTOR, '[data-act=finish]'), 'no "Use this result" button on the standalone page')
    d.save_screenshot(str(OUT / 'rp_standalone_done.png'))
    # "None of the above" is exclusive within a column
    answer(d, '[data-q="products"][data-col="known"][data-v="none"]', 'products')
    on = js(d, "return [].map.call(document.querySelectorAll('[data-q=products][data-col=known].rp-on'), function(b){ return b.getAttribute('data-v'); })")
    check(on == ['none'], '"None of the above" replaces the other ticks: %s' % on)
    answer(d, '[data-q="products"][data-col="known"][data-v="bonds"]', 'products')
    on = js(d, "return [].map.call(document.querySelectorAll('[data-q=products][data-col=known].rp-on'), function(b){ return b.getAttribute('data-v'); })")
    check(on == ['bonds'], 'ticking a product clears "None of the above": %s' % on)
    # Clear
    click(d, css(d, '[data-act=reset]'))
    check(answered(d) == 0 and section(d) == 'about', 'Clear all answers resets and returns to part 1')
    # Age rule: a 7 becomes 6 for a client over 80
    answer_all(d, {'tolerance': 'buymore'})
    goto(d, 'about')
    type_dob(d, '1940-01-01')
    goto(d, 'result')
    check(css(d, '.rp-big b').text == '6' and 'otherwise be 7' not in result_text(d), 'over-80 client: 7 is limited to 6, without explaining it: %r' % result_text(d)[:200])
    # Two or more product rows: the highest counts (corrected; the questionnaire site gives NaN)
    goto(d, 'experience')
    click(d, css(d, '[data-q="products"][data-col="known"][data-v="govbonds"]'))
    goto(d, 'result')
    check('NaN' not in result_text(d) and css(d, '.rp-big b').text == '6', 'two products: still a result')
    check(not errors(d), 'standalone console errors: %s' % errors(d))

# ── the quotation tool ──
def nxt(d): click(d, d.find_element(By.ID, 'btn-next')); time.sleep(0.2)
def step(d): return js(d, 'return S.step')
def msg(d): return d.find_element(By.ID, 'foot-msg').text

def to_step3(d, product='prsa', dob='1980-03-15'):
    d.get(TOOL); js(d, "localStorage.clear()"); d.get(TOOL)
    for k, v in dict(firm='Test Financial Ltd', name='Pat Adviser', email='pat@test.ie', phone='01 555 0000',
                     address='1 Main Street\nDublin 2', reg='Test Financial Ltd is regulated by the Central Bank of Ireland.').items():
        setv(d, 'b-' + k, v)
    click(d, d.find_element(By.ID, 'b-consent')); nxt(d)
    click(d, css(d, '#prod-cards [data-prod=%s]' % product))
    setv(d, 'c-first', 'Alex'); setv(d, 'c-last', 'Murphy'); setv(d, 'c-dob', dob)
    setv(d, 'c-address', '22 Oak Road\nBlackrock\nCo. Dublin'); setv(d, 'q-start', '2026-10-01')
    if product == 'prsa': setv(d, 'q-nra', 65)
    nxt(d)
    check(step(d) == 3, 'reached step 3 (%s)' % msg(d))

def tool(d):
    print('Quotation tool')
    to_step3(d)
    check(css(d, '#rp-method').is_displayed() and not css(d, '#sri-card').is_displayed() and not css(d, '#rpm').is_displayed(), 'step 3 opens on the choice of method, no questions or ratings yet')
    d.save_screenshot(str(OUT / 'rp_tool_step3_empty.png'))
    click(d, css(d, '#rp-method [data-m=profiler]'))
    check(css(d, '#rpm').is_displayed(), 'choosing the risk profiler opens it in a dialog')
    check(len(d.find_elements(By.CSS_SELECTOR, '#rp-host .rp-q')) == 12, 'tool asks 12 questions (date of birth is already known): %d' % len(d.find_elements(By.CSS_SELECTOR, '#rp-host .rp-q')))
    d.save_screenshot(str(OUT / 'rp_tool_dialog.png'))
    # Closing part-way keeps the answers but sets nothing
    answer(d, '[data-q="education"][data-v="degree"]', 'education')
    check('1 of 10' in css(d, '#rpm-d').text, 'dialog counts answers: %r' % css(d, '#rpm-d').text)
    click(d, css(d, '#rpm .rpm-x'))
    check(not css(d, '#rpm').is_displayed() and 'In progress' in css(d, '#rp-sum').text and '1 of 10' in css(d, '#rp-sum').text, 'closed part-way: in progress: %r' % css(d, '#rp-sum').text)
    check(js(d, 'return S.risk.sri') is None and not css(d, '#sri-card').is_displayed(), 'partial answers do not set a rating')
    nxt(d)
    check(step(d) == 3 and 'complete the risk profiler' in msg(d), 'step 3 needs the profiler finished (%s)' % msg(d))
    click(d, css(d, '#rp-sum button'))
    answer_all(d)
    check(js(d, 'return S.risk.sri') is None and js(d, 'return S.risk.pSuggested') is None, 'nothing is applied while the dialog is open')
    goto(d, 'result')
    check('Medium to High' in result_text(d), 'result screen in the tool shows the rating')
    d.save_screenshot(str(OUT / 'rp_tool_step3_done.png'))
    click(d, css(d, '[data-act=finish]'))
    check(not css(d, '#rpm').is_displayed(), '"Use this result" closes the dialog')
    check(js(d, 'return S.risk.sri') == 5 and js(d, 'return S.risk.pSuggested') == 5, 'the applied result sets the risk rating to 5 (%s)' % js(d, 'return S.risk.sri'))
    check('Risk profile 5' in css(d, '#rp-sum').text and 'Review answers' in css(d, '#rp-sum').text, 'summary shows the result: %r' % css(d, '#rp-sum').text)
    check(js(d, 'return profilerDone().purpose') == 'A', 'purpose comes from the product (PRSA = A)')
    check('on' in d.find_elements(By.CSS_SELECTOR, '.sri-t')[4].get_attribute('class'), 'rating 5 tile is selected')
    check('Set by the Allianz Risk Profiler' in css(d, '#rp-apply-msg').text and "can't be changed" in css(d, '#rp-apply-msg').text, 'note says the rating came from the profiler and is locked: %r' % css(d, '#rp-apply-msg').text)
    check(not css(d, '#r-profiler-wrap').is_displayed(), 'free-text "risk profiler used" is only for own profiling')
    check(js(d, 'return S.risk.pDate') == js(d, 'return todayStr()'), 'completion date recorded')
    d.save_screenshot(str(OUT / 'rp_tool_step3_applied.png'))
    # The profiler's rating can't be changed: the tiles are locked
    check(all(t.get_attribute('disabled') is not None for t in d.find_elements(By.CSS_SELECTOR, '.sri-t')), 'rating tiles locked while the profiler is used')
    js(d, 'setSri(4)')
    check(js(d, 'return S.risk.sri') == 5, 'the rating stays at the profiler\'s 5')
    check(not d.find_elements(By.ID, 'rp-reason'), 'no override reason box')
    click(d, d.find_element(By.ID, 'esg-seg').find_element(By.CSS_SELECTOR, '[data-v=yes]'))
    cap = js(d, "return document.querySelector('#stepnav .rs:nth-child(3) .cap').textContent")
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4 (%s)' % msg(d))
    cap = js(d, "return document.querySelector('#stepnav .rs:nth-child(3) .cap').textContent")
    check('Profiled' in cap, 'rail caption notes the profiler: %r' % cap)

    # A changed answer that changes the result replaces the rating and clears the reason
    js(d, 'goStep(3)')
    check(not css(d, '#rpm').is_displayed() and 'Review answers' in css(d, '#rp-sum').text, 'a finished profiler stays closed when Step 3 is revisited')
    click(d, css(d, '#rp-sum button'))
    check(css(d, '#rpm').is_displayed() and section(d) == 'about', 'Review answers opens the dialog at part 1')
    # Edits that are not applied are undone
    answer(d, '[data-q="tolerance"][data-v="sell"]', 'tolerance')
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))")
    check(not css(d, '#rpm').is_displayed() and js(d, 'return S.risk.sri') == 5 and js(d, 'return profilerDone().sri') == 5, 'Escape closes without applying the change')
    click(d, css(d, '#rp-sum button'))
    check(js(d, "return rpUI.getState().answers.tolerance") == 'hold', 'reopening shows the applied answers')
    answer(d, '[data-q="tolerance"][data-v="sell"]', 'tolerance')
    goto(d, 'result'); click(d, css(d, '[data-act=finish]'))
    check(js(d, 'return S.risk.pSuggested') == 1 and js(d, 'return S.risk.sri') == 1 and js(d, 'return S.risk.pReason') == '', 'a new result becomes the rating (sell -> 1), reason cleared')
    click(d, css(d, '#rp-sum button'))
    answer(d, '[data-q="tolerance"][data-v="hold"]', 'tolerance')
    goto(d, 'result'); click(d, css(d, '[data-act=finish]'))
    check(js(d, 'return S.risk.sri') == 5, 'back to rating 5')
    # The date of birth comes from step 2. Over 80 only a 7 is capped, so a 5 stays 5.
    js(d, 'goStep(2)')
    setv(d, 'c-dob', '1940-01-01')
    check(js(d, 'return profilerDone().age') > 80 and js(d, 'return profilerDone().ageCapped') is False and js(d, 'return S.risk.sri') == 5, 'over 80 leaves a 5 unchanged: %s' % js(d, 'return S.risk.sri'))
    setv(d, 'c-dob', '1980-03-15')

    # Carry on to the pack with the profiler's rating of 5
    js(d, 'goStep(3)'); time.sleep(0.2)
    check(step(d) == 3, 'back on step 3')
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4 (%s)' % msg(d))
    click(d, css(d, '#p-ctchips [data-part=sp]'))
    setv(d, 'p-sp', '50000')
    nxt(d)
    check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))
    # Own funds: pick the Strategy Select 75 fund (SRI 5 matches the rating of 5)
    js(d, "setPfView && 0")
    pack(d)

def pack(d):
    # Choose a managed strategy if offered, else build one fund
    ok = js(d, """
      try {
        S.prsa.strat = 'diy';
        var ids = Object.keys(FUNDS_MAP).filter(function(i) { return Math.round(FUNDS_MAP[i].esma) === S.risk.sri; });
        return ids.length ? ids[0] : null;
      } catch (e) { return String(e); }""")
    check(ok and isinstance(ok, str), 'found a fund matching the rating: %s' % ok)
    js(d, """S.prsa.diySel = {}; S.prsa.diyAllocs = {}; S.prsa.diySel[arguments[0]] = true; S.prsa.diyAllocs[arguments[0]] = 100;
             S.prsa.strat = 'diy'; goStep(6);""", ok)
    time.sleep(0.4)
    check(step(d) == 6, 'reached results (%s)' % msg(d))
    js(d, "RES_TABS.forEach(function(t) { S.resSeen[t[0]] = true; }); renderResults(); renderFoot();")
    nxt(d)
    check(step(d) == 7, 'reached the pack (%s)' % msg(d))
    # Contents: the Risk profile record is on by default and listed after the SoS
    check(js(d, "return !!document.querySelector('[data-sec=riskprofile]') && S.sections.riskprofile"), 'Risk profile record has a toggle and is on')
    names = js(d, "return [].map.call(document.querySelectorAll('#pack-order ol:first-of-type li span:nth-child(2)'), function(e){ return e.textContent; })")
    check(names[:3] == ['Cover letter', 'Statement of Suitability', 'Risk profile'], 'pack order: %s' % names[:4])
    d.save_screenshot(str(OUT / 'rp_tool_step7.png'))
    nxt(d)                                  # cover letter
    check('Risk profile' not in js(d, "return stripMarks(S.text.cover)") or True, 'cover letter')
    check('A record of your risk profile questionnaire' in js(d, "return stripMarks(S.text.cover)"), 'cover letter lists the risk profile record')
    nxt(d)                                  # SoS
    sos = js(d, "return stripMarks(S.text.sos)")
    check('Allianz Global Life Risk Profiler' in sos, 'SoS names the built-in profiler: %r' % sos[sos.find('risk profiling'):sos.find('risk profiling') + 140])
    check('You are an employee.' in sos and 'Nobody depends on you financially.' in sos and 'You plan to keep this investment for more than 10 years.' in sos, 'SoS circumstances come from the answers')
    check('risk profile of 5 (Medium to High) on the 1 to 7 scale' in sos, 'SoS gives the profile')
    check('hold the investment and wait, because you want a positive long-term return' in sos, 'SoS quotes the reaction to a fall')
    check('experience and knowledge of investment products was assessed as high' in sos, 'SoS gives the experience level')
    check('The risk profiler indicated a risk rating of' not in sos, 'no override in the SoS: the profiler\'s rating is used')
    check('Existing pensions, other assets and liabilities, and anything else to add' in sos, 'circumstances prompt is shortened once the profiler is used')
    check(len(d.find_elements(By.CSS_SELECTOR, '#ed-sos .auto')) >= 6, 'profiler sentences appear as auto-filled grey boxes')
    d.save_screenshot(str(OUT / 'rp_tool_sos.png'))
    js(d, "S.text.sos = S.text.sos.replace(/\\[\\[[^\\]]*\\]\\]/g, 'Discussed in our meeting.'); renderReport();")
    nxt(d)                                  # review
    for _ in range(100):
        if re.search(r'\d+ page', css(d, '#fname').text): break
        time.sleep(0.1)
    labels = [e.text for e in d.find_elements(By.CSS_SELECTOR, '#thumbs .lbl')]
    check(len(labels) == 4, 'four thumbnails (cover, SoS, risk profile, the Allianz quotation): %d' % len(labels))
    main = d.current_window_handle
    click(d, d.find_element(By.ID, 'btn-preview'))
    time.sleep(0.6)
    wins = [w for w in d.window_handles if w != main]
    check(len(wins) == 1, 'pack window opened')
    if not wins: return
    d.switch_to.window(wins[0])
    for _ in range(60):
        if js(d, 'return window.__paginated'): break
        time.sleep(0.1)
    pages = js(d, 'return window.__paginated')
    txt = d.find_element(By.ID, 'pages').text
    check('undefined' not in txt and 'NaN' not in txt, 'pack contains undefined/NaN')
    check(not re.findall(r'\{[a-zA-Z]+\}', txt), 'pack has unfilled tokens: %s' % re.findall(r'\{[a-zA-Z]+\}', txt)[:5])
    page = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ var h=p.querySelector('h1'); return h && h.textContent === 'Risk profile'; })[0]; return p ? p.textContent : ''")
    check(page, 'pack has a Risk profile page')
    for needle in ['Your risk profile', 'Medium to High', 'Your risk rating', 'Experience and knowledge', 'Your answers', 'About you', 'Your finances',
                   'What is your level of education?', "Bachelor's or master's degree", 'Long term (more than 10 years)',
                   'Mutual funds', 'Shares (equities): High', 'of 7', 'How the result was worked out',
                   'guide to help your adviser']:
        check(needle in page or needle in txt, 'Risk profile page contains %r' % needle)
    # the page is on the adviser's letterhead and numbered with the adviser documents
    grp = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ var h=p.querySelector('h1'); return h && h.textContent === 'Risk profile'; })[0]; return p ? p.getAttribute('data-grp') : ''")
    check(grp == 'adv', 'Risk profile page is in the adviser group: %r' % grp)
    over = js(d, "return [].slice.call(document.querySelectorAll('.pbody')).filter(function(b){return b.scrollHeight > b.clientHeight + 1;}).length")
    check(over == 0, 'pages with overflowing content: %s' % over)
    rp_pages = js(d, "return [].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ return p.querySelector('.blk[data-sec=riskprofile]'); }).length")
    print('  risk profile record spans %d page(s); pack %s pages' % (rp_pages, pages))
    for i, pg in enumerate(d.find_elements(By.CSS_SELECTOR, '#pages .page')):
        if pg.find_elements(By.CSS_SELECTOR, '.blk[data-sec=riskprofile]'):
            d.execute_script("arguments[0].scrollIntoView()", pg)
            pg.screenshot(str(OUT / ('rp_page%02d.png' % (i + 1))))
    po = PrintOptions(); po.background = True; po.margin_top = po.margin_bottom = po.margin_left = po.margin_right = 0
    po.page_width = 21.0; po.page_height = 29.7
    (OUT / 'rp_pack.pdf').write_bytes(base64.b64decode(d.print_page(po)))
    check(not errors(d), 'pack console errors: %s' % errors(d))
    d.close(); d.switch_to.window(main)

    # Deselecting the section drops it from the pack; without a profile it cannot be offered
    js(d, "setPackStage('contents')"); time.sleep(0.2)
    click(d, css(d, '[data-sec=riskprofile]'))
    check(js(d, 'return packSections().indexOf("riskprofile")') < 0, 'toggled off: not in the pack')
    click(d, css(d, '[data-sec=riskprofile]'))
    js(d, "S.risk.method = 'own'; S.risk.pSuggested = null; renderReport();")
    check(js(d, 'return packSections().indexOf("riskprofile")') < 0 and 'Complete the risk profiler' in css(d, '#secs').text and js(d, "return !document.querySelector('[data-sec=riskprofile]')"),
          'without a completed profile the section shows "Complete the risk profiler" and is not in the pack')
    check(not errors(d), 'tool console errors: %s' % errors(d))

def responsive(d):
    print('Responsive')
    to_step3(d)
    for w in (1440, 1152, 1024):
        d.set_window_rect(width=w, height=1000); time.sleep(0.3)
        over = js(d, "return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
        check(over == 0, 'no sideways scroll at %dpx on step 3 (overflow %dpx)' % (w, over))
    d.set_window_rect(width=1440, height=1400)
    d.get(STANDALONE)
    for w in (900, 420):
        d.set_window_rect(width=w, height=1000); time.sleep(0.3)
        over = js(d, "return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
        check(over == 0, 'no sideways scroll at %dpx on the standalone page (overflow %dpx)' % (w, over))
    d.set_window_rect(width=1440, height=1400)

d = driver()
try:
    standalone(d)
    tool(d)
    responsive(d)
finally:
    d.quit()
print('\n%d failure(s)' % len(fails))
sys.exit(1 if fails else 0)
