// quote_pdf.js — charts (vector SVG) and the printable quotation pack.
//
// The pack is an HTML document opened in a new window and printed to PDF. Charts are
// drawn as inline SVG (not canvas bitmaps), so text and lines stay sharp at any zoom in
// the saved PDF — this is the fix for the blurry text seen in the existing PRSA tool's
// PDFs, whose charts were low-resolution canvas images stretched onto the page.
//
// Depends on quote_common.js, quote_text.js and the data/engine files.

// ─── Logo ─────────────────────────────────────────────────────────────────────
function qtLogoSvg(height) {
  return '<svg xmlns="http://www.w3.org/2000/svg" height="' + height + '" viewBox="0 0 399.76 99.15" style="display:block">' +
    '<path d="M36.43,52.48H22.78l7.27-23.72ZM15.7,78.62,20.36,63H38.75l4.36,15.58h17L43.22,19.18c-1-3.51-3.1-5.13-6.79-5.13H12.32v5.61h2c2.52,0,3.88,1,3.88,2.91,0,1.27-.28,2.33-1.28,5.22L0,78.62Z" fill="#003781"/><path d="M79.78,78.62V19c0-3.11-1.82-4.95-4.83-4.95H60v5.61h1c2.51,0,3.58,1.07,3.58,3.61V78.62Z" fill="#003781"/><path d="M105.62,78.62V19c0-3.11-1.85-4.95-4.84-4.95H85.88v5.61h1c2.52,0,3.59,1.07,3.59,3.61V78.62Z" fill="#003781"/><path d="M132.13,19.94c0-4.33-3.21-7-8.71-7s-8.73,2.62-8.73,7,3.31,7,8.73,7,8.71-2.6,8.71-7m-.29,58.68V35.16c0-3.1-1.84-4.93-4.85-4.93H112.28v5.5h.87c2.51,0,3.58,1.16,3.58,3.68V78.62Z" fill="#003781"/><path d="M165.12,55.38v9.41C162.59,67.4,159.51,69,156.9,69s-3.68-1.34-3.68-5,.76-5.21,3.48-6.26a38.66,38.66,0,0,1,8.42-2.36m-20.44-11.3a36.51,36.51,0,0,1,14.91-3.78c4.08,0,5.53,1.45,5.53,5.68v1.08c-6.19,1-8.13,1.38-11.62,2.15A34.7,34.7,0,0,0,147.78,51c-6.11,2.45-9,7.17-9,14.42,0,9.2,4,13.64,12.19,13.64a21.94,21.94,0,0,0,8.14-1.53,27.07,27.07,0,0,0,6.49-4.16v.68c0,3,1.54,4.53,4.55,4.53H184V73.41h-.68c-2.61,0-3.57-1.17-3.57-4.26V46.1c0-12.29-4.27-16.57-16.58-16.57a51.9,51.9,0,0,0-11.59,1.37,38.84,38.84,0,0,0-10.27,3.88Z" fill="#003781"/><path d="M206.05,78.62V45.9c2.53-2.81,5.13-4.08,8.13-4.08,3.21,0,4,1.27,4,6.14V78.62h15.1V45.72c0-7.66-.55-10.08-3-12.68-2-2.25-5.13-3.39-9.12-3.39-5.91,0-10.07,1.83-15.66,7.06V34.78c0-3-1.57-4.55-4.66-4.55H186.49v5.5h.87c2.51,0,3.59,1.16,3.59,3.68V78.62Z" fill="#003781"/><path d="M278.07,68.46H257l20.15-28.25v-10H245.55c-3.58,0-5.23,1.64-5.23,5.23v8.8h5.61v-.86c0-2.23,1.16-3.29,3.57-3.29h10.86L240,68.66v10h38Z" fill="#003781"/><path d="M357.34,77.39V22.68c0-4.36-1.55-5.83-5.78-5.83H338.75V23h.77c2.92,0,3.49.66,3.49,4.18V77.39Zm6.32,0h14.22V34.78c0-4.28-1.65-5.82-5.82-5.82h-8.4Zm-26.93,0V29H328.3c-4.17,0-5.8,1.54-5.8,5.82V77.39Zm54.61-27.81c0,24.11-17.34,41.64-41.15,41.64S309,73.69,309,49.58,326.37,7.94,350.19,7.94s41.15,17.63,41.15,41.64m8.42,0C399.76,21.23,378.55,0,350.19,0S300.6,21.23,300.6,49.58s21.21,49.57,49.59,49.57S399.76,78,399.76,49.58" fill="#003781"/></svg>';
}

