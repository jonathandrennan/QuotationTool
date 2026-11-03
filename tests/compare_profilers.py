"""Runs 50 test clients through our Risk Profiler, the Zurich Life risk profiler (live site) and Aviva's
Investment Suitability Tool (its decision table), and writes the three ratings side by side.

Each client is defined by OUR answers (Q1-Q8 and date of birth). Those are translated to the other two tools'
questions by the mapping below, so the comparison is only as good as the mapping. Change MAP_* to change it.

  Ours   : js/risk_profiler.js (node), rating 1-6
  Zurich : zurichlife.ie/pensions-retirement/calculators/risk-profiler (headless Edge), Risk Profile 1-7 and Capacity
           for Loss. Scoring is server-side, so each client is a real run of the site (~50 runs).
  Aviva  : calculateRiskLevel from secure.avivabroker.ie istLogic.js, as transcribed in docs/risk-questionnaires.md
           (the live file returns 403 from here). Result 0 (no risk), 3, 4, 5 or 6.

Run:  python tests/compare_profilers.py [--no-zurich]
      python tests/compare_profilers.py --report   (re-runs ours only, reuses the saved Zurich and Aviva results and
                                                    writes tests/out/compare_profilers_sections.md for the proposal)
Out:  tests/out/compare_profilers.csv, compare_profilers.json
"""
import csv, datetime as dt, json, pathlib, random, subprocess, sys, time

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'out'
OUT.mkdir(exist_ok=True)
TODAY = dt.date(2026, 10, 28)
ZURICH = 'https://www.zurichlife.ie/pensions-retirement/calculators/risk-profiler/riskProfiler'

# ─── The 50 clients ──────────────────────────────────────────────────────────────────────────
CUSHION = ['under3', '3to11', '12plus']
IMPACT = ['big', 'some', 'little']
REACTION = ['sellall', 'sellpart', 'wait', 'investmore']
OBJECTIVE = ['safe', 'deposit', 'inflation', 'steady', 'strong', 'highest']
EXPERIENCE = ['none', 'passive', 'recent', 'regular', 'professional']
GOOD = ['deposit', 'govbonds', 'fund', 'share']      # the right order for Q8


def make_cases():
    def c(name, age, cushion, impact, horizon, loss, reaction, objective, experience, check='right'):
        return dict(name=name, age=age, cushion=cushion, impact=impact, horizon=horizon, loss=loss,
                    reaction=reaction, objective=objective, experience=experience, check=check)
    cases = [
        c('Corner: most cautious', 80, 'under3', 'big', 1, 0, 'sellall', 'safe', 'none', 'dontKnow'),
        c('Corner: most adventurous', 25, '12plus', 'little', 12, 40, 'investmore', 'highest', 'professional'),
        c('Mid-range', 40, '3to11', 'some', 10, 15, 'wait', 'steady', 'recent'),
        c('Keen but no cushion', 30, 'under3', 'big', 10, 40, 'investmore', 'highest', 'regular'),
        c('Cautious but wealthy', 60, '12plus', 'little', 12, 2, 'sellall', 'safe', 'regular'),
        c('Adventurous, short horizon', 50, '12plus', 'little', 2, 40, 'investmore', 'highest', 'regular'),
        c('Age 70 adventurous', 70, '12plus', 'little', 10, 30, 'investmore', 'strong', 'regular'),
        c('Loss 2.5 but wants max return', 45, '3to11', 'some', 10, 2.5, 'investmore', 'highest', 'recent'),
    ]
    rng = random.Random(20261028)
    while len(cases) < 50:
        cases.append(c('Random %02d' % (len(cases) - 7), rng.randint(22, 78), rng.choice(CUSHION), rng.choice(IMPACT),
                       rng.randint(0, 12), rng.randint(0, 80) / 2, rng.choice(REACTION), rng.choice(OBJECTIVE),
                       rng.choice(EXPERIENCE), rng.choice(['right', 'wrong', 'dontKnow'])))
    for i, k in enumerate(cases):
        k['id'] = i + 1
        k['dob'] = (TODAY.replace(year=TODAY.year - k['age']) - dt.timedelta(days=100)).isoformat()   # birthday passed
    return cases


