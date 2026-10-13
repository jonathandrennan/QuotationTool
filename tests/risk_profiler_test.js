// Checks the Risk Profiler engine against the Allianz Global Life risk profile website.
//
// SITE below is a line-by-line transcription of the site's scoring (chunk-DEWIXWZV.js, build
// main-MEMR5U7I: the `n` helpers and SurveyService._calculation), working on the site's own answer
// shape. The test walks every answer combination through both and requires identical numbers (with
// ctx.siteQuirks, which turns off the engine's corrections). FIXED is the same transcription with only
// the corrections applied, and the corrected engine must match it on every combination too. Then
// hand-worked cases.
//
// Run:  node tests/risk_profiler_test.js
const path = require('path');
const RP = require(path.join(__dirname, '..', 'js', 'risk_profiler.js'));
const CFG = RP.config;

let fails = 0;
function eq(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) { fails++; console.log('  FAIL', msg, '\n    expected', JSON.stringify(expected), '\n    got     ', JSON.stringify(actual)); }
}

// ─── The site's scoring, transcribed ─────────────────────────────────────────────────
const n = {
  C5: 0.2, E5: (t, e) => Math.max(...t, ...e) * n.C5, Q11: (t) => Math.max(t), Q31: (t) => t.reduce((e, i) => e + i, 0),
  C8: 0.6, E8: (t) => n.C8 * t, C9: 0.2, E9: (t) => n.C9 * t, C11: (t, e, i) => t + e + i,
  J11: (t) => (t < 100 ? 'LOW' : t >= 100 && t < 200 ? 'MEDIUM' : 'HIGH'),
  C19: 25, C20: 10, C21: 65, E19: (t) => Math.max(t) * n.C19, E20: (t) => Math.max(t) * n.C20, E21: (t) => Math.max(t) * n.C21,
  C24: (t) => Math.round(t.reduce((e, i) => e + i, 0)), J24: (t) => (t < 35 ? 1 : t >= 35 && t < 65 ? 2 : 3),
  J33: (t, e) => { const i = { 2: [1, 2, 3], 3: [2, 2, 3] }; return t < 1 || e < 1 ? 0 : i[e][t - 1]; },
  J45: (t, e) => { const i = { 1: [1, 2, 2], 2: [1, 2, 3], 3: [1, 3, 3] }; return t < 1 || e < 1 ? 0 : i[t][e - 1]; },
  J57: (t, e) => { const i = { 1: [1, 1, 2], 2: [2, 2, 3], 3: [2, 3, 3] }; return t < 1 || e < 1 ? 0 : i[t][e - 1]; },
  J66: (t, e) => { const i = { 1: [1, 2, 3], 2: [2, 2, 3], 3: [2, 3, 3] }; return t < 1 || e < 1 ? 0 : i[t][e - 1]; },
  J82: (t, e) => { const i = { 1: [1, 1, 2, 3, 4, 5, 6], 2: [1, 2, 3, 4, 5, 6, 6], 3: [1, 2, 3, 4, 5, 6, 7] }; return t < 1 || e < 1 ? 0 : i[t][e - 1]; },
  H93: (t, e, i, s) => (t + e + i === 0 ? 'Na' : s), H94: (t, e) => (t === 7 && e > 80 ? 6 : t),
  I93: (t) => (t === 'LOW' ? 1 : t === 'MEDIUM' ? 2 : 3),
  ELIGIBLE_PRODUCT: (t, e, i, s) => e && s && t <= e && i <= s
};
// e = the site's form value; age = moment().diff(dob, 'years'), or -1 with no date of birth
function SITE(e, age) {
  const sp = e.socioPersonalInformation, ek = e.experienceKnowledge, fp = e.financialPosition;
  let s5 = [0]; sp.sPI_4 && sp.sPI_4.weight && (s5 = [sp.sPI_4.weight]);
  let a5 = [0]; sp.sPI_2 && sp.sPI_2.weight && (a5 = [sp.sPI_2.weight]);
  const i = n.E5(s5, a5);
  let a8 = [];
  Object.keys(ek.eK_7).forEach((r) => { if ((ek.eK_7[r] || []).length > 0) a8 = [...a8, Number(r.split('___')[1].split('-')[1])]; });
  const s = n.E8(n.Q11(a8));
  let a9 = [0];
  Object.keys(ek.eK_8).forEach((k) => {
    if ((ek.eK_8[k] || []).length > 0) {
      const l = k.split('___')[1]; let c = Number(l.split('-')[1]);
      l.split('-')[0] == 'O31' && ek.eK_8[k] == 'eK_8-know' && (c = 0);
      (l.split('-')[0] == 'O33' || l.split('-')[0] == 'O35') && ek.eK_8[k] == 'eK_8-held' && (c = 0);
      a9 = [...a9, c];
    }
  });
  const a = n.E9(n.Q31(a9));
  const r = n.J11(n.C11(i, s, a));
  const f = n.J24(n.C24([sp.sPI_3 ? n.E19(sp.sPI_3.weight) : 0, sp.sPI_5 ? n.E20(sp.sPI_5.weight) : 0, sp.sPI_6 ? n.E21(sp.sPI_6.weight) : 0]));
  const P = fp.fP_9.weight, g = n.J33(f, P), Q = fp.fP_10.weight, G = n.J45(Q, g);
  const x = fp.fP_11.weight, w = fp.fP_12.weight, h = n.J57(x, w), T = n.J66(w, h);
  const M = e.riskTolerance.rT_13.weight, y = n.J82(T, M);
  const D = n.H93(i, s, a, r), K = age > -1 ? n.H94(y, age) : 0, E = n.I93(D);
  return { experience: r, personalInformation: f, earningCapacity: g, adjustedEarningCapacity: G, totalAssets: h,
           financialSustainability: T, riskProfile: M, tolleranceForTheRiskProfile: y, finalExperienceAndKnowledgeProfile: D,
           finalSustenaibleRiskProfile: K, finalExperienceAndKnowledgeProfileInNumber: E, e5: i, e8: s, e9: a };
}
// The site's calculation with the corrections, and nothing else changed:
//   tolerance 6 and 7 swapped; weights 0.25/0.10/0.65; J57 read (liquid assets, horizon); J66 fed adjusted
//   earning capacity; several products -> the highest; an experience total of 0 -> LOW
function FIXED(e, age) {
  const site = SITE(e, age), sp = e.socioPersonalInformation, ek = e.experienceKnowledge, fp = e.financialPosition;
  const rowsTicked = Object.keys(ek.eK_7).filter((k) => (ek.eK_7[k] || []).length > 0).map((k) => Number(k.split('___')[1].split('-')[1]));
  const s = n.E8(rowsTicked.length ? Math.max(...rowsTicked) : 0);
  const sum = n.C11(site.e5, s, site.e9), r = n.J11(sum);
  const f = n.J24(Math.round((sp.sPI_3 ? sp.sPI_3.weight : 0) * 0.25 + (sp.sPI_5 ? sp.sPI_5.weight : 0) * 0.10 + (sp.sPI_6 ? sp.sPI_6.weight : 0) * 0.65));
  const P = fp.fP_9.weight, g = n.J33(f, P), Q = fp.fP_10.weight, G = n.J45(Q, g);
  const x = fp.fP_11.weight, w = fp.fP_12.weight, h = n.J57(w, x), T = n.J66(G, h);
  const W = e.riskTolerance.rT_13.weight, M = W === 6 ? 7 : W === 7 ? 6 : W, y = n.J82(T, M);
  const K = age > -1 ? n.H94(y, age) : 0, E = n.I93(r);
  return { experience: r, personalInformation: f, earningCapacity: g, adjustedEarningCapacity: G, totalAssets: h,
           financialSustainability: T, riskProfile: M, tolleranceForTheRiskProfile: y, finalExperienceAndKnowledgeProfile: r,
           finalSustenaibleRiskProfile: K, finalExperienceAndKnowledgeProfileInNumber: E, e5: site.e5, e8: s, e9: site.e9 };
}

