"""Live check: feeds answer sets into the real Allianz Global Life risk profile site's form and compares
the site's own results (its state, RESULTS and ELIGIBLE_PRODUCTS) with js/risk_profiler.js.
Nothing is submitted: the site works entirely in the browser.

Run:  python tests/risk_profiler_live_check.py [number of random cases, default 60]
Needs internet access. Re-run it if the site changes (it was last checked against build main-MEMR5U7I).
"""
import json, pathlib, random, sys, time
from selenium import webdriver
from selenium.webdriver.edge.options import Options

QT = pathlib.Path(__file__).resolve().parent.parent; N = int(sys.argv[1]) if len(sys.argv) > 1 else 60
o = Options(); o.add_argument('--headless=new'); o.add_argument('--window-size=1400,1000')
d = webdriver.Edge(options=o)
d.get('https://riskprofile.allianzgloballife.ie/#/survey/questions')
# wait until the debug hook exists and the form behind it has been built
FORM_READY = """if (typeof window.logPrevAndNowState !== 'function') return false;
  var f = null, ol = console.log; console.log = function(a, b) { if (a === 'form') f = b; };
  try { window.logPrevAndNowState(); } catch (e) {} console.log = ol;
  return !!(f && f.get && f.get('financialPosition'));"""
for _ in range(60):
    if d.execute_script(FORM_READY): break
    time.sleep(0.5)
else:
    print('site form did not load'); d.quit(); sys.exit(2)
for f in ('risk_profiler_data.js', 'risk_profiler.js'):
    d.execute_script("var s = document.createElement('script'); s.textContent = arguments[0]; document.head.appendChild(s);", (QT / 'js' / f).read_text(encoding='utf-8'))

# In the page: grab the form, convert our answers to the site's form value, set it, read the site's state
setup = (d.execute_script(r"""try {
  var ol = console.log; console.log = function(a, b) { if (a === 'form') window.__f = b; };
  window.logPrevAndNowState(); console.log = ol;
  var RP = RiskProfiler;
  window.__toSite = function(A, dob) {
    var pick = function(id) { var q = RP.question(id), op = RP.option(q, A[id]); return op ? { text: 'x', id: q.src + '-answer___' + op.src, weight: op.siteScore != null ? op.siteScore : op.score } : null; };
    var pq = RP.question('products'), aq = RP.question('assetView'), e7 = {}, e8 = {};
    pq.options.forEach(function(op) {
      var v = pq.columns.filter(function(c) { return ((A.products || {})[c.id] || []).indexOf(op.id) >= 0; }).map(function(c) { return c.src; });
      e7['eK_7-answer___' + op.src + '-' + op.score] = v.length ? v : null;
    });
    aq.rows.forEach(function(r) { var op = RP.option(aq, (A.assetView || {})[r.id]); e8['eK_8-answer___' + r.src + '-100'] = op ? op.src : null; });
    return {
      socioPersonalInformation: { sPI_0: { first: 'Test', last: 'Case' }, sPI_1: dob, sPI_2: pick('education'), sPI_3: pick('employment'), sPI_4: pick('financeWork'), sPI_5: pick('health'), sPI_6: pick('dependants') },
      experienceKnowledge: { eK_7: e7, eK_8: e8 },
      financialPosition: { fP_9: pick('income'), fP_10: pick('commitments'), fP_11: pick('horizon'), fP_12: pick('assets') },
      riskTolerance: { rT_13: pick('tolerance') },
      sustainability: { s_15: { id: 's_15-answer___H10' }, s_16: { id: 's_16-answer___H10' }, s_17: { id: 's_17-answer___H10' } },
      productQuestions: { pQ_14: { id: A.purpose } }
    };
  };
  window.__run = function(A, dob) {
    window.__f.patchValue(window.__toSite(A, dob));
    var st = window.logPrevAndNowState(), R = st.RESULTS || {};
    // compare by position in the site's product list (ours is copied in the same order), and check each row's data
    var all = st.ELIGIBLE_PRODUCTS || [], elig = [];
    all.forEach(function(p, i) { if (p.elegible && p.elegibleProductFundsCombination) elig.push(i); });
    window.__rows = all.map(function(p, i) { var f = RP.config.eligibleFunds[i];
      return f && f.product === p.product && f.complexity === p.complexityRating && f.risk === p.riskRating && f.fund.toLowerCase() === p.fundsManagedSolution.toLowerCase() ? '' : i + ': site ' + p.product + ' / ' + p.fundsManagedSolution + ' / ' + p.complexityRating + ' / ' + p.riskRating; }).filter(Boolean);
    var ours = RP.evaluate(A, { dob: dob, purpose: A.purpose, siteQuirks: true });   // without our corrections, to match the site
    var site = [R.experience, R.finalExperienceAndKnowledgeProfile, R.finalExperienceAndKnowledgeProfileInNumber, R.personalInformation, R.earningCapacity,
                R.adjustedEarningCapacity, R.totalAssets, R.financialSustainability, R.riskProfile, R.tolleranceForTheRiskProfile, R.finalSustenaibleRiskProfile, elig.length];
    var X = ours.experience, S = ours.steps;
    var mine = [X.score === 0 ? 'LOW' : (isNaN(X.score) ? 'HIGH' : X.score < 100 ? 'LOW' : X.score < 200 ? 'MEDIUM' : 'HIGH'), X.level, X.number, S.personal, S.earningCapacity,
                S.adjustedEarningCapacity, S.totalAssets, S.financialCapacity, ours.tolerance, ours.profileRaw, ours.sri, ours.eligible.length];
    return { site: site, ours: mine, siteFunds: elig, ourFunds: ours.eligible.map(function(f) { return RP.config.eligibleFunds.indexOf(f); }), rows: window.__rows };
  };
  return "ok " + !!window.__f; } catch (e) { return "ERR " + e + " " + e.stack; }
"""))
if setup != 'ok true':
    print('could not reach the form:', setup); d.quit(); sys.exit(2)

