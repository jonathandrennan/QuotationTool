"""Numeric parity check: Quotation Tool engines vs the existing prsa_tool.html / arf_tool.html.

Opens each existing tool headless in Edge, runs its own engine for a set of cases, then
injects the Quotation Tool engine files into the same page and runs them with identical
inputs. Any difference beyond 1e-9 is reported.

Run:  python "Quotation Tool/tests/parity_test.py"   (from the v4 folder or anywhere)
"""
import json, os, sys, pathlib
from selenium import webdriver
from selenium.webdriver.edge.options import Options

HERE = pathlib.Path(__file__).resolve().parent
QT = HERE.parent
V4 = QT.parent

def file_url(p):
    return pathlib.Path(p).resolve().as_uri()

def read(p):
    return pathlib.Path(p).read_text(encoding='utf-8')

PRSA_CASES = [
    dict(dob='1980-03-15', start='2026-10-01', nra=65, gender='M', prsaType='nonstandard', code='A5', strat='dis', sp=50000, ofv=0, rp=500, freq='monthly', esc=0),
    dict(dob='1975-07-02', start='2026-11-12', nra=66, gender='F', prsaType='nonstandard', code='B3', strat='ap_dy', sp=0, ofv=120000, rp=300, freq='quarterly', esc=3),
    dict(dob='1990-01-31', start='2026-10-01', nra=60, gender='M', prsaType='standard', code='E2', strat='lc_op', sp=8000, ofv=0, rp=80, freq='monthly', esc=2),
    dict(dob='1968-12-20', start='2026-10-05', nra=65, gender='F', prsaType='nonstandard', code='F4', strat='diy', sp=200000, ofv=0, rp=0, freq='annual', esc=0,
         diyAllocs={'ss50': 40, 'dm75': 30, 'etfw': 30}, diyGmab={'ss50': True}, spUpOverride=0.025),
    dict(dob='1985-05-05', start='2026-10-01', nra=68, gender='M', prsaType='nonstandard', code='A3', strat='lc_ba', sp=0, ofv=0, rp=1000, freq='annual', esc=0, rpUpOverride=0.005),
]

ARF_CASES = [
    dict(dob='1960-04-10', start='2026-10-01', code='A5', contribution=300000, diyAllocs={'ss50': 60, 'afie': 40}, diyGmab={}, incomeType='default', incomeValue=0, incomeStartAge=66, incomeEscalationPct=2),
    dict(dob='1955-09-22', start='2026-10-15', code='B2', contribution=150000, diyAllocs={'ss75': 50, 'hmw': 50}, diyGmab={'ss75': True}, incomeType='custom_amount', incomeValue=12000, incomeStartAge=71, incomeEscalationPct=3),
    dict(dob='1964-01-01', start='2026-10-01', code='F3', contribution=2500000, diyAllocs={'dm50': 100}, diyGmab={}, incomeType='custom_pct', incomeValue=7, incomeStartAge=62, incomeEscalationPct=2, spUpOverride=0.01),
    dict(dob='1950-06-30', start='2026-10-01', code='D1', contribution=40000, diyAllocs={'cash': 100}, diyGmab={}, incomeType='custom_amount', incomeValue=9000, incomeStartAge=76, incomeEscalationPct=2, rate1Override=0.045),
]

PRSA_KEYS = ['termMonths', 'grossRate', 'netRate', 'totalCharge', 'fundNC', 'fundWC', 'realMat', 'monthlyAnn',
             'annualIncomeReal', 'annualIncomeNominal', 'spUpfrontComm', 'rpUpfrontComm', 'blendedFundCharge', 'blendedGmab']
SNAP_KEYS = ['year', 'month', 'contribNC', 'fundNC', 'growthNC', 'fundWC', 'rpInYear', 'commInYear']

