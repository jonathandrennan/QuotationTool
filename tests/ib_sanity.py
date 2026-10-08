"""Scratch sanity check for engine_ib.js, loaded inside the real page in headless Edge.
Not part of the app. Run: python "Quotation Tool/tests/ib_sanity.py"
"""
import json, pathlib
from selenium import webdriver
from selenium.webdriver.edge.options import Options

HERE = pathlib.Path(__file__).resolve().parent
QT = HERE.parent
URL = (QT / 'quotation_tool.html').resolve().as_uri()

o = Options()
o.add_argument('--headless=new')
o.set_capability('ms:loggingPrefs', {'browser': 'ALL'})
d = webdriver.Edge(options=o)
d.get(URL)

cases = [
    ("SP only, D5, 100% Strategy Select 30, individual", {
        "dobStr": "1963-08-28", "startStr": "2025-09-17", "code": "D5", "policyholderType": "individual",
        "contribution": 100000, "rp": 0, "freq": "monthly", "esc": 0,
        "diyAllocs": {"ss30": 100}, "diyGmab": {},
        "incomeType": "none", "incomeValue": 0, "incomeStartAge": None, "incomeEscalationPct": 0,
        "spUpOverride": None, "rateOverride": None
    }),
    ("SP+RP, K1, 100% Euro Cash, individual", {
        "dobStr": "1980-01-01", "startStr": "2025-01-01", "code": "K1", "policyholderType": "individual",
        "contribution": 50000, "rp": 500, "freq": "monthly", "esc": 0,
        "diyAllocs": {"cash": 100}, "diyGmab": {},
        "incomeType": "none", "incomeValue": 0, "incomeStartAge": None, "incomeEscalationPct": 0,
        "spUpOverride": None, "rateOverride": None
    }),
    ("SP only + 5% income, A1, exempt", {
        "dobStr": "1960-01-01", "startStr": "2025-01-01", "code": "A1", "policyholderType": "exempt",
        "contribution": 200000, "rp": 0, "freq": "monthly", "esc": 0,
        "diyAllocs": {"ss50": 100}, "diyGmab": {},
        "incomeType": "custom_pct", "incomeValue": 5, "incomeStartAge": 65, "incomeEscalationPct": 0,
        "spUpOverride": None, "rateOverride": None
    }),
]

for label, inp in cases:
    print('===', label, '===')
    result = d.execute_script("return runIbQuote(arguments[0]);", inp)
    if result.get('errors'):
        print('  ERRORS:', result['errors']); continue
    p = result['p']
    print('  rate', round(result['rate'] * 100, 3), 'netRate', round(p['netRate'] * 100, 3), 'riy', round(p['riy'] * 100, 3))
    print('  initialComm', round(result['initialComm'], 2), 'portfolioSri', round(result['portfolioSri'], 2))
    for row in p['rows']:
        check = row['A'] + row['B'] - row['C'] - row['D'] - row['E']
        print('  yr', row['year'], 'age', row['age'], 'A', row['A'], 'B', row['B'], 'C', row['C'], 'D(tax)', row['D'],
              'E(income)', row['E'], 'F(value)', row['F'], 'check', check, 'OK' if abs(check - row['F']) < 2 else 'MISMATCH')

errs = [l for l in d.get_log('browser') if l['level'] == 'SEVERE']
if errs:
    print('CONSOLE ERRORS:')
    for e in errs: print(' ', e['message'])
d.quit()