# ─── Ours ────────────────────────────────────────────────────────────────────────────────────
def our_answers(k):
    a = dict(cushion=k['cushion'], impact=k['impact'], horizon=k['horizon'], loss=k['loss'], reaction=k['reaction'],
             objective=k['objective'], experience=k['experience'])
    a['check'] = {'order': GOOD} if k['check'] == 'right' else {'order': ['deposit', 'fund', 'govbonds', 'share']} \
        if k['check'] == 'wrong' else {'dontKnow': True}
    return a


def run_ours(cases):
    payload = json.dumps([dict(a=our_answers(k), dob=k['dob']) for k in cases])
    js = ("const RP=require(process.argv[1]);const ins=JSON.parse(require('fs').readFileSync(0,'utf8'));"
          "console.log(JSON.stringify(ins.map(x=>{const r=RP.evaluate(x.a,{dob:x.dob,atDate:'2026-10-28'});"
          "return {sri:r.sri,attitude:r.attitude.rating,capacity:r.capacity.label,knowledge:r.knowledge.level,"
          "flags:r.flags.map(f=>f.id)};})));")
    p = subprocess.run(['node', '-e', js, str(HERE.parent / 'js' / 'risk_profiler.js')], input=payload,
                       capture_output=True, text=True, check=True)
    return json.loads(p.stdout)


# ─── Aviva ───────────────────────────────────────────────────────────────────────────────────
# Q1 experience 1-4, Q2 importance 1-4, Q3 safety 1-5 (1 = strongly agree), Q4 expectations 1-5, Q5 max 12-month loss.
# Only Q4 and Q5 set the level; Q1-Q3 are recorded because they trigger Aviva's confirmation prompts.
MAP_AVIVA_EXPERIENCE = {'none': 1, 'passive': 1, 'recent': 2, 'regular': 3, 'professional': 4}
MAP_AVIVA_IMPORTANCE = {'big': 1, 'some': 2, 'little': 4}
MAP_AVIVA_SAFETY = {'safe': 1, 'deposit': 2, 'inflation': 3, 'steady': 3, 'strong': 4, 'highest': 5}
MAP_AVIVA_EXPECT = {'safe': 1, 'deposit': 2, 'inflation': 2, 'steady': 3, 'strong': 4, 'highest': 5}


def aviva_level(q4, loss):
    if q4 == 1: return 0 if loss < 5 else 3
    if q4 == 2: return 0 if loss < 3 else 3 if loss < 12 else 4
    if q4 == 3: return 3 if loss < 8 else 4 if loss < 18 else 5
    if q4 == 4: return 3 if loss < 8 else 4 if loss < 16 else 5 if loss < 35 else 6
    return 3 if loss < 8 else 4 if loss < 16 else 5 if loss < 28 else 6


def aviva_prompts(q1, q2, q3, q4, loss):
    """Which of Aviva's 'please confirm' dialogs the answers would raise."""
    p = []
    if ((q3 == 4 and q2 == 1) or q3 == 5) and q2 in (1, 2): p.append('reliance')
    if (q4 == 1 and q3 in (4, 5)) or (q4 in (2, 3) and q3 == 5) or (q4 == 4 and q3 == 1) \
            or (q4 == 5 and (q3 in (1, 2) or q2 in (1, 2) or q1 == 1)): p.append('expectations')
    if (q4 in (3, 4, 5) and loss < 5) or (q4 in (4, 5) and loss < 10) or (q4 == 5 and loss < 20) \
            or (q4 == 1 and loss > 4) or (q4 == 2 and loss > 10): p.append('loss')
    return p


def run_aviva(k):
    q = (MAP_AVIVA_EXPERIENCE[k['experience']], MAP_AVIVA_IMPORTANCE[k['impact']],
         MAP_AVIVA_SAFETY[k['objective']], MAP_AVIVA_EXPECT[k['objective']])
    loss = min(40, k['loss'])
    return dict(level=aviva_level(q[3], loss), prompts=aviva_prompts(*q, loss),
                answers=dict(experience=q[0], importance=q[1], safety=q[2], expectations=q[3], loss=loss))