// Our answers -> the site's form value (ids from the "src" fields in risk_profiler_data.js)
const Qn = (id) => RP.question(id);
// the site's own weight for each answer (siteScore where ours is corrected)
const pick = (id, v) => { const q = Qn(id), o = RP.option(q, v); return o ? { id: q.src + '-answer___' + o.src, weight: o.siteScore != null ? o.siteScore : o.score } : null; };
function toSite(A) {
  const pq = Qn('products'), aq = Qn('assetView'), eK_7 = {}, eK_8 = {};
  pq.options.forEach((o) => {
    const v = pq.columns.filter((c) => ((A.products || {})[c.id] || []).indexOf(o.id) >= 0).map((c) => c.src);
    eK_7['eK_7-answer___' + o.src + '-' + o.score] = v.length ? v : null;
  });
  aq.rows.forEach((r) => { const o = RP.option(aq, (A.assetView || {})[r.id]); eK_8['eK_8-answer___' + r.src + '-100'] = o ? o.src : null; });
  return {
    socioPersonalInformation: { sPI_2: pick('education', A.education), sPI_3: pick('employment', A.employment), sPI_4: pick('financeWork', A.financeWork),
                                sPI_5: pick('health', A.health), sPI_6: pick('dependants', A.dependants) },
    experienceKnowledge: { eK_7, eK_8 },
    financialPosition: { fP_9: pick('income', A.income), fP_10: pick('commitments', A.commitments), fP_11: pick('horizon', A.horizon), fP_12: pick('assets', A.assets) },
    riskTolerance: { rT_13: pick('tolerance', A.tolerance) }
  };
}
const same = (a, b) => (Number.isNaN(a) && Number.isNaN(b)) || a === b;
function compare(A, ctx, age, label) { return compareTo(SITE, true, A, ctx, age, 'site mismatch ' + label) && compareTo(FIXED, false, A, ctx, age, 'corrected mismatch ' + label); }
function compareTo(REF, quirks, A, ctx, age, label) {
  const ours = RP.evaluate(A, Object.assign({ siteQuirks: quirks }, ctx)), site = REF(toSite(A), age == null ? -1 : age), X = ours.experience, St = ours.steps;
  const pairs = [[X.e5, site.e5], [X.e8, site.e8], [X.e9, site.e9], [X.level, site.finalExperienceAndKnowledgeProfile],
    [X.number, site.finalExperienceAndKnowledgeProfileInNumber], [St.personal, site.personalInformation], [St.earningCapacity, site.earningCapacity],
    [St.adjustedEarningCapacity, site.adjustedEarningCapacity], [St.totalAssets, site.totalAssets], [St.financialCapacity, site.financialSustainability],
    [ours.tolerance, site.riskProfile], [ours.profileRaw, site.tolleranceForTheRiskProfile], [ours.sri, site.finalSustenaibleRiskProfile]];
  if (!pairs.every(([o, s]) => same(o, s))) { if (fails < 20) eq(pairs.map((p) => p[0]), pairs.map((p) => p[1]), label + ' ' + JSON.stringify(A)); else fails++; return false; }
  return true;
}

