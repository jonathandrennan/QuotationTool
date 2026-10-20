// quote_pdf.js — charts (vector SVG) and the printable quotation pack.
//
// The pack is an HTML document opened in a new window and printed to PDF. Charts are
// drawn as inline SVG (not canvas bitmaps), so text and lines stay sharp at any zoom in
// the saved PDF — this is the fix for the blurry text seen in the existing PRSA tool's
// PDFs, whose charts were low-resolution canvas images stretched onto the page.
//
// Depends on quote_common.js, quote_text.js and the data/engine files.

// ─── Logo ─────────────────────────────────────────────────────────────────────
function qtLogoSvg(height, color) {
  color = color || '#003781';   // white on the cover photo and the navy back page
  return '<svg xmlns="http://www.w3.org/2000/svg" height="' + height + '" viewBox="0 0 399.76 99.15" style="display:block">' +
    '<path d="M36.43,52.48H22.78l7.27-23.72ZM15.7,78.62,20.36,63H38.75l4.36,15.58h17L43.22,19.18c-1-3.51-3.1-5.13-6.79-5.13H12.32v5.61h2c2.52,0,3.88,1,3.88,2.91,0,1.27-.28,2.33-1.28,5.22L0,78.62Z" fill="' + color + '"/><path d="M79.78,78.62V19c0-3.11-1.82-4.95-4.83-4.95H60v5.61h1c2.51,0,3.58,1.07,3.58,3.61V78.62Z" fill="' + color + '"/><path d="M105.62,78.62V19c0-3.11-1.85-4.95-4.84-4.95H85.88v5.61h1c2.52,0,3.59,1.07,3.59,3.61V78.62Z" fill="' + color + '"/><path d="M132.13,19.94c0-4.33-3.21-7-8.71-7s-8.73,2.62-8.73,7,3.31,7,8.73,7,8.71-2.6,8.71-7m-.29,58.68V35.16c0-3.1-1.84-4.93-4.85-4.93H112.28v5.5h.87c2.51,0,3.58,1.16,3.58,3.68V78.62Z" fill="' + color + '"/><path d="M165.12,55.38v9.41C162.59,67.4,159.51,69,156.9,69s-3.68-1.34-3.68-5,.76-5.21,3.48-6.26a38.66,38.66,0,0,1,8.42-2.36m-20.44-11.3a36.51,36.51,0,0,1,14.91-3.78c4.08,0,5.53,1.45,5.53,5.68v1.08c-6.19,1-8.13,1.38-11.62,2.15A34.7,34.7,0,0,0,147.78,51c-6.11,2.45-9,7.17-9,14.42,0,9.2,4,13.64,12.19,13.64a21.94,21.94,0,0,0,8.14-1.53,27.07,27.07,0,0,0,6.49-4.16v.68c0,3,1.54,4.53,4.55,4.53H184V73.41h-.68c-2.61,0-3.57-1.17-3.57-4.26V46.1c0-12.29-4.27-16.57-16.58-16.57a51.9,51.9,0,0,0-11.59,1.37,38.84,38.84,0,0,0-10.27,3.88Z" fill="' + color + '"/><path d="M206.05,78.62V45.9c2.53-2.81,5.13-4.08,8.13-4.08,3.21,0,4,1.27,4,6.14V78.62h15.1V45.72c0-7.66-.55-10.08-3-12.68-2-2.25-5.13-3.39-9.12-3.39-5.91,0-10.07,1.83-15.66,7.06V34.78c0-3-1.57-4.55-4.66-4.55H186.49v5.5h.87c2.51,0,3.59,1.16,3.59,3.68V78.62Z" fill="' + color + '"/><path d="M278.07,68.46H257l20.15-28.25v-10H245.55c-3.58,0-5.23,1.64-5.23,5.23v8.8h5.61v-.86c0-2.23,1.16-3.29,3.57-3.29h10.86L240,68.66v10h38Z" fill="' + color + '"/><path d="M357.34,77.39V22.68c0-4.36-1.55-5.83-5.78-5.83H338.75V23h.77c2.92,0,3.49.66,3.49,4.18V77.39Zm6.32,0h14.22V34.78c0-4.28-1.65-5.82-5.82-5.82h-8.4Zm-26.93,0V29H328.3c-4.17,0-5.8,1.54-5.8,5.82V77.39Zm54.61-27.81c0,24.11-17.34,41.64-41.15,41.64S309,73.69,309,49.58,326.37,7.94,350.19,7.94s41.15,17.63,41.15,41.64m8.42,0C399.76,21.23,378.55,0,350.19,0S300.6,21.23,300.6,49.58s21.21,49.57,49.59,49.57S399.76,78,399.76,49.58" fill="' + color + '"/></svg>';
}

// ─── SVG line chart ───────────────────────────────────────────────────────────
// opts = { width, height, xLabels:[...], series:[{label,color,values:[...],dash,width,area,fill,endDot}],
//          yFormat:function(v){}, xTitle,
//          legend:false        leave the legend out (the screen draws its own above the chart)
//          xs:[...]            optional x position of each point (e.g. years since start), for uneven spacing
//          xTicks:[{x,label}]  optional axis labels at x positions (replaces xLabels)
//          markers:[{x,label}] optional dashed vertical lines, labelled above the plot }
// A series with `fill` is drawn as a filled area only (e.g. contributions paid); `area` adds a
// light tint under a line; `endDot` marks the last point.
var QT_CHART_FONT = "'Allianz Neo', Arial, Helvetica, sans-serif";
function qtSvgLineChart(opts) {
  var W = opts.width || 640, H = opts.height || 260, legend = opts.legend !== false;
  var padL = 50, padR = 14, padT = opts.markers && opts.markers.length ? 30 : 12, padB = legend ? (opts.xTitle ? 56 : 44) : 26;
  var n = opts.xs ? opts.xs.length : opts.xLabels.length;
  var maxV = 0;
  opts.series.forEach(function(s) { s.values.forEach(function(v) { if (v > maxV) maxV = v; }); });
  if (maxV <= 0) maxV = 1;
  // nice axis max
  var mag = Math.pow(10, Math.floor(Math.log(maxV) / Math.LN10));
  var steps = [1, 2, 2.5, 5, 10], niceMax = maxV, step = mag;
  for (var i = 0; i < steps.length; i++) {
    step = steps[i] * mag / 2;
    if (maxV / step <= 6) break;
  }
  niceMax = Math.ceil(maxV / step) * step;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  var xs = opts.xs, x0 = xs ? xs[0] : 0, x1 = xs ? xs[n - 1] : n - 1;
  function xAt(v) { return padL + (x1 <= x0 ? 0 : (v - x0) * plotW / (x1 - x0)); }
  function x(i) { return xAt(xs ? xs[i] : i); }
  function y(v) { return padT + plotH - (v / niceMax) * plotH; }
  var fmt = opts.yFormat || function(v) { return fNum(v); };
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;font-family:' + QT_CHART_FONT.replace(/"/g, '') + '">';
  // grid + y labels
  for (var g = 0; g <= niceMax + 1e-9; g += step) {
    var gy = y(g).toFixed(1);
    if (g > 0) svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy + '" stroke="#EEF2F6" stroke-width="1"/>';
    svg += '<text x="' + (padL - 8) + '" y="' + (+gy + 3.5) + '" font-size="10.5" fill="#8A96A3" text-anchor="end">' + escHtml(fmt(g)) + '</text>';
  }
  if (opts.xTicks) {
    opts.xTicks.forEach(function(t, i) {
      var tx = xAt(t.x), last = i === opts.xTicks.length - 1 && tx > W - padR - 30;
      svg += '<text x="' + tx.toFixed(1) + '" y="' + (padT + plotH + 17) + '" font-size="10.5" fill="#8A96A3" text-anchor="' + (last ? 'end' : 'middle') + '">' + escHtml(t.label) + '</text>';
    });
  } else {
    // x labels (thin out)
    var every = Math.max(1, Math.ceil(n / 12));
    for (var xi = 0; xi < n; xi++) {
      if (xi !== n - 1 && (xi % every !== 0 || n - 1 - xi < every * 0.6)) continue;
      svg += '<text x="' + x(xi).toFixed(1) + '" y="' + (padT + plotH + 17) + '" font-size="10.5" fill="#8A96A3" text-anchor="middle">' + escHtml(opts.xLabels[xi]) + '</text>';
    }
  }
  if (opts.xTitle) svg += '<text x="' + (padL + plotW / 2) + '" y="' + (padT + plotH + 31) + '" font-size="10" fill="#5E6B78" text-anchor="middle">' + escHtml(opts.xTitle) + '</text>';
  svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (padT + plotH) + '" y2="' + (padT + plotH) + '" stroke="#D5DDE6" stroke-width="1"/>';
  // series: filled areas first, then lines on top
  function poly(s) { return x(0).toFixed(1) + ',' + y(0).toFixed(1) + ' ' + s.values.map(function(v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ') + ' ' + x(s.values.length - 1).toFixed(1) + ',' + y(0).toFixed(1); }
  opts.series.forEach(function(s) {
    if (s.fill) svg += '<polygon points="' + poly(s) + '" fill="' + s.fill + '" stroke="none"/>';
    else if (s.area) svg += '<polygon points="' + poly(s) + '" fill="' + s.color + '" fill-opacity="' + (s.areaOpacity || 0.07) + '" stroke="none"/>';
  });
  opts.series.forEach(function(s) {
    if (s.fill) return;
    var pts = s.values.map(function(v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); });
    svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.2) + '"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>';
    if (s.endDot) {
      var li = s.values.length - 1;
      svg += '<circle cx="' + x(li).toFixed(1) + '" cy="' + y(s.values[li]).toFixed(1) + '" r="3.8" fill="' + s.color + '" stroke="#fff" stroke-width="1.5"/>';
    }
  });
  // markers: label sits above the plot so it never collides with the lines
  (opts.markers || []).forEach(function(m) {
    var mx = xAt(m.x), anchor = mx > W - padR - 120 ? 'end' : mx < padL + 120 ? 'start' : 'middle';
    svg += '<line x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (padT - 4) + '" y2="' + (padT + plotH) + '" stroke="#003781" stroke-width="1" stroke-dasharray="3,3"/>';
    svg += '<text x="' + mx.toFixed(1) + '" y="' + (padT - 9) + '" font-size="10" font-weight="bold" fill="#003781" text-anchor="' + anchor + '">' + escHtml(m.label) + '</text>';
  });
  // legend
  var lx = padL;
  if (legend) opts.series.slice().reverse().forEach(function(s) {
    var ly = H - 5;
    if (s.fill) svg += '<rect x="' + lx + '" y="' + (ly - 9) + '" width="12" height="10" rx="2" fill="' + s.fill + '"/>';
    else svg += '<line x1="' + lx + '" x2="' + (lx + 18) + '" y1="' + (ly - 3.5) + '" y2="' + (ly - 3.5) + '" stroke="' + s.color + '" stroke-width="2.5"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + '/>';
    var tx0 = lx + (s.fill ? 17 : 23);
    svg += '<text x="' + tx0 + '" y="' + ly + '" font-size="10" fill="#3A4756">' + escHtml(s.label) + '</text>';
    lx = tx0 + 14 + s.label.length * 5.4;
  });
  svg += '</svg>';
  return svg;
}

function qtEuroAxis(v) {
  if (v >= 1e6) return '€' + (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'm';
  if (v >= 1e3) return '€' + Math.round(v / 1e3) + 'k';
  return '€' + Math.round(v);
}

// Charts run on a calendar-date axis from the policy start date: points sit at their real
// dates (so a short final period to retirement is drawn short) and ticks are calendar years.
var QT_YEAR_MS = 365.25 * 24 * 3600 * 1000;
var QT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function qtYearsFrom(start, d) { return (d - start) / QT_YEAR_MS; }
// 1 January ticks across [0, span] years from start, thinned for long projections
function qtYearTicks(start, span) {
  var y0 = start.getFullYear(), y1 = new Date(start.getTime() + span * QT_YEAR_MS).getFullYear();
  var gap = y1 - y0 <= 12 ? 1 : y1 - y0 <= 25 ? 2 : 5, out = [];
  for (var yr = y0 + 1; yr <= y1; yr++) {
    if (yr % gap) continue;
    var t = qtYearsFrom(start, new Date(yr, 0, 1));
    if (t <= span + 1e-9) out.push({ x: t, label: String(yr) });
  }
  return out;
}

// Year ticks for a projection to retirement: counted back from the retirement date in even steps,
// so the last tick is the retirement year itself
function qtRetirementTicks(start, retDate, span) {
  var gap = span <= 12 ? 1 : span <= 25 ? 2 : 5, out = [];
  for (var k = 0; ; k++) {
    var d = new Date(retDate.getFullYear() - k * gap, retDate.getMonth(), retDate.getDate()), x = qtYearsFrom(start, d);
    if (x < gap * 0.5) break;
    out.unshift({ x: x, label: String(d.getFullYear()) });
  }
  return out;
}
// Chart series builders (used both on screen and in the PDF). o = { legend } passed through.
function qtPrsaChart(r, width, height, o) {
  var start = new Date(r.inputs.startStr), dob = new Date(r.inputs.dobStr);
  var retDate = new Date(dob.getFullYear() + r.nra, dob.getMonth(), dob.getDate()), tRet = qtYearsFrom(start, retDate);
  var xs = [0], wc = [r.ofvRaw + r.spRaw * (1 - r.spContribCharge)], contrib = [r.ofvRaw + r.spRaw];
  r.snapshots.forEach(function(s) {
    xs.push(s.isMat ? tRet : s.month / 12);
    wc.push(s.fundWC); contrib.push(s.contribNC);
  });
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtRetirementTicks(start, retDate, tRet), yFormat: qtEuroAxis, legend: !o || o.legend !== false,
    series: [
      { label: 'Total paid in', fill: '#E3EAF2', values: contrib },
      { label: 'Projected value', color: '#003781', values: wc, area: true, width: 2.5, endDot: true }
    ]
  });
}
function qtArfChart(r, width, height, o) {
  var start = new Date(r.inputs.startStr), xs = [], s1 = r.p1.fundByYear, s2 = r.p2.fundByYear;
  var lastPos = 0;
  for (var k = 0; k < s1.length; k++) if (s1[k] > 0.5 || (s2[k] || 0) > 0.5) lastPos = k;
  var n = Math.min(s1.length, Math.max(lastPos + 4, 10));
  s1 = s1.slice(0, n); s2 = s2.slice(0, n);
  for (var i = 0; i < n; i++) xs.push(i);
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtYearTicks(start, n - 1), yFormat: qtEuroAxis, legend: !o || o.legend !== false,
    series: [
      { label: 'Fund value at ' + pct(r.rate2) + ' growth', color: '#0377A8', values: s2, dash: '4,4', width: 1.8 },
      { label: 'Fund value at ' + pct(r.rate1) + ' growth', color: '#003781', values: s1, area: true, width: 2.5 }
    ]
  });
}