# ─── Zurich ──────────────────────────────────────────────────────────────────────────────────
# Option 1 is the most aggressive answer for Q3-Q7 (see AdditionalInfo/RiskProfiler/Zurich Life ... .md).
MAP_ZURICH_KNOWLEDGE = {'none': 5, 'passive': 4, 'recent': 3, 'regular': 2, 'professional': 1}
MAP_ZURICH_OBJECTIVE = {'safe': 5, 'deposit': 4, 'inflation': 4, 'steady': 3, 'strong': 2, 'highest': 1}
MAP_ZURICH_DECLINE = {'sellall': 5, 'sellpart': 4, 'wait': 3, 'investmore': 1}          # concern about a 10% fall
MAP_ZURICH_APPROACH = {'sellall': 4, 'sellpart': 3, 'wait': 2, 'investmore': 1}
MAP_ZURICH_EMERGENCY = {'under3': 1, '3to11': 2, '12plus': 3}
MAP_ZURICH_WELLBEING = {'big': 1, 'some': 2, 'little': 3}


def zurich_range(loss):
    """Q6: the widest range the client would accept on 10,000 over 5 years. Option 1 (6,300 to 17,200) needs a
    fall of 37% or more, 2 (6,800) 32%, 3 (7,900) 21%, 4 (8,900) 11%, 5 (9,800) 2%."""
    return 1 if loss >= 37 else 2 if loss >= 32 else 3 if loss >= 21 else 4 if loss >= 11 else 5


def zurich_answers(k):
    return dict(clientAge=min(100, max(19, k['age'])), lengthOfInvestment=min(15, max(1, k['horizon'])),
                knowledgeOfInvesting=MAP_ZURICH_KNOWLEDGE[k['experience']],
                investmentObjective=MAP_ZURICH_OBJECTIVE[k['objective']],
                investmentDecline=MAP_ZURICH_DECLINE[k['reaction']], investmentChoice=zurich_range(k['loss']),
                increaseInvestmentbyRisk=MAP_ZURICH_APPROACH[k['reaction']],
                financialEmergency=MAP_ZURICH_EMERGENCY[k['cushion']], financialWellBeing=MAP_ZURICH_WELLBEING[k['impact']])


def run_zurich(cases):
    import re
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.edge.options import Options
    o = Options()
    o.add_argument('--headless=new')
    o.add_argument('--window-size=1440,1400')
    nxt = 'button[name=navButton][value=Next]'
    out = []
    d = None
    try:
        for k in cases:
            a = zurich_answers(k)
            res = None
            for attempt in range(2):
                try:
                    # the site remembers the session and skips the start pages, so each run gets a fresh browser
                    if d: d.quit()
                    d = webdriver.Edge(options=o)
                    d.get(ZURICH)
                    time.sleep(3 if attempt == 0 else 6)
                    for b in d.find_elements(By.ID, 'onetrust-accept-btn-handler'):
                        try: b.click()
                        except Exception: pass
                    d.execute_script("document.getElementById('sustainabilityQuestionN').click()")
                    d.find_element(By.CSS_SELECTOR, nxt).click(); time.sleep(1.5)
                    d.execute_script("document.getElementById('complianceQuestionY').click()")
                    d.find_element(By.CSS_SELECTOR, nxt).click(); time.sleep(1.5)
                    d.execute_script("""
                      const a = arguments[0];
                      for (const f of ['clientAge', 'lengthOfInvestment']) {
                        const el = document.getElementById('riskProfiler_' + f); el.value = a[f];
                        el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true}));
                      }
                      for (const f in a) if (f !== 'clientAge' && f !== 'lengthOfInvestment')
                        document.getElementById('riskProfiler_' + f + a[f]).click();""", a)
                    d.find_element(By.CSS_SELECTOR, nxt).click(); time.sleep(2)
                    text = d.find_element(By.TAG_NAME, 'body').text
                    m = re.search(r'Risk Profile\s+(\d)', text)
                    cap = re.search(r'Capacity For Loss\s*-\s*(\w+)', text)
                    strat = re.search(r'(Low|Medium|High)\s+risk\s*/\s*return', text, re.I)
                    if m:
                        res = dict(profile=int(m.group(1)), capacity=cap.group(1) if cap else None,
                                   strategy=strat.group(1) if strat else None)
                        break
                except Exception as e:
                    print('  Zurich case %d attempt %d: %s' % (k['id'], attempt + 1, str(e).splitlines()[0]))
            if res is None:
                res = dict(profile=None, capacity=None, strategy=None)
                if d: (OUT / ('zurich_fail_%02d.png' % k['id'])).write_bytes(d.get_screenshot_as_png())
            res['answers'] = a
            out.append(res)
            print('  Zurich %2d/50: profile %s, capacity %s' % (k['id'], res['profile'], res['capacity']), flush=True)
    finally:
        if d: d.quit()
    return out