// ─── SVG line chart ───────────────────────────────────────────────────────────
// opts = { width, height, xLabels:[...], series:[{label,color,values:[...],dash,area}],
//          yFormat:function(v){}, xTitle,
//          xs:[...]            optional x position of each point (e.g. years since start), for uneven spacing
//          xTicks:[{x,label}]  optional axis labels at x positions (replaces xLabels)
//          markers:[{x,label}] optional dashed vertical lines, labelled above the plot }
function qtSvgLineChart(opts) {
  var W = opts.width || 640, H = opts.height || 260;
  var padL = 62, padR = 14, padT = opts.markers && opts.markers.length ? 30 : 14, padB = 56;
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
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;font-family:Arial,Helvetica,sans-serif">';
  // grid + y labels
  for (var g = 0; g <= niceMax + 1e-9; g += step) {
    var gy = y(g).toFixed(1);
    svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy + '" stroke="#e3e8ef" stroke-width="1"/>';
    svg += '<text x="' + (padL - 6) + '" y="' + (+gy + 3.5) + '" font-size="10" fill="#555" text-anchor="end">' + escHtml(fmt(g)) + '</text>';
  }
  if (opts.xTicks) {
    opts.xTicks.forEach(function(t) {
      var tx = xAt(t.x).toFixed(1);
      svg += '<line x1="' + tx + '" x2="' + tx + '" y1="' + (padT + plotH) + '" y2="' + (padT + plotH + 4) + '" stroke="#8a96a3" stroke-width="1"/>';
      svg += '<text x="' + tx + '" y="' + (padT + plotH + 15) + '" font-size="10" fill="#555" text-anchor="middle">' + escHtml(t.label) + '</text>';
    });
  } else {
    // x labels (thin out)
    var every = Math.max(1, Math.ceil(n / 12));
    for (var xi = 0; xi < n; xi++) {
      if (xi !== n - 1 && (xi % every !== 0 || n - 1 - xi < every * 0.6)) continue;
      svg += '<text x="' + x(xi).toFixed(1) + '" y="' + (padT + plotH + 15) + '" font-size="10" fill="#555" text-anchor="middle">' + escHtml(opts.xLabels[xi]) + '</text>';
    }
  }
  if (opts.xTitle) svg += '<text x="' + (padL + plotW / 2) + '" y="' + (padT + plotH + 29) + '" font-size="10" fill="#333" text-anchor="middle">' + escHtml(opts.xTitle) + '</text>';
  svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (padT + plotH) + '" y2="' + (padT + plotH) + '" stroke="#8a96a3" stroke-width="1"/>';
  // series
  opts.series.forEach(function(s) {
    var pts = s.values.map(function(v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); });
    if (s.area) {
      svg += '<polygon points="' + x(0).toFixed(1) + ',' + y(0).toFixed(1) + ' ' + pts.join(' ') + ' ' + x(s.values.length - 1).toFixed(1) + ',' + y(0).toFixed(1) + '" fill="' + s.color + '" fill-opacity="0.12" stroke="none"/>';
    }
    svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 2.2) + '"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + ' stroke-linejoin="round"/>';
  });
  // markers: label sits above the plot so it never collides with the lines
  (opts.markers || []).forEach(function(m) {
    var mx = xAt(m.x), anchor = mx > W - padR - 120 ? 'end' : mx < padL + 120 ? 'start' : 'middle';
    svg += '<line x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (padT - 4) + '" y2="' + (padT + plotH) + '" stroke="#003781" stroke-width="1" stroke-dasharray="3,3"/>';
    svg += '<text x="' + mx.toFixed(1) + '" y="' + (padT - 9) + '" font-size="10" font-weight="bold" fill="#003781" text-anchor="' + anchor + '">' + escHtml(m.label) + '</text>';
  });
  // legend
  var lx = padL;
  opts.series.forEach(function(s) {
    var ly = H - 5;
    svg += '<line x1="' + lx + '" x2="' + (lx + 18) + '" y1="' + (ly - 3.5) + '" y2="' + (ly - 3.5) + '" stroke="' + s.color + '" stroke-width="2.5"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + '/>';
    svg += '<text x="' + (lx + 23) + '" y="' + ly + '" font-size="10" fill="#333">' + escHtml(s.label) + '</text>';
    lx += 30 + s.label.length * 5.6;
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

// Chart series builders (used both on screen and in the PDF)
function qtPrsaChart(r, width, height) {
  var start = new Date(r.inputs.startStr), dob = new Date(r.inputs.dobStr);
  var retDate = new Date(dob.getFullYear() + r.nra, dob.getMonth(), dob.getDate()), tRet = qtYearsFrom(start, retDate);
  var xs = [0], wc = [r.ofvRaw + r.spRaw * (1 - r.spContribCharge)], nc = [r.ofvRaw + r.spRaw], contrib = [r.ofvRaw + r.spRaw];
  r.snapshots.forEach(function(s) {
    xs.push(s.isMat ? tRet : s.month / 12);
    wc.push(s.fundWC); nc.push(s.fundNC); contrib.push(s.contribNC);
  });
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtYearTicks(start, tRet), yFormat: qtEuroAxis,
    markers: [{ x: tRet, label: 'Retirement · age ' + r.nra + ' · ' + QT_MONTHS[retDate.getMonth()] + ' ' + retDate.getFullYear() }],
    series: [
      { label: 'Projected value after charges', color: '#003781', values: wc, area: true },
      { label: 'Before charges', color: '#0082be', values: nc, dash: '5,4', width: 1.6 },
      { label: 'Contributions paid', color: '#8a96a3', values: contrib, width: 1.4 }
    ]
  });
}
function qtArfChart(r, width, height) {
  var start = new Date(r.inputs.startStr), xs = [], s1 = r.p1.fundByYear, s2 = r.p2.fundByYear;
  var lastPos = 0;
  for (var k = 0; k < s1.length; k++) if (s1[k] > 0.5 || (s2[k] || 0) > 0.5) lastPos = k;
  var n = Math.min(s1.length, Math.max(lastPos + 4, 10));
  s1 = s1.slice(0, n); s2 = s2.slice(0, n);
  for (var i = 0; i < n; i++) xs.push(i);
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtYearTicks(start, n - 1), yFormat: qtEuroAxis,
    series: [
      { label: 'Fund value at ' + pct(r.rate1) + ' growth', color: '#003781', values: s1, area: true },
      { label: 'Fund value at ' + pct(r.rate2) + ' growth', color: '#0082be', values: s2, dash: '5,4' }
    ]
  });
}