function qtIbChart(r, width, height, o) {
  var start = new Date(r.inputs.startStr), xs = [], s1 = r.p.fundByYear;
  var lastPos = 0;
  for (var k = 0; k < s1.length; k++) if (s1[k] > 0.5) lastPos = k;
  var n = Math.min(s1.length, Math.max(lastPos + 4, 10));
  s1 = s1.slice(0, n);
  for (var i = 0; i < n; i++) xs.push(i);
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtYearTicks(start, n - 1), yFormat: qtEuroAxis, legend: !o || o.legend !== false,
    series: [ { label: 'Fund value at ' + pct(r.rate) + ' growth', color: '#003781', values: s1, area: true, width: 2.5 } ]
  });
}

// ─── SRI scale (HTML, prints with exact colours) ──────────────────────────────
// The portfolio marker uses the rounded indicative figure (decimals are footnoted, not plotted).
function qtSriScale(clientSri, portfolioSri, portfolioLabel, cls) {
  var pr = portfolioSri == null ? null : Math.round(portfolioSri);
  var h = '<div class="sricol' + (cls ? ' ' + cls : '') + '"><table class="sri"><tr>';
  for (var i = 1; i <= 7; i++) {
    h += '<td style="background:' + ESMA_COLORS[i] + '"' + (i === clientSri || i === pr ? ' class="on"' : '') + '>' + i + '</td>';
  }
  h += '</tr><tr class="mk">';
  for (var j = 1; j <= 7; j++) {
    var m = [];
    if (j === clientSri) m.push('You');
    if (j === pr) m.push(portfolioLabel || 'Portfolio');
    h += '<td>' + (m.length ? '&#9650;<br>' + m.join(' &amp; ') : '') + '</td>';
  }
  h += '</tr></table><div class="sri-ends"><span>Lower risk</span><span>Higher risk</span></div></div>';
  return h;
}
// Published fund SRI (PRIIPs): always a whole number.
function qtSriBadge(sri) {
  var r = Math.round(sri);
  return '<span class="badge" style="background:' + ESMA_COLORS[r] + ';color:' + (r === 4 ? '#222' : '#fff') + '">ESMA ' + r + '</span>';
}
// Indicative risk lines and footnote for the client-facing pack (rounded figures).
function qtPortfolioRisk(Q) {
  var T = QT_TEXT, r = Q.r;
  if (Q.product === 'prsa' && r.isGlidepath) {
    var gp = glidepathSriPath(r.stratObj, r.termMonths);
    if (!gp) return { line: '', scaleValue: null, label: '', footnote: '' };
    return { line: escHtml(qtFill(T.glidepathRiskPath, { start: fmtRisk(gp.start), end: fmtRisk(gp.end) })), scaleValue: gp.start, label: 'Plan at start',
             short: 'strategy risk profile <b>' + escHtml(strategyProfile(r.stratObj) || 'Medium risk') + '</b>', glide: true,
             footnote: qtFill(T.riskFootnoteGlidepath, { start: fmtRisk(gp.start, 1), end: fmtRisk(gp.end, 1) }) };
  }
  var pr = Math.round(r.portfolioSri);
  return { line: 'Indicative portfolio risk: <b>' + pr + ' &ndash; ' + ESMA_LABELS[pr] + '</b>*', scaleValue: r.portfolioSri, label: 'Portfolio',
           short: 'indicative portfolio risk <b>' + pr + '</b>', mark: '*',
           footnote: qtFill(T.riskFootnote, { exact: fmtRisk(r.portfolioSri, 1) }) };
}