# ─── Report for the proposal (section 5 and Appendix A of docs/risk-profiler-design-draft.md) ──
FLAGS = {'F1': 'mixed attitude', 'F2': 'knowledge', 'F3': 'capacity limit', 'F4': 'short horizon', 'F5': 'age', 'F6': 'changed answers'}
WORDS = dict(
    cushion={'under3': 'savings under 3 months', '3to11': 'savings 3 to 11 months', '12plus': 'savings 12 months or more'},
    impact={'big': 'a loss would hit hard', 'some': 'a loss would have some effect', 'little': 'a loss would hardly matter'},
    reaction={'sellall': 'would sell all after a 20% fall', 'sellpart': 'would sell some', 'wait': 'would wait',
              'investmore': 'would invest more'},
    objective={'safe': 'wants safety', 'deposit': 'a little above a deposit', 'inflation': 'growth above inflation',
               'steady': 'steady growth', 'strong': 'strong growth', 'highest': 'highest return'},
    experience={'none': 'no experience', 'passive': 'passive holder', 'recent': 'some recent experience',
                'regular': 'regular investor', 'professional': 'professional'})


def describe(k):
    h = 'under 1 year' if k['horizon'] == 0 else '%d year%s' % (k['horizon'], '' if k['horizon'] == 1 else 's')
    loss = ('%g%%' % k['loss']) if k['loss'] else 'no'
    label = k['id'] if k['name'].startswith('Random') else '%d. %s' % (k['id'], k['name'])
    return '**%s.** Age %d; %s; accepts %s fall; %s; %s; %s; %s; %s' % (
        label, k['age'], h, loss, WORDS['reaction'][k['reaction']], WORDS['objective'][k['objective']],
        WORDS['cushion'][k['cushion']], WORDS['impact'][k['impact']], WORDS['experience'][k['experience']])


def note(k, o, z, a):
    s, zp, av = o['sri'], z['profile'], a['level']
    if zp == s and av == s: return 'Same in all three.'
    bits = ['Same as Zurich.' if zp == s else 'Zurich %d %s.' % (abs(zp - s), 'higher' if zp > s else 'lower')]
    if av == s: bits.append('Same as Aviva.')
    elif av == 0: bits.append("Aviva's 0 means deposit-type only.")
    else: bits.append('Aviva %d %s.' % (abs(av - s), 'higher' if av > s else 'lower'))
    why = []
    if 'F3' in o['flags']: why.append('capacity limit')
    if 'F4' in o['flags'] and s < o['attitude']: why.append('horizon limit')
    if why and (av > s or zp > s): bits.append('Our %s applies; Aviva ignores it.' % ' and '.join(why))
    elif zp > s and 'F1' in o['flags']: bits.append('Mixed answers: we anchor on the loss answer, Zurich adds up points.')
    elif zp < s and 'F1' in o['flags']: bits.append('Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one.')
    elif zp < s and (k['age'] > 40 or 0 < k['horizon'] < 10 or o['knowledge'] == 'LOW'): bits.append('Zurich deducts for age, term or knowledge.')
    return ' '.join(bits)


