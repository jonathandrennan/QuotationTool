// engine_runner.js — loads the Quotation Tool calculation engines in Node (same load order as
// quotation_tool.html, data files first) and runs a batch of quotes.
//
// Usage:  node tests/engine_runner.js <cases.json> <out.json>
//   cases.json = [ { id, product: 'prsa'|'arf'|'ib', inp: {...} }, ... ]
//   out.json   = [ { id, product, result } ]   (result = runPrsaQuote/runArfQuote/runIbQuote output)
// Also exposes a few data tables (CODES, FUNDS, ARF_FUNDS, IB_CODES, ...) under the id "__data__".
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JS = path.resolve(__dirname, '..', 'js');
const FILES = ['prsa_data.js', 'arf_data.js', 'ib_data.js', 'quote_common.js',
               'engine_prsa.js', 'engine_arf.js', 'engine_ib.js'];

const ctx = vm.createContext({ console: console });
for (const f of FILES) {
  vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), ctx, { filename: f });
}

const [, , casesPath, outPath] = process.argv;
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
ctx.__cases = cases;
const out = vm.runInContext(`
  (function () {
    var res = __cases.map(function (c) {
      var fn = c.product === 'prsa' ? runPrsaQuote : c.product === 'arf' ? runArfQuote : runIbQuote;
      var r;
      try { r = fn(c.inp); } catch (e) { r = { errors: ['EXCEPTION: ' + e.message] }; }
      // extra PRSA diagnostics not returned by runPrsaQuote
      if (c.product === 'prsa' && !r.errors) {
        r._annFactor = (r.nra - r.ageAtStart <= 5) ? 1 / ANN_IL_QUOTE_RATE
          : prsaAnnuityFactor(r.nra, c.inp.gender, ANN_INTEREST, ANN_ESC, ANN_GUARANTEE);
        r._termFmf = prsaTerm(c.inp.dobStr, c.inp.startStr, c.inp.nra).fmf;
        // Per-month growth / charge rates exactly as engine_prsa.js the monthly loop compute them
        // (diagnostic only — used to localise glidepath differences month by month).
        var cc = CODES[c.inp.code], s = r.stratObj, mo = [];
        var g0 = Math.pow(1 + r.blendedGross, 1/12) - 1;
        var ch0 = (1 - Math.pow(1 - cc.admin, 1/12)) + (1 - Math.pow(1 - r.blendedFundCharge, 1/12))
                + (r.blendedGmab > 0 ? (1 - Math.pow(1 - r.blendedGmab, 1/12)) : 0);
        for (var m = 1; m <= r.termMonths; m++) {
          var g = g0, ch = ch0;
          if (r.isGlidepath) {
            var gp = getGP(s.gpKey, r.termMonths - m + 1);
            g  = Math.pow(1 + gp.gross, 1/12) - 1;
            ch = (1 - Math.pow(1 - cc.admin, 1/12)) + (1 - Math.pow(1 - gp.amc, 1/12))
               + (prsaGmabOn(s, r.termMonths - m + 1) ? (1 - Math.pow(1 - gp.gmab, 1/12)) : 0);
          }
          mo.push([g, ch]);
        }
        r._monthlyRates = mo;
      }
      if (c.product === 'ib' && !r.errors) {
        r._spAlloc = ibSpAllocationRate(c.inp);
        r._rpAlloc = ibRpAllocationRate(c.inp);
      }
      return { id: c.id, product: c.product, result: r };
    });
    // glidepath blended metrics for every strategy and months-to-retirement 0..540
    var gpt = {};
    [['standard', STRATS_STD], ['nonstandard', STRATS_NS]].forEach(function (p) {
      p[1].forEach(function (s) {
        if (!s.gpKey) return;
        var a = [];
        for (var m = 0; m <= 540; m++) { var g = getGP(s.gpKey, m); a.push([g.gross, g.amc, prsaGmabOn(s, m) ? g.gmab : 0]); }
        gpt[p[0] + '/' + s.id] = a;
      });
    });
    res.push({ id: '__data__', result: { GP: gpt, ILT15_QX_M: ILT15_QX_M, ILT15_QX_F: ILT15_QX_F,
      CODES: CODES, FUNDS: FUNDS, ARF_FUNDS: ARF_FUNDS, ARF_CODES: ARF_CODES,
      IB_CODES: IB_CODES, IB_TIERED_BONUS: IB_TIERED_BONUS, CONSTANTS: {
        MAX_INVESTMENT_RETURN: MAX_INVESTMENT_RETURN, INFLATION: INFLATION, ANN_INTEREST: ANN_INTEREST,
        ANN_ESC: ANN_ESC, ANN_GUARANTEE: ANN_GUARANTEE, ANN_IL_QUOTE_RATE: ANN_IL_QUOTE_RATE,
        IB_GOVT_LEVY: IB_GOVT_LEVY, IB_TAX_RATES: IB_TAX_RATES } } });
    return JSON.stringify(res);
  })()
`, ctx);
fs.writeFileSync(outPath, out);