function qtIbChart(r, width, height) {
  var start = new Date(r.inputs.startStr), xs = [], s1 = r.p.fundByYear;
  var lastPos = 0;
  for (var k = 0; k < s1.length; k++) if (s1[k] > 0.5) lastPos = k;
  var n = Math.min(s1.length, Math.max(lastPos + 4, 10));
  s1 = s1.slice(0, n);
  for (var i = 0; i < n; i++) xs.push(i);
  return qtSvgLineChart({
    width: width, height: height, xs: xs, xTicks: qtYearTicks(start, n - 1), yFormat: qtEuroAxis,
    series: [ { label: 'Fund value at ' + pct(r.rate) + ' growth', color: '#003781', values: s1, area: true } ]
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
  return '<span class="badge" style="background:' + ESMA_COLORS[r] + ';color:' + (r === 4 ? '#222' : '#fff') + '">SRI ' + r + '</span>';
}
// Indicative risk lines and footnote for the client-facing pack (rounded figures).
function qtPortfolioRisk(Q) {
  var T = QT_TEXT, r = Q.r;
  if (Q.product === 'prsa' && r.isGlidepath) {
    var gp = glidepathSriPath(r.stratObj, r.termMonths);
    if (!gp) return { line: '', scaleValue: null, label: '', footnote: '' };
    return { line: escHtml(qtFill(T.glidepathRiskPath, { start: fmtRisk(gp.start), end: fmtRisk(gp.end) })), scaleValue: gp.start, label: 'Plan at start',
             footnote: qtFill(T.riskFootnoteGlidepath, { start: fmtRisk(gp.start, 1), end: fmtRisk(gp.end, 1) }) };
  }
  var pr = Math.round(r.portfolioSri);
  return { line: 'Indicative portfolio risk: <b>' + pr + ' &ndash; ' + ESMA_LABELS[pr] + '</b>*', scaleValue: r.portfolioSri, label: 'Portfolio',
           footnote: qtFill(T.riskFootnote, { exact: fmtRisk(r.portfolioSri, 1) }) };
}

// ─── Simple markup for adviser-edited text ────────────────────────────────────
// "## " heading, "- " bullet, blank line = paragraph break. Returns an array of HTML
// blocks so the paginator can split long letters across pages.
function qtMarkupBlocks(text) {
  var lines = String(text || '').replace(/\r/g, '').split('\n');
  var blocks = [], para = [], list = [];
  function flushPara() { if (para.length) { blocks.push('<p>' + para.map(escHtml).join('<br>') + '</p>'); para = []; } }
  function flushList() { if (list.length) { blocks.push('<ul>' + list.map(function(l){ return '<li>' + escHtml(l) + '</li>'; }).join('') + '</ul>'); list = []; } }
  lines.forEach(function(l) {
    var t = l.replace(/\s+$/, '');
    if (/^##\s+/.test(t)) { flushPara(); flushList(); blocks.push('<h3 class="kwn">' + escHtml(t.replace(/^##\s+/, '')) + '</h3>'); }
    else if (/^-\s+/.test(t)) { flushPara(); list.push(t.replace(/^-\s+/, '')); }
    else if (t === '') { flushPara(); flushList(); }
    else { flushList(); para.push(t); }
  });
  flushPara(); flushList();
  return blocks;
}

// ─── Shared derived figures ───────────────────────────────────────────────────
function qtFundRows(Q) {
  var r = Q.r;
  return r.mix.map(function(m) {
    var f = m.fund;
    var fmc  = Q.product === 'prsa' ? f.charge : f.extFund;
    var gtee = m.gmab ? (Q.product === 'prsa' ? f.gmab : f.gteeCharge) : 0;
    return { fund: f, weight: m.weight, admin: r.cc.admin, fmc: fmc, gtee: gtee, total: r.cc.admin + fmc + gtee,
             cat: FUND_CATEGORY_OF[f.id] || 'multi', gmab: m.gmab };
  });
}
function qtCategorySplit(rows) {
  var out = {};
  FUND_CATEGORIES.forEach(function(c) { out[c.key] = 0; });
  rows.forEach(function(r) { out[r.cat] += r.weight; });
  return out;
}

// ─── Pack builder ─────────────────────────────────────────────────────────────
// Q = { product, r, broker{}, client{}, risk{sri,reason}, quoteRef, dateStr,
//       productName, strategyName, sections{}, coverText, sosText }
function qtBuildPack(Q) {
  var T = QT_TEXT, r = Q.r, isPrsa = Q.product === 'prsa', isArf = Q.product === 'arf', isIb = Q.product === 'ib';
  var clientName = [Q.client.first, Q.client.last].join(' ');
  var B = []; // blocks: { html, hdr:'agl'|'broker', cls }
  function add(html, opts) {
    opts = opts || {};
    var cls = opts.cls || '', m = /^<h\d class="([^"]+)"/.exec(html);
    if (m) cls = (cls + ' ' + m[1]).trim();
    B.push({ html: html, hdr: opts.hdr || 'agl', cls: cls });
  }
  function h2(title, newpage, hdr) { add('<h2>' + escHtml(title) + '</h2>', { cls: 'kwn' + (newpage ? ' newpage' : ''), hdr: hdr }); }
  function p(txt, cls) { add('<p' + (cls ? ' class="' + cls + '"' : '') + '>' + escHtml(txt) + '</p>'); }
  function imp(lines) { add('<div class="imp"><b>IMPORTANT</b>' + lines.map(function(l){ return '<p>' + escHtml(l) + '</p>'; }).join('') + '</div>'); }
  var fundRows = qtFundRows(Q);
  var cs = T.company;
  var dateLong = fmtDateLong(new Date());

  // ── 1. Cover letter (adviser letterhead) ──
  if (Q.sections.cover) {
    var addr = (Q.client.address || '').split('\n').filter(function(x){ return x.trim(); });
    add('<div class="letter-top"><div>' + escHtml(Q.client.salutation + ' ' + clientName) + '<br>' + addr.map(escHtml).join('<br>') + '</div>' +
        '<div class="r">' + escHtml(dateLong) + '<br><span class="muted">Our ref: ' + escHtml(Q.quoteRef) + '</span></div></div>',
        { hdr: 'broker', cls: 'newpage' });
    add('<p class="re"><b>Re: Your ' + escHtml(Q.productName) + ' quotation</b></p>', { hdr: 'broker' });
    qtMarkupBlocks(Q.coverText).forEach(function(b) { add(b, { hdr: 'broker' }); });
    add('<div class="sigblock"><div class="sigline"></div>' + escHtml(Q.broker.name) + '<br>' +
        (Q.broker.title ? escHtml(Q.broker.title) + '<br>' : '') + escHtml(Q.broker.firm) + '</div>', { hdr: 'broker' });
  }

  // ── 2. Statement of Suitability ──
  if (Q.sections.sos) {
    add('<h1>' + escHtml(T.sections.sos) + '</h1>', { hdr: 'broker', cls: 'kwn newpage' });
    add('<table class="kv"><tr><td>Client</td><td>' + escHtml(clientName) + '</td><td>Adviser</td><td>' + escHtml(Q.broker.name) + '</td></tr>' +
        '<tr><td>Date</td><td>' + escHtml(dateLong) + '</td><td>Firm</td><td>' + escHtml(Q.broker.firm) + '</td></tr>' +
        '<tr><td>Product</td><td>' + escHtml(Q.productName) + '</td><td>Quote ref.</td><td>' + escHtml(Q.quoteRef) + '</td></tr></table>', { hdr: 'broker' });
    qtMarkupBlocks(Q.sosText).forEach(function(b, i, all) { add(b, { hdr: 'broker', cls: i === all.length - 1 ? 'kwn' : '' }); });
    add('<div class="sigs"><div><p>' + escHtml(T.sosDeclaration) + '</p><div class="sigline"></div>Adviser: ' + escHtml(Q.broker.name) +
        '<div class="sigline short"></div>Date</div>' +
        '<div><p>' + escHtml(T.sosClientAck) + '</p><div class="sigline"></div>Client: ' + escHtml(clientName) +
        '<div class="sigline short"></div>Date</div></div>', { hdr: 'broker' });
  }

  // ── 3. Summary ──
  if (Q.sections.summary) {
    add('<div class="title"><div class="t1">' + escHtml(qtFill(T.docTitle, {})) + '</div><div class="t2">' + escHtml(Q.productName) + '</div>' +
        '<div class="t3">' + escHtml(qtFill(T.docSubtitle, { clientName: clientName, brokerFirm: Q.broker.firm })) + '</div></div>', { cls: 'newpage' });
    p(T.summaryIntro);
    var boxes = [];
    if (isPrsa) {
      boxes.push(['Your plan', '<b>' + escHtml(Q.productName) + '</b><br>Start date ' + fmtDate(r.inputs.startStr) + '<br>Retirement age ' + r.nra + ' (' + (r.termMonths / 12).toFixed(1) + ' years)']);
      var cl = [];
      if (r.spRaw > 0) cl.push('Single ' + fEUR(r.spRaw));
      if (r.ofvRaw > 0) cl.push('Transfer ' + fEUR(r.ofvRaw));
      if (r.rpRaw > 0) cl.push('Regular ' + fEUR(r.rpRaw) + ' ' + r.freq + (r.esc > 0 ? ', increasing ' + r.esc + '% a year' : ''));
      boxes.push(['Your contributions', cl.join('<br>')]);
    } else if (isArf) {
      boxes.push(['Your plan', '<b>' + escHtml(Q.productName) + '</b><br>Start date ' + fmtDate(r.inputs.startStr) + '<br>Income from age ' + r.inputs.incomeStartAge]);
      boxes.push(['Your contribution', 'Single contribution ' + fEUR(r.contribution) + '<br>' + escHtml(qtArfIncomeShort(r))]);
    } else {
      boxes.push(['Your plan', '<b>' + escHtml(Q.productName) + '</b><br>Start date ' + fmtDate(r.inputs.startStr) + '<br>' + (r.policyholderType.charAt(0).toUpperCase() + r.policyholderType.slice(1)) + ' policyholder']);
      var ibCl = [];
      if (r.contribution > 0) ibCl.push('Single contribution ' + fEUR(r.contribution));
      if (r.rp > 0) ibCl.push('Regular contribution ' + fEUR(r.rp) + ' ' + r.inputs.freq);
      ibCl.push(escHtml(qtIbIncomeShort(r)));
      boxes.push(['Your contribution', ibCl.join('<br>')]);
    }
    var pfRisk = qtPortfolioRisk(Q);
    boxes.push(['Your investment and risk', '<b>' + escHtml(Q.strategyName) + '</b><br>' +
      'Your risk rating: <b>' + Q.risk.sri + ' &ndash; ' + ESMA_LABELS[Q.risk.sri] + '</b><br>' +
      (isPrsa && r.isGlidepath ? 'Strategy risk profile: <b>' + escHtml(strategyProfile(r.stratObj) || 'Medium risk') + '</b><br>' : '') +
      pfRisk.line + qtSriScale(Q.risk.sri, pfRisk.scaleValue, pfRisk.label, 'sm')]);
    if (isPrsa) {
      boxes.push(['Projected at retirement', '<span class="big">' + fEUR(r.fundWC) + '</span><br>' + fEUR(r.realMat) + ' in today\'s money<br>Income approx. ' + fEUR(r.annualIncomeReal) + ' a year in today\'s money']);
      boxes.push(['Charges', 'Total annual charge ' + pct(r.totalAnnualCharge) + (r.isGlidepath ? ' (initial mix)' : '') + '<br>Effect of charges: ' + pct(Math.max(0, r.grossRate - r.netRate)) + ' a year']);
      boxes.push(['Adviser remuneration', 'Initial ' + fEUR(r.totalInitialComm) + '<br>Trail ' + pct(r.cc.ongoing) + ' a year of fund value']);
    } else if (isArf) {
      boxes.push(['Your fund over time', qtArfLastsShort(r.p1, r.rate1) + '<br>' + qtArfLastsShort(r.p2, r.rate2)]);
      boxes.push(['Charges', 'Total annual charge ' + pct(r.p1.chargeRate) + '<br>Growth reduced from ' + pct(r.rate1) + ' to ' + pct(r.p1.netRate)]);
      boxes.push(['Adviser remuneration', 'Initial ' + fEUR(r.initialComm) + '<br>Trail ' + pct(r.cc.ongoing) + ' a year of fund value']);
    } else {
      boxes.push(['Your fund over time', qtArfLastsShort(r.p, r.rate)]);
      boxes.push(['Charges', 'Total annual charge ' + pct(r.p.chargeRate) + '<br>Growth reduced from ' + pct(r.rate) + ' to ' + pct(r.p.netRate) + '<br>Exit tax ' + pct(r.taxRate)]);
      boxes.push(['Adviser remuneration', 'Initial ' + fEUR(r.initialComm) + '<br>Trail ' + pct(r.cc.ongoing) + ' a year of fund value']);
    }
    var bh = '<div class="boxes">';
    boxes.forEach(function(b, i) { bh += '<div class="box"><div class="bn">' + (i + 1) + '</div><div><div class="bt">' + b[0] + '</div><div>' + b[1] + '</div></div></div>'; });
    add(bh + '</div>');
    add('<div class="chart">' + (isPrsa ? qtPrsaChart(r, 640, 125) : isArf ? qtArfChart(r, 640, 125) : qtIbChart(r, 640, 125)) + '</div>');
    var inPack = ['cover', 'sos', 'projection', 'charges', 'funds', 'remun', 'product', 'tax', 'important', 'glossary']
      .filter(function(k) { return Q.sections[k]; }).map(function(k) { return '<li>' + escHtml(T.sections[k]) + '</li>'; }).join('');
    add('<div class="sumfoot"><div class="inpack"><div class="bt">' + escHtml(T.summaryInPack) + '</div><ul>' + inPack + '</ul></div>' +
        '<div class="warn sm"><div class="bt">' + escHtml(T.summaryWarningsTitle) + '</div>' + T.warnings.map(function(w) { return '<p>' + escHtml(w) + '</p>'; }).join('') + '</div></div>');
    p((pfRisk.footnote ? pfRisk.footnote + ' ' : '') + T.disclaimerShort, 'small');
  }

  // ── 4. Projection ──
  if (Q.sections.projection) {
    h2(T.sections.projection, true);
    if (isPrsa) {
      var rate = pct(r.blendedGross);
      p(qtFill(T.prsaProjectionIntro, { nra: r.nra }));
      p(qtFill(r.isGlidepath ? T.prsaRateGlidepath : T.prsaRateFlat, { rate: rate }));
      if (!Q.sections.summary) add('<div class="chart">' + qtPrsaChart(r, 640, 220) + '</div>');
      var th = '<table class="num split"><thead><tr class="ltr"><th></th><th></th><th>A</th><th>B</th><th>C</th><th>D = A + B &minus; C</th></tr>' +
        '<tr><th>Year</th><th>Age</th><th>Contributions paid to date</th><th>Investment growth to date (before charges)</th><th>Effect of charges to date</th><th>Projected value with charges</th></tr></thead><tbody>';
      qtPrsaRows(r).forEach(function(s) {
        th += '<tr' + (s.isMat ? ' class="mat"' : '') + '><td>' + (s.isMat ? 'Retirement' : s.year) + '</td><td>' + (s.isMat ? r.nra : s.age) + '</td><td>' + fEUR(s.contribNC) + '</td><td>' + fEUR(Math.max(0, s.growthNC)) + '</td><td>' + fEUR(s.fundNC - s.fundWC) + '</td><td><b>' + fEUR(s.fundWC) + '</b></td></tr>';
      });
      add(th + '</tbody></table>', { cls: 'split' });
      imp([qtFill(r.isGlidepath ? T.prsaImportantGlidepath : T.prsaImportantFlat, { rate: rate, inflation: pct(INFLATION) }), T.prsaImportant2]);
      p(qtFill(T.prsaInflation, { fundValue: fEUR(r.fundWC), realValue: fEUR(r.realMat), monthlyIncome: fEUR(r.monthlyAnn),
        annualIncome: fEUR(r.annualIncomeReal), guarantee: ANN_GUARANTEE, annEsc: pct(ANN_ESC) }));
      p(T.prsaAverageNote);
      p(T.prsaAnnuityNote);
      if (r.strat === 'dis') p(T.prsaDisNote);
    } else if (isArf) {
      p(T.arfProjectionIntro);
      if (!Q.sections.summary) add('<div class="chart">' + qtArfChart(r, 640, 220) + '</div>');
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
      if (!Q.sections.summary) add('<div class="chart">' + qtIbChart(r, 640, 220) + '</div>');
      var ibRt = pct(r.rate);
      var ti = '<table class="num split"><thead><tr class="ltr"><th></th><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F = A + B &minus; C &minus; D &minus; E</th></tr>' +
        '<tr><th>Year</th><th>Age</th><th>Contributions paid</th><th>Investment growth to date</th><th>Charges to date</th><th>Tax to date</th><th>Income taken to date</th><th>Projected value</th></tr></thead><tbody>';
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
    h2(T.sections.charges, true);
    p(T.chargesIntro);
    p(qtFill(isPrsa ? T.prsaFundCharges : isArf ? T.arfFundCharges : T.ibFundCharges, { admin: pct(r.cc.admin) }));
    var ct = '<table class="num split"><thead><tr><th class="l">Fund</th><th>Allocation</th><th>' + (isPrsa ? 'AMC' : 'Policy charge') + '</th><th>Fund charge</th><th>Guarantee charge</th><th>Total annual charge</th></tr></thead><tbody>';
    var bAdmin = 0, bFmc = 0, bG = 0;
    fundRows.forEach(function(fr) {
      ct += '<tr><td class="l">' + escHtml(fr.fund.name) + '</td><td>' + (fr.weight * 100).toFixed(1) + '%</td><td>' + pct(fr.admin) + '</td><td>' + pct(fr.fmc) + '</td><td>' + (fr.gtee > 0 ? pct(fr.gtee) : '&ndash;') + '</td><td>' + pct(fr.total) + '</td></tr>';
      bAdmin += fr.weight * fr.admin; bFmc += fr.weight * fr.fmc; bG += fr.weight * fr.gtee;
    });
    ct += '<tr class="mat"><td class="l">Your portfolio' + (isPrsa && r.isGlidepath ? ' (initial mix)' : '') + '</td><td>100%</td><td>' + pct(bAdmin) + '</td><td>' + pct(bFmc) + '</td><td>' + (bG > 0 ? pct(bG) : '&ndash;') + '</td><td>' + pct(bAdmin + bFmc + bG) + '</td></tr>';
    add(ct + '</tbody></table>', { cls: 'split' });
    if (isPrsa) {
      if (r.isGlidepath) p(T.glidepathNote);
      p(qtFill(T.prsaContribCharges, { spCharge: pct(CONTRIB_SP_CHARGE), spThreshold: fEUR(CONTRIB_SP_THRESHOLD), rpCharge: pct(CONTRIB_RP_CHARGE), rpThreshold: fEUR(CONTRIB_RP_THRESHOLD) }));
      var ccLines = [];
      if (r.spRaw > 0) ccLines.push('Single contribution of ' + fEUR(r.spRaw) + ': ' + (r.spContribCharge > 0 ? pct(r.spContribCharge) + ' contribution charge applies' : 'no contribution charge'));
      if (r.rpRaw > 0) ccLines.push('Regular contribution of ' + fEUR(r.rpRaw) + ': ' + (r.rpContribCharge > 0 ? pct(r.rpContribCharge) + ' contribution charge applies' : 'no contribution charge'));
      if (r.ofvRaw > 0) ccLines.push('Transfer value of ' + fEUR(r.ofvRaw) + ': no contribution charge');
      add('<ul>' + ccLines.map(function(l){ return '<li>' + escHtml(l) + '</li>'; }).join('') + '</ul>');
      add('<h3 class="kwn">Effect of charges</h3>');
      p(qtFill(T.prsaRiy, { riy: pct(Math.max(0, r.grossRate - r.netRate)), gross: pct(r.grossRate), net: pct(r.netRate) }) + ' ' + qtRiyWhy('prsa', r));
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
      add('<h3 class="kwn">Effect of charges</h3>');
      p(qtFill(T.arfRiyCharges, { rate: pct(r.rate1), netRate: pct(r.p1.netRate) }) + ' ' + qtFill(T.arfRiyCharges, { rate: pct(r.rate2), netRate: pct(r.p2.netRate) }) + ' ' + qtRiyWhy('arf', r));
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
      add('<h3 class="kwn">Effect of charges</h3>');
      p(qtFill(T.ibRiyCharges, { rate: pct(r.rate), netRate: pct(r.p.netRate) }) + ' ' + qtRiyWhy('ib', r));
    }
    if (fundRows.some(function(fr){ return fr.gmab; })) p(T.guaranteeOnNote);
    p(T.chargesFundNote, 'small');
  }

  // ── 6. Funds & risk ──
  if (Q.sections.funds) {
    h2(T.sections.funds, true);
    p(T.fundsIntro);
    var fRisk = qtPortfolioRisk(Q);
    if (isPrsa && r.isGlidepath) {
      var profile = strategyProfile(r.stratObj) || 'Medium risk', fit = strategyRiskFit(r.stratObj, Q.risk.sri);
      add('<div class="sriwrap"><div class="sril">Your risk rating: <b>' + Q.risk.sri + ' &ndash; ' + ESMA_LABELS[Q.risk.sri] + '</b><br>Strategy risk profile: <b>' + escHtml(profile) + '</b><br>' + fRisk.line + '</div>' +
          qtSriScale(Q.risk.sri, fRisk.scaleValue, fRisk.label) + '</div>');
      if (fit.aligned) p(T.riskMatch);
      else p(qtFill(fit.direction === 'higher' ? T.riskHigherProfile : T.riskLowerProfile, { profile: profile, clientSriLabel: ESMA_LABELS[Q.risk.sri], reason: Q.risk.reason }));
    } else {
      add('<div class="sriwrap"><div class="sril">Your risk rating: <b>' + Q.risk.sri + ' &ndash; ' + ESMA_LABELS[Q.risk.sri] + '</b><br>' + fRisk.line + '</div>' + qtSriScale(Q.risk.sri, r.portfolioSri) + '</div>');
      var pr = Math.round(r.portfolioSri);
      if (pr === Q.risk.sri) p(T.riskMatch);
      else p(qtFill(pr > Q.risk.sri ? T.riskHigher : T.riskLower, { portfolioSri: pr, clientSri: Q.risk.sri, reason: Q.risk.reason }));
    }
    if (fRisk.footnote) p(fRisk.footnote, 'small');
    add('<h3 class="kwn">' + escHtml(Q.strategyName) + '</h3>');
    p(qtStrategyDescription(Q));
    var split = qtCategorySplit(fundRows);
    var sb = '<div class="catbar">';
    FUND_CATEGORIES.forEach(function(c, i) {
      if (split[c.key] > 0) sb += '<div style="width:' + (split[c.key] * 100).toFixed(2) + '%;background:' + ['#7fb2d9', '#003781', '#0082be'][i] + '"></div>';
    });
    sb += '</div><div class="catleg">';
    FUND_CATEGORIES.forEach(function(c, i) {
      sb += '<span><i style="background:' + ['#7fb2d9', '#003781', '#0082be'][i] + '"></i>' + escHtml(c.label) + ' ' + (split[c.key] * 100).toFixed(1) + '%</span>';
    });
    add(sb + '</div>');
    var ft = '<table class="num split"><thead><tr><th class="l">Fund</th><th>Allocation</th><th>Risk (SRI)</th><th>Guarantee</th></tr></thead><tbody>';
    FUND_CATEGORIES.forEach(function(c) {
      var rows = fundRows.filter(function(fr){ return fr.cat === c.key; });
      if (!rows.length) return;
      ft += '<tr class="cat"><td class="l" colspan="4">' + escHtml(c.label) + '</td></tr>';
      rows.forEach(function(fr) {
        ft += '<tr><td class="l">' + escHtml(fr.fund.name) + '</td><td>' + (fr.weight * 100).toFixed(1) + '%</td><td>' + qtSriBadge(fr.fund.esma) + '</td><td>' + (fr.gmab ? 'Yes' : '&ndash;') + '</td></tr>';
      });
    });
    add(ft + '</tbody></table>', { cls: 'split' });
    if (isPrsa && r.isGlidepath) p(T.glidepathNote);
    fundRows.forEach(function(fr) {
      add('<p class="fdesc"><b>' + escHtml(fr.fund.name) + '.</b> ' + escHtml(fr.fund.desc) + '</p>');
    });
    if (fundRows.some(function(fr){ return fr.gmab; })) p(T.guaranteeFundNote);
  }

  // ── 7. Remuneration ──
  if (Q.sections.remun) {
    h2(T.sections.remun, true);
    p(qtFill(T.remunIntro, { brokerFirm: Q.broker.firm }));
    var rt2 = '<table class="num"><thead><tr><th class="l">Type</th><th class="l">Basis</th><th>Amount</th></tr></thead><tbody>';
    if (isPrsa) {
      if (r.spRaw > 0) rt2 += '<tr><td class="l">Initial &ndash; single contribution</td><td class="l">' + pct(r.spUpRate) + ' of single contribution' + (r.spContribCharge > 0 ? ' (after contribution charge)' : '') + '</td><td>' + fEUR(r.spUpfrontComm) + '</td></tr>';
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
      yt = '<table class="num split"><thead><tr><th>Year</th><th>Contributions payable in that year</th><th>Projected remuneration payable in that year</th></tr></thead><tbody>';
      qtPrsaRows(r).forEach(function(s) {
        var c = s.rpInYear + (s.year === 1 ? r.spRaw : 0);
        yt += '<tr' + (s.isMat ? ' class="mat"' : '') + '><td>' + (s.isMat ? 'Retirement' : s.year) + '</td><td>' + (c > 0 ? fEUR(c) : '&ndash;') + '</td><td>' + fEUR(s.commInYear) + '</td></tr>';
      });
    } else if (isArf) {
      yt = '<table class="num split"><thead><tr><th>Year</th><th>Contributions payable in that year</th><th>Projected remuneration at ' + pct(r.rate1) + '</th><th>Projected remuneration at ' + pct(r.rate2) + '</th></tr></thead><tbody>';
      // stop after the first row where remuneration has fallen to zero at both rates
      var seenZero = false;
      r.p1.commRows.forEach(function(c1, i) {
        var c2 = r.p2.commRows[i] || { comm: 0 };
        if (seenZero) return;
        if (c1.comm < 0.5 && c2.comm < 0.5 && c1.contrib <= 0) seenZero = true;
        yt += '<tr><td>' + c1.year + '</td><td>' + (c1.contrib > 0 ? fEUR(c1.contrib) : '&ndash;') + '</td><td>' + fEUR(c1.comm) + '</td><td>' + fEUR(c2.comm) + '</td></tr>';
      });
    } else {
      yt = '<table class="num split"><thead><tr><th>Year</th><th>Contributions payable in that year</th><th>Projected remuneration at ' + pct(r.rate) + '</th></tr></thead><tbody>';
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

  // ── 8–10. Product, tax, important ──
  if (Q.sections.product) {
    h2(T.sections.product, true);
    add('<ul>' + (isPrsa ? T.prsaProduct : isArf ? T.arfProduct : T.ibProduct).map(function(l){ return '<li>' + escHtml(l) + '</li>'; }).join('') + '</ul>');
  }
  if (Q.sections.tax) {
    h2(T.sections.tax, !Q.sections.product);
    p(T.taxIntro, 'small');
    add('<ul>' + (isPrsa ? T.prsaTax : isArf ? T.arfTax : T.ibTax).map(function(l){ return '<li>' + escHtml(l) + '</li>'; }).join('') + '</ul>');
  }
  if (Q.sections.important) {
    h2(T.sections.important, !Q.sections.product && !Q.sections.tax);
    add('<div class="warn">' + T.warnings.map(function(w){ return '<p>' + escHtml(w) + '</p>'; }).join('') + '</div>');
    T.importantInfo.forEach(function(l) { p(qtFill(l, { regDoc: isPrsa ? T.regDocPrsa : isArf ? T.regDocArf : T.regDocIb })); });
    add('<h3 class="kwn">Cooling-off period</h3>');
    p(T.coolingOff);
    p(qtFill(T.quoteValidity, { date: dateLong }), 'small');
    add('<p class="small">' + escHtml(cs.regulatory) + '<br>' + escHtml(cs.directors) + '</p>');
  }
  if (Q.sections.glossary) {
    h2(T.sections.glossary, false);
    var gt = '<table class="gloss split"><tbody>';
    T.glossary.forEach(function(g) { gt += '<tr><td><b>' + escHtml(g[0]) + '</b></td><td>' + escHtml(g[1]) + '</td></tr>'; });
    add(gt + '</tbody></table>', { cls: 'split' });
  }

  // ── Assemble ──
  var hdrAgl = '<div class="hl">' + qtLogoSvg(26) + '</div><div class="hr">' + escHtml(Q.productName) + '<br><span>Quotation</span></div>';
  var bAddr = (Q.broker.address || '').split('\n').filter(function(x){ return x.trim(); }).map(escHtml).join(', ');
  var hdrBroker = '<div class="hl"><div class="firm">' + escHtml(Q.broker.firm) + '</div><div class="faddr">' + bAddr + '</div></div>' +
    '<div class="hr">' + escHtml(Q.broker.phone) + '<br>' + escHtml(Q.broker.email) + '</div>';
  var footAgl = escHtml(Q.quoteRef) + ' &middot; ' + escHtml(clientName) + ' &middot; ' + escHtml(fmtDate(new Date())) + ' &middot; ' + escHtml(cs.name) + ' is regulated by the Central Bank of Ireland.';
  var footBroker = escHtml(Q.quoteRef) + ' &middot; ' + escHtml(Q.broker.regStatement);

  var src = B.map(function(b) {
    return '<div class="blk ' + b.cls + '" data-hdr="' + b.hdr + '">' + b.html + '</div>';
  }).join('');

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>' + escHtml(Q.productName + ' – Quotation – ' + clientName + ' – ' + Q.quoteRef) + '</title>' +
    '<style>' + qtPackCss() + '</style></head><body>' +
    '<div class="topbar"><span>' + escHtml(Q.productName) + ' &ndash; Quotation &ndash; ' + escHtml(clientName) + '</span><button onclick="window.print()">Print / Save as PDF</button></div>' +
    '<template id="hdr-agl">' + hdrAgl + '</template><template id="hdr-broker">' + hdrBroker + '</template>' +
    '<template id="foot-agl">' + footAgl + '</template><template id="foot-broker">' + footBroker + '</template>' +
    '<div id="src">' + src + '</div><div id="pages"></div>' +
    '<script>' + (Q.noAutoPrint ? 'window.__noAutoPrint = true;' : '') + qtPaginatorSrc() + '<\/script></body></html>';
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
  return (prof ? T.strategyProfiles[prof] : '') + (r.stratObj && r.stratObj.gmab ? ' ' + T.guaranteeFundNote : '');
}

function qtPackCss() {
  return [
    '@page { size: A4; margin: 0; }',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'html, body { font-family: Arial, Helvetica, sans-serif; color: #1f2933; font-synthesis: none; -webkit-font-smoothing: antialiased; }',
    'body { background: #dfe3e8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
    '#src { position: absolute; left: -10000px; top: 0; width: 178mm; }',
    '.topbar { position: sticky; top: 0; z-index: 2; background: #003781; color: #fff; padding: 10px 20px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }',
    '.topbar button { background: #fff; color: #003781; border: none; padding: 7px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }',
    '.page { width: 210mm; height: 297mm; background: #fff; margin: 8mm auto; position: relative; overflow: hidden; page-break-after: always; break-after: page; }',
    '.page:last-child { page-break-after: auto; break-after: auto; }',
    '.phdr { position: absolute; top: 12mm; left: 16mm; right: 16mm; height: 14mm; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5pt solid #003781; padding-bottom: 3mm; }',
    '.phdr .hr { text-align: right; font-size: 8pt; color: #003781; font-weight: 700; line-height: 1.35; }',
    '.phdr .hr span { color: #5b6670; font-weight: 400; }',
    '.phdr .firm { font-size: 14pt; font-weight: 700; color: #1f2933; }',
    '.phdr .faddr { font-size: 7.5pt; color: #5b6670; margin-top: 2px; }',
    '.pbody { position: absolute; top: 32mm; bottom: 18mm; left: 16mm; right: 16mm; overflow: hidden; }',
    '.pfoot { position: absolute; bottom: 8mm; left: 16mm; right: 16mm; font-size: 6.8pt; color: #6b7682; border-top: 0.5pt solid #c9d1da; padding-top: 2mm; display: flex; justify-content: space-between; gap: 6mm; }',
    '.pfoot .pn { white-space: nowrap; }',
    '.blk { margin-bottom: 3.2mm; }',
    'h1 { font-size: 17pt; color: #003781; font-weight: 700; margin-bottom: 2mm; }',
    'h2 { font-size: 13pt; color: #003781; font-weight: 700; padding-bottom: 1.5mm; border-bottom: 0.75pt solid #9fb3c8; }',
    'h3 { font-size: 10pt; color: #003781; font-weight: 700; margin-top: 1.5mm; }',
    'p, li { font-size: 9pt; line-height: 1.5; }',
    'p + p { margin-top: 2mm; }',
    'ul { padding-left: 5mm; } li { margin-bottom: 1.2mm; }',
    'p.small { font-size: 7.8pt; color: #5b6670; }',
    '.muted { color: #6b7682; font-size: 7.8pt; }',
    'b { font-weight: 700; }',
    '.title .t1 { font-size: 20pt; color: #1f2933; }',
    '.title .t2 { font-size: 20pt; color: #0082be; font-weight: 700; margin-top: 1mm; }',
    '.title .t3 { font-size: 10pt; color: #5b6670; margin-top: 2mm; }',
    '.boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }',
    '.box { border: 0.75pt solid #c9d6e3; border-radius: 2mm; padding: 3mm; display: flex; gap: 3mm; font-size: 8.8pt; line-height: 1.5; }',
    '.box .bn { flex: 0 0 6mm; height: 6mm; border-radius: 50%; background: #003781; color: #fff; font-weight: 700; font-size: 8pt; text-align: center; line-height: 6mm; }',
    '.box .bt { font-weight: 700; color: #003781; margin-bottom: 1mm; }',
    '.box .big { font-size: 14pt; font-weight: 700; color: #003781; }',
    '.chart { margin: 1mm 0; }',
    'table { width: 100%; border-collapse: collapse; }',
    'table.num th { font-size: 7.6pt; color: #003781; font-weight: 700; text-align: right; padding: 1.5mm 1.8mm; vertical-align: bottom; border-bottom: 1.2pt solid #003781; line-height: 1.3; }',
    'table.num tr.ltr th { border-bottom: none; font-size: 9.5pt; padding-bottom: 0; }',
    'table.num td { font-size: 8.4pt; text-align: right; padding: 1.4mm 1.8mm; border-bottom: 0.5pt solid #e1e6ec; }',
    'table.num th:first-child, table.num td:first-child { text-align: left; }',
    'table.num .l { text-align: left; }',
    'table.num tr.mat td { font-weight: 700; color: #003781; background: #eef3fa; }',
    'table.num tr.cat td { font-weight: 700; color: #1f2933; background: #f3f5f8; font-size: 8pt; }',
    'table.kv td { font-size: 8.6pt; padding: 1.2mm 2mm; border-bottom: 0.5pt solid #e1e6ec; }',
    'table.kv td:nth-child(odd) { color: #5b6670; width: 16%; }',
    'table.gloss td { font-size: 8.6pt; padding: 1.6mm 2mm; border-bottom: 0.5pt solid #e1e6ec; vertical-align: top; line-height: 1.45; }',
    'table.gloss td:first-child { width: 34%; color: #003781; }',
    '.imp { border-left: 2.5pt solid #003781; background: #f2f6fb; padding: 2.5mm 4mm; }',
    '.imp b { font-size: 8.6pt; text-decoration: underline; }',
    '.imp p { font-size: 8.6pt; font-weight: 700; margin-top: 1.2mm; }',
    '.warn { border: 1pt solid #003781; padding: 2.5mm 4mm; }',
    '.warn p { font-weight: 700; font-size: 8.8pt; }',
    '.badge { display: inline-block; padding: 0.3mm 1.6mm; border-radius: 1mm; font-size: 7.4pt; font-weight: 700; }',
    '.sricol { flex: 1; max-width: 95mm; }',
    'table.sri { width: 100%; table-layout: fixed; }',
    'table.sri td { text-align: center; font-size: 9pt; font-weight: 700; color: #fff; padding: 1.6mm 0; border: 1.5pt solid #fff; opacity: 1; }',
    'table.sri td.on { outline: 1.5pt solid #1f2933; outline-offset: -1.5pt; }',
    'table.sri tr.mk td { background: none; color: #1f2933; font-size: 7.2pt; font-weight: 700; padding-top: 0.5mm; line-height: 1.2; }',
    '.sri-ends { width: 100%; margin-top: -1mm; display: flex; justify-content: space-between; font-size: 7.2pt; color: #6b7682; }',
    '.sricol.sm { max-width: 72mm; margin-top: 2mm; }',
    '.sricol.sm table.sri td { font-size: 7.4pt; padding: 0.8mm 0; }',
    '.sricol.sm table.sri tr.mk td { font-size: 6.4pt; }',
    '.sricol.sm .sri-ends { display: none; }',
    '.sumfoot { display: grid; grid-template-columns: 1.25fr 1.5fr; gap: 4mm; }',
    '.sumfoot .bt { font-weight: 700; color: #003781; font-size: 8.8pt; margin-bottom: 1mm; }',
    '.inpack { border: 0.75pt solid #c9d6e3; border-radius: 2mm; padding: 2.5mm 3mm; }',
    '.inpack ul { padding-left: 3.5mm; columns: 2; column-gap: 5mm; } .inpack li { font-size: 7.6pt; margin-bottom: 0.3mm; line-height: 1.35; break-inside: avoid; }',
    '.warn.sm { padding: 2.5mm 3mm; } .warn.sm p { font-size: 7.4pt; line-height: 1.35; margin-top: 0.4mm; }',
    '.sriwrap { display: flex; gap: 6mm; align-items: flex-start; }',
    '.sril { flex: 0 0 52mm; font-size: 8.6pt; line-height: 1.6; }',
    '.catbar { display: flex; height: 4mm; border-radius: 1mm; overflow: hidden; }',
    '.catleg { display: flex; gap: 6mm; font-size: 8pt; margin-top: 1.5mm; }',
    '.catleg i { display: inline-block; width: 3mm; height: 3mm; margin-right: 1.5mm; vertical-align: -0.4mm; }',
    'p.fdesc { font-size: 8.2pt; color: #333; }',
    '.letter-top { display: flex; justify-content: space-between; font-size: 9.2pt; line-height: 1.5; margin-bottom: 4mm; }',
    '.letter-top .r { text-align: right; }',
    '.re { margin-bottom: 1mm; }',
    '.sigblock { margin-top: 10mm; font-size: 9pt; line-height: 1.5; }',
    '.sigline { border-bottom: 0.75pt solid #1f2933; width: 60mm; height: 12mm; margin-bottom: 1.5mm; }',
    '.sigline.short { width: 35mm; height: 9mm; }',
    '.sigs { display: flex; gap: 10mm; margin-top: 4mm; font-size: 8.6pt; }',
    '.sigs > div { flex: 1; } .sigs p { font-size: 8.6pt; }',
    '@media print { body { background: #fff; } .topbar { display: none; } .page { margin: 0; } }'
  ].join('\n');
}

// Runs inside the pack window: flows blocks into fixed A4 pages, splits long tables
// (repeating their header rows), keeps headings with the next block, numbers pages,
// then opens the print dialog.
function qtPaginatorSrc() {
  return '(' + function() {
    var src = document.getElementById('src'), out = document.getElementById('pages');
    var blocks = [].slice.call(src.children);
    var body = null, cur = null, pages = [];
    function tpl(id) { return document.getElementById(id).innerHTML; }
    function newPage(hdr) {
      var pg = document.createElement('div');
      pg.className = 'page';
      pg.innerHTML = '<div class="phdr">' + tpl('hdr-' + hdr) + '</div><div class="pbody"></div>' +
        '<div class="pfoot"><span>' + tpl('foot-' + hdr) + '</span><span class="pn"></span></div>';
      out.appendChild(pg); pages.push(pg);
      body = pg.querySelector('.pbody'); cur = hdr;
    }
    function over() { return body.scrollHeight > body.clientHeight + 1; }
    function moveToNewPage(b, hdr) {
      var carry = [], prev = b.previousElementSibling;
      while (prev && prev.classList.contains('kwn') && carry.length < 3 && prev.previousElementSibling) { carry.unshift(prev); prev = prev.previousElementSibling; }
      body.removeChild(b);
      carry.forEach(function(c) { body.removeChild(c); });
      newPage(hdr);
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
          newPage(hdr);
          body.appendChild(cont);
          b = cont; tbody = ctb;
          tbody.appendChild(rows[i]); placed = 1;
        } else placed++;
      }
    }
    blocks.forEach(function(b) {
      var hdr = b.getAttribute('data-hdr') || 'agl';
      if (!body || hdr !== cur || (b.classList.contains('newpage') && body.children.length)) newPage(hdr);
      body.appendChild(b);
      if (!over()) return;
      if (b.classList.contains('split')) { splitTable(b, hdr); return; }
      if (body.children.length > 1) moveToNewPage(b, hdr);
    });
    pages.forEach(function(pg, i) { pg.querySelector('.pn').textContent = 'Page ' + (i + 1) + ' of ' + pages.length; });
    src.parentNode.removeChild(src);
    window.__paginated = pages.length;
    if (!window.__noAutoPrint) setTimeout(function() { window.print(); }, 300);
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