def report():
    j = json.loads((OUT / 'compare_profilers.json').read_text())
    cases, zurich, aviva = j['cases'], j['zurich'], j['aviva']
    ours = run_ours(cases)
    sri = [o['sri'] for o in ours]; zp = [z['profile'] for z in zurich]; av = [a['level'] for a in aviva]

    def stats(x, y, skip0=False):
        pairs = [(p, q) for p, q in zip(x, y) if not (skip0 and q == 0)]
        d = [q - p for p, q in pairs]
        return len(d), sum(v == 0 for v in d), sum(abs(v) <= 1 for v in d), sum(map(abs, d)) / len(d), sum(d) / len(d), max(map(abs, d))
    L = ['## 5. Testing against Aviva and Zurich', '',
         "50 example clients were run through the proposed questions, Aviva's tool and Zurich's tool. The first 8 test the edges "
         '(the most cautious, the most adventurous, a keen client with no savings, a short horizon and so on) and the other 42 are random answer '
         "sets. Aviva's results come from its decision table, read from the tool's own script. Zurich's come from "
         'its live tool, run on 28/10/2026. The proposal is as at 28/10/2026, with Q3 limits of 3 (under 3 years), 4 (3 to under 5 years) and none from 5 years.',
         '', '| Pair | Same rating | Within one level | Average gap | Higher or lower | Largest gap |', '|---|---|---|---|---|---|']
    for name, x, y in (('Proposed and Zurich', sri, zp), ('Proposed and Aviva', sri, av), ('Aviva and Zurich (for reference)', av, zp)):
        n, same, w1, mabs, mean, mx = stats(x, y)
        L.append('| %s | %d of %d | %d of %d | %.2f | %+.2f | %d |' % (name, same, n, w1, n, mabs, mean, mx))
    L += ['', 'Higher or lower is the second tool minus the first (Zurich minus Aviva in the last row): a positive number means the second tool rates higher.', '']
    n0 = sum(v == 0 for v in av)
    n, same, w1, mabs, mean, mx = stats(sri, av, True)
    L.append('- **Overall:** The proposal agrees with each competitor more often than the two agree with each other. Aviva is the outlier: it rates on the '
             'objective and maximum loss alone, so it runs higher than both of us. It also gives 0 (deposit-type only) to %d clients. Leaving those out, the proposal '
             'and Aviva agree on %d of %d and are within one level on %d.' % (n0, same, n, w1))
    L.append('- **Where we are stricter:** Clients 4 and 6 (a keen client with no savings, and an adventurous client who needs the money in 2 years). '
             'Our capacity and horizon limits hold us to 4 and 3; Zurich gives 6 and 5, and Aviva 6.')
    L.append('- **Where Zurich is lower:** Clients 9, 20, 37 and 43 would sell everything after a 20% fall but gave aggressive answers to the loss and objective questions. '
             'We take the middle of the three attitude answers and rate them 3 to 5; Zurich adds up points and gives 1 to 3.')
    L.append("- **Translation caveat:** Each client was set by our answers and translated into the other two tools' answers by us (the mapping is in `tests/compare_profilers.py`), "
             'so a one-level difference can come from that translation.')
    L += ['', 'Results for each client are in Appendix A.', '', '## Appendix A. Test results by client', '',
          '| Client | Proposed | Aviva | Zurich | What it shows |', '|---|---|---|---|---|']
    for k, o, a, z in zip(cases, ours, aviva, zurich):
        fl = ('<br>Flags: ' + ', '.join(FLAGS[f] for f in o['flags'])) if o['flags'] else ''
        pr = ('<br>Prompts: ' + ', '.join(a['prompts'])) if a['prompts'] else ''
        L.append('| %s | %d<br>Capacity %s%s | %s%s | %d<br>Capacity %s | %s |' % (
            describe(k), o['sri'], o['capacity'], fl, '0 (no-risk)' if a['level'] == 0 else a['level'], pr,
            z['profile'], z['capacity'], note(k, o, z, a)))
    (OUT / 'compare_profilers_sections.md').write_text('\n'.join(L) + '\n', encoding='utf-8')


# ─── Main ────────────────────────────────────────────────────────────────────────────────────
def main():
    if '--report' in sys.argv: return report()
    cases = make_cases()
    ours = run_ours(cases)
    aviva = [run_aviva(k) for k in cases]
    zurich = [None] * len(cases) if '--no-zurich' in sys.argv else run_zurich(cases)
    rows = []
    for k, o, a, z in zip(cases, ours, aviva, zurich):
        z = z or dict(profile=None, capacity=None, strategy=None)
        rows.append(dict(id=k['id'], client=k['name'], age=k['age'], horizon=k['horizon'], loss=k['loss'],
                         ours=o['sri'], ours_capacity=o['capacity'], ours_flags=' '.join(o['flags']),
                         zurich=z['profile'], zurich_capacity=z['capacity'], aviva=a['level'],
                         aviva_prompts=' '.join(a['prompts'])))
    with open(OUT / 'compare_profilers.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    (OUT / 'compare_profilers.json').write_text(json.dumps(dict(cases=cases, ours=ours, zurich=zurich, aviva=aviva), indent=1))
    print('\n id client                         age yrs loss | ours | zurich | aviva')
    for r in rows:
        print('%3d %-30s %3d %3s %4s |  %s   |  %s  |  %s' % (r['id'], r['client'], r['age'], r['horizon'], r['loss'], r['ours'],
              r['zurich'] if r['zurich'] is not None else '-', r['aviva']))
    print('\nWrote tests/out/compare_profilers.csv and .json')


if __name__ == '__main__':
    main()