const base = {
  education: 'degree', employment: 'employee', financeWork: 'no', health: 'verygood', dependants: 'none',
  products: { known: ['funds'], held: ['funds'] }, assetView: { equity: 'high', cash: 'low', bonds: 'low' },
  income: 'high', commitments: 'none', horizon: 'long', assets: 'high', tolerance: 'buymore'
};
const ctx = { dob: '1985-06-15', purpose: 'A', atDate: '2026-10-12' };
const withA = (o) => Object.assign({}, base, o);
const ids = (id) => Qn(id).options.map((o) => o.id);

// 1. Every combination of the financial position and tolerance answers, at three ages, matches the site
//    (with siteQuirks) and the corrected transcription (without)
let combos = 0;
for (const employment of ids('employment')) for (const health of ids('health')) for (const dependants of ids('dependants'))
  for (const income of ids('income')) for (const commitments of ids('commitments')) for (const horizon of ids('horizon'))
    for (const assets of ids('assets')) for (const tolerance of ids('tolerance'))
      for (const [dob, age] of [['1985-06-15', 41], ['1946-10-12', 80], ['1945-10-12', 81]]) {
        combos++;
        compare(withA({ employment, health, dependants, income, commitments, horizon, assets, tolerance }), Object.assign({}, ctx, { dob }), age, 'financial');
      }
