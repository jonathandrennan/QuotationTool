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

// ─── SRI display (ESMA / PRIIPs summary risk indicator 1–7) ───────────────────
var ESMA_COLORS = ['', '#1a9e5c', '#4ab566', '#a0c840', '#f5c400', '#f5820a', '#e03333', '#990000'];
var ESMA_LABELS = ['', 'Very Low', 'Low', 'Low to Medium', 'Medium', 'Medium to High', 'High', 'Very High'];

// Formats an indicative (weighted) risk figure: one decimal on screen, whole number otherwise.
function fmtRisk(v, decimals) { return decimals ? (+v).toFixed(1) : String(Math.round(v)); }

// ─── Fund categories (Portfolio Builder grouping — no look-through) ───────────
var FUND_CATEGORIES = [
  { key:'fic',   label:'Fixed Income & Cash' },
  { key:'multi', label:'Multi-Asset' },
  { key:'eq',    label:'Equity' }
];
var FUND_CATEGORY_OF = {
  // PRSA fund ids
  cash:'fic', afisd:'fic', afie:'fic',
  ss30:'multi', dm15:'multi', ss50:'multi', ss75:'multi', dm50:'multi', dm75:'multi',
  bsri:'eq', etfe:'eq', etfw:'eq', etfs:'eq',
  // ARF fund ids (where they differ)
  afsd:'fic', bsge:'eq', hesc:'eq', hmw:'eq', hsp:'eq'
};

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
