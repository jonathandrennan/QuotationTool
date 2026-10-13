// quote_common.js — shared helpers, fund categories and risk mapping for the Quotation Tool.
// Depends on prsa_data.js and arf_data.js being loaded first.

// ─── Formatters ───────────────────────────────────────────────────────────────
function fEUR(n) { return '€' + Math.round(n || 0).toLocaleString('en-IE'); }
function fNum(n) { return Math.round(n || 0).toLocaleString('en-IE'); }
function pct(n)  { return ((n || 0) * 100).toFixed(2) + '%'; }
function parseNum(s) {
  var v = parseFloat(String(s == null ? '' : s).replace(/[€,\s]/g, ''));
  return isNaN(v) ? 0 : v;
}
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function fmtDate(d) {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('en-IE', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function fmtDateLong(d) {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('en-IE', { day:'numeric', month:'long', year:'numeric' });
}
function ageBetween(dobStr, atStr) {
  return (new Date(atStr) - new Date(dobStr)) / (365.25 * 24 * 3600 * 1000);
}

// ─── SRI display (ESMA / PRIIPs ESMA risk rating 1–7) ───────────────────
var ESMA_COLORS = ['', '#1a9e5c', '#4ab566', '#a0c840', '#f5c400', '#f5820a', '#e03333', '#990000'];
var ESMA_LABELS = ['', 'Very Low', 'Low', 'Low to Medium', 'Medium', 'Medium to High', 'High', 'Very High'];

// Formats an indicative (weighted) risk figure: one decimal on screen, whole number otherwise.
function fmtRisk(v, decimals) { return decimals ? (+v).toFixed(1) : String(Math.round(v)); }

// ─── Fund categories (Portfolio Builder grouping — brochure pp.19 and 31) ─────
// label: group heading in the builder · short: per-fund tag in the builder and the pack
var FUND_CATEGORIES = [
  { key:'ma',  label:'Multi-Asset Solutions',         short:'Multi-asset' },
  { key:'pg',  label:'Protected Growth',              short:'Protected growth' },
  { key:'cbb', label:'Complementary Building Blocks', short:'Building block' },
  { key:'idx', label:'Index-Tracking',                short:'Index tracker' }
];
var FUND_CATEGORY_OF = {
  // PRSA fund ids
  dm15:'ma', dm50:'ma', dm75:'ma',
  ss30:'pg', ss50:'pg', ss75:'pg',
  bsri:'cbb', afie:'cbb', afisd:'cbb', cash:'cbb',
  etfw:'idx', etfs:'idx', etfe:'idx',
  // ARF fund ids (where they differ)
  afsd:'cbb', bsge:'cbb', hesc:'idx', hmw:'idx', hsp:'idx'
};
var FUND_CATEGORY_MAP = {};
FUND_CATEGORIES.forEach(function(c) { FUND_CATEGORY_MAP[c.key] = c; });

// ─── Asset split (indicative) ─────────────────────────────────────────────────
// DMAS funds: look-through exposure from the factsheets (FUND_FACTSHEET, prsa_data.js). The published
// figures include derivatives and total over 100%, so each class is rescaled to its share of the total.
// Every other fund: its nominal split (`assets` in the fund data). For Strategy Select that is the
// stock/bond mix whose RETURN the fund aims to match (brochure pp.33–34), not what it holds — its
// factsheet exposures are not reliable at the moment, so they are not used. Either way the split is
// always shown as indicative.
var ASSET_CLASSES = [
  { key:'eq',   label:'Equity' },
  { key:'fi',   label:'Fixed income' },
  { key:'cash', label:'Cash' },
  { key:'com',  label:'Commodities' },
  { key:'alt',  label:'Alternatives' }
];
var ASSET_FROM_FACTSHEET = ['dm15', 'dm50', 'dm75'];
// A fund's asset split as fractions summing to 1: { eq, fi, cash, com, alt }.
function fundAssets(f) {
  var fs = ASSET_FROM_FACTSHEET.indexOf(f.id) >= 0 && typeof FUND_FACTSHEET !== 'undefined' ? FUND_FACTSHEET[f.id] : null;
  if (fs) {
    var g = { eq: fs.equity || 0, fi: fs.bonds || 0, cash: 0, com: fs.commodities || 0, alt: fs.alt || 0 };
    var t = g.eq + g.fi + g.com + g.alt;
    if (t > 0) { for (var k in g) g[k] /= t; return g; }
  }
  var a = f.assets || {};
  return { eq: a.eq || 0, fi: a.fi || 0, cash: a.cash || 0, com: 0, alt: 0 };
}
// Share of a fund mix ([{ fund, weight }]) by asset class, as fractions of the mix.
function assetSplit(mix) {
  var out = {}, tot = 0;
  ASSET_CLASSES.forEach(function(c) { out[c.key] = 0; });
  (mix || []).forEach(function(m) { tot += m.weight; });
  (mix || []).forEach(function(m) {
    var a = fundAssets(m.fund), w = tot ? m.weight / tot : 0;
    ASSET_CLASSES.forEach(function(c) { out[c.key] += w * a[c.key]; });
  });
  return out;
}
// Which split bases a mix uses, for the note under the split: { factsheet, target } (DMAS, Strategy Select).
function assetSplitBasis(mix) {
  var b = { factsheet: false, target: false };
  (mix || []).forEach(function(m) {
    if (ASSET_FROM_FACTSHEET.indexOf(m.fund.id) >= 0) b.factsheet = true;
    else if (FUND_CATEGORY_OF[m.fund.id] === 'pg') b.target = true;
  });
  return b;
}

// ─── Managed strategy → suitable client risk ratings ──────────────────────────
// Glidepath strategies (DIS/Autopilot/Life Cycle) don't have a published SRI — the fund
// mix moves over time — so each strategy is mapped to the client ratings it suits [min, max].
// Business-supplied mapping (2026-10-06). The same ids apply to Standard and Non-Standard
// PRSAs. Ratings outside every range (1, 6, 7) match no managed strategy.
var STRATEGY_SUITABLE = {
  dis:   [3, 4],
  ap_ba: [2, 3], ap_dy: [3, 4], ap_op: [3, 5],
  lc_ba: [2, 3], lc_dy: [3, 5], lc_op: [4, 5]
};
function strategySuitableRange(strat) {
  return strat && strat.gpKey ? STRATEGY_SUITABLE[strat.id] || null : null;
}
// { aligned, direction: 'higher' | 'lower' | null, range } — direction is the strategy's
// risk relative to the client (higher = client's rating is below the suitable range).
function strategyRiskFit(strat, sri) {
  var rg = strategySuitableRange(strat);
  if (!rg || !sri) return { aligned: true, direction: null, range: rg };
  if (sri < rg[0]) return { aligned: false, direction: 'higher', range: rg };
  if (sri > rg[1]) return { aligned: false, direction: 'lower', range: rg };
  return { aligned: true, direction: null, range: rg };
}
function fmtRatingRange(rg) { return rg[0] === rg[1] ? String(rg[0]) : rg[0] + '–' + rg[1]; }
function strategyProfile(strat) {
  if (!strat || !strat.sub) return null;
  if (/Balanced/.test(strat.sub)) return 'Balanced';
  if (/Dynamic/.test(strat.sub)) return 'Dynamic';
  if (/Opportunity/.test(strat.sub)) return 'Opportunity';
  return null;
}

// Weighted portfolio SRI from a list of { esma, weight } (weights sum to 1).
// This is an indicative house measure, NOT a PRIIPs SRI (it ignores diversification).
function weightedSri(items) {
  var s = 0, w = 0;
  items.forEach(function(it) { s += it.esma * it.weight; w += it.weight; });
  return w > 0 ? s / w : 0;
}

// Indicative weighted SRI of a glidepath's fund mix at policy start and at retirement.
// Glidepath weights are indexed by months remaining to retirement (0 = at retirement).
function glidepathSriPath(strat, termMonths) {
  if (!strat || !strat.gpKey || typeof GP_DATA === 'undefined') return null;
  var gp = GP_DATA[strat.gpKey];
  function at(m) {
    var w = gp.weights[Math.max(0, Math.min(m, 540))];
    return weightedSri(gp.funds.map(function(id, i) { return { esma: FUNDS_MAP[id].esma, weight: w[i] }; }));
  }
  return { start: at(termMonths), end: at(0) };
}

// Quote reference: Q-YYMMDD-XXXX
function newQuoteRef() {
  var d = new Date();
  var p = function(n) { return (n < 10 ? '0' : '') + n; };
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '';
  for (var i = 0; i < 4; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'Q-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + r;
}