console.log('  financial combinations checked against the site and the corrected transcription: ' + combos);

// 2. Every combination of the experience answers (all 4^6 tick patterns, all asset-class answers) matches the site
const pq = Qn('products'), cells = [[], ['known'], ['held'], ['known', 'held']];
const avOpts = [undefined, 'low', 'high'];
let ecombos = 0;
for (const education of ids('education')) for (const financeWork of ids('financeWork'))
  for (let m = 0; m < 4096; m++) {
    const products = { known: [], held: [] };
    pq.options.forEach((o, k) => cells[(m >> (2 * k)) & 3].forEach((c) => products[c].push(o.id)));
    for (let v = 0; v < 27; v++) {
      const assetView = {};
      ['equity', 'cash', 'bonds'].forEach((r, k) => { const x = avOpts[Math.floor(v / Math.pow(3, k)) % 3]; if (x) assetView[r] = x; });
      ecombos++;
      compare(withA({ education, financeWork, products, assetView }), ctx, 41, 'experience');
    }
  }
console.log('  experience combinations checked against the site and the corrected transcription: ' + ecombos);

// 3. Hand-worked cases
let r = RP.evaluate(base, ctx);
// personal 0.25*80 + 0.10*100 + 0.65*100 = 95 -> 3; earning 3; adjusted 3; wealth 3; capacity 3; buy more scores 7 -> 7
eq([r.complete, r.steps.personalScore, r.steps.personal, r.steps.adjustedEarningCapacity, r.steps.totalAssets, r.steps.financialCapacity, r.tolerance, r.sri, r.sriLabel],
   [true, 95, 3, 3, 3, 3, 7, 7, 'Very High'], 'strongest case -> 7');