// ─── Simple markup for adviser-edited text ────────────────────────────────────
// "## " heading, "- " bullet, **bold**, blank line = paragraph break. Returns an array of HTML
// blocks so the paginator can split long letters across pages.
function qtMarkupBlocks(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n');
  var blocks = [], para = [], list = [];
  function inl(s) { return escHtml(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }   // **bold**
  function flushPara() { if (para.length) { blocks.push('<p>' + para.map(inl).join('<br>') + '</p>'); para = []; } }
  function flushList() { if (list.length) { blocks.push('<ul>' + list.map(function(l){ return '<li>' + inl(l) + '</li>'; }).join('') + '</ul>'); list = []; } }
  lines.forEach(function(l) {
    var t = l.replace(/\s+$/, '');
    if (/^##\s+/.test(t)) { flushPara(); flushList(); blocks.push('<h3 class="kwn">' + inl(t.replace(/^##\s+/, '')) + '</h3>'); }
    else if (/^-\s+/.test(t)) { flushPara(); list.push(t.replace(/^-\s+/, '')); }
    else if (t === '') { flushPara(); flushList(); }
    else { flushList(); para.push(t); }
  });
  flushPara(); flushList();
  return blocks;
}

// ─── Shared derived figures ───────────────────────────────────────────────────
// Largest holding first, so the fund, charge and description lists all lead with what matters most.
// Equal weights keep the engine's order (ascending risk), since Array#sort is stable.
function qtFundRows(Q) {
  var r = Q.r;
  return r.mix.map(function(m) {
    var f = m.fund;
    var fmc  = Q.product === 'prsa' ? f.chargeQuoted : f.extFund;
    var gtee = m.gmab ? (Q.product === 'prsa' ? f.gmab : f.gteeCharge) : 0;
    return { fund: f, weight: m.weight, admin: r.cc.admin, fmc: fmc, gtee: gtee, total: r.cc.admin + fmc + gtee,
             cat: FUND_CATEGORY_OF[f.id] || '', gmab: m.gmab };
  }).sort(function(a, b) { return b.weight - a.weight; });
}
// The protected level is a product feature keyed by fund, shared by the PRSA, ARF and Bond ranges.
function qtGteeLevel(fundId) {
  var l = QT_CONTENT.guarantee.levels[fundId];
  return l ? Math.round(l.protected * 100) + '%' : null;
}
function qtNameList(a) {
  return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}
// Names the guaranteed funds and their level. Falls back to the general wording if any fund in the
// quotation has no published level, so an unknown fund can never produce a wrong percentage.
function qtGuaranteeNote(rows) {
  var T = QT_TEXT, g = rows.filter(function(fr) { return fr.gmab; });
  if (!g.length) return '';
  var lv = g.map(function(fr) { return qtGteeLevel(fr.fund.id); });
  if (lv.some(function(x) { return !x; })) return T.guaranteeFundNoteGeneric;
  var uniq = lv.filter(function(x, i) { return lv.indexOf(x) === i; });
  return uniq.length === 1
    ? qtFill(T.guaranteeFundNote, { level: uniq[0], funds: qtNameList(g.map(function(fr) { return fr.fund.name; })) })
    : qtFill(T.guaranteeFundNoteMixed, { levels: qtNameList(uniq) });
}

// The redesigned Charges page drops the effect-of-charges / reduction-in-yield disclosure
// (handoff §8, 9 Oct 2026). The handoff lists that as still open for Compliance, so it sits behind
// this flag: set it to true to put the disclosure back without reworking the page.
var QT_SHOW_EFFECT_OF_CHARGES = false;

// ─── Quotation-pack page furniture (design handoff, 9 Oct 2026) ───────────────
// A titled block of label/value rows, as used on "Your quotation at a glance".
// Rows are [label, value, isTotal]; a falsy row is dropped, so each product can pass
// only the rows that apply to it.
function qtFactBlock(title, rows) {
  return '<div class="fblk"><div class="fbh">' + escHtml(title) + '</div>' +
    rows.filter(Boolean).map(function(r) {
      return '<div class="fbr' + (r[2] ? ' tot' : '') + '"><span>' + escHtml(r[0]) + '</span><b>' + r[1] + '</b></div>';
    }).join('') + '</div>';
}
// Three headline figures under a 2px navy rule. Items are [label, value, sub].
function qtStat3(items) {
  items = items.filter(Boolean);
  return '<div class="stat3"' + (items.length === 3 ? '' : ' style="grid-template-columns: repeat(' + items.length + ', 1fr)"') + '>' + items.map(function(i) {
    return '<div><span>' + escHtml(i[0]) + '</span><b>' + i[1] + '</b>' +
      (i[2] ? '<span class="sub">' + escHtml(i[2]) + '</span>' : '') + '</div>';
  }).join('') + '</div>';
}
// CPC warnings, boxed next to the figures they relate to.
function qtWarnBox(lines) {
  return '<div class="wbox">' + lines.filter(Boolean).map(function(l) { return '<span>' + escHtml(l) + '</span>'; }).join('') + '</div>';
}
// Attitude-to-risk strip: seven cells, the client's own rating filled navy.
function qtRiskStrip(sri) {
  var h = '';
  for (var i = 1; i <= 7; i++) h += '<div' + (i === sri ? ' class="on"' : '') + '>' + i + '</div>';
  return '<div class="rstrip">' + h + '<span class="lo">Lower risk</span><span class="hi">Higher risk</span></div>';
}
// Key years for the projection and remuneration tables: the first five, then 10 and 15, then
// retirement/maturity. Short terms simply yield fewer rows.
function qtKeyYears(rows) {
  return rows.filter(function(x) { return x.isMat || [1, 2, 3, 4, 5, 10, 15].indexOf(x.year) >= 0; });
}
// Weighted charge components across the portfolio, used on both the glance and charges pages.
function qtChargeMix(fundRows) {
  var m = { admin: 0, fmc: 0, gtee: 0 };
  fundRows.forEach(function(fr) { m.admin += fr.weight * fr.admin; m.fmc += fr.weight * fr.fmc; m.gtee += fr.weight * fr.gtee; });
  m.total = m.admin + m.fmc + m.gtee;
  return m;
}

// ─── Pack builder ─────────────────────────────────────────────────────────────
// Q = { product, r, broker{}, client{}, risk{sri,reason}, dateStr,
//       productName, strategyName, sections{}, coverText, sosText, embed }
// Q.embed renders the pages for display inside the tool (no print toolbar, transparent backdrop).
function qtBuildPack(Q) {
  var T = QT_TEXT, r = Q.r, isPrsa = Q.product === 'prsa', isArf = Q.product === 'arf', isIb = Q.product === 'ib';
  var clientName = [Q.client.first, Q.client.last].join(' ');
  var B = []; // blocks: { html, hdr:'agl'|'broker', cls, sec }
  var sec = '';  // pack section the blocks being added belong to (used to find each section's pages)
  function add(html, opts) {
    opts = opts || {};
    var cls = opts.cls || '', m = /^<h\d class="([^"]+)"/.exec(html);
    if (m) cls = (cls + ' ' + m[1]).trim();
    var hdr = opts.hdr || 'agl';
    B.push({ html: html, hdr: hdr, cls: cls, sec: sec, grp: hdr === 'broker' ? 'adv' : 'agl', full: !!opts.full });
  }
  // Page title and lead, as it appears on every Allianz page.
  function pageTitle(title, lead) {
    add('<div class="ptitle"><h2>' + escHtml(title) + '</h2>' +
        (lead ? '<span class="lead">' + escHtml(lead) + '</span>' : '') + '</div>', { cls: 'newpage kwn' });
  }
  function h2(title, newpage, hdr) { add('<h2>' + escHtml(title) + '</h2>', { cls: 'kwn' + (newpage ? ' newpage' : ''), hdr: hdr }); }
  function p(txt, cls) { add('<p' + (cls ? ' class="' + cls + '"' : '') + '>' + escHtml(txt) + '</p>'); }
  function imp(lines) { add('<div class="imp"><b>IMPORTANT</b>' + lines.map(function(l){ return '<p>' + escHtml(l) + '</p>'; }).join('') + '</div>'); }
  var fundRows = qtFundRows(Q);
  var cs = T.company;
  var dateLong = fmtDateLong(new Date());
  // Short product name for the quotation cover and the footer brand line.
  var brand = T.productBrands[Q.product] || Q.productName;
  // Every CPC warning, for Important information and the back page
  var wAll = [T.packWarnings.value, T.packWarnings.currency, T.packWarnings.lose, T.packWarnings.past, T.packWarnings.income]
    .concat(isPrsa ? [T.packWarnings.access] : [], [T.packWarnings.estimates]);

  // ── 1. Cover letter (adviser letterhead) ──
  if (Q.sections.cover) {
    sec = 'cover';
    var addr = (Q.client.address || '').split('\n').filter(function(x){ return x.trim(); });
    add('<div class="letter-top"><div>' + escHtml(Q.client.salutation + ' ' + clientName) + '<br>' + addr.map(escHtml).join('<br>') + '</div>' +
        '<div class="ldate">' + escHtml(dateLong) + '</div></div>',
        { hdr: 'broker', cls: 'newpage' });
    add('<p class="re"><b>Re: Your ' + escHtml(Q.productName) + ' quotation</b></p>', { hdr: 'broker' });
    qtMarkupBlocks(Q.coverText).forEach(function(b) { add(b, { hdr: 'broker' }); });
    add('<div class="sigblock"><b>' + escHtml(Q.broker.name) + '</b><br>' +
        (Q.broker.title ? escHtml(Q.broker.title) + '<br>' : '') + escHtml(Q.broker.firm) + (Q.broker.email ? '<br>' + escHtml(Q.broker.email) : '') + '</div>', { hdr: 'broker' });
  }

  // ── 2. Statement of Suitability ──
  if (Q.sections.sos) {
    sec = 'sos';
    add('<h1>' + escHtml(T.sections.sos) + '</h1>', { hdr: 'broker', cls: 'kwn newpage' });
    add('<table class="kv"><tr><td>Client</td><td>' + escHtml(clientName) + '</td><td>Adviser</td><td>' + escHtml(Q.broker.name) + '</td></tr>' +
        '<tr><td>Date</td><td>' + escHtml(dateLong) + '</td><td>Firm</td><td>' + escHtml(Q.broker.firm) + '</td></tr>' +
        '<tr><td>Product</td><td colspan="3">' + escHtml(Q.productName) + '</td></tr></table>', { hdr: 'broker' });
    qtMarkupBlocks(Q.sosText).forEach(function(b, i, all) { add(b, { hdr: 'broker', cls: i === all.length - 1 ? 'kwn' : '' }); });
    add('<div class="sigs"><div><p>' + escHtml(T.sosDeclaration) + '</p><div class="sigline"></div>Adviser: ' + escHtml(Q.broker.name) +
        '<div class="sigline short"></div>Date</div>' +
        '<div><p>' + escHtml(T.sosClientAck) + '</p><div class="sigline"></div>Client: ' + escHtml(clientName) +
        '<div class="sigline short"></div>Date</div></div>', { hdr: 'broker' });
  }

  // ── 2b. Risk profile: the client's questionnaire answers and the result (adviser letterhead) ──
  // Q.profile comes from the risk profiler module (js/risk_profiler*.js); it is null until the profiler is complete.
  if (Q.sections.riskprofile && Q.profile) {
    sec = 'riskprofile';
    var pf = Q.profile, pr = pf.result, pcfg = pf.config, pnarr = pf.narrative;
    add('<h1>' + escHtml(T.sections.riskprofile) + '</h1>', { hdr: 'broker', cls: 'kwn newpage' });
    add('<table class="kv"><tr><td>Client</td><td>' + escHtml(clientName) + '</td><td>Adviser</td><td>' + escHtml(Q.broker.name) + '</td></tr>' +
        '<tr><td>Completed</td><td>' + escHtml(fmtDateLong(pf.date)) + '</td><td>Questionnaire</td><td>' + escHtml(pf.name) + '</td></tr></table>', { hdr: 'broker' });
    var lowered = Q.risk.sri < pr.sri;
    add(qtStat3([
      ['Your risk rating', Q.risk.sri + ' &ndash; ' + escHtml(ESMA_LABELS[Q.risk.sri]), lowered ? 'Lowered by your adviser from ' + pr.sri : ''],
      ['Capacity for loss', escHtml(pr.capacity.label)]
    ]), { hdr: 'broker' });
    add(qtRiskStrip(Q.risk.sri), { hdr: 'broker' });
    if (pnarr.risk) add('<p>' + escHtml(pnarr.risk) + '</p>', { hdr: 'broker' });
    if (pnarr.override) add('<p>' + escHtml(pnarr.override) + '</p>', { hdr: 'broker' });
    add('<h3 class="kwn">Your answers</h3>', { hdr: 'broker' });
    pf.summary.forEach(function(s) {
      var t = '<table class="dt split"><thead><tr><th class="l" colspan="2">' + escHtml(s.title) + '</th></tr></thead><tbody>';
      s.rows.forEach(function(rw) {
        t += '<tr><td class="l" style="width:52%">' + escHtml((rw.num ? (/^S/.test(rw.num) ? rw.num : 'Q' + rw.num) + '. ' : '') + rw.q) + '</td><td class="l"><b>' + rw.a.map(escHtml).join('<br>') + '</b></td></tr>';
      });
      add(t + '</tbody></table>', { hdr: 'broker', cls: 'split' });
    });
    var kn = pr.knowledge;
    add(qtFactBlock('KNOWLEDGE AND EXPERIENCE', [
      ['Stated (Q7)', escHtml(pcfg.levels.knowledge[kn.stated].label)],
      ['Knowledge check (Q8)', kn.check === 'right' ? 'Right' : kn.check === 'dontknow' ? 'Did not know' : 'Not right'],
      ['Knowledge level', escHtml(kn.label) + (kn.level !== kn.stated ? ' (one level lower after the check)' : ''), true]
    ]), { hdr: 'broker' });
    if (pnarr.sustainability) add('<p>' + escHtml(pnarr.sustainability) + '</p>', { hdr: 'broker' });
    add('<h3 class="kwn">Points for your adviser</h3>', { hdr: 'broker' });
    add(pr.flags.length ? '<ul>' + pr.flags.map(function(f) { return '<li><b>' + escHtml(f.title) + ':</b> ' + escHtml(f.text) + '</li>'; }).join('') + '</ul>'
      : '<p>No flags were raised.</p>', { hdr: 'broker' });
    add('<p class="tiny">' + escHtml(pcfg.text.recordNote) + ' Questionnaire version ' + escHtml(pcfg.version) + '.</p>', { hdr: 'broker' });
  }

  // ── Allianz quotation: cover / divider ──
  // Separates the adviser's documents from the Allianz pages, which are numbered from 1 again.
  // Products without a cover image fall back to the plain navy cover.
  var aglSections = ['summary', 'projection', 'charges', 'funds', 'remun', 'important', 'glossary'];
  var hasAgl = aglSections.some(function(k) { return Q.sections[k]; });
  // Brochure-style: PRSA and ARF have the photo across the top with the title on white below;
  // the Investment Bond cover is a full-page photo with the title over the sky.
  var tocAt = -1;
  if (hasAgl) {
    sec = 'summary';
    var coverImg = (typeof QT_COVERS !== 'undefined' && QT_COVERS) ? QT_COVERS[Q.product] : null;
    var coverFull = coverImg && isIb;
    var bw = brand.split(' '), brandLines = brand.length > 22 ? [bw.slice(0, 2).join(' '), bw.slice(2).join(' ')] : [brand];
    var ctitle = '<div class="ctitle"><span class="ck">' + escHtml(T.packCoverKickers[Q.product] || T.packCoverKicker) + '</span>' +
        '<h1 class="cn">' + T.packCoverLines.map(function(l, i) { return '<span class="cl' + i + '">' + escHtml(l) + '</span>'; }).join('') +
        brandLines.map(function(l, i) { return '<span class="cb cb' + i + '">' + escHtml(l) + '</span>'; }).join('') + '</h1></div>';
    var cfor = '<div class="cfor"><b>' + escHtml(qtFill(T.packCoverFor, { clientName: Q.client.salutation + ' ' + clientName })) + '</b>' +
        '<span>' + escHtml(dateLong) + '</span></div>';
    if (!coverImg) {
      add('<div class="cover plain"><div class="clogo">' + qtLogoSvg(30, '#fff') + '</div>' + ctitle + cfor + '</div>', { full: true });
    } else if (coverFull) {
      add('<div class="cover full" style="background-image:url(' + coverImg + ')"><div class="clogo">' + qtLogoSvg(30, '#fff') + '</div>' + ctitle + cfor + '</div>', { full: true });
    } else {
      add('<div class="cover half"><div class="cphoto" style="background-image:url(' + coverImg + ')"><div class="clogo">' + qtLogoSvg(30) + '</div></div>' +
          '<div class="cbody">' + ctitle + cfor + '</div></div>', { full: true });
    }
    tocAt = B.length;   // the contents page goes here once every section is known
  }

  // ── Allianz 2. Your quotation at a glance ──
  // Factual only: the details the quotation is based on. Projections live on their own page.
  if (Q.sections.summary) {
    sec = 'summary';
    pageTitle(T.sections.summary, T.packLeads.summary);
    var mix = qtChargeMix(fundRows);
    var ageStart = r.ageAtStart != null ? r.ageAtStart : r.startAge;
    var startYear = new Date(r.inputs.startStr).getFullYear();
    var cAddr = (Q.client.address || '').split('\n').filter(function(x) { return x.trim(); }).join(', ');
    var youRows = [
      ['Name', escHtml(Q.client.salutation + ' ' + clientName)],
      ['Date of birth', escHtml(fmtDate(r.inputs.dobStr)) + ' &middot; age ' + Math.floor(ageStart)],
      cAddr ? ['Address', escHtml(cAddr)] : null,
      (Q.broker.name || Q.broker.firm) ? ['Adviser', escHtml([Q.broker.name, Q.broker.firm].filter(Boolean).join(', '))] : null   // blank in lite mode
    ];
    var planRows, contribRows;
    if (isPrsa) {
      planRows = [
        ['Product', escHtml(brand)],
        ['Type and version', escHtml((r.prsaType === 'standard' ? 'Standard PRSA' : 'Non-Standard PRSA') + ' · ' + r.code)],
        ['Start date', escHtml(fmtDate(r.inputs.startStr))],
        ['Retirement age', r.nra + ' &middot; ' + (startYear + Math.round(r.termMonths / 12))]
      ];
      contribRows = [
        r.ofvRaw > 0 ? ['Transfer value', fEUR(r.ofvRaw)] : null,
        r.spRaw > 0 ? ['Single contribution', fEUR(r.spRaw)] : null,
        r.rpRaw > 0 ? ['Regular contribution', fEUR(r.rpRaw) + ' a ' + String(r.freq).replace(/ly$/, '').replace('month', 'month').replace('quarter', 'quarter').replace('annual', 'year') + (r.esc > 0 ? ', +' + r.esc + '% a year' : '')] : null,
        ['Total paid in by age ' + r.nra, fEUR(r.totalContrib)]
      ];
    } else if (isArf) {
      planRows = [
        ['Product', escHtml(brand)],
        ['Version', escHtml(r.code)],
        ['Start date', escHtml(fmtDate(r.inputs.startStr))],
        ['Income from age', escHtml(String(r.inputs.incomeStartAge || Math.floor(ageStart)))]
      ];
      contribRows = [
        ['Single contribution', fEUR(r.contribution)],
        ['Income', escHtml(qtArfIncomeShort(r))],
        ['Age at start', String(Math.floor(ageStart))]
      ];
    } else {
      planRows = [
        ['Product', escHtml(brand)],
        ['Version', escHtml(r.code)],
        ['Start date', escHtml(fmtDate(r.inputs.startStr))],
        ['Policyholder', escHtml(r.policyholderType)]
      ];
      contribRows = [
        r.contribution > 0 ? ['Single contribution', fEUR(r.contribution)] : null,
        r.rp > 0 ? ['Regular contribution', fEUR(r.rp) + ' ' + escHtml(r.inputs.freq)] : null,
        ['Exit tax', pct(r.taxRate)],
        r.totalContrib != null ? ['Total paid in', fEUR(r.totalContrib)] : null
      ];
    }
    var chargeRows = [
      [(isPrsa ? 'Annual management charge' : 'Policy charge') + ' (incl. trail commission)', pct(mix.admin) + ' a year'],
      ['Fund charges, weighted', pct(mix.fmc) + ' a year'],
      mix.gtee > 0 ? ['Guarantee charge, weighted', pct(mix.gtee) + ' a year'] : null,
      ['Contribution charge', (r.spContribCharge > 0 || r.rpContribCharge > 0) ? 'Applies, see Charges' : 'None'],
      ['Total annual charge', pct(mix.total) + ' a year', true]
    ];
    add('<div class="fgrid">' + qtFactBlock('YOU', youRows) + qtFactBlock('YOUR PLAN', planRows) +
        qtFactBlock('CONTRIBUTIONS', contribRows) + qtFactBlock('CHARGES', chargeRows) + '</div>');

    var ivRows = fundRows.map(function(fr) {
      return '<tr><td class="l">' + escHtml(fr.fund.name) +
        (fr.gmab ? ' <span class="g">&middot; with Annual Guarantee</span>' : '') + '</td>' +
        '<td>' + Math.round(fr.fund.esma) + '</td><td><b>' + (+(fr.weight * 100).toFixed(1)) + '%</b></td></tr>';
    }).join('');
    add('<div class="fblk"><div class="fbh">YOUR INVESTMENT</div>' +
        '<table class="dt num split"><thead><tr><th class="l">Fund</th><th>Risk</th><th class="em">Allocation</th></tr></thead>' +
        '<tbody>' + ivRows + '</tbody></table></div>', { cls: 'split' });

    var gRisk = qtPortfolioRisk(Q);
    if (Q.lite) {
      // Lite mode: no client rating, so show the portfolio's own risk only
      var lr = Math.round(r.portfolioSri);
      add('<div class="riskrow"><div class="rl"><span>' + (r.isGlidepath ? 'Strategy risk profile' : 'Portfolio risk') + '</span><b>' +
          (r.isGlidepath ? escHtml(strategyProfile(r.stratObj) || 'Medium risk') : lr + ' &ndash; ' + ESMA_LABELS[lr] + (gRisk.mark || '')) + '</b></div>' +
          (r.isGlidepath ? '' : qtRiskStrip(lr)) + '</div>');
    } else {
    add('<div class="riskrow"><div class="rl"><span>Your attitude to risk</span><b>' + Q.risk.sri + ' &ndash; ' +
        ESMA_LABELS[Q.risk.sri] + '</b>' +
        (gRisk.short ? '<span>' + gRisk.short.replace(/^indicative /, '').replace(/^portfolio risk/, 'Portfolio risk') + (gRisk.mark || '') + '</span>' : '') + '</div>' +
        qtRiskStrip(Q.risk.sri) + '</div>');
    }
    if (gRisk.footnote) p(gRisk.glide ? T.packRiskFootnoteGlide : qtFill(T.packRiskFootnote, { exact: fmtRisk(r.portfolioSri, 1) }), 'tiny');
  }

  // ── Allianz 3. Your investment and risk: fund split → asset split → portfolio risk → the funds ──
  if (Q.sections.funds) {
    sec = 'funds';
    pageTitle(T.sections.funds, Q.lite ? T.packLeads.fundsLite : T.packLeads.funds);
    var FH = T.packFundsHeads, gp = isPrsa && r.isGlidepath, pr6 = Math.round(r.portfolioSri);
    // Fund split
    add('<h3 class="kwn">' + escHtml(FH.split) + '</h3>');
    var ft = '<table class="dt num split"><thead><tr><th class="l">Fund</th><th class="l">Category</th><th>Risk</th><th class="em">Allocation</th></tr></thead><tbody>';
    fundRows.forEach(function(fr) {
      var lv = qtGteeLevel(fr.fund.id), cat = FUND_CATEGORY_MAP[fr.cat];
      ft += '<tr><td class="l">' + escHtml(fr.fund.name) + (fr.gmab ? ' &middot; <span class="g">Guarantee' + (lv ? ' ' + lv : '') + '</span>' : '') + '</td>' +
            '<td class="l">' + (cat ? escHtml(cat.short) : '&ndash;') + '</td><td>' + Math.round(fr.fund.esma) + '</td><td class="em"><b>' + (+(fr.weight * 100).toFixed(1)) + '%</b></td></tr>';
    });
    add(ft + '</tbody></table>', { cls: 'split' });
    if (gp) p(T.glidepathNote, 'small');
    // Asset split: indicative (DMAS from rescaled factsheet exposure, Strategy Select at its target mix)
    if (!Q.lite) {   // lite mode leaves the asset split out
    var ASC = { eq: '#003781', fi: '#0377A8', cash: '#9DC4E3', com: '#B58A2E', alt: '#7A8794' }, as = assetSplit(fundRows), sb = '', lg = '';
    ASSET_CLASSES.forEach(function(c) {
      if (!(as[c.key] > 0.0005)) return;
      sb += '<div style="width:' + (as[c.key] * 100).toFixed(2) + '%;background:' + ASC[c.key] + '"></div>';
      lg += '<span><i style="background:' + ASC[c.key] + '"></i>' + c.label + ' ' + Math.round(as[c.key] * 100) + '%</span>';
    });
    add('<div class="catsplit kwn"><div class="bt">' + escHtml(FH.assets) + (gp ? ' at the start of your plan' : '') + '</div>' +
        '<div class="catbar">' + sb + '</div><div class="catleg">' + lg + '</div></div>');
    p(qtAssetNote(fundRows), 'tiny');
    }
    // Portfolio risk
    add('<h3 class="kwn">' + escHtml(FH.risk) + '</h3>');
    var fRisk = qtPortfolioRisk(Q), sfs = qtSfdrSplit(r.mix);
    var t2 = gp ? ['Strategy risk profile', escHtml(strategyProfile(r.stratObj) || 'Medium risk')] : ['Indicative portfolio risk*', pr6 + ' &ndash; ' + ESMA_LABELS[pr6]];
    var sus = sfs.unknown > 0.0001 ? '&ndash;' : sfs.art8 > 0.9999 ? '100% Article 8' : Math.round(sfs.art8 * 100) + '% Article 8';
    add(qtStat3([Q.lite ? null : ['Your attitude to risk', Q.risk.sri + ' &ndash; ' + ESMA_LABELS[Q.risk.sri]], [t2[0], t2[1]], ['Sustainability', sus]]));
    p(Q.lite ? T.fundsIntroLite : T.fundsIntro);
    if (Q.lite) {
      if (gp && fRisk.line) add('<p>' + fRisk.line + '</p>');   // no client rating to compare with
    } else if (gp) {
      var profile = strategyProfile(r.stratObj) || 'Medium risk', fit = strategyRiskFit(r.stratObj, Q.risk.sri);
      if (fRisk.line) add('<p>' + fRisk.line + '</p>');
      if (fit.aligned) p(T.riskMatch);
      else p(qtFill(fit.direction === 'higher' ? T.riskHigherProfile : T.riskLowerProfile, { profile: profile, clientSriLabel: ESMA_LABELS[Q.risk.sri], reason: Q.risk.reason }));
    } else {
      if (pr6 === Q.risk.sri) p(T.riskMatch);
      else p(qtFill(pr6 > Q.risk.sri ? T.riskHigher : T.riskLower, { portfolioSri: pr6, clientSri: Q.risk.sri, reason: Q.risk.reason }));
    }
    if (fundRows.some(function(fr) { return fr.gmab; })) {
      var gFunds = qtNameList(fundRows.filter(function(fr) { return fr.gmab; }).map(function(fr) { return fr.fund.name; }));
      add('<div class="gnote"><b>' + escHtml(qtFill(T.packGuaranteeHead, { funds: gFunds })) + '</b>' +
          '<span>' + escHtml(qtGuaranteeNote(fundRows)) + '</span></div>');
    }
    if (fRisk.footnote) p(fRisk.footnote, 'tiny');
    // The funds: brochure objective and key facts (largest holding first); opportunities and risks are left to the factsheets
    add('<h3 class="kwn">' + escHtml(FH.funds) + '</h3>');
    p(T.packFundsFactsheets);
    fundRows.forEach(function(fr) {
      var f = fr.fund, info = qtFundInfo(f.id) || {}, cat = FUND_CATEGORY_MAP[fr.cat], lv = qtGteeLevel(f.id);
      var facts = [f.isin ? 'ISIN ' + escHtml(f.isin) : '', 'Risk ' + Math.round(f.esma) + ' of 7', 'Fund charge ' + pct(fr.fmc),
                   info.sfdr ? 'SFDR Article ' + info.sfdr : '', fr.gmab ? '<span class="g">Annual Guarantee' + (lv ? ' ' + lv : '') + '</span>' : ''].filter(Boolean);
      add('<div class="fcard"><div class="fch"><b>' + escHtml(f.name) + '</b><span>' + escHtml(info.category || (cat ? cat.label : '')) +
          ' &middot; ' + (+(fr.weight * 100).toFixed(1)) + '% of your plan</span></div>' +
          '<div class="fcm">' + facts.join(' &middot; ') + '</div>' +
          '<p>' + escHtml(info.desc || f.desc || '') + '</p></div>');
    });
    // fmcNote says projections use the maximum FMC, which holds for the PRSA only (ARF / Bond illustrate at the quoted FMC)
    // kwn: if the warnings below don't fit, this note goes over with them rather than leaving them alone on a page
    add('<p class="tiny">' + escHtml(T.packFundsSourceNote + (isPrsa ? ' ' + T.fmcNote : '')) + '</p>', { cls: 'kwn' });
    add(qtWarnBox([T.packWarnings.past, T.packWarnings.currency]));
  }

  // ── Allianz 4. Projected benefits ──
  if (Q.sections.projection) {
    sec = 'projection';
    pageTitle(T.sections.projection, qtFill(T.packProjectionLead[Q.product] || '', { nra: r.nra }));
    if (isPrsa) {
      var rate = pct(r.blendedGross);
      add(qtStat3([
        ['Projected value at ' + r.nra, fEUR(r.fundWC)],
        ['In today\'s money', fEUR(r.realMat)],
        ['Estimated income', fEUR(r.annualIncomeReal), 'a year']
      ]));
      add('<div class="chart">' + qtPrsaChart(r, 640, 180) + '</div>');
      // Key years only: the full year-by-year run is in the adviser's on-screen results.
      var th = '<table class="dt num split"><thead><tr><th class="l">Year</th><th>Age</th><th>Total paid in</th>' +
        '<th class="em">Projected value</th><th>In today\'s money</th></tr></thead><tbody>';
      qtKeyYears(r.snapshots).forEach(function(x) {
        var real = x.isMat ? r.realMat : x.fundWC / Math.pow(1 + INFLATION, x.year);
        th += '<tr' + (x.isMat ? ' class="mat"' : '') + '><td class="l">' + (x.isMat ? 'At ' + r.nra : x.year) + '</td><td>' + (x.isMat ? r.nra : x.age) +
          '</td><td>' + fEUR(x.contribNC) + '</td><td class="em"><b>' + fEUR(x.fundWC) + '</b></td><td>' + fEUR(real) + '</td></tr>';
      });
      add(th + '</tbody></table>', { cls: 'split' });
      p(T.packKeyYearsNote + ' ' + T.packChargesAllowed, 'tiny');   // one line, so the warnings below stay on this page
      // IMPORTANT box under the figures, as for the ARF and Investment Bond
      imp([qtFill(r.isGlidepath ? T.prsaImportantGlidepath : T.prsaImportantFlat, { rate: rate, inflation: pct(INFLATION) }), T.prsaImportant2]);
      add(qtWarnBox([T.packWarnings.estimates, T.packWarnings.value]));
      if (r.strat === 'dis') p(T.prsaDisNote, 'tiny');
    } else if (isArf) {
      p(T.arfProjectionIntro);
      add('<div class="chart">' + qtArfChart(r, 640, 220) + '</div>');
      [[r.p1, r.rate1], [r.p2, r.rate2]].forEach(function(pr, idx) {
        var pp = pr[0], rt = pct(pr[1]);
        add('<h3 class="kwn' + (idx === 1 ? ' newpage' : '') + '">At ' + rt + ' growth a year</h3>');
        var t = '<table class="num split"><thead><tr class="ltr"><th></th><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E = A + B &minus; C &minus; D</th></tr>' +
          '<tr><th>Year</th><th>Age</th><th>Contributions paid</th><th>Investment growth to date</th><th>Charges to date</th><th>Income taken to date</th><th>Projected value after income</th></tr></thead><tbody>';
        pp.rows.forEach(function(rw) {
          t += '<tr' + (pp.fundZeroYear === rw.year ? ' class="mat"' : '') + '><td>' + rw.year + '</td><td>' + rw.age + '</td><td>' + fEUR(rw.A) + '</td><td>' + fEUR(rw.B) + '</td><td>' + fEUR(rw.C) + '</td><td>' + fEUR(rw.D) + '</td><td><b>' + fEUR(rw.E) + '</b></td></tr>';
        });
        add(t + '</tbody></table>', { cls: 'split' });
        imp([qtFill(T.arfImportant, { rate: rt })]);
        p(qtFill(T.arfRiy, { rate: rt, netRate: pct(pp.netRate) }));
        p(pp.fundZeroYear ? qtFill(T.arfDepletes, { rate: rt, year: pp.fundZeroYear, age: pp.depletionAge }) : qtFill(T.arfLasts, { rate: rt }));
      });
      p(qtArfIncomeSentence(r));
      p(qtFill(T.arfEscNote, { esc: pct(qtArfEsc(r)) }));
      p(T.arfDepletionWarning);
      if (r.hasSurrender) p(T.arfSurrenderNote);
    } else {
      p(T.ibProjectionIntro);
      add('<div class="chart">' + qtIbChart(r, 640, 220) + '</div>');
      var ibRt = pct(r.rate);
      var ti = '<table class="num split"><thead><tr class="ltr"><th></th><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F = A + B &minus; C &minus; D &minus; E</th></tr>' +
        '<tr><th>Year</th><th>Age</th><th>Contributions paid</th><th>Investment growth to date</th><th>Charges to date</th><th>Tax to date</th><th>Income taken to date (after tax)</th><th>Projected value</th></tr></thead><tbody>';
      r.p.rows.forEach(function(rw) {
        ti += '<tr' + (r.p.fundZeroYear === rw.year ? ' class="mat"' : '') + '><td>' + rw.year + '</td><td>' + rw.age + '</td><td>' + fEUR(rw.A) + '</td><td>' + fEUR(rw.B) + '</td><td>' + fEUR(rw.C) + '</td><td>' + fEUR(rw.D) + '</td><td>' + fEUR(rw.E) + '</td><td><b>' + fEUR(rw.F) + '</b></td></tr>';
      });
      add(ti + '</tbody></table>', { cls: 'split' });
      imp([qtFill(T.ibImportant, { rate: ibRt })]);
      p(qtFill(T.ibRiy, { rate: ibRt, netRate: pct(r.p.netRate) }));
      p(r.p.fundZeroYear ? qtFill(T.ibDepletes, { rate: ibRt, year: r.p.fundZeroYear, age: r.p.depletionAge }) : qtFill(T.ibLasts, { rate: ibRt }));
      p(qtIbIncomeSentence(r));
      p(qtFill(T.ibTaxNote, { rate: pct(r.taxRate), ptype: r.policyholderType }));
      p(T.ibDepletionWarning);
      if (r.hasSurrender) p(T.ibSurrenderNote);
    }
  }

  // ── 5. Charges ──
  if (Q.sections.charges) {
    sec = 'charges';
    pageTitle(T.sections.charges, T.packLeads.charges);
    var ct = '<table class="dt num split"><thead><tr><th class="l">Fund</th><th>Allocation</th><th>' + (isPrsa ? 'AMC' : 'Policy charge') + ' (incl. trail commission)</th><th>Fund charge</th><th>Guarantee charge</th><th>Total annual charge</th></tr></thead><tbody>';
    var bAdmin = 0, bFmc = 0, bG = 0;
    fundRows.forEach(function(fr) {
      ct += '<tr><td class="l">' + escHtml(fr.fund.name) + '</td><td>' + (fr.weight * 100).toFixed(1) + '%</td><td>' + pct(fr.admin) + '</td><td>' + pct(fr.fmc) + '</td><td>' + (fr.gtee > 0 ? pct(fr.gtee) : '&ndash;') + '</td><td>' + pct(fr.total) + '</td></tr>';
      bAdmin += fr.weight * fr.admin; bFmc += fr.weight * fr.fmc; bG += fr.weight * fr.gtee;
    });
    ct += '<tr class="tot"><td class="l">Your portfolio' + (isPrsa && r.isGlidepath ? ' (initial mix)' : '') + '</td><td>100%</td><td>' + pct(bAdmin) + '</td><td>' + pct(bFmc) + '</td><td>' + (bG > 0 ? pct(bG) : '&ndash;') + '</td><td>' + pct(bAdmin + bFmc + bG) + '</td></tr>';
    add(ct + '</tbody></table>', { cls: 'split' });
    if (isPrsa) {
      if (r.isGlidepath) p(T.glidepathNote);
      // Contribution charges: one row per contribution in the plan, with the rule that sets the charge
      var CR = T.prsaContribRule, per = { monthly: ' a month', quarterly: ' a quarter', annual: ' a year' }[r.freq] || '';
      var ccRows = [
        r.spRaw > 0 ? ['Single contribution', fEUR(r.spRaw), r.spContribCharge, qtFill(CR.sp, { charge: pct(CONTRIB_SP_CHARGE), threshold: fEUR(CONTRIB_SP_THRESHOLD) })] : null,
        r.rpRaw > 0 ? ['Regular contribution', fEUR(r.rpRaw) + per, r.rpContribCharge, qtFill(CR.rp, { charge: pct(CONTRIB_RP_CHARGE), threshold: fEUR(CONTRIB_RP_THRESHOLD) })] : null,
        r.ofvRaw > 0 ? ['Transfer value', fEUR(r.ofvRaw), 0, CR.ofv] : null
      ].filter(Boolean);
      add('<h3 class="kwn">Contribution charges</h3>');
      add('<table class="dt num split"><thead><tr><th class="l">Contribution</th><th>Amount</th><th class="em">Contribution charge</th><th class="l">When a charge applies</th></tr></thead><tbody>' +
        ccRows.map(function(c) {
          return '<tr><td class="l">' + c[0] + '</td><td>' + c[1] + '</td><td class="em"><b>' + (c[2] > 0 ? pct(c[2]) : 'None') + '</b></td><td class="l">' + escHtml(c[3]) + '</td></tr>';
        }).join('') + '</tbody></table>', { cls: 'split' });
      if (QT_SHOW_EFFECT_OF_CHARGES) add('<h3 class="kwn">Effect of charges</h3>');
      if (QT_SHOW_EFFECT_OF_CHARGES) p(qtFill(T.prsaRiy, { riy: pct(Math.max(0, r.grossRate - r.netRate)), gross: pct(r.grossRate), net: pct(r.netRate) }) + ' ' + qtRiyWhy('prsa', r));
    } else if (isArf) {
      add('<h3 class="kwn">Exit charges</h3>');
      if (r.hasSurrender) {
        p(T.arfExitCharges);
        var sv = r.cc.surrender, et = '<table class="num"><thead><tr><th class="l">Policy year</th>';
        var last = 0; sv.forEach(function(x, i){ if (x > 0) last = i; });
        for (var yi = 0; yi <= last + 1 && yi < sv.length; yi++) et += '<th>' + (yi === last + 1 ? (yi + 1) + '+' : yi + 1) + '</th>';
        et += '</tr></thead><tbody><tr><td class="l">Exit charge</td>';
        for (var yj = 0; yj <= last + 1 && yj < sv.length; yj++) et += '<td>' + pct(sv[yj]) + '</td>';
        add(et + '</tr></tbody></table>');
      } else p(T.arfNoExitCharges);
      if (QT_SHOW_EFFECT_OF_CHARGES) add('<h3 class="kwn">Effect of charges</h3>');
      if (QT_SHOW_EFFECT_OF_CHARGES) p(qtFill(T.arfRiyCharges, { rate: pct(r.rate1), netRate: pct(r.p1.netRate) }) + ' ' + qtFill(T.arfRiyCharges, { rate: pct(r.rate2), netRate: pct(r.p2.netRate) }) + ' ' + qtRiyWhy('arf', r));
    } else {
      add('<h3 class="kwn">Government levy</h3>');
      p(qtFill(T.ibGovtLevyNote, { levy: pct(IB_GOVT_LEVY) }));
      add('<h3 class="kwn">Exit charges</h3>');
      if (r.hasSurrender) {
        p(T.ibExitCharges);
        var sv2 = r.cc.surrender, et2 = '<table class="num"><thead><tr><th class="l">Policy year</th>';
        var last2 = 0; sv2.forEach(function(x, i){ if (x > 0) last2 = i; });
        for (var yi2 = 0; yi2 <= last2 + 1 && yi2 < sv2.length; yi2++) et2 += '<th>' + (yi2 === last2 + 1 ? (yi2 + 1) + '+' : yi2 + 1) + '</th>';
        et2 += '</tr></thead><tbody><tr><td class="l">Exit charge</td>';
        for (var yj2 = 0; yj2 <= last2 + 1 && yj2 < sv2.length; yj2++) et2 += '<td>' + pct(sv2[yj2]) + '</td>';
        add(et2 + '</tr></tbody></table>');
      } else p(T.ibNoExitCharges);
      add('<h3 class="kwn">Exit tax</h3>');
      p(qtFill(T.ibExitTaxNote, { rate: pct(r.taxRate), ptype: r.policyholderType }));
      if (QT_SHOW_EFFECT_OF_CHARGES) add('<h3 class="kwn">Effect of charges</h3>');
      if (QT_SHOW_EFFECT_OF_CHARGES) p(qtFill(T.ibRiyCharges, { rate: pct(r.rate), netRate: pct(r.p.netRate) }) + ' ' + qtRiyWhy('ib', r));
    }
    // ARF / Bond: no contribution charges (the PRSA has its own table above). Then plain-English definitions of each charge.
    if (!isPrsa) add('<div class="pair">' +
        '<div class="fbr"><span>Contribution charge</span><b>None</b></div>' +
        '<div class="fbr"><span>Transfer charge</span><b>Not applicable</b></div></div>');
    add('<div class="defs">' + T.chargeDefs.map(function(d) {
      return '<div><b>' + escHtml(d[0]) + '</b><span>' + escHtml(d[1]) + '</span></div>';
    }).join('') + '</div>');
    if (fundRows.some(function(fr){ return fr.gmab; })) p(T.guaranteeOnNote, 'tiny');
    p(T.chargesFundNote, 'tiny');
    add(qtWarnBox([T.packWarnings.lose]));
  }

  // ── 6. Remuneration ──
  if (Q.sections.remun) {
    sec = 'remun';
    pageTitle(T.sections.remun, qtFill(T.packLeads.remun, { company: cs.name, brokerFirm: Q.broker.firm || 'your adviser' }));
    var initComm = r.totalInitialComm != null ? r.totalInitialComm : r.initialComm;
    var trailComm = r.totalOngoingComm != null ? r.totalOngoingComm
      : (r.p1 || r.p) ? ((r.p1 || r.p).yearly.reduce(function(a, y) { return a + y.comm; }, 0) - (r.initialComm || 0)) : null;
    var toWhen = isPrsa ? 'to age ' + r.nra : 'over the life of your plan';
    add(qtStat3([
      ['Initial commission', fEUR(initComm), 'paid in year 1'],
      ['Trail commission', pct(r.cc.ongoing) + ' a year', trailComm != null ? 'of fund value, est. ' + fEUR(trailComm) + ' ' + toWhen : 'of fund value'],
      trailComm != null ? ['Total estimated', fEUR(initComm + trailComm), toWhen] : null
    ]));
    var rt2 = '<table class="dt num"><thead><tr><th class="l">Type</th><th class="l">Basis</th><th>Amount</th></tr></thead><tbody>';
    if (isPrsa) {
      if (r.spRaw > 0) rt2 += '<tr><td class="l">Initial &ndash; single contribution</td><td class="l">' + pct(r.spUpRate) + ' of single contribution</td><td>' + fEUR(r.spUpfrontComm) + '</td></tr>';
      if (r.ofvRaw > 0) rt2 += '<tr><td class="l">Initial &ndash; transfer</td><td class="l">' + pct(r.spUpRate) + ' of transfer value</td><td>' + fEUR(r.ofvUpfrontComm) + '</td></tr>';
      if (r.rpRaw > 0) rt2 += '<tr><td class="l">Initial &ndash; regular contributions</td><td class="l">' + pct(r.rpUpfrontPct) + ' of first year\'s regular contributions</td><td>' + fEUR(r.rpUpfrontComm) + '</td></tr>';
      rt2 += '<tr><td class="l">Trail</td><td class="l">' + pct(r.cc.ongoing) + ' a year of fund value</td><td>' + fEUR(r.totalOngoingComm) + '<br><span class="muted">projected total to retirement</span></td></tr>';
      rt2 += '<tr class="mat"><td class="l" colspan="2">Total projected remuneration</td><td>' + fEUR(r.totalInitialComm + r.totalOngoingComm) + '</td></tr>';
    } else if (isArf) {
      var trail1 = r.p1.yearly.reduce(function(a, y){ return a + y.comm; }, 0) - r.initialComm;
      var trail2 = r.p2.yearly.reduce(function(a, y){ return a + y.comm; }, 0) - r.initialComm;
      rt2 += '<tr><td class="l">Initial</td><td class="l">' + pct(r.spUpRate) + ' of single contribution</td><td>' + fEUR(r.initialComm) + '</td></tr>';
      rt2 += '<tr><td class="l">Trail</td><td class="l">' + pct(r.cc.ongoing) + ' a year of fund value</td><td>' + fEUR(trail1) + ' at ' + pct(r.rate1) + '<br>' + fEUR(trail2) + ' at ' + pct(r.rate2) + '<br><span class="muted">projected total over the life of your ARF</span></td></tr>';
    } else {
      var trailIb = r.p.yearly.reduce(function(a, y){ return a + y.comm; }, 0) - r.initialComm;
      if (r.contribution > 0) rt2 += '<tr><td class="l">Initial &ndash; single contribution</td><td class="l">' + pct(r.spUpRate) + ' of single contribution</td><td>' + fEUR(r.spUpRate * r.contribution) + '</td></tr>';
      if (r.rpInitialComm > 0) rt2 += '<tr><td class="l">Initial &ndash; regular contribution</td><td class="l">' + pct(IB_CODES[r.code].rpUp) + ' of first year\'s regular contributions</td><td>' + fEUR(r.rpInitialComm) + '</td></tr>';
      rt2 += '<tr><td class="l">Trail</td><td class="l">' + pct(r.cc.ongoing) + ' a year of fund value</td><td>' + fEUR(trailIb) + ' at ' + pct(r.rate) + '<br><span class="muted">projected total over the life of your Investment Bond</span></td></tr>';
    }
    add(rt2 + '</tbody></table>');
    p(T.remunInitial + ' ' + T.remunTrail);
    add('<h3 class="kwn">Projected remuneration by year</h3>');
    var yt;
    if (isPrsa) {
      yt = '<table class="dt num split"><thead><tr><th class="l">Year</th><th>Age</th><th>Initial</th><th>Trail</th><th class="em">Total</th></tr></thead><tbody>';
      qtKeyYears(r.snapshots).forEach(function(s) {
        var trailY = s.ongoingInYear || 0, initY = Math.max(0, (s.commInYear || 0) - trailY);
        yt += '<tr' + (s.isMat ? ' class="mat"' : '') + '><td class="l">' + (s.isMat ? 'At ' + r.nra : s.year) + '</td><td>' + (s.isMat ? r.nra : s.age) +
          '</td><td>' + (initY > 0 ? fEUR(initY) : '&ndash;') + '</td><td>' + fEUR(trailY) + '</td><td class="em"><b>' + fEUR(initY + trailY) + '</b></td></tr>';
      });
    } else if (isArf) {
      yt = '<table class="dt num split"><thead><tr><th class="l">Year</th><th>Contributions payable in that year</th><th>Projected remuneration at ' + pct(r.rate1) + '</th><th>Projected remuneration at ' + pct(r.rate2) + '</th></tr></thead><tbody>';
      // stop after the first row where remuneration has fallen to zero at both rates
      var seenZero = false;
      r.p1.commRows.forEach(function(c1, i) {
        var c2 = r.p2.commRows[i] || { comm: 0 };
        if (seenZero) return;
        if (c1.comm < 0.5 && c2.comm < 0.5 && c1.contrib <= 0) seenZero = true;
        yt += '<tr><td>' + c1.year + '</td><td>' + (c1.contrib > 0 ? fEUR(c1.contrib) : '&ndash;') + '</td><td>' + fEUR(c1.comm) + '</td><td>' + fEUR(c2.comm) + '</td></tr>';
      });
    } else {
      yt = '<table class="dt num split"><thead><tr><th class="l">Year</th><th>Contributions payable in that year</th><th>Projected remuneration at ' + pct(r.rate) + '</th></tr></thead><tbody>';
      r.p.commRows.forEach(function(c1) {
        yt += '<tr><td>' + c1.year + '</td><td>' + (c1.contrib > 0 ? fEUR(c1.contrib) : '&ndash;') + '</td><td>' + fEUR(c1.comm) + '</td></tr>';
      });
    }
    add(yt + '</tbody></table>', { cls: 'split' });
    p(T.remunTableNote, 'small');
    add('<h3 class="kwn">Clawback</h3>');
    p(r.clawback ? (isPrsa ? T.prsaClawback : isArf ? T.arfClawback : T.ibClawback) : T.noClawback);
    if (r.spUpOverridden || (isPrsa && r.rpUpOverridden)) p(T.overrideNote);
  }

  // ── 8. Important ──
  if (Q.sections.important) {
    sec = 'important';
    pageTitle(T.sections.important, T.packLeads.important);
    // Every CPC warning together, as well as beside the figures each one relates to.
    add(qtWarnBox(wAll));
    add('<div class="defs two">' + T.packImportant.map(function(d) {
      return '<div><b>' + escHtml(d[0]) + '</b><span>' + escHtml(qtFill(d[1], { productBrand: brand })) + '</span></div>';
    }).join('') + '</div>');
    T.importantInfo.forEach(function(l) { p(qtFill(l, { regDoc: isPrsa ? T.regDocPrsa : isArf ? T.regDocArf : T.regDocIb }), 'tiny'); });
    // Standing projection notes (the IMPORTANT assumptions box is on the projection page)
    if (isPrsa) {
      p(T.prsaAverageNote, 'tiny');
      p(T.prsaAnnuityNote, 'tiny');
    }
    p(T.coolingOff, 'tiny');
  }
  if (Q.sections.glossary) {
    sec = 'glossary';
    pageTitle(T.sections.glossary, T.packLeads.glossary);
    var gl = T.glossary.filter(function(g) {
      var only = T.glossaryOnly[g[0]];
      return !only || only === Q.product;
    });
    var gt = '<table class="gloss two split"><tbody>';
    for (var gi = 0; gi < gl.length; gi += 2) {
      gt += '<tr>' + [gl[gi], gl[gi + 1]].map(function(g) {
        return '<td>' + (g ? '<b>' + escHtml(g[0]) + '</b><span>' + escHtml(g[1]) + '</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }
    add(gt + '</tbody></table>', { cls: 'split' });
  }

  // ── Allianz 9. Back page: navy, as in the brochures (contact, warnings, small print) ──
  if (hasAgl) {
    sec = 'glossary';
    var BP = T.packBack;
    add('<div class="backp"><div class="clogo">' + qtLogoSvg(30, '#fff') + '</div>' +
        '<div class="bpmain"><div class="bpsec"><b class="bph">' + escHtml(BP.contactHead) + '</b><p>' + escHtml(BP.contactIntro) + '</p>' +
        '<p><b>' + escHtml(BP.office) + '</b><br>' + escHtml(cs.name) + '<br>' + cs.addressLines.map(escHtml).join(', ') + '</p>' +
        '<p><b>Email:</b> <span class="bpl">' + escHtml(cs.email) + '</span> &ndash; ' + escHtml(BP.emailNote) + '</p>' +
        '<p><b>Tel:</b> ' + escHtml(cs.phone) + '</p></div>' +
        '<div class="bprule"></div>' +
        '<div class="bpsec"><b class="bph">' + escHtml(BP.warningsHead) + '</b><p>' + escHtml(qtFill(BP.notRiskFree, { productBrand: brand })) + '</p>' +
        qtWarnBox(wAll) + '</div></div>' +
        '<div class="bpr"><span>' + escHtml(qtFill(T.packValidity, { date: dateLong })) + '</span>' +
        '<span>' + escHtml(cs.regulatory) + '</span></div></div>', { full: true });
  }

  // ── Allianz 1b. Contents, after the cover (page numbers are filled in by the paginator) ──
  if (tocAt >= 0) {
    var tocKeys = [];
    B.forEach(function(b) {
      if (b.full || b.grp !== 'agl' || tocKeys.indexOf(b.sec) >= 0) return;
      tocKeys.push(b.sec);
    });
    var TC = T.packContents;
    sec = 'summary';
    add('<div class="tocp"><div class="toct"><span>' + escHtml(TC.title[0]) + '</span><span>' + escHtml(TC.title[1]) + '</span></div>' +
        '<p>' + escHtml(qtFill(isIb ? TC.introKid : TC.intro, { productBrand: brand })) + '</p>' +
        '<div class="tocl">' + tocKeys.map(function(k) {
          return '<div class="toci"><span class="tpg">' + escHtml(TC.pageWord) + ' <b data-toc="' + k + '"></b></span>' +
            '<span class="ttl">' + escHtml(T.sections[k]) + '</span></div>';
        }).join('') + '</div></div>', { full: true });
    B.splice(tocAt, 0, B.pop());
  }

  // ── Assemble ──
  // Allianz pages: logo left, who the quotation is for on the right (as on the Statement of Reasonable Projection).
  var hdrAgl = '<div class="hl">' + qtLogoSvg(20) + '</div><div class="hr">Quotation for ' + escHtml(clientName) +
    '<br>' + escHtml(dateLong) + '</div>';
  var bAddr = (Q.broker.address || '').split('\n').filter(function(x){ return x.trim(); }).map(escHtml);
  var hdrBroker = '<div class="hl"><div class="firm">' + escHtml(Q.broker.firm) + '</div></div>' +
    '<div class="hr">' + bAddr.concat(Q.broker.phone ? [escHtml(Q.broker.phone)] : []).join('<br>') + '</div>';
  // Footers carry their own spans: the paginator appends only the page number.
  var footAgl = '<span class="fbrand">' + escHtml(brand.toUpperCase()) + '</span>' +
    '<span>' + escHtml(cs.name) + ' is regulated by the Central Bank of Ireland.</span>';
  var footBroker = '<span>' + escHtml(Q.broker.regStatement || (Q.broker.firm + ' is regulated by the Central Bank of Ireland.')) + '</span>';

  var src = B.map(function(b) {
    return '<div class="blk ' + b.cls + '" data-hdr="' + b.hdr + '" data-grp="' + b.grp + '"' +
      (b.full ? ' data-full="1"' : '') + ' data-sec="' + b.sec + '">' + b.html + '</div>';
  }).join('');

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>' + escHtml(Q.docTitle || (Q.productName + ' – Quotation – ' + clientName)) + '</title>' +
    '<style>' + qtPackCss() + (Q.embed ? qtEmbedCss() : '') + '</style></head><body class="p-' + escHtml(Q.product) + '">' +
    (Q.embed ? '' : '<div class="topbar"><span>' + escHtml(Q.productName) + ' &ndash; Quotation &ndash; ' + escHtml(clientName) + '</span><button onclick="window.print()">Print / Save as PDF</button>' +
      (Q.libBase ? '<button onclick="this.disabled=true;window.opener&&window.opener.savePackPdf&&window.opener.savePackPdf(window)">Save PDF with attached documents</button>' : '') + '</div>') +
    '<template id="hdr-agl">' + hdrAgl + '</template><template id="hdr-broker">' + hdrBroker + '</template>' +
    '<template id="foot-agl">' + footAgl + '</template><template id="foot-broker">' + footBroker + '</template>' +
    '<div id="src">' + src + '</div><div id="pages"></div>' + qtAttachedPreview(Q) +
    // Pages are rasterised here (html2canvas) so the opener can merge the factsheets / KIDs into one PDF
    (Q.libBase ? '<script src="' + Q.libBase + 'js/vendor/html2canvas.min.js"><\/script><script>' + qtRasterSrc() + '<\/script>' : '') +
    '<script>' + (Q.noAutoPrint || Q.libBase ? 'window.__noAutoPrint = true;' : '') + qtPaginatorSrc() + '<\/script></body></html>';
}

// The documents that will be added to the saved PDF, shown below the pages in the pack window (never printed)
function qtAttachedPreview(Q) {
  if (!Q.libBase || !Q.attached || !Q.attached.length) return '';
  return '<style>#attached { max-width: 210mm; margin: 8mm auto 16mm; font-family: Arial, sans-serif; } #attached h2 { font-size: 14pt; color: #003781; margin: 0 0 2mm; }' +
    ' #attached p { font-size: 9.5pt; color: #5E6B78; margin: 0 0 4mm; } #attached details { margin-bottom: 3mm; background: #fff; border: 1px solid #E2E8EF; border-radius: 2mm; }' +
    ' #attached summary { padding: 3mm 4mm; font-size: 10pt; font-weight: 700; cursor: pointer; } #attached embed { display: block; width: 100%; height: 280mm; border: 0; }' +
    ' @media print { #attached { display: none; } }</style>' +
    '<div id="attached"><h2>Attached documents</h2><p>These are added after the pages above when you choose Save PDF with attached documents. Open one to check it.</p>' +
    Q.attached.map(function(d) { return '<details><summary>' + escHtml(d.title) + '</summary><embed src="' + escHtml(d.url) + '" type="application/pdf"></details>'; }).join('') + '</div>';
}

// Rows shown in PRSA tables: years 1–5, every 5th year, and retirement.
function qtPrsaRows(r) {
  return r.snapshots.filter(function(s) { return s.isMat || s.year <= 5 || s.year % 5 === 0; });
}
function qtArfEsc(r) {
  var i = r.inputs;
  return (i.incomeType === 'custom_amount' && i.incomeEscalationPct != null) ? i.incomeEscalationPct / 100 : ARF_INCOME_ESC;
}
function qtArfIncomeShort(r) {
  var i = r.inputs;
  if (i.incomeType === 'default') return 'Income at Revenue minimum (deemed distribution)';
  if (i.incomeType === 'custom_amount') return 'Income ' + fEUR(i.incomeValue) + ' a year, increasing ' + pct(qtArfEsc(r)) + ' a year';
  return 'Income ' + i.incomeValue + '% of fund a year';
}
function qtArfIncomeSentence(r) {
  var T = QT_TEXT, i = r.inputs, s;
  if (i.incomeType === 'default') s = T.arfIncomeDefault;
  else if (i.incomeType === 'custom_amount') s = qtFill(T.arfIncomeAmount, { income: fEUR(i.incomeValue), esc: pct(qtArfEsc(r)) });
  else s = qtFill(T.arfIncomePct, { incomePct: (+i.incomeValue).toFixed(2) + '%', income: fEUR(r.contribution * i.incomeValue / 100) });
  if (i.incomeStartAge > Math.ceil(r.startAge)) s += ' ' + qtFill(T.arfDeferNote, { incomeAge: i.incomeStartAge });
  return s;
}
function qtIbEsc(r) {
  var i = r.inputs;
  return (i.incomeType === 'custom_amount' && i.incomeEscalationPct != null) ? i.incomeEscalationPct / 100 : 0;
}
function qtIbIncomeShort(r) {
  var i = r.inputs;
  if (i.incomeType === 'none') return 'No income — the policy is left to grow';
  if (i.incomeType === 'custom_amount') return 'Income ' + fEUR(i.incomeValue) + ' a year, increasing ' + pct(qtIbEsc(r)) + ' a year';
  return 'Income ' + i.incomeValue + '% of fund a year';
}
function qtIbIncomeSentence(r) {
  var T = QT_TEXT, i = r.inputs, s;
  if (i.incomeType === 'none') s = T.ibIncomeNone;
  else if (i.incomeType === 'custom_amount') s = qtFill(T.ibIncomeAmount, { income: fEUR(i.incomeValue), esc: pct(qtIbEsc(r)) });
  else s = qtFill(T.ibIncomePct, { incomePct: (+i.incomeValue).toFixed(2) + '%', income: fEUR(r.contribution * i.incomeValue / 100) });
  if (i.incomeType !== 'none' && i.incomeStartAge > Math.ceil(r.startAge)) s += ' ' + qtFill(T.ibDeferNote, { incomeAge: i.incomeStartAge });
  return s;
}
function qtArfLastsShort(pp, rate) {
  return pp.fundZeroYear ? 'At ' + pct(rate) + ': lasts until around age <b>' + pp.depletionAge + '</b>' : 'At ' + pct(rate) + ': lasts beyond 40 years';
}
function qtStrategyDescription(Q) {
  var T = QT_TEXT, r = Q.r;
  if (Q.product !== 'prsa' || r.strat === 'diy') return T.diyDescription;
  if (r.strat === 'dis') return T.disDescription;
  var prof = strategyProfile(r.stratObj);
  return (prof ? T.strategyProfiles[prof] : '') + (r.stratObj && r.stratObj.gmab ? ' ' + T.guaranteeFundNoteGeneric : '');
}

// Allianz Neo, as loaded by a1-elements.css in the tool itself
var QT_PACK_FONTS = [['normal', 'Regular'], ['600', 'SemiBold'], ['bold', 'Bold']].map(function(w) {
  var u = 'https://fonts.cdn.allianz.com/allianz-neo/AllianzNeoW04-' + w[1];
  return '@font-face { font-family: "Allianz Neo"; font-style: normal; font-weight: ' + w[0] + '; font-display: block; src: url("' + u + '.woff2") format("woff2"), url("' + u + '.woff") format("woff"); }';
}).join('\n');
// Trims the standalone-window chrome so the pages sit cleanly in the tool's preview panel
function qtEmbedCss() {
  return [
    'body { background: transparent; }',
    '.page { margin: 0 0 6mm; box-shadow: 0 2px 10px rgba(14,30,51,.10); }',
    '.page:last-child { margin-bottom: 0; }'
  ].join('\n');
}
function qtPackCss() {
  return [
    QT_PACK_FONTS,
    '@page { size: A4; margin: 0; }',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { font-family: "Allianz Neo", Arial, Helvetica, sans-serif; color: #0E1E33; font-synthesis: none; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums; }',
    'body { background: #dfe3e8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    '#src { position: absolute; left: -10000px; top: 0; width: 178mm; }',
    '.topbar { position: sticky; top: 0; z-index: 2; background: #003680; color: #fff; padding: 10px 20px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }',
    '.topbar button { background: #fff; color: #003680; border: none; padding: 7px 18px; border-radius: 6px; font: inherit; font-weight: 700; cursor: pointer; }',
    '.page { width: 210mm; height: 297mm; background: #fff; margin: 8mm auto; position: relative; overflow: hidden; page-break-after: always; break-after: page; }',
    '.page:last-child { page-break-after: auto; break-after: auto; }',
    '.phdr { position: absolute; top: 12mm; left: 16mm; right: 16mm; height: 13mm; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 0.6pt solid #D5DDE6; padding-bottom: 3mm; }',
    '.phdr.broker { height: 16mm; align-items: flex-start; border-bottom: 1.5pt solid #0E1E33; }',
    '.phdr .hr { text-align: right; font-size: 7.6pt; color: #5E6B78; line-height: 1.45; }',
    '.phdr .firm { font-size: 13pt; font-weight: 700; color: #0E1E33; }',
    '.pbody { position: absolute; top: 33mm; bottom: 18mm; left: 16mm; right: 16mm; overflow: hidden; }',
    '.pfoot { position: absolute; bottom: 8mm; left: 16mm; right: 16mm; font-size: 6.8pt; color: #8A96A3; border-top: 0.5pt solid #E2E8EF; padding-top: 2mm; display: flex; justify-content: space-between; gap: 6mm; }',
    '.pfoot .pn { white-space: nowrap; }',
    '.blk { margin-bottom: 3.2mm; }',
    'h1 { font-size: 19pt; color: #003680; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 2mm; }',
    'h2 { font-size: 17pt; color: #003680; font-weight: 700; letter-spacing: -0.01em; padding-bottom: 1mm; }',
    'h3 { font-size: 10.5pt; color: #003680; font-weight: 700; margin-top: 1.5mm; }',
    'p, li { font-size: 9pt; line-height: 1.5; color: #1E2B3B; }',
    'p + p { margin-top: 2mm; }',
    'ul { padding-left: 5mm; } li { margin-bottom: 1.2mm; }',
    'p.small { font-size: 7.6pt; color: #5E6B78; }',
    '.muted { color: #5E6B78; font-size: 7.8pt; }',
    'b { font-weight: 700; }',
    '.eyebrow { font-size: 7.6pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0377A8; margin-bottom: 1.5mm; }',
    'h1.prep { font-size: 22pt; margin-bottom: 1mm; }',
    '.byline { font-size: 9pt; color: #5E6B78; }',
    '.hero { display: grid; grid-template-columns: 1.1fr 1fr; border: 0.75pt solid #E2E8EF; border-radius: 2.5mm; overflow: hidden; }',
    '.hero .hl { background: #003680; color: #fff; padding: 5mm 5.5mm; }',
    '.hero .k, .hero .s { font-size: 8pt; color: #DCE6F4; line-height: 1.45; }',
    '.hero .v { font-size: 24pt; font-weight: 700; line-height: 1.15; margin: 1.5mm 0 1mm; }',
    '.hero .hr { padding: 4mm 5mm; display: flex; align-items: center; }',
    'table.facts td { font-size: 8.4pt; padding: 0.9mm 0; color: #5E6B78; }',
    'table.facts td + td { text-align: right; color: #0E1E33; font-weight: 700; }',
    '.chart { margin: 1mm 0; }',
    '.cards2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }',
    '.pcard { border: 0.75pt solid #E2E8EF; border-radius: 2.5mm; padding: 4mm 4.5mm; }',
    '.pcard .pt { font-size: 9pt; font-weight: 700; color: #003680; margin-bottom: 1.5mm; }',
    '.pcard p { font-size: 8.4pt; }',
    'table.kv2 td { font-size: 8.4pt; padding: 0.9mm 0; color: #5E6B78; }',
    'table.kv2 td + td { text-align: right; color: #0E1E33; font-weight: 700; }',
    '.warnbox { background: #F4F7FA; border-radius: 2mm; padding: 3mm 4mm; font-size: 7.8pt; line-height: 1.5; color: #1E2B3B; }',
    '.tiles3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }',
    '.tiles3 > div { background: #F4F7FA; border-radius: 2mm; padding: 3mm 4mm; }',
    '.tiles3 span { display: block; font-size: 7.6pt; color: #5E6B78; }',
    '.tiles3 b { display: block; font-size: 12pt; color: #003680; margin-top: 0.5mm; }',
    '.g { color: #0B7A3E; font-weight: 700; }',
    '.splitrow { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }',
    '.splitrow.one { grid-template-columns: 1fr; }',
    '.splitrow .bt { font-size: 8.8pt; font-weight: 700; color: #003680; margin-bottom: 1.5mm; }',
    '.gnote { background: #E6F4EC; border-radius: 2mm; padding: 3mm 3.5mm; font-size: 7.8pt; line-height: 1.45; color: #1E2B3B; }',
    '.gnote b { display: block; color: #0B7A3E; margin-bottom: 0.8mm; }',
    'table { width: 100%; border-collapse: collapse; }',
    'table.num th { font-size: 7.4pt; color: #5E6B78; font-weight: 700; text-align: right; padding: 1.5mm 1.8mm; vertical-align: bottom; border-bottom: 1pt solid #003680; line-height: 1.3; }',
    'table.num th.em { color: #003680; }',
    'table.num tr.ltr th { border-bottom: none; font-size: 9pt; color: #003680; padding-bottom: 0; }',
    'table.num td { font-size: 8.4pt; text-align: right; padding: 1.5mm 1.8mm; border-bottom: 0.5pt solid #EEF2F6; }',
    'table.num th:first-child, table.num td:first-child { text-align: left; }',
    'table.num .l { text-align: left; }',
    'table.num tr.mat td { font-weight: 700; color: #003680; background: #EEF4FA; }',
    'table.num tr.cat td { font-weight: 700; color: #0E1E33; background: #F7FAFC; font-size: 8pt; }',
    'table.kv td { font-size: 8.6pt; padding: 1.2mm 2mm; border-bottom: 0.5pt solid #EEF2F6; }',
    'table.kv td:nth-child(odd) { color: #5E6B78; width: 16%; }',
    'table.gloss td { font-size: 8.6pt; padding: 1.6mm 2mm; border-bottom: 0.5pt solid #EEF2F6; vertical-align: top; line-height: 1.45; }',
    'table.gloss td:first-child { width: 34%; color: #003680; }',
    '.imp { border-left: 2.5pt solid #003680; background: #EEF4FA; padding: 2.5mm 4mm; border-radius: 0 1.5mm 1.5mm 0; }',
    '.imp b { font-size: 8.6pt; }',
    '.imp p { font-size: 8.4pt; font-weight: 700; margin-top: 1.2mm; }',
    '.warn { background: #F4F7FA; border-radius: 2mm; padding: 3mm 4mm; }',
    '.warn p { font-weight: 700; font-size: 8.6pt; }',
    '.badge { display: inline-block; padding: 0.3mm 1.6mm; border-radius: 1mm; font-size: 7.4pt; font-weight: 700; }',
    '.sricol { flex: 1; max-width: 95mm; }',
    'table.sri { width: 100%; table-layout: fixed; }',
    'table.sri td { text-align: center; font-size: 8.6pt; font-weight: 700; color: #fff; padding: 1.4mm 0; border: 1.5pt solid #fff; }',
    'table.sri td.on { outline: 1.5pt solid #0E1E33; outline-offset: -1.5pt; }',
    'table.sri tr.mk td { background: none; color: #0E1E33; font-size: 7pt; font-weight: 700; padding-top: 0.5mm; line-height: 1.2; }',
    '.sri-ends { width: 100%; margin-top: -1mm; display: flex; justify-content: space-between; font-size: 7pt; color: #5E6B78; }',
    '.sricol.sm { max-width: none; margin-top: 2mm; }',
    '.sricol.sm table.sri td { font-size: 7.2pt; padding: 0.8mm 0; }',
    '.sricol.sm table.sri tr.mk td { font-size: 6.4pt; }',
    '.sricol.sm .sri-ends { display: none; }',
    '.catbar { display: flex; height: 3.5mm; border-radius: 1mm; overflow: hidden; background: #EEF2F6; }',
    '.catleg { display: flex; flex-wrap: wrap; gap: 1mm 5mm; font-size: 7.8pt; color: #5E6B78; margin-top: 1.5mm; }',
    '.catleg i { display: inline-block; width: 2.6mm; height: 2.6mm; border-radius: 0.6mm; margin-right: 1.4mm; vertical-align: -0.3mm; }',
    'p.fdesc { font-size: 8.2pt; color: #3A4756; }',
    '.letter-top { font-size: 9.2pt; line-height: 1.5; margin-bottom: 4mm; }',
    '.letter-top .ldate { margin-top: 5mm; }',
    '.re { margin-bottom: 1mm; }',
    '.sigblock { margin-top: 9mm; font-size: 9pt; line-height: 1.55; }',
    '.sigline { border-bottom: 0.75pt solid #0E1E33; width: 60mm; height: 12mm; margin-bottom: 1.5mm; }',
    '.sigline.short { width: 35mm; height: 9mm; }',
    '.sigs { display: flex; gap: 10mm; margin-top: 4mm; font-size: 8.6pt; }',
    '.sigs > div { flex: 1; } .sigs p { font-size: 8.6pt; }',
    // ── Redesigned quotation pack (handoff §8, 9 Oct 2026) ──
    // Full-bleed pages: the block is the page, with no header, footer or page number.
    '.page.full { padding: 0; }',
    // Label/value blocks on "At a glance"
    '.fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 9mm; }',
    '.fblk { display: flex; flex-direction: column; }',
    '.fbh { font-size: 9pt; font-weight: 700; letter-spacing: 0.08em; color: #003680; padding-bottom: 2mm; border-bottom: 1.5pt solid #003680; }',
    '.fbr { display: flex; justify-content: space-between; gap: 4mm; padding: 1.9mm 0; border-bottom: 0.5pt solid #EEF2F6; font-size: 9pt; }',
    '.fbr span { color: #5E6B78; }',
    '.fbr b { text-align: right; }',
    '.fbr.tot { padding-top: 2.4mm; border-bottom: none; font-size: 10pt; color: #003680; }',
    '.fbr.tot span { color: #003680; font-weight: 700; }',
    '.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0 9mm; }',
    // Three headline figures under a navy rule
    '.stat3 { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1.5pt solid #003680; border-bottom: 0.5pt solid #E2E8EF; }',
    '.stat3 > div { padding: 3mm 4mm 3mm 0; display: flex; flex-direction: column; gap: 0.8mm; }',
    '.stat3 > div + div { padding-left: 4mm; border-left: 0.5pt solid #E2E8EF; }',
    '.stat3 span { font-size: 9pt; color: #5E6B78; }',
    '.stat3 b { font-size: 16pt; color: #003680; line-height: 1.15; }',
    '.stat3 .sub { font-size: 8pt; }',
    // Boxed CPC warnings
    '.wbox { padding: 3mm 4mm; border: 1.2pt solid #0E1E33; display: flex; flex-direction: column; gap: 1mm; font-size: 8.8pt; font-weight: 700; line-height: 1.45; }',
    // Attitude-to-risk strip
    '.riskrow { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6mm; align-items: center; padding: 4mm 4.5mm; background: #F4F7FA; }',
    '.riskrow .rl { display: flex; flex-direction: column; gap: 0.5mm; font-size: 9pt; }',
    '.riskrow .rl span { color: #5E6B78; }',
    '.riskrow .rl b { font-size: 12pt; color: #003680; }',
    '.rstrip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.8mm; }',
    '.rstrip > div { height: 5.5mm; background: #E3EAF2; color: #5E6B78; font-size: 8pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }',
    '.rstrip > div.on { background: #003680; color: #fff; }',
    '.rstrip .lo { grid-column: 1 / 4; font-size: 7.5pt; color: #5E6B78; }',
    '.rstrip .hi { grid-column: 5 / 8; font-size: 7.5pt; color: #5E6B78; text-align: right; }',
    // Data tables
    'table.dt { width: 100%; border-collapse: collapse; }',
    'table.dt thead th { padding: 2mm 1.5mm; border-bottom: 1.5pt solid #003680; font-size: 8.2pt; font-weight: 700; color: #5E6B78; text-align: right; }',
    'table.dt thead th.l { text-align: left; padding-left: 0; }',
    'table.dt thead th.em { color: #003680; }',
    'table.dt tbody td { padding: 2.4mm 1.5mm; border-bottom: 0.5pt solid #EEF2F6; font-size: 9pt; text-align: right; }',
    'table.dt tbody td.l { text-align: left; padding-left: 0; }',
    'table.dt tbody td.em { color: #003680; }',
    'table.dt tbody tr.tot td, table.dt tbody tr.mat td { background: #F4F7FA; font-weight: 700; color: #003680; border-bottom: none; }',
    'table.dt .g { color: #0B7A3E; font-weight: 700; }',
    // Definition lists (charge definitions, important information)
    '.defs { display: flex; flex-direction: column; gap: 3mm; }',
    '.defs.two { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; }',
    '.defs b { display: block; color: #003680; font-size: 9.2pt; }',
    '.defs span { display: block; font-size: 9pt; line-height: 1.55; color: #1E2B3B; }',
    // Asset split (Investment page)
    '.catsplit .bt { font-size: 9.5pt; font-weight: 700; color: #003680; margin-bottom: 2mm; }',
    // Fund details cards (Investment page)
    '.fcard { border-top: 0.5pt solid #E2E8EF; padding: 3.5mm 0 1mm; }',
    '.fch { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; }',
    '.fch b { font-size: 10pt; color: #003680; }',
    '.fch span { font-size: 8pt; color: #5E6B78; text-align: right; }',
    '.fcm { font-size: 8pt; color: #5E6B78; margin: 1mm 0 2mm; }',
    '.fcm .g { color: #0B7A3E; font-weight: 700; }',
    '.fcard p { margin: 0 0 2mm; }',
    // Guarantee note
    '.gnote { padding: 4mm 4.5mm; background: #F4F7FA; display: flex; flex-direction: column; gap: 1mm; line-height: 1.6; }',
    '.gnote b { color: #003680; font-size: 9.2pt; }',
    '.gnote span { font-size: 9pt; }',
    // Two-column glossary
    'table.gloss.two { width: 100%; border-collapse: collapse; }',
    'table.gloss.two td { width: 50%; vertical-align: top; padding: 0 5mm 3.5mm 0; border: none; }',
    'table.gloss.two td b { display: block; color: #003680; font-size: 9pt; }',
    'table.gloss.two td span { display: block; font-size: 8.6pt; line-height: 1.5; }',
    '.tiny { font-size: 7.6pt; line-height: 1.55; color: #5E6B78; }',
    // Footer brand line
    '.pfoot .fbrand { font-weight: 700; letter-spacing: 0.08em; color: #003680; white-space: nowrap; }',
    // ── Brochure cover, contents and back page; the pages between follow the Statement of Reasonable Projection ──
    'body { --navy: #003680; --ink: #1D3962; --toc: #0A7EB5; --rule: #E4E8EB; --tint: #F4F8FB; --tint2: #EDF2F9; }',
    '.page.full .blk { margin: 0; height: 100%; }',
    // Inner pages: logo over a thin light-blue rule, dark grey text, navy headings and table headers
    '.phdr.agl { border-bottom: 0.75pt solid #13A0D3; }',
    'p, li { color: #2B2B2B; }',
    '.pfoot, .pfoot .fbrand { color: #777777; }',
    '.ptitle { margin-bottom: 2mm; }',
    '.ptitle h2 { font-size: 19pt; font-weight: 700; color: var(--navy); letter-spacing: -0.01em; padding: 0; }',
    '.ptitle .lead { display: block; margin-top: 1.5mm; font-size: 9.6pt; color: #545454; }',
    '.blk .ptitle + * { margin-top: 1mm; }',
    'h2, h3 { color: var(--navy); }',
    '.fbh { color: var(--navy); border-bottom: 1pt solid var(--navy); }',
    '.fbr { border-bottom-color: var(--rule); }',
    '.fbr span, .stat3 span, .riskrow .rl span, .rstrip .lo, .rstrip .hi { color: #545454; }',
    '.fbr.tot, .fbr.tot span, .stat3 b, .riskrow .rl b, .fch b, .defs b, table.gloss.two td b { color: var(--navy); }',
    '.stat3 { border-top: 1pt solid var(--navy); border-bottom-color: var(--rule); }',
    '.riskrow, .gnote { background: var(--tint); }',
    '.imp { background: var(--tint); border-left: 2.5pt solid var(--navy); border-radius: 0; }',
    '.fcard { border-top-color: var(--rule); }',
    'table.dt thead th { color: var(--navy); border-bottom: 1pt solid var(--navy); }',
    'table.dt tbody td { border-bottom-color: var(--rule); }',
    'table.dt tbody tr.tot td, table.dt tbody tr.mat td, table.num tr.mat td { background: var(--tint2); color: var(--navy); }',
    'table.num th { color: var(--navy); border-bottom-color: var(--navy); }',
    'table.num td { border-bottom-color: var(--rule); }',
    '.rstrip > div { background: var(--rule); color: #545454; }',
    '.rstrip > div.on { background: var(--navy); }',
    '.wbox { border: 1pt solid #2B2B2B; }',
    // Cover: brochure photo; title in navy with the product name in bold
    '.cover { position: relative; height: 100%; display: flex; flex-direction: column; background-size: cover; background-position: center; }',
    '.cover .clogo { position: absolute; top: 14mm; left: 14mm; }',
    '.cover .ctitle { display: flex; flex-direction: column; gap: 5mm; }',
    '.cover .ck { font-size: 9pt; font-weight: 700; letter-spacing: 0.02em; color: var(--navy); }',
    '.cover .cn { display: flex; flex-direction: column; font-size: 31pt; line-height: 1.12; font-weight: normal; color: var(--navy); letter-spacing: -0.01em; margin: 0; }',
    '.cover .cl1, .cover .cb1 { padding-left: 24mm; }',
    '.cover .cb { font-weight: 700; }',
    '.cover .cfor { display: flex; flex-direction: column; gap: 1mm; font-size: 10.5pt; color: var(--navy); }',
    '.cover.half .cphoto { position: relative; height: 152mm; background-size: cover; background-position: center; }',
    '.cover.half .cbody { flex: 1; padding: 18mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; }',
    '.cover.full { padding: 40mm 14mm 14mm; justify-content: space-between; }',
    '.cover.full .cfor { color: #fff; }',
    '.cover.plain { background: var(--navy); padding: 50mm 16mm 16mm; justify-content: space-between; }',
    '.cover.plain .ck, .cover.plain .cn, .cover.plain .cfor { color: #fff; }',
    // Contents page: one colour (blue), the large two-colour title, then the list
    '.tocp { height: 100%; background: var(--toc); color: #fff; padding: 30mm 16mm 16mm; overflow: hidden; display: flex; flex-direction: column; }',
    '.toct { display: flex; flex-direction: column; font-size: 96pt; line-height: 0.86; letter-spacing: -0.02em; margin-left: -17.5mm; white-space: nowrap; }',
    '.toct span:last-child { color: #233259; padding-left: 9mm; }',
    '.tocp p { color: #fff; font-size: 10.5pt; line-height: 1.5; max-width: 112mm; margin: 22mm 0 16mm; }',
    '.tocl { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: min-content; gap: 8mm 12mm; }',
    '.toci { display: flex; flex-direction: column; gap: 1.6mm; }',
    '.toci .tpg { font-size: 6.6pt; font-weight: 700; color: #fff; letter-spacing: 0.04em; }',
    '.toci .tpg:before { content: ""; display: block; width: 7mm; border-top: 0.75pt solid #fff; margin-bottom: 1.8mm; }',
    '.toci .ttl { font-size: 13.5pt; color: #fff; line-height: 1.25; }',
    // Back page: navy, white text, each warning in its own outlined box
    '.backp { height: 100%; padding: 14mm 16mm 12mm; display: flex; flex-direction: column; background: var(--ink); color: #fff; }',
    '.backp .bpmain { margin-top: 30mm; display: flex; flex-direction: column; gap: 9mm; }',
    '.backp .bpsec { display: flex; flex-direction: column; gap: 3mm; }',
    '.backp .bph { font-size: 12pt; }',
    '.backp p { color: #fff; font-size: 8.8pt; line-height: 1.55; margin: 0; }',
    '.backp .bpl { color: #A2D2DE; text-decoration: underline; }',
    '.backp .bprule { width: 70mm; border-top: 0.6pt solid #A2D2DE; }',
    '.backp .wbox { padding: 0; border: none; gap: 1.6mm; }',
    '.backp .wbox span { display: block; border: 0.9pt solid #fff; padding: 1mm 2.4mm; font-size: 8.2pt; color: #fff; }',
    '.backp .bpr { margin-top: auto; display: flex; flex-direction: column; gap: 2mm; font-size: 7.4pt; line-height: 1.5; color: #fff; }',
    '@media print { body { background: #fff; } .topbar { display: none; } .page { margin: 0; } }'
  ].join('\n');
}

// Runs inside the pack window: window.qtRasterPages() renders each A4 page to a JPEG (Uint8Array).
function qtRasterSrc() {
  return '(' + function() {
    window.qtRasterPages = function() {
      var pages = [].slice.call(document.querySelectorAll('.page')), out = [];
      return pages.reduce(function(chain, pg) {
        return chain.then(function() {
          return html2canvas(pg, { scale: 2, backgroundColor: '#fff', useCORS: true, logging: false }).then(function(c) {
            var bin = atob(c.toDataURL('image/jpeg', 0.92).split(',')[1]), u = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
            out.push(u);
          });
        });
      }, Promise.resolve()).then(function() { return out; });
    };
  }.toString() + ')();';
}

// Runs inside the pack window: flows blocks into fixed A4 pages, splits long tables
// (repeating their header rows), keeps headings with the next block, numbers pages,
// then opens the print dialog.
function qtPaginatorSrc() {
  return '(' + function() {
   var started = false;
   function run() {
    if (started) return;
    started = true;
    var src = document.getElementById('src'), out = document.getElementById('pages');
    var blocks = [].slice.call(src.children);
    var body = null, cur = null, grpCur = null, pages = [];
    function tpl(id) { return document.getElementById(id).innerHTML; }
    function newPage(hdr, grp) {
      var pg = document.createElement('div');
      pg.className = 'page pg-' + hdr;
      pg.setAttribute('data-grp', grp || 'agl');
      pg.innerHTML = '<div class="phdr ' + hdr + '">' + tpl('hdr-' + hdr) + '</div><div class="pbody"></div>' +
        '<div class="pfoot">' + tpl('foot-' + hdr) + '<span class="pn"></span></div>';
      out.appendChild(pg); pages.push(pg);
      body = pg.querySelector('.pbody'); cur = hdr; grpCur = grp || 'agl';
    }
    // Cover and back page: the block IS the page, with no header, footer or page number.
    function fullPage(b, grp) {
      var pg = document.createElement('div');
      pg.className = 'page full';
      pg.setAttribute('data-grp', grp || 'agl');
      pg.appendChild(b);
      out.appendChild(pg); pages.push(pg);
      body = null; cur = null; grpCur = null;
    }
    function over() { return body.scrollHeight > body.clientHeight + 1; }
    function moveToNewPage(b, hdr) {
      var carry = [], prev = b.previousElementSibling;
      while (prev && prev.classList.contains('kwn') && carry.length < 3 && prev.previousElementSibling) { carry.unshift(prev); prev = prev.previousElementSibling; }
      body.removeChild(b);
      carry.forEach(function(c) { body.removeChild(c); });
      newPage(hdr, grpCur);
      carry.forEach(function(c) { body.appendChild(c); });
      body.appendChild(b);
    }
    function splitTable(b, hdr) {
      var tbl = b.querySelector('table');
      var tbody = tbl.querySelector('tbody');
      var rows = [].slice.call(tbody.children);
      rows.forEach(function(r) { tbody.removeChild(r); });
      var placed = 0;
      for (var i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
        if (over()) {
          tbody.removeChild(rows[i]);
          if (placed === 0) {
            // nothing fits here — move the whole block (and its heading) to a new page
            moveToNewPage(b, hdr);
            tbody.appendChild(rows[i]); placed = 1;
            continue;
          }
          var cont = b.cloneNode(true);
          var ctb = cont.querySelector('tbody');
          while (ctb.firstChild) ctb.removeChild(ctb.firstChild);
          newPage(hdr, grpCur);
          body.appendChild(cont);
          b = cont; tbody = ctb;
          tbody.appendChild(rows[i]); placed = 1;
        } else placed++;
      }
    }
    blocks.forEach(function(b) {
      var hdr = b.getAttribute('data-hdr') || 'agl', grp = b.getAttribute('data-grp') || 'agl';
      if (b.getAttribute('data-full')) { fullPage(b, grp); return; }
      if (!body || hdr !== cur || grp !== grpCur || (b.classList.contains('newpage') && body.children.length)) newPage(hdr, grp);
      body.appendChild(b);
      if (!over()) return;
      if (b.classList.contains('split')) { splitTable(b, hdr); return; }
      if (body.children.length > 1) moveToNewPage(b, hdr);
    });
    // The adviser's documents and the Allianz quotation are numbered separately, each from 1.
    // The count is whatever the quotation actually runs to, so extra funds or a longer
    // Statement of Suitability stay correctly numbered.
    var byGrp = {};
    pages.forEach(function(pg) {
      var g = pg.getAttribute('data-grp') || 'agl';
      (byGrp[g] = byGrp[g] || []).push(pg);
    });
    Object.keys(byGrp).forEach(function(g) {
      var list = byGrp[g];
      list.forEach(function(pg, i) {
        var el = pg.querySelector('.pn');
        if (el) el.textContent = (i + 1) + ' / ' + list.length;
      });
    });
    // Contents page: each section's first page, counted as in the footers
    [].forEach.call(document.querySelectorAll('[data-toc]'), function(el) {
      var k = el.getAttribute('data-toc'), list = byGrp.agl || [];
      for (var i = 0; i < list.length; i++) {
        if (!list[i].classList.contains('full') && list[i].querySelector('.blk[data-sec="' + k + '"]')) { el.textContent = i + 1; return; }
      }
      el.parentNode.parentNode.style.display = 'none';   // nothing on any page: leave it out
    });
    src.parentNode.removeChild(src);
    window.__paginated = pages.length;
    if (!window.__noAutoPrint) setTimeout(function() { window.print(); }, 300);
   }
   if (document.fonts && document.fonts.ready) {
     var fallback = setTimeout(run, 3000);
     document.fonts.ready.then(function() { clearTimeout(fallback); run(); });
   } else run();
  }.toString() + ')();';
}

function qtOpenPack(Q) {
  var html = qtBuildPack(Q);
  var win = window.open('', '_blank');
  if (!win) { alert('Pop-up blocked. Please allow pop-ups for this page and try again.'); return null; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}