def opts(qid): return d.execute_script("return RiskProfiler.question(arguments[0]).options.map(function(o){ return o.id; })", qid)
Q = {q: opts(q) for q in ('education', 'employment', 'financeWork', 'health', 'dependants', 'income', 'commitments', 'horizon', 'assets', 'tolerance')}
PRODUCTS = ['govbonds', 'bonds', 'unitlinked', 'guaranteed', 'funds']
rnd = random.Random(20261012)

def products():
    k = rnd.choice(['none', 'empty', 'one', 'two', 'noneplus', 'many'])
    if k == 'empty': return {}
    if k == 'none': return {'known': ['none'], 'held': ['none']}
    if k == 'one': p = rnd.choice(PRODUCTS); return {'known': [p], 'held': rnd.choice([[p], []])}
    if k == 'noneplus': return {'known': ['none'], 'held': [rnd.choice(PRODUCTS)]}   # "None" in one column, a product in the other
    ps = rnd.sample(PRODUCTS, 2 if k == 'two' else rnd.randint(3, 5))
    return {'known': ps, 'held': rnd.sample(ps, rnd.randint(0, len(ps)))}

def case():
    A = {q: rnd.choice(v) for q, v in Q.items()}
    A['products'] = products()
    A['assetView'] = {r: v for r in ('equity', 'cash', 'bonds') for v in [rnd.choice([None, 'low', 'high'])] if v}
    A['purpose'] = rnd.choice(['A', 'A', 'C', 'B'])
    return A

today = time.strftime('%Y-%m-%d')
y, m, dd = map(int, today.split('-'))
dobs = ['1985-06-15', '%04d-%02d-%02d' % (y - 80, m, dd), '%04d-%02d-%02d' % (y - 81, m, dd), '1940-01-01']
cases = []
# every liquid assets × horizon cell with the top two tolerance answers, at 80 and 81
for a in Q['assets']:
    for h in Q['horizon']:
        for t in ('buymore', 'buyadviser'):
            for dob in dobs[1:3]:
                A = case(); A.update(assets=a, horizon=h, tolerance=t); cases.append((A, dob))
# every tolerance answer at each financial capacity extreme
for t in Q['tolerance']:
    for a, h in (('low', 'short'), ('mid', 'medium'), ('high', 'long')):
        A = case(); A.update(assets=a, horizon=h, tolerance=t); cases.append((A, dobs[0]))
# Na experience, and random cases
A = case(); A.update(education='other', financeWork='no', products={'known': ['none'], 'held': ['none']}, assetView={'equity': 'low', 'cash': 'high', 'bonds': 'high'}); cases.append((A, dobs[0]))
cases += [(case(), rnd.choice(dobs)) for _ in range(N)]

bad = 0
for i, (A, dob) in enumerate(cases):
    r = d.execute_script("return window.__run(arguments[0], arguments[1])", A, dob)
    ok = r['site'] == r['ours'] and r['siteFunds'] == r['ourFunds']
    if not ok:
        bad += 1
        if bad <= 10: print('MISMATCH', json.dumps(A), dob, '\n  site', r['site'], '\n  ours', r['ours'])
print('fund table rows that differ from the site:', r['rows'] or 'none')
print('%d cases checked against the live site, %d mismatch(es)' % (len(cases), bad))
d.quit()
sys.exit(1 if bad else 0)