eq(RP.evaluate(base, Object.assign({ siteQuirks: true }, ctx)).steps.personalScore, 9500, 'with siteQuirks: weights x100');
// experience: 0.2*200 + 0.6*250 + 0.2*300 = 40+150+60 = 250 -> HIGH
eq([Math.round(r.experience.score), r.experience.level, r.experience.number], [250, 'HIGH', 3], 'experience high');
// The weakest income side: 0.25*0 + 0.10*30 + 0.65*10 = 9.5 -> 10 -> level 1; income up to 100k -> earning 1;
// high commitments -> adjusted 1. With strong wealth (3) capacity is 3, with weak wealth (1) it is 1.
const weak = { employment: 'unemployed', health: 'notgood', dependants: 'three', income: 'low', commitments: 'high' };
r = RP.evaluate(withA(weak), ctx);
eq([r.steps.personalScore, r.steps.personal, r.steps.earningCapacity, r.steps.adjustedEarningCapacity, r.steps.financialCapacity, r.sri], [10, 1, 1, 1, 3, 7], 'weak earner, strong wealth: capacity 3');
eq(RP.evaluate(withA(Object.assign({}, weak, { assets: 'low', horizon: 'short' })), ctx).steps.financialCapacity, 1, 'weak earner, weak wealth: capacity 1');
// Income-side answers now matter: high commitments cut adjusted earning capacity to 2, and with wealth 2 the capacity is 2, so 7 -> 6
r = RP.evaluate(withA({ health: 'average', income: 'low', commitments: 'high', horizon: 'short' }), ctx);
eq([r.steps.personal, r.steps.earningCapacity, r.steps.adjustedEarningCapacity, r.steps.totalAssets, r.steps.financialCapacity, r.sri], [3, 3, 2, 2, 2, 6], 'commitments lower the rating');
eq(RP.evaluate(withA({ health: 'average', income: 'low', commitments: 'high', horizon: 'short', tolerance: 'buyadviser' }), Object.assign({ siteQuirks: true }, ctx)).sri, 7, 'with siteQuirks the same answers (and the answer the site scores 7) give 7');
// Wealth reads liquid assets as the row: (liquid, horizon) -> wealth, workbook values
const wealth = (assets, horizon) => RP.evaluate(withA({ assets, horizon }), ctx).steps.totalAssets;
const cells9 = [['low', 'short'], ['low', 'medium'], ['low', 'long'], ['mid', 'short'], ['mid', 'medium'], ['mid', 'long'], ['high', 'short'], ['high', 'medium'], ['high', 'long']];
eq(cells9.map(([a, h]) => wealth(a, h)), [1, 1, 2, 2, 2, 3, 2, 3, 3], 'wealth table (rows = liquid assets)');
// Financial capacity = adjusted earning capacity x wealth. With adjusted 3:
const cap = (assets, horizon, o) => RP.evaluate(withA(Object.assign({ assets, horizon }, o || {})), ctx).steps.financialCapacity;
eq(cells9.map(([a, h]) => cap(a, h)), [2, 2, 3, 3, 3, 3, 3, 3, 3], 'financial capacity with strong earnings');
eq(cells9.map(([a, h]) => cap(a, h, weak)), [1, 1, 2, 2, 2, 3, 2, 3, 3], 'financial capacity with weak earnings (= wealth)');
// Tolerance scores are out of display order: 1, 2, 5, 7, 4, 3, 6 (buy more is 7, buy more with an adviser 6)
eq(ids('tolerance').map((t) => RP.evaluate(withA({ tolerance: t }), ctx).sri), [1, 2, 5, 7, 4, 3, 6], 'tolerance options at capacity 3');
eq(ids('tolerance').map((t) => RP.evaluate(withA(Object.assign({}, weak, { tolerance: t, assets: 'low', horizon: 'short' })), ctx).sri), [1, 1, 4, 6, 3, 2, 5], 'tolerance options at capacity 1');
eq(ids('tolerance').map((t) => RP.evaluate(withA({ tolerance: t }), Object.assign({ siteQuirks: true }, ctx)).sri), [1, 2, 5, 6, 4, 3, 7], 'with siteQuirks: the site order 1, 2, 5, 6, 4, 3, 7');
// Age: only 7 is capped, only over 80; 29 February birthdays count on 28 February
const sriAt = (dob, atDate, o) => RP.evaluate(withA(o || {}), { dob, purpose: 'A', atDate });
eq([sriAt('1946-10-12', '2026-10-12').sri, sriAt('1945-10-13', '2026-10-12').sri, sriAt('1945-10-12', '2026-10-12').sri], [7, 7, 6], 'age 80 not capped, 81 capped');
eq(sriAt('1940-01-01', '2026-10-12', { tolerance: 'buyadviser' }).sri, 6, 'a 6 is not changed by age');
eq([RP.ageAt('2000-02-29', '2001-02-28'), RP.ageAt('2000-02-29', '2001-02-27'), RP.ageAt('1985-06-15', '2026-06-14'), RP.ageAt('1985-06-15', '2026-06-15')], [1, 0, 40, 41], 'ages as moment counts them');
// Experience corrections: several product rows score the highest one (the site gives NaN -> HIGH);
// a total of 0 is LOW (the site gives "Na", counted as 3)
const exp = (o) => RP.evaluate(withA(o), ctx).experience;
const expSite = (o) => RP.evaluate(withA(o), Object.assign({ siteQuirks: true }, ctx)).experience;
const lowAll = { education: 'other', financeWork: 'no', assetView: { equity: 'low', cash: 'high', bonds: 'high' } };
eq(exp(Object.assign({}, lowAll, { products: { known: ['govbonds'], held: [] } })).level, 'LOW', 'one cheap product: LOW (0.6*50 = 30)');
const two = Object.assign({}, lowAll, { products: { known: ['govbonds', 'bonds'], held: [] } });
eq([Math.round(exp(two).e8), exp(two).level], [60, 'LOW'], 'two product rows: the higher (bonds 100 -> 0.6*100 = 60), LOW');
eq(expSite(two).level, 'HIGH', 'with siteQuirks: two product rows give NaN, HIGH');
const noneHeld = Object.assign({}, lowAll, { products: { known: ['none'], held: ['govbonds'] } });
eq([Math.round(exp(noneHeld).e8), exp(noneHeld).level], [30, 'LOW'], '"None" in one column and a product in the other: the product counts (0.6*50 = 30), LOW');
eq(exp(Object.assign({}, lowAll, { products: { known: ['funds', 'unitlinked', 'govbonds'], held: ['bonds'] } })).e8, 0.6 * 300, 'four rows: the highest (unit-linked 300)');
const zero = Object.assign({}, lowAll, { products: { known: ['none'], held: ['none'] } });
eq([exp(zero).score, exp(zero).level, exp(zero).number], [0, 'LOW', 1], 'nothing scored: LOW (1)');
eq([expSite(zero).level, expSite(zero).number], ['Na', 3], 'with siteQuirks: nothing scored is Na, counted as 3');
eq(exp(Object.assign({}, lowAll, { products: {}, assetView: {} })).level, 'LOW', 'both optional questions skipped: LOW');
eq(RP.evaluate(withA(zero), ctx).eligible.map((f) => f.fund).sort(), ['Allianz Euro Cash', 'Allianz Euro Cash'], 'a score of 0 lists only complexity-1 funds, like LOW');
// 0.2*300 (doctorate) + 0 + 0.2*200 = 100 -> MEDIUM (the boundary is inclusive)
eq(exp({ education: 'doctorate', products: { known: ['none'], held: ['none'] }, assetView: { equity: 'high', cash: 'low', bonds: 'high' } }).level, 'MEDIUM', 'experience boundary 100 is MEDIUM');

