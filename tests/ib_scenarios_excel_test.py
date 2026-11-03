"""The IB illustration page (oneoff/ib_scenarios.html) vs the IB workbook (Projections sheet).

The page's example tables are built by scenRows() in the page. This test sets the page and the workbook to the
same plan, at a flat growth rate the workbook can take (Projections C36), and compares every policy year:
contributions (A), growth to date (B), charges to date (C), tax to date (D), value if encashed (F) and the policy
value. The workbook has no year-by-year returns and no guarantee floor, so only flat, positive rates are used and
the test checks that the floor never pays a top-up.

Run:   python tests/ib_scenarios_excel_test.py      (needs Excel, pywin32, selenium + Edge)
Output: per-case summary on stdout; tests/out/ib_scenarios_excel_diff.csv (every value compared)
"""
import csv, datetime as dt, pathlib, sys, time
from selenium import webdriver
from selenium.webdriver.edge.options import Options

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import excel_parity_test as T  # noqa: E402  (workbook driver and the A-F extraction)
from excel_com import ExcelSession  # noqa: E402

PAGE = ROOT / 'oneoff' / 'ib_scenarios.html'
OUT = HERE / 'out'
TOL = 0.01
D = dt.date

# sd / comm in % as entered on the page; rate = flat gross growth % (returns entered before the fund charge)
CASES = [
    dict(id='S1', desc='B3, SP 750k, SS75 with guarantee 85%, special deal +1%, commission 2% (allocation 101%), 6%, 10 yrs',
         code='B3', ph='individual', sp=750000, fund='ss75', gtee=True, sd=1, comm=2, rate=6, years=10),
    dict(id='S2', desc='as S1 without the guarantee',
         code='B3', ph='individual', sp=750000, fund='ss75', gtee=False, sd=1, comm=2, rate=6, years=10),
    dict(id='S3', desc='B3, SP 750k, SS75 with guarantee, no special deal, standard commission (allocation 100%), 4%, 5 yrs',
         code='B3', ph='individual', sp=750000, fund='ss75', gtee=True, sd=0, comm=2, rate=4, years=5),
    dict(id='S4', desc='D5, SP 200k, SS50 with guarantee 90%, commission 4% above standard (allocation below 100%), corporate, 5%, 12 yrs',
         code='D5', ph='corporate', sp=200000, fund='ss50', gtee=True, sd=0, comm=4, rate=5, years=12),
    dict(id='S5', desc='C2, SP 100k, SS30 without guarantee, special deal +0.5%, exempt, 3%, 8 yrs',
         code='C2', ph='exempt', sp=100000, fund='ss30', gtee=False, sd=0.5, comm=None, rate=3, years=8),
]
START = D(2026, 11, 1)
DOB = D(START.year - 50, START.month, START.day)   # the page's placeholder age of 50 (it asks for no date of birth)


def page_rows(d, c):
    """Set the page to case c and return its example rows (scenRows) and plan details."""
    return d.execute_script("""
      var c = arguments[0];
      S.code = c.code; S.ph = c.ph; S.sp = c.sp; S.fund = c.fund; S.sd = c.sd;
      S.startStr = c.start; onFundChange(); S.gtee = c.gtee;
      S.comm = c.comm == null ? baseCommPct() : c.comm;
      var rates = []; for (var i = 0; i < c.years; i++) rates.push(c.rate);
      var sc = { title: c.id, years: c.years, rates: rates, src: 'flat' };
      S.scenRates = rates;
      var R = runScen(sc), inp = planInp(guaranteeOn());
      return { rows: scenRows(R, c.years), start: R.p.fundByYear[0], topUps: R.p.gteeTopUp, useG: R.useG,
               alloc: ibSpAllocationRate(inp), comm: ibSpUpRate(inp), spUpOverride: inp.spUpOverride, specialDeal: inp.specialDeal };
    """, dict(c, start=START.isoformat()))


class RateX:
    """Passes everything to the workbook session, but sets the growth cap (C36) to the case's flat rate."""
    def __init__(self, x, rate):
        self.x, self.rate = x, rate

    def set(self, sheet, addr, value):
        self.x.set(sheet, addr, self.rate if addr == 'C36' else value)

    def __getattr__(self, k):
        return getattr(self.x, k)


def main():
    OUT.mkdir(exist_ok=True)
    o = Options(); o.add_argument('--headless=new')
    d = webdriver.Edge(options=o)
    d.get(PAGE.as_uri())
    d.execute_script('localStorage.clear(); location.reload();'); time.sleep(1.5)
    pages = {c['id']: page_rows(d, c) for c in CASES}
    d.quit()

    out, fails = [], 0
    with ExcelSession(T.IB_XLSX) as x:
        for c in CASES:
            pg = pages[c['id']]
            xc = dict(id=c['id'], code=c['code'], ph=c['ph'], dob=DOB, start=START, sp=c['sp'], rp=0, freq='monthly', esc=0,
                      allocs={c['fund']: 100}, gmab={c['fund']: pg['useG']}, income=None,
                      specialDeal=pg['specialDeal'], spUpOverride=pg['spUpOverride'])
            ex = T.ib_excel_run(RateX(x, c['rate'] / 100.0), xc)
            yrs = T.ib_excel_years(ex)
            checks = [('growth rate used (C38)', None, T.num(ex['C38']), c['rate'] / 100.0),
                      ('SP allocation rate (C67)', None, T.num(ex['C67']), pg['alloc']),
                      ('SP commission used (C66)', None, T.num(ex['C66']), pg['comm']),
                      ('guarantee top-ups (must be 0 to compare)', None, 0.0, pg['topUps'])]
            for r in pg['rows']:
                X, y = yrs[r['year']], r['year']
                checks += [('A contributions to date', y, X['A'], r['contrib']),
                           ('B growth to date', y, X['B'], r['growth']),
                           ('C charges to date', y, X['C'], r['charges']),
                           ('D tax to date', y, X['D'], r['tax']),
                           ('F value if encashed', y, X['F'], r['encash']),
                           ('policy value', y, X['fund'], r['fund']),
                           # the table's split of C: charges without the exit charge, and the exit charge
                           ('C = charges ex exit charge + exit charge', y, X['C'], r['chargesExExit'] + r['exitCharge']),
                           ('policy value = A + B - charges - tax paid + top-ups', y, X['fund'],
                            r['contrib'] + r['growth'] - r['chargesExExit'] - r['taxPaid'] + r['topUps'])]
            n_bad = 0
            for field, y, xv, pv in checks:
                tol = 1e-9 if y is None else TOL
                ok = abs(xv - pv) <= tol
                n_bad += not ok
                out.append(dict(case=c['id'], field=field, year=y, excel=xv, page=pv, diff=pv - xv, ok=ok))
            fails += n_bad
            print('[%s] %s  %d checks, %d mismatches  %s' % ('PASS' if not n_bad else 'FAIL', c['id'], len(checks), n_bad, c['desc']))
            for r in [r for r in out if r['case'] == c['id'] and not r['ok']][:8]:
                print('        - %-40s yr %-4s excel %-14.2f page %-14.2f diff %.4f' % (r['field'], r['year'], r['excel'], r['page'], r['diff']))
    with open(OUT / 'ib_scenarios_excel_diff.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()))
        w.writeheader(); w.writerows(out)
    print('\nTOTAL: %d checks, %d mismatches (details: tests/out/ib_scenarios_excel_diff.csv)' % (len(out), fails))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
