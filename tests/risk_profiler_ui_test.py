"""UI check for the Risk Profiler: the standalone page, and its integration in quotation_tool.html.

Standalone (risk_profiler.html): steps through the six parts and the result screen, checks Continue, the
introduction, the Q4 slider (no starting value), the Q8 ranking (arrows, drag, "I don't know"), the conditional
sustainability questions, the limits and flags on the result, the changed-answers flag and "Clear all answers".

Quotation tool: chooses the risk profiler in Step 3, completes it in its dialog, checks that nothing changes on the
page until "Use this result", that the result sets the risk rating and the sustainability preference, that the
adviser can only lower the rating and must give a reason, that the answers fill the Statement of Suitability,
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
def slide(d, v):
    js(d, "var e=document.querySelector('.rp-range'); e.value=arguments[0]; e.dispatchEvent(new Event('input', {bubbles:true}));", v)
def click(d, el):
    d.execute_script("arguments[0].scrollIntoView({block:'center'})", el); el.click()
def css(d, sel): return d.find_element(By.CSS_SELECTOR, sel)
def dlg_open(d): return d.find_element(By.ID, 'rpm').get_attribute('hidden') is None   # not is_displayed(): it fades in
def tx(d, sel): return js(d, "var e=document.querySelector(arguments[0]); return e ? e.textContent : ''", sel)   # also while a panel fades in
def errors(d):
    try: return [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
    except Exception: return []

# Capacity High (3 + 3), no time limit, ratings 5 (loss 25%), 6 and 5: attitude 5, so the risk rating is 5.
# Knowledge stated High and the check right. Sustainability: C ticked, so S4 is asked.
ANSWERS = [('cushion', '12plus'), ('impact', 'little'), ('horizon', '5plus'), ('loss', 25), ('reaction', 'investmore'), ('objective', 'strong'),
           ('experience', 'regular'), ('check', 'right'), ('s1', 'yes'), ('s2', ['pai']), ('s4', ['ghg'])]
RIGHT = ['deposit', 'govbonds', 'fund', 'share']
def goto(d, sec):
    if section(d) == 'intro': click(d, css(d, '[data-act=fwd]'))   # the introduction has no step strip
    click(d, css(d, '.rp-nav [data-tab="%s"]' % sec)); time.sleep(0.05)
def section(d): return js(d, "var p=[].filter.call(document.querySelectorAll('.rp [data-panel]'), function(p){ return !p.hidden; })[0]; return p ? p.getAttribute('data-panel') : null")
def sec_of(d, q): return js(d, "return RiskProfiler.question(arguments[0]).section", q)
def to_sec(d, q):
    if section(d) != sec_of(d, q): goto(d, sec_of(d, q))
def answer(d, sel, q):
    to_sec(d, q); click(d, css(d, sel))
def rank_order(d): return js(d, "return [].map.call(document.querySelectorAll('[data-panel]:not([hidden]) .rp-ri'), function(li){ return li.getAttribute('data-ri'); })")
def rank_right(d):
    # move each item up into its place with the arrows, as a keyboard user would
    to_sec(d, 'check')
    for i, it in enumerate(RIGHT):
        while rank_order(d).index(it) > i:
            click(d, css(d, '[data-q=check][data-mv="-1"][data-v="%s"]' % it))
def answered(d): return int(css(d, '.rp-prog').get_attribute('aria-valuenow'))
def result_text(d): return js(d, "return document.querySelector('.rp [data-panel=result]').textContent")
def flags(d): return js(d, "return [].map.call(document.querySelectorAll('.rp [data-flag]'), function(e){ return e.getAttribute('data-flag'); })")
def answer_all(d, overrides=None):
    ov = dict(overrides or {})
    for q, v in ANSWERS:
        v = ov.get(q, v)
        if q == 'loss': to_sec(d, q); slide(d, v)
        elif q == 'check':
            if v == 'right': rank_right(d)
            else: answer(d, '[data-q=check][data-dk]', q)
        elif isinstance(v, list):
            for x in v: answer(d, '[data-q="%s"][data-v="%s"]' % (q, x), q)
        else: answer(d, '[data-q="%s"][data-v="%s"]' % (q, v), q)

def standalone(d):
    print('Standalone page')
    d.get(STANDALONE)
    n = len(d.find_elements(By.CSS_SELECTOR, '.rp-q'))
    check(n == 10, 'standalone asks 10 questions to start with (Q1-Q8, date of birth, S1): %d' % n)
    check(answered(d) == 0 and css(d, '.rp-prog').get_attribute('aria-valuemax') == '10', 'progress starts at 0 of 10')
    check(section(d) == 'intro' and 'about 5 minutes' in css(d, '[data-panel=intro]').text.lower() and not css(d, '.rp-nav').is_displayed(), 'opens on a full-screen introduction before Q1, with no step strip')
    click(d, css(d, '[data-act=fwd]'))
    check(section(d) == 'finances' and len(d.find_elements(By.CSS_SELECTOR, '.rp-tab')) == 7, 'Start opens part 1 with seven steps in the strip')
    check('appears here once every question is answered' in result_text(d), 'no result until complete')
    d.save_screenshot(str(OUT / 'rp_standalone_empty.png'))
    # Continue is held back until the part is answered, and highlights what is missing
    click(d, css(d, '[data-act=fwd]'))
    check(section(d) == 'finances' and len(d.find_elements(By.CSS_SELECTOR, '.rp-q.flag')) == 2 and 'highlighted' in css(d, '.rp-msg').text, 'Continue flags the 2 unanswered questions in part 1')

    # Q4: the slider starts with no value; moving it shows the amount
    goto(d, 'attitude')
    check('unset' in css(d, '.rp-sld').get_attribute('class') and 'Not answered' in css(d, '.rp-sv').text, 'Q4 slider starts with no value')
    slide(d, 15)
    check('15%' in css(d, '.rp-sv').text and '€1,500' in css(d, '.rp-sv').text and '€8,500' in css(d, '.rp-sv').text, 'slider shows the € fall: %r' % css(d, '.rp-sv').text)
    check('unset' not in css(d, '.rp-sld').get_attribute('class') and js(d, "return RiskProfiler.lossBand(15).rating") == 4, 'slider answered; 15% is band 4')
    slide(d, 40)
    check('40% or more' in css(d, '.rp-sv').text, 'top of the slider: 40% or more')
    d.save_screenshot(str(OUT / 'rp_standalone_slider.png'))

    # Q8: starts in a mixed order and is not answered until the client acts
    goto(d, 'knowledge')
    check(rank_order(d) == ['fund', 'share', 'deposit', 'govbonds'], 'Q8 starts in the mixed order: %s' % rank_order(d))
    check('done' not in css(d, '[data-qwrap=check]').get_attribute('class'), 'Q8 not answered at the start')
    click(d, css(d, '[data-q=check][data-mv="1"][data-v="fund"]'))
    check(rank_order(d) == ['share', 'fund', 'deposit', 'govbonds'] and 'done' in css(d, '[data-qwrap=check]').get_attribute('class'), 'moving an item answers Q8')
    check(js(d, "return document.activeElement.getAttribute('data-fk')") in ('check-dn-fund', 'check-up-fund'), 'focus follows the moved item')
    # drag and drop: deposit onto share (to the top)
    js(d, """var src=document.querySelector('[data-ri=deposit]'), dst=document.querySelector('[data-ri=share]'), dt=new DataTransfer();
             src.dispatchEvent(new DragEvent('dragstart', {bubbles:true, dataTransfer:dt}));
             dst.dispatchEvent(new DragEvent('dragover', {bubbles:true, cancelable:true, dataTransfer:dt}));
             dst.dispatchEvent(new DragEvent('drop', {bubbles:true, cancelable:true, dataTransfer:dt}));""")
    check(rank_order(d)[0] == 'deposit', 'drag and drop moves an item: %s' % rank_order(d))
    click(d, css(d, '[data-q=check][data-dk]'))
    check('off' in css(d, '.rp-rank').get_attribute('class') and js(d, "return document.querySelector('[data-q=check][data-mv]').disabled"), '"I don\'t know" switches off the ordering')
    click(d, css(d, '[data-q=check][data-dk]'))
    check('off' not in css(d, '.rp-rank').get_attribute('class') and rank_order(d)[0] == 'deposit', 'unticking keeps the order')
    d.save_screenshot(str(OUT / 'rp_standalone_rank.png'))

    # Sustainability: S2 only after Yes; S3 for A or B, S4 for C; the general preference is exclusive
    goto(d, 'sustainability')
    check(not d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s2]'), 'S2 hidden until S1 is Yes')
    check('set from your answers' in tx(d, '[data-set]'), 'sustainability part says the rating is set elsewhere: %r' % tx(d, '[data-set]'))
    click(d, css(d, '[data-q=s1][data-v=yes]'))
    check(d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s2]') and not d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s3]'), 'S1 Yes asks S2')
    click(d, css(d, '[data-q=s2][data-v=taxonomy]')); click(d, css(d, '[data-q=s2][data-v=pai]'))
    check(d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s3]') and d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s4]'), 'A asks S3 and C asks S4')
    check(len(d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s3] .rp-mr')) == 1, 'S3 has one row, for A')
    click(d, css(d, '[data-q=s2][data-v=general]'))
    on = js(d, "return [].map.call(document.querySelectorAll('[data-q=s2].on'), function(b){ return b.getAttribute('data-v'); })")
    check(on == ['general'] and not d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s3]'), '"a preference but not for any of these" clears the others: %s' % on)
    click(d, css(d, '[data-q=s1][data-v=no]'))
    check(not d.find_elements(By.CSS_SELECTOR, '[data-qwrap=s2]'), 'S1 No ends the sustainability questions')

    # Everything else
    click(d, css(d, '[data-act=reset]'))
    check(answered(d) == 0 and section(d) == 'finances', 'Clear all answers resets and returns to part 1')
    answer_all(d)
    check(answered(d) == 11, 'progress counts answers: %d' % answered(d))
    goto(d, 'result')
    check('still to answer' in result_text(d), 'result screen lists what is left (the date of birth)')
    click(d, css(d, '[data-act=next]'))
    check(section(d) == 'about' and js(d, "return document.activeElement.getAttribute('data-q')") == 'dob', 'go-to-next opens About you and focuses the date of birth')
    type_dob(d, '1985-06-15')
    check(answered(d) == 12, 'all 12 answered: %d' % answered(d))
    click(d, css(d, '[data-act=fwd]'))
    check(section(d) == 'sustainability' and 'set at 5 (Medium to High)' in tx(d, '[data-set]'), 'the sustainability part shows the rating already set: %r' % tx(d, '[data-set]'))
    click(d, css(d, '[data-act=fwd]'))
    check(section(d) == 'result', 'Continue moves on to the result')
    res = result_text(d)
    check(tx(d, '.rp-big b') == '5' and 'Medium to High' in tx(d, '.rp-big span') and 'scale of 1 to 7' in tx(d, '.rp-big'), 'capacity High and attitude 5 give 5 out of 6: %r' % tx(d, '.rp-big'))
    check(len(d.find_elements(By.CSS_SELECTOR, '.rp-scale span')) == 7 and len(d.find_elements(By.CSS_SELECTOR, '.rp-scale span.off')) == 1, 'the scale on the result runs 1 to 7, with 7 greyed')
    check(tx(d, '[data-cap]') == 'High' and tx(d, '[data-kn]') == 'High', 'capacity and knowledge shown')
    check(not d.find_elements(By.CSS_SELECTOR, '[data-check]'), 'the answer to the knowledge check is not shown')
    check(flags(d) == [], 'no flags: %s' % flags(d))
    check('not a recommendation' not in res, 'no disclaimer on the result')
    check(not d.find_elements(By.CSS_SELECTOR, '[data-act=finish]'), 'no "Use this result" button on the standalone page')
    d.save_screenshot(str(OUT / 'rp_standalone_done.png'))
    # A short horizon limits the rating and the client is told; changing an answer after seeing the result is flagged
    answer(d, '[data-q=horizon][data-v="1to3"]', 'horizon')
    goto(d, 'result')
    check(tx(d, '.rp-big b') == '2' and 'limited to 2' in result_text(d), 'horizon 1 to 3 years limits the rating to 2, and says so')
    check(flags(d) == ['F4', 'F6'], 'short horizon and changed-answer flags: %s' % flags(d))
    check('Q3 investment horizon' in tx(d, '[data-flag=F6]'), 'F6 names the changed question')
    answer(d, '[data-q=horizon][data-v="5plus"]', 'horizon')
    goto(d, 'result')
    check(flags(d) == [], 'changing it back clears F6: %s' % flags(d))
    # Low capacity limits the rating to 4
    answer(d, '[data-q=cushion][data-v=under3]', 'cushion'); answer(d, '[data-q=impact][data-v=big]', 'impact')
    goto(d, 'result')
    check(tx(d, '.rp-big b') == '4' and tx(d, '[data-cap]') == 'Low' and 'hard for you to bear' in result_text(d), 'low capacity limits the rating to 4')
    check(flags(d) == ['F3', 'F6'], 'capacity-limit flag: %s' % flags(d))
    d.save_screenshot(str(OUT / 'rp_standalone_flags.png'))
    check(not errors(d), 'standalone console errors: %s' % errors(d))

# ── the quotation tool ──
def nxt(d): click(d, d.find_element(By.ID, 'btn-next')); time.sleep(0.2)
def step(d): return js(d, 'return S.step')
def msg(d): return d.find_element(By.ID, 'foot-msg').text

def to_step3(d, product='prsa', dob='1980-03-15'):
    d.get(TOOL); js(d, "localStorage.clear()"); d.get(TOOL); js(d, 'setLite(false)')   # the tool opens in lite mode
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
    check(css(d, '#rp-method').is_displayed() and not css(d, '#sri-card').is_displayed() and not dlg_open(d), 'step 3 opens on the choice of method, no questions or ratings yet')
    d.save_screenshot(str(OUT / 'rp_tool_step3_empty.png'))
    click(d, css(d, '#rp-method [data-m=profiler]'))
    check(dlg_open(d), 'choosing the risk profiler opens it in a dialog')
    n = len(d.find_elements(By.CSS_SELECTOR, '#rp-host .rp-q'))
    check(n == 9, 'tool asks 9 questions to start with (date of birth is already known): %d' % n)
    check(len(d.find_elements(By.CSS_SELECTOR, '#rp-host .rp-tab')) == 6, 'no About you part in the tool')
    d.save_screenshot(str(OUT / 'rp_tool_dialog.png'))
    # Closing part-way keeps the answers but sets nothing
    answer(d, '[data-q="cushion"][data-v="12plus"]', 'cushion')
    check('1 of 9' in css(d, '#rpm-d').text, 'dialog counts answers: %r' % css(d, '#rpm-d').text)
    click(d, css(d, '#rpm .rpm-x'))
    check(not dlg_open(d) and 'In progress' in css(d, '#rp-sum').text and '1 of 9' in css(d, '#rp-sum').text, 'closed part-way: in progress: %r' % css(d, '#rp-sum').text)
    check(js(d, 'return S.risk.sri') is None and not css(d, '#sri-card').is_displayed(), 'partial answers do not set a rating')
    nxt(d)
    check(step(d) == 3 and 'complete the risk profiler' in msg(d), 'step 3 needs the profiler finished (%s)' % msg(d))
    click(d, css(d, '#rp-sum button'))
    answer_all(d)
    check(js(d, 'return S.risk.sri') is None and js(d, 'return S.risk.pSuggested') is None and js(d, 'return S.risk.esg') is None, 'nothing is applied while the dialog is open')
    goto(d, 'result')
    check('Medium to High' in result_text(d), 'result screen in the tool shows the rating')
    check(js(d, 'return !!rpUI.getState().seen'), 'showing the result records the answers it was based on')
    d.save_screenshot(str(OUT / 'rp_tool_step3_done.png'))
    click(d, css(d, '[data-act=finish]'))
    check(not dlg_open(d), '"Use this result" closes the dialog')
    check(js(d, 'return S.risk.sri') == 5 and js(d, 'return S.risk.pSuggested') == 5, 'the applied result sets the risk rating to 5 (%s)' % js(d, 'return S.risk.sri'))
    check(js(d, 'return S.risk.esg') is True and js(d, "return document.querySelector('#esg-seg [data-v=yes]').disabled") and css(d, '#esg-src').is_displayed(),
          'the sustainability answer sets the preference, and the Yes/No is locked')
    check('Risk rating 5' in css(d, '#rp-sum').text and 'Review answers' in css(d, '#rp-sum').text and 'Knowledge high' in css(d, '#rp-sum').text, 'summary shows the result: %r' % css(d, '#rp-sum').text)
    check('on' in d.find_elements(By.CSS_SELECTOR, '.sri-t')[4].get_attribute('class'), 'rating 5 tile is selected')
    check('Set by the Allianz Risk Profiler' in css(d, '#rp-apply-msg').text and 'lower rating' in css(d, '#rp-apply-msg').text, 'note says the rating came from the profiler and can be lowered: %r' % css(d, '#rp-apply-msg').text)
    check(not css(d, '#rp-flags').is_displayed(), 'no flags shown')
    check(not css(d, '#r-profiler-wrap').is_displayed(), 'free-text "risk profiler used" is only for own profiling')
    check(js(d, 'return S.risk.pDate') == js(d, 'return todayStr()') and js(d, 'return S.risk.pSeen.loss') == 25, 'completion date and the shown answers recorded')
    d.save_screenshot(str(OUT / 'rp_tool_step3_applied.png'))
    # The adviser may lower the rating, with a reason, but not raise it
    tiles = d.find_elements(By.CSS_SELECTOR, '.sri-t')
    check([t.get_attribute('disabled') is not None for t in tiles] == [False] * 5 + [True] * 2, 'tiles above the profiler\'s 5 are locked')
    js(d, 'setSri(6)')
    check(js(d, 'return S.risk.sri') == 5, 'the rating cannot be raised')
    click(d, tiles[3])
    check(js(d, 'return S.risk.sri') == 4 and css(d, '#rp-reason-wrap').is_displayed(), 'choosing 4 asks for a reason')
    nxt(d)
    check(step(d) == 3 and 'reason for choosing a lower rating' in msg(d), 'a lower rating needs a reason (%s)' % msg(d))
    setv(d, 'rp-reason', 'Wants a more cautious approach for now.')
    d.save_screenshot(str(OUT / 'rp_tool_step3_lowered.png'))
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4 with a reason (%s)' % msg(d))
    cap = js(d, "return document.querySelector('#stepnav .rs:nth-child(3) .cap').textContent")
    check('4 · Medium' in cap and 'Profiled' in cap, 'rail caption notes the profiler: %r' % cap)

    # Reviewing: edits that are not applied are undone; a new result replaces the rating and clears the reason
    js(d, 'goStep(3)')
    check(not dlg_open(d) and 'Review answers' in css(d, '#rp-sum').text, 'a finished profiler stays closed when Step 3 is revisited')
    click(d, css(d, '#rp-sum button'))
    check(dlg_open(d) and section(d) == 'finances', 'Review answers opens the dialog at part 1')
    answer(d, '[data-q="reaction"][data-v="sellall"]', 'reaction')
    js(d, "document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))")
    check(not dlg_open(d) and js(d, 'return S.risk.sri') == 4 and js(d, "return S.risk.pAnswers.reaction") == 'investmore', 'Escape closes without applying the change')
    click(d, css(d, '#rp-sum button'))
    check(js(d, "return rpUI.getState().answers.reaction") == 'investmore', 'reopening shows the applied answers')
    to_sec(d, 'loss'); slide(d, 7)                        # ratings 3, 6, 5: the middle is 5, limited to 4 (one above Q4)
    goto(d, 'result')
    check(flags(d) == ['F1', 'F6'], 'mixed attitude (3 levels apart) and the changed answer are flagged in the dialog: %s' % flags(d))
    click(d, css(d, '[data-act=finish]'))
    check(js(d, 'return S.risk.pSuggested') == 4 and js(d, 'return S.risk.sri') == 4 and js(d, 'return S.risk.pReason') == '', 'a new result becomes the rating (4), reason cleared')
    check(css(d, '#rp-flags').is_displayed() and 'Changed answers' in css(d, '#rp-flags').text, 'Step 3 shows the changed-answers flag: %r' % css(d, '#rp-flags').text)
    click(d, css(d, '#rp-sum button'))
    to_sec(d, 'loss'); slide(d, 25)
    goto(d, 'result'); click(d, css(d, '[data-act=finish]'))
    check(js(d, 'return S.risk.sri') == 5 and not css(d, '#rp-flags').is_displayed(), 'back to rating 5, and the answers match those first shown')
    # The date of birth comes from step 2: 65 or over with a rating of 5 raises the age flag, without changing it
    js(d, 'goStep(2)')
    setv(d, 'c-dob', '1955-01-01')
    check(js(d, 'return S.risk.sri') == 5 and [f['id'] for f in js(d, 'return profilerDone().flags')] == ['F5'], 'age 71: rating stays 5, age flag')
    setv(d, 'c-dob', '1980-03-15')

    # Carry on to the pack with the profiler's rating of 5, lowered to 4 with a reason
    js(d, 'goStep(3)'); time.sleep(0.2)
    click(d, d.find_elements(By.CSS_SELECTOR, '.sri-t')[3])
    setv(d, 'rp-reason', 'Wants a more cautious approach for now.')
    nxt(d)
    check(step(d) == 4, 'step 3 -> 4 (%s)' % msg(d))
    click(d, css(d, '#p-ctchips [data-part=sp]'))
    setv(d, 'p-sp', '50000')
    nxt(d)
    check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))
    pack(d)

def pack(d):
    # Build one fund matching the rating
    ok = js(d, """
      try {
        var ids = Object.keys(FUNDS_MAP).filter(function(i) { return Math.round(FUNDS_MAP[i].esma) === S.risk.sri; });
        return ids.length ? ids[0] : null;
      } catch (e) { return String(e); }""")
    check(ok and isinstance(ok, str), 'found a fund matching the rating: %s' % ok)
    js(d, """S.prsa.diySel = {}; S.prsa.diyAllocs = {}; S.prsa.diySel[arguments[0]] = true; S.prsa.diyAllocs[arguments[0]] = 100;
             S.prsa.strat = 'diy'; goStep(6);""", ok)
    time.sleep(0.4)
    check(step(d) == 6, 'reached results (%s)' % msg(d))
    js(d, "RES_TABS.forEach(function(t) { S.resSeen[t[0]] = true; }); S.resTab = 'rem'; renderResults(); renderFoot();")
    nxt(d)
    check(step(d) == 7, 'reached the pack (%s)' % msg(d))
    check(js(d, "return !!document.querySelector('[data-sec=riskprofile]') && S.sections.riskprofile"), 'Risk profile record has a toggle and is on')
    names = js(d, "return [].map.call(document.querySelectorAll('#pack-order ol:first-of-type li span:nth-child(2)'), function(e){ return e.textContent; })")
    check(names[:3] == ['Cover letter', 'Statement of Suitability', 'Risk profile'], 'pack order: %s' % names[:4])
    d.save_screenshot(str(OUT / 'rp_tool_step7.png'))
    nxt(d)                                  # cover letter
    check('A record of your risk profile questionnaire' in js(d, "return stripMarks(S.text.cover)"), 'cover letter lists the risk profile record')
    nxt(d)                                  # SoS
    sos = js(d, "return stripMarks(S.text.sos)")
    check('Allianz Global Life Risk Profiler' in sos, 'SoS names the built-in profiler')
    check('12 months or more' in sos and 'little or no impact' in sos and '5 years or more' in sos, 'SoS circumstances come from Q1 to Q3')
    check('25% (€2,500 on €10,000)' in sos and 'keep it and invest more' in sos and 'strong growth over the long term' in sos, 'SoS quotes the attitude answers')
    check('This gives a risk rating of 5 (Medium to High).' in sos, 'SoS gives the profiler\'s rating')
    check('lower risk rating of 4 because: Wants a more cautious approach for now.' in sos, 'SoS records the lower rating and the reason')
    check('knowledge and experience was assessed as high' in sos, 'SoS gives the knowledge level')
    check('take account of their main negative effects' in sos and 'greenhouse gas emissions' in sos, 'SoS sustainability passage comes from the profiler')
    check(len(d.find_elements(By.CSS_SELECTOR, '#ed-sos .auto')) >= 4, 'profiler sentences appear as auto-filled grey boxes')
    d.save_screenshot(str(OUT / 'rp_tool_sos.png'))
    js(d, "S.text.sos = S.text.sos + '\\n\\nDiscussed in our meeting.'; renderReport();")
    nxt(d)                                  # review
    for _ in range(100):
        if re.search(r'\d+ page', css(d, '#fname').text): break
        time.sleep(0.1)
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
    check('undefined' not in txt and 'NaN' not in txt and 'null' not in txt, 'pack contains undefined/NaN/null')
    check(not re.findall(r'\{[a-zA-Z]+\}', txt), 'pack has unfilled tokens: %s' % re.findall(r'\{[a-zA-Z]+\}', txt)[:5])
    page = js(d, "return [].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ return p.querySelector('.blk[data-sec=riskprofile]'); }).map(function(p){ return p.textContent; }).join(' ')")
    check(page, 'pack has a Risk profile page')
    check('Risk profiler rating' not in page and 'Your answers to the questions on the largest fall' not in page, 'no duplicate rating or calculation explanation')
    check('worked out' not in page and 'Largest fall you could accept (Q4)' not in page, 'no calculation workings')
    for needle in ['Your risk rating', 'Lowered by your adviser', 'Capacity for loss', 'Your answers', 'Your finances', 'Your timing',
                   'Q1. If your income stopped', '12 months or more', 'Q4. Imagine you invest', '25% (€2,500 on €10,000)',
                   '1. A savings deposit', 'S2. Which of these',
                   'Knowledge check (Q8)', 'Points for your adviser', 'No flags were raised', 'Questionnaire version 3.0']:
        check(needle in page, 'Risk profile page contains %r' % needle)
    check('not a recommendation' not in page, 'no "not a recommendation" disclaimer')
    grp = js(d, "var p=[].slice.call(document.querySelectorAll('#pages .page')).filter(function(p){ return p.querySelector('.blk[data-sec=riskprofile]'); })[0]; return p ? p.getAttribute('data-grp') : ''")
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
        for sec in ('attitude', 'knowledge', 'sustainability'):
            goto(d, sec)
            if sec == 'sustainability':
                click(d, css(d, '[data-q=s1][data-v=yes]')); click(d, css(d, '[data-q=s2][data-v=taxonomy]'))
            over = js(d, "return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
            check(over == 0, 'no sideways scroll at %dpx on the standalone %s part (overflow %dpx)' % (w, sec, over))
        if w == 420: d.save_screenshot(str(OUT / 'rp_standalone_narrow.png'))
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