// 4. Completeness: products and asset classes are optional, as on the site
r = RP.evaluate(withA({ products: undefined, assetView: undefined }), ctx);
eq([r.complete, r.total], [true, 10], 'optional questions do not block the result');
r = RP.evaluate({ education: 'degree' }, ctx);
eq([r.complete, r.answered, r.total, r.sri], [false, 1, 10, null], 'incomplete has no result');
r = RP.evaluate(base, { atDate: '2026-10-12' });
eq([r.complete, r.missing], [false, ['dob', 'purpose']], 'dob and purpose asked when the host does not supply them');

// 5. Eligible funds
const elig = (o, c) => RP.evaluate(withA(o || {}), Object.assign({}, ctx, c || {})).eligible.map((f) => f.fund);
eq(elig({ tolerance: 'sell' }), ['Allianz Euro Cash', 'Allianz Euro Cash', 'Combination of Life Cycle and Autopilot'], 'risk 1, PRSA: Euro Cash (both PRSAs) and the unrated default strategy');
eq(elig({}, { purpose: 'C' }).length, 10, 'risk 7, ARF: all ten ARF funds');
eq(elig({}, { purpose: 'B' }).length, 0, 'investment purpose: nothing listed (no fund is flagged for B)');
eq(RP.evaluate(withA(Object.assign({}, lowAll, { products: { known: ['govbonds'], held: [] } })), ctx).eligible.map((f) => f.fund).sort(), ['Allianz Euro Cash', 'Allianz Euro Cash'], 'LOW experience: only complexity-1 funds');

// 6. Written outputs
r = RP.evaluate(base, ctx);
const nr = RP.narrative(base, ctx, r, { suggestedSri: 7, chosenSri: 5, overrideReason: 'Shorter horizon.' });
eq(/You are an employee\./.test(nr.circumstances) && /Nobody depends on you/.test(nr.circumstances) && !/health/i.test(nr.circumstances), true, 'circumstances sentences (no health)');
eq(/risk profile of 7 \(Very High\) on the 1 to 7 scale\./.test(nr.risk), true, 'risk sentence');
eq(/Following our discussion.*5 because: Shorter horizon\./.test(nr.override), true, 'override sentence');
const sum = RP.summary(base, ctx);
eq(sum.map((s) => s.title), ['About you', 'Experience and knowledge', 'Your finances', 'Your attitude to risk'], 'summary sections (no dob or purpose rows when supplied)');

console.log(fails ? fails + ' check(s) FAILED' : 'risk profiler engine: all checks passed');
process.exit(fails ? 1 : 0);