def close(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= 1e-9 * max(1, abs(a), abs(b))
    return a == b

def main():
    opts = Options()
    opts.add_argument('--headless=new')
    d = webdriver.Edge(options=opts)
    failures = 0
    try:
        common = read(QT / 'js' / 'quote_common.js')
        # ─── PRSA ───
        d.get(file_url(V4 / 'prsa_tool.html'))
        for i, c in enumerate(PRSA_CASES):
            old = d.execute_script("""
              var c = arguments[0];
              document.getElementById('inp-name').value = 'Test';
              document.getElementById('inp-dob').value = c.dob;
              document.getElementById('inp-start').value = c.start;
              document.getElementById('inp-nra').value = c.nra;
              document.getElementById('inp-sp').value = c.sp;
              document.getElementById('inp-ofv').value = c.ofv;
              document.getElementById('inp-rp').value = c.rp;
              state.gender = c.gender; state.prsaType = c.prsaType; state.code = c.code; state.strat = c.strat;
              state.freq = c.freq; state.esc = c.esc; state.gmab = false;
              state.diyAllocs = c.diyAllocs || {}; state.diyGmab = c.diyGmab || {};
              state.spUpOverride = c.spUpOverride == null ? null : c.spUpOverride;
              state.rpUpOverride = c.rpUpOverride == null ? null : c.rpUpOverride;
              quoteResult = null;
              try { runQuotation(); } catch (e) { if (!quoteResult) return {err: String(e)}; }
              return JSON.parse(JSON.stringify(quoteResult));
            """, c)
            if old is None or 'err' in old:
                print('PRSA case', i, 'old engine error:', old); failures += 1; continue
            new = d.execute_script(common + '\n' + read(QT / 'js' / 'engine_prsa.js') + """
              var c = arguments[0];
              var r = runPrsaQuote({dobStr:c.dob, startStr:c.start, nra:c.nra, gender:c.gender, prsaType:c.prsaType,
                code:c.code, strat:c.strat, diyAllocs:c.diyAllocs||{}, diyGmab:c.diyGmab||{}, sp:c.sp, ofv:c.ofv, rp:c.rp,
                freq:c.freq, esc:c.esc, spUpOverride:c.spUpOverride==null?null:c.spUpOverride, rpUpOverride:c.rpUpOverride==null?null:c.rpUpOverride});
              return JSON.parse(JSON.stringify({r:r, snaps:r.snapshots}));
            """, c)
            r = new['r']
            bad = [k for k in PRSA_KEYS if not close(old[k], r[k])]
            if len(old['snapshots']) != len(r['snapshots']):
                bad.append('snapshot count')
            else:
                for so, sn in zip(old['snapshots'], r['snapshots']):
                    bad += ['snap%d.%s' % (so['year'], k) for k in SNAP_KEYS if not close(so[k], sn[k])]
            if bad:
                failures += 1
                print('PRSA case %d FAIL: %s' % (i, bad[:10]))
                for k in bad[:5]:
                    if k in old: print('   ', k, old[k], r[k])
            else:
                print('PRSA case %d OK  fundWC=%.4f netIRR=%.6f comm=%.2f' % (i, r['fundWC'], r['netRate'], r['spUpfrontComm'] + r['rpUpfrontComm']))
        logs = [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
        if logs: print('PRSA browser errors:', logs[:3])

        # ─── ARF ───
        d.get(file_url(V4 / 'arf_tool.html'))
        for i, c in enumerate(ARF_CASES):
            old = d.execute_script("""
              var c = arguments[0];
              state.dob = c.dob; state.startDate = c.start; state.code = c.code; state.version = c.code.charAt(0);
              state.contribution = c.contribution; state.diyAllocs = c.diyAllocs; state.diyGmab = c.diyGmab;
              state.incomeType = c.incomeType; state.incomeValue = c.incomeValue; state.incomeStartAge = c.incomeStartAge;
              state.incomeEscalationPct = c.incomeEscalationPct;
              state.spUpOverride = c.spUpOverride == null ? null : c.spUpOverride;
              state.rate1Override = c.rate1Override == null ? null : c.rate1Override;
              state.rate2Override = c.rate2Override == null ? null : c.rate2Override;
              recomputeResults();
              return JSON.parse(JSON.stringify(illResult));
            """, c)
            new = d.execute_script(common + '\n' + read(QT / 'js' / 'engine_arf.js') + """
              var c = arguments[0];
              var r = runArfQuote({dobStr:c.dob, startStr:c.start, code:c.code, contribution:c.contribution,
                diyAllocs:c.diyAllocs, diyGmab:c.diyGmab, incomeType:c.incomeType, incomeValue:c.incomeValue,
                incomeStartAge:c.incomeStartAge, incomeEscalationPct:c.incomeEscalationPct,
                spUpOverride:c.spUpOverride==null?null:c.spUpOverride,
                rate1Override:c.rate1Override==null?null:c.rate1Override, rate2Override:c.rate2Override==null?null:c.rate2Override});
              return JSON.parse(JSON.stringify(r));
            """, c)
            if 'errors' in new:
                print('ARF case', i, 'new engine validation error:', new['errors']); failures += 1; continue
            bad = []
            for k in ['rate1', 'rate2']:
                if not close(old[k], new[k]): bad.append(k)
            for p in ['p1', 'p2']:
                for k in ['fundZeroYear', 'netRate', 'riy', 'chargeRate', 'spUpRate']:
                    if not close(old[p][k], new[p][k]): bad.append(p + '.' + k)
                if json.dumps(old[p]['fundByYear']) != json.dumps(new[p]['fundByYear']): bad.append(p + '.fundByYear')
                if json.dumps(old[p]['commRows']) != json.dumps(new[p]['commRows']): bad.append(p + '.commRows')
                oldrows = old[p]['rows']
                newrows = [{k: v for k, v in rw.items() if k != 'age'} for rw in new[p]['rows']]
                if json.dumps(oldrows, sort_keys=True) != json.dumps(newrows, sort_keys=True): bad.append(p + '.rows')
            if bad:
                failures += 1
                print('ARF case %d FAIL: %s' % (i, bad))
            else:
                print('ARF case %d OK  rate1=%.4f E40/last=%s deplete=%s/%s' % (i, new['rate1'], new['p1']['rows'][-1]['E'], new['p1']['fundZeroYear'], new['p2']['fundZeroYear']))
        logs = [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
        if logs: print('ARF browser errors:', logs[:3])
    finally:
        d.quit()
    print('FAILURES:', failures)
    sys.exit(1 if failures else 0)

if __name__ == '__main__':
    main()
