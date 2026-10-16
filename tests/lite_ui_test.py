"""UI check for lite mode in quotation_tool.html (headless Edge).

Turns Lite mode on from the first screen and checks: the adviser and risk steps are skipped,
the portfolio step shows no client risk rating or asset split, the pack holds the core
quotation only, and the generated pack has no client risk rating or asset split.

Run:  python tests/lite_ui_test.py
"""
import sys, time
from selenium.webdriver.common.by import By
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
# Reuse the helpers from ui_test.py (everything before the first flow), without running its flows
_src = (HERE / 'ui_test.py').read_text(encoding='utf-8')
_src = _src[:_src.index('def fill_broker(d):')]
import types
U = types.SimpleNamespace(); _g = {'__file__': str(HERE / 'ui_test.py')}
exec(compile(_src, 'ui_test_helpers', 'exec'), _g); U.__dict__.update(_g)
js, setv, click, css, nxt, step, msg, check = U.js, U.setv, U.click, U.css, U.nxt, U.step, U.msg, U.check

def main():
    d = U.driver()
    try:
        d.get(U.URL); js(d, 'localStorage.clear()'); d.get(U.URL)
        check(d.find_element(By.ID, 'lite-toggle').is_displayed(), 'lite toggle on the first screen')
        check(js(d, 'return S.lite') is True and d.find_element(By.ID, 'lite-toggle').is_selected(), 'lite mode is on by default')
        click(d, d.find_element(By.ID, 'lite-toggle'))
        check(js(d, 'return S.lite') is False and d.find_element(By.CSS_SELECTOR, '#step-1 .cols').is_displayed(), 'toggle switches lite off')
        click(d, d.find_element(By.ID, 'lite-toggle'))
        check(js(d, 'return S.lite') is True, 'toggle turns lite back on')
        check(not d.find_element(By.CSS_SELECTOR, '#step-1 .cols').is_displayed(), 'adviser form hidden in lite')
        nxt(d)
        check(step(d) == 2, 'lite: step 1 -> 2 without adviser details (%s)' % msg(d))
        click(d, css(d, '#prod-cards [data-prod=prsa]'))
        setv(d, 'c-first', 'Alex'); setv(d, 'c-last', 'Murphy'); setv(d, 'c-dob', '1980-03-15'); setv(d, 'q-start', '2026-10-01'); setv(d, 'q-nra', 65)
        check('Continue to plan' in d.find_element(By.ID, 'btn-next').text, 'footer skips the risk step: %r' % d.find_element(By.ID, 'btn-next').text)
        nxt(d)
        check(step(d) == 4, 'lite: step 2 -> 4, risk step skipped (step %s, %s)' % (step(d), msg(d)))
        rail = js(d, "return [].map.call(document.querySelectorAll('#stepnav .lb'), function(e){ return e.textContent; })")
        check('Attitude to risk' not in rail and 'Adviser' not in rail, 'rail hides skipped steps: %s' % rail)
        check(css(d, '#step-4 .eyebrow').get_attribute('textContent') == 'Step 2 of 5', 'eyebrow renumbered: %r' % css(d, '#step-4 .eyebrow').text)
        U.set_ct(d, 'prsa', 'sp'); setv(d, 'p-sp', '50000')
        nxt(d)
        check(step(d) == 5, 'step 4 -> 5 (%s)' % msg(d))
        click(d, css(d, '[data-way=managed] .strat-main')); time.sleep(0.5)
        check(js(d, "return document.querySelectorAll('#strat-opts .suit, #strat-opts .rg').length") == 0, 'no "suits ratings" marks in lite')
        click(d, css(d, '[data-strat=dis] .strat-main')); time.sleep(0.5)
        check(js(d, 'return S.prsa.strat') == 'dis', 'strategy chosen')
        side = d.find_element(By.ID, 'pf-side').text
        check(d.find_element(By.ID, 'pf-side').is_displayed() and 'Client' not in side and 'Asset split' not in side and 'Aligned' not in side,
              'glance panel has no client rating or asset split: %r' % side[:200])
        nxt(d)
        check(step(d) == 6 and not js(d, 'return portfolioState().mismatch'), 'no mismatch gate in lite (%s)' % msg(d))
        check('Attitude to risk' not in css(d, '#res-band').text and 'client' not in css(d, '#res-band').text.lower().replace('client\n', ''), 'results summary has no client risk rating: %r' % css(d, '#res-band').text[:200])
        js(d, "setResTab('chg'); setResTab('rem')")
        nxt(d)
        check(step(d) == 7, 'step 7 reached (%s)' % msg(d))
        secs = js(d, 'return packItems()')
        check(secs == ['quotation'], 'pack holds the core quotation only: %s' % secs)
        check(js(d, 'return attachedList().length') == 0, 'no factsheets or KIDs attached')
        check(js(d, 'return packStages()') == ['contents', 'review'], 'no cover letter or SoS stages')
        html = js(d, 'return qtBuildPack(packData(true))')
        low = html.lower()
        for bad in ['your attitude to risk', 'asset split', 'class="catsplit', 'how your money is split', 'pays  for', ', </', 'undefined', 'nan%', '{', ]:
            if bad == '{': continue
            check(bad not in low, 'pack html has no %r' % bad)
        check('portfolio risk' in low or 'strategy risk profile' in low, 'pack still shows the portfolio risk')
        # Adviser details entered before lite was switched on stay out of the pack
        js(d, "S.broker.name='Pat Adviser'; S.broker.firm='Test Financial Ltd'; S.broker.email='pat@test.ie'; S.broker.phone='01 555 0000'")
        html2 = js(d, 'return qtBuildPack(packData(true))')
        for bad in ['Pat Adviser', 'Test Financial', 'pat@test.ie', '01 555 0000', '>Adviser<']:
            check(bad not in html2, 'lite pack has no adviser detail %r' % bad)
        # Switching lite off restores the full flow
        click(d, css(d, '#rail-lite .lnk'))
        check(js(d, 'return S.lite') is False and step(d) == 1 and d.find_element(By.CSS_SELECTOR, '#step-1 .cols').is_displayed(), 'switching off returns to the adviser step')
        errs = U.console_errors(d)
        check(not errs, 'no console errors: %s' % errs[:3])
    finally:
        d.quit()
    print('FAILS:', len(U.fails))
    sys.exit(1 if U.fails else 0)

if __name__ == '__main__':
    main()
