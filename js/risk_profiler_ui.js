// risk_profiler_ui.js — the Risk Profiler questionnaire, as a component you mount into any element.
// The questions are split into parts (one shown at a time, with a step strip and Back / Continue),
// and the result has its own final screen. The result shows the outcome only: the scores behind it stay
// in risk_profiler.js (RiskProfiler.evaluate) for the host to use. It injects its own scoped styles (everything is under
// .rp) and reads the host's CSS variables (--navy, --line, ...) when they exist, so it matches the
// Quotation Tool and still looks right on a plain page.
//
//   var rp = RiskProfilerUI.mount(document.getElementById('host'), {
//     answers: {},                                  // optional starting answers
//     context: { dob: '1985-06-15' },               // optional, see RiskProfiler.evaluate
//     sri: { labels: [...], colors: [...] },        // optional, defaults to RP_CONFIG
//     onChange: function(state) { ... },            // state = { answers, result }
//     onFinish: function(state) { ... },            // optional: adds a button to the completed result
//     finishLabel: 'Use this result'                // its label
//   });
//   rp.getState(); rp.setAnswers(a); rp.setContext(c); rp.reset(); rp.goToNext(); rp.goTo('finances' | 'result');
//   rp.section(); rp.destroy();
//
// Needs risk_profiler_data.js and risk_profiler.js loaded first.

var RiskProfilerUI = (function() {
  var RP = RiskProfiler, CFG = RP.config;

  var CSS = [
    '.rp { --rp-navy:var(--navy,#003781); --rp-navy-d:var(--navy-d,#002A63); --rp-teal:var(--teal,#0377A8); --rp-ink:var(--ink,#0E1E33); --rp-body:var(--body,#3A4756);',
    '  --rp-muted:var(--muted,#5E6B78); --rp-faint:var(--faint,#8A96A3); --rp-line:var(--line,#E2E8EF); --rp-div:var(--div,#EEF2F6); --rp-inp:var(--inp,#D5DDE6);',
    '  --rp-tint:var(--tint,#EEF4FA); --rp-sel:var(--sel,#F6FAFE); --rp-bg:var(--bg,#F4F7FA); --rp-hdr:var(--hdr,#F7FAFC); --rp-off:var(--off,#C9D3DE);',
    '  --rp-grn:var(--grn,#0B7A3E); --rp-grn-bg:var(--grn-bg,#E6F2EA); --rp-amb:var(--amb-ink,#8A4708); --rp-amb-bg:var(--amb-bg,#FDF4E7); --rp-amb-ring:var(--amb-ring,#E8A33D);',
    '  container-type:inline-size; color:var(--rp-ink); font-family:inherit; font-size:14px; line-height:1.45; scroll-margin-top:24px; }',
    '.rp *, .rp *::before, .rp *::after { box-sizing:border-box; }',
    '.rp button { font-family:inherit; }',
    '.rp [hidden] { display:none !important; }',
    '.rp button:focus-visible { outline:2px solid var(--rp-teal); outline-offset:2px; }',
    '.rp h2:focus, .rp h3:focus { outline:none; }',
    '.rp-shell { border:1px solid var(--rp-line); border-radius:12px; background:#fff; overflow:hidden; }',

    // step strip
    '.rp-nav { position:relative; display:flex; align-items:center; gap:10px; padding:16px 28px; border-bottom:1px solid var(--rp-line); background:var(--rp-hdr); }',
    '.rp-tab { display:inline-flex; align-items:center; gap:8px; flex:none; padding:4px 2px; border:none; background:none; color:var(--rp-faint); font:inherit; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }',
    '.rp-tab:not(.on):hover .rp-tl { text-decoration:underline; text-underline-offset:3px; }',
    '.rp-td { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px var(--rp-off); font-size:11px; font-weight:700; transition:background-color .15s, box-shadow .15s; }',
    '.rp-tab.part { color:var(--rp-body); } .rp-tab.part .rp-td { box-shadow:inset 0 0 0 1.5px var(--rp-navy); color:var(--rp-navy); }',
    '.rp-tab.done { color:var(--rp-grn); } .rp-tab.done .rp-td { background:var(--rp-grn-bg); box-shadow:none; color:var(--rp-grn); }',
    '.rp-tab.on { color:var(--rp-navy); font-weight:700; } .rp-tab.on .rp-td { background:var(--rp-navy); box-shadow:none; color:#fff; }',
    '.rp-sep { flex:1 1 16px; min-width:12px; max-width:48px; height:1px; background:var(--rp-off); }',
    '.rp-prog { position:absolute; left:0; right:0; bottom:-1px; height:2px; }',
    '.rp-prog div { height:100%; background:var(--rp-navy); transition:width .3s ease; }',

    // a part of the questionnaire
    '.rp-panel { padding:32px 28px 8px; animation:rp-in .22s ease; }',
    '@keyframes rp-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }',
    '.rp-ph { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-bottom:8px; }',
    '.rp-eb { margin-bottom:6px; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--rp-teal); }',
    '.rp-ph h2 { margin:0; font-size:22px; line-height:1.2; font-weight:700; letter-spacing:-.005em; color:var(--rp-navy); }',
    '.rp-lead { max-width:620px; margin:6px 0 0; font-size:14px; line-height:1.55; color:var(--rp-muted); }',
    '.rp-cnt { flex:none; padding:4px 10px; border-radius:999px; background:var(--rp-div); color:var(--rp-muted); font-size:12px; font-weight:600; white-space:nowrap; }',
    '.rp-cnt.done { background:var(--rp-grn-bg); color:var(--rp-grn); }',

    // a question
    '.rp-q { padding:24px 0; border-top:1px solid var(--rp-div); transition:background-color .2s; }',
    '.rp-ph + .rp-q { margin-top:16px; }',
    '.rp-q:last-child { padding-bottom:28px; }',
    '.rp-qh { display:flex; gap:14px; align-items:flex-start; margin-bottom:16px; }',
    '.rp-qn { flex:none; display:flex; align-items:center; justify-content:center; width:28px; height:28px; margin-top:-3px; border-radius:50%; background:var(--rp-tint); color:var(--rp-navy); font-size:12px; font-weight:700; transition:background-color .15s; }',
    '.rp-q.done .rp-qn { background:var(--rp-grn-bg); color:var(--rp-grn); }',
    '.rp-qt { font-size:15px; font-weight:600; line-height:1.4; color:var(--rp-ink); }',
    '.rp-qs { margin-top:3px; font-size:13px; line-height:1.5; color:var(--rp-muted); }',
    '.rp-qb { padding-left:42px; }',
    '.rp-q.flag { margin:6px -16px; padding:22px 16px; border-top-color:transparent; border-radius:12px; background:var(--rp-amb-bg); box-shadow:inset 0 0 0 1px #F3D3A2; }',
    '.rp-q.flag + .rp-q { border-top-color:transparent; }',
    '.rp-q.flag .rp-qn { background:#fff; box-shadow:inset 0 0 0 1.5px var(--rp-amb-ring); color:var(--rp-amb); }',
    '.rp-req { display:none; margin-top:3px; font-size:12px; font-weight:600; color:var(--rp-amb); }',
    '.rp-q.flag .rp-req { display:block; }',

    // single choice: option cards
    '.rp-opts { display:grid; grid-template-columns:repeat(var(--rp-c, 2), minmax(0, 1fr)); gap:10px; }',
    '.rp-opts.c1 { --rp-c:1; max-width:720px; } .rp-opts.c4 { --rp-c:2; max-width:280px; }',
    '.rp-opt { display:flex; align-items:flex-start; gap:12px; width:100%; min-height:52px; padding:14px 16px; border:none; border-radius:10px; background:#fff; box-shadow:inset 0 0 0 1px var(--rp-line); color:var(--rp-ink); font:inherit; font-size:14px; line-height:1.45; text-align:left; cursor:pointer; transition:box-shadow .15s, background-color .15s; }',
    '.rp-opt:hover { box-shadow:inset 0 0 0 1px #BFCBD8; background:var(--rp-hdr); }',
    '.rp-opt.on { background:var(--rp-sel); box-shadow:inset 0 0 0 2px var(--rp-navy), 0 4px 14px rgba(0,55,129,.08); color:var(--rp-navy); font-weight:600; }',
    '.rp-dot { flex:none; width:20px; height:20px; margin-top:0; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px #A9B6C4; transition:box-shadow .15s; }',
    '.rp-opt.on .rp-dot { box-shadow:inset 0 0 0 6px var(--rp-navy); }',

    // products: a tick per column
    '.rp-grid { border:1px solid var(--rp-line); border-radius:10px; overflow:hidden; }',
    '.rp-gr { position:relative; display:grid; grid-template-columns:minmax(0, 1fr) 172px 172px; align-items:center; border-top:1px solid var(--rp-div); }',
    '.rp-gr:first-child { border-top:none; }',
    '.rp-gr.h { background:var(--rp-hdr); border-bottom:1px solid var(--rp-line); }',
    '.rp-gr.h + .rp-gr { border-top:none; }',
    '.rp-gr.h > div { padding:10px 16px; color:var(--rp-muted); font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }',
    '.rp-gr.h > div:not(:first-child) { text-align:center; }',
    '.rp-gr .l { padding:12px 16px; font-size:14px; }',
    '.rp-gr.sel { background:var(--rp-sel); }',
    '.rp-gr.sel::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--rp-navy); }',
    '.rp-gr.sel .l { font-weight:600; color:var(--rp-navy); }',
    '.rp-gr.nn { background:var(--rp-hdr); }',
    '.rp-gr.nn.sel { background:var(--rp-sel); }',
    '.rp-gr button.c { display:flex; align-items:center; justify-content:center; align-self:stretch; border:none; background:none; cursor:pointer; padding:10px 16px; }',
    '.rp-gr button.c:hover .rp-box { box-shadow:inset 0 0 0 1.5px var(--rp-navy); }',
    '.rp-box { flex:none; display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:4px; background:#fff; box-shadow:inset 0 0 0 1.5px #A9B6C4; color:#fff; font-size:13px; font-weight:700; line-height:1; transition:background-color .12s, box-shadow .12s; }',
    '.rp-on .rp-box, .rp-gr button.c.rp-on:hover .rp-box { background:var(--rp-navy); box-shadow:none; }',

    // asset view: Low / High per row
    '.rp-mx { max-width:620px; border:1px solid var(--rp-line); border-radius:10px; overflow:hidden; }',
    '.rp-mr { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px 10px 10px 16px; border-top:1px solid var(--rp-div); }',
    '.rp-mr:first-child { border-top:none; }',
    '.rp-mr .l { font-size:14px; }',
    '.rp-seg { display:inline-flex; flex:none; gap:3px; height:38px; padding:3px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; }',
    '.rp-seg button { min-width:76px; padding:0 18px; border:none; border-radius:6px; background:none; color:var(--rp-body); font:inherit; font-size:14px; font-weight:500; cursor:pointer; }',
    '.rp-seg button:hover:not(.on) { background:var(--rp-hdr); }',
    '.rp-seg button.on { background:var(--rp-navy); color:#fff; font-weight:600; }',

    // date of birth
    '.rp-date { max-width:240px; }',
    '.rp-date input { width:100%; height:44px; padding:0 14px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; color:var(--rp-ink); font:inherit; font-size:15px; }',
    '.rp-date input:focus { outline:none; border-color:var(--rp-teal); box-shadow:0 0 0 1px var(--rp-teal), 0 0 0 5px rgba(3,119,168,.12); }',

    // footer: Back / Continue
    '.rp-foot { display:flex; align-items:center; gap:16px; padding:16px 28px; border-top:1px solid var(--rp-line); background:var(--rp-hdr); }',
    '.rp-foot .sp { flex:1; }',
    '.rp-msg { font-size:13px; color:var(--rp-muted); text-align:right; }',
    '.rp-msg.warn { color:var(--rp-amb); font-weight:600; }',
    '.rp-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:40px; padding:0 18px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; color:var(--rp-ink); font:inherit; font-size:14px; font-weight:600; white-space:nowrap; cursor:pointer; }',
    '.rp-btn:hover { border-color:#B6C3D1; }',
    '.rp-btn.pri { border-color:var(--rp-navy); background:var(--rp-navy); color:#fff; }',
    '.rp-btn.pri:hover { border-color:var(--rp-navy-d); background:var(--rp-navy-d); }',
    '.rp-link { padding:0; border:none; background:none; color:var(--rp-teal); font:inherit; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }',
    '.rp-link:hover { color:var(--rp-navy); text-decoration:underline; }',

    // result
    '.rp-res { padding-bottom:28px; }',
    '.rp-hero { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(0, 1fr); gap:16px; margin-top:24px; }',
    '.rp-tile { padding:22px 24px; border:1px solid var(--rp-line); border-radius:12px; background:#fff; }',
    '.rp-tile.main { border:none; background:linear-gradient(135deg, var(--rp-navy) 0%, #0A4AA0 100%); color:#fff; box-shadow:0 10px 28px rgba(0,55,129,.18); }',
    '.rp-k { font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--rp-muted); }',
    '.rp-tile.main .rp-k { color:rgba(255,255,255,.72); }',
    '.rp-big { display:flex; align-items:baseline; gap:12px; margin-top:10px; }',
    '.rp-big b { font-size:48px; line-height:1; font-weight:700; letter-spacing:-.02em; }',
    '.rp-big span { font-size:22px; font-weight:700; }',
    '.rp-big small { font-size:13px; font-weight:400; opacity:.72; }',
    '.rp-meter { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:18px; }',
    '.rp-meter div { display:flex; flex-direction:column; gap:6px; font-size:11.5px; color:rgba(255,255,255,.6); }',
    '.rp-meter i { height:6px; border-radius:3px; background:rgba(255,255,255,.2); }',
    '.rp-meter div.on i { background:#fff; }',
    '.rp-meter div.cur { color:#fff; font-weight:700; }',
    '.rp-scale { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); gap:5px; align-items:end; height:64px; margin-top:16px; }',
    '.rp-scale span { display:flex; align-items:center; justify-content:center; height:30px; border-radius:7px; color:#fff; font-size:13px; font-weight:700; opacity:.4; }',
    '.rp-scale span.on { height:58px; font-size:24px; opacity:1; box-shadow:0 0 0 2px #fff, 0 0 0 4px var(--rp-navy); }',
    '.rp-scale-l { display:flex; justify-content:space-between; margin-top:8px; font-size:11.5px; color:var(--rp-faint); }',
    '.rp-sl { margin-top:16px; font-size:20px; font-weight:700; color:var(--rp-navy); }',
    '.rp-sl small { display:block; margin-top:2px; font-size:13px; font-weight:400; color:var(--rp-muted); }',
    '.rp-notes { display:flex; flex-direction:column; gap:10px; margin-top:16px; }',
    '.rp-note { padding:12px 16px; border-radius:10px; background:var(--rp-tint); font-size:13px; line-height:1.5; color:var(--rp-body); }',
    '.rp-note.warn { background:var(--rp-amb-bg); box-shadow:inset 0 0 0 1px #F3D3A2; color:var(--rp-amb); }',
    '.rp-fine { margin:16px 0 0; font-size:12px; line-height:1.5; color:var(--rp-muted); }',

    '.rp-tile.main .rp-scale span:not(.on) { background:rgba(255,255,255,.14) !important; color:rgba(255,255,255,.7) !important; opacity:1; }',
    '.rp-tile.main .rp-scale span.on { opacity:1; box-shadow:0 0 0 2px var(--rp-navy), 0 0 0 4px #fff; }',
    '.rp-tile.main .rp-scale-l { color:rgba(255,255,255,.6); }',
    '.rp-xl { margin-top:10px; font-size:30px; line-height:1.1; font-weight:700; color:var(--rp-navy); }',
    '.rp-pips { display:flex; gap:4px; max-width:180px; margin-top:12px; }',
    '.rp-pips i { flex:1; height:6px; border-radius:3px; background:var(--rp-div); }',
    '.rp-pips i.on { background:var(--rp-navy); }',
    '.rp-xd { margin:14px 0 0; font-size:13px; line-height:1.55; color:var(--rp-body); }',
    '.rp-optl { display:inline-block; margin-left:6px; padding:1px 8px; border-radius:999px; background:var(--rp-div); color:var(--rp-muted); font-size:11.5px; font-weight:600; vertical-align:1px; }',

    // result before every question is answered
    '.rp-todo { margin:22px 0 0; padding:0; list-style:none; max-width:560px; border:1px solid var(--rp-line); border-radius:10px; overflow:hidden; }',
    '.rp-todo li { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border-top:1px solid var(--rp-div); font-size:14px; }',
    '.rp-todo li:first-child { border-top:none; }',
    '.rp-todo .st { font-size:12px; font-weight:600; color:var(--rp-amb); white-space:nowrap; }',
    '.rp-todo .st.ok { color:var(--rp-grn); }',
    '.rp-todo .rp-link { font-size:14px; color:var(--rp-ink); }',
    '.rp-todo .rp-link:hover { color:var(--rp-navy); }',

    // narrow hosts
    '@container (max-width: 860px) { .rp-hero { grid-template-columns:minmax(0, 1fr); } }',
    '@container (max-width: 720px) { .rp-nav { gap:6px; padding:14px 20px; } .rp-tab:not(.on) .rp-tl { display:none; } .rp-sep { max-width:20px; }',
    '  .rp-panel { padding:24px 20px 4px; } .rp-q.flag { margin:6px -10px; padding-left:10px; padding-right:10px; } .rp-foot { padding:14px 20px; }',
    '  .rp-qb { padding-left:0; } .rp-opts { --rp-c:1; } .rp-ph { flex-direction:column; align-items:flex-start; } }',
    '@container (max-width: 520px) { .rp-gr { grid-template-columns:minmax(0, 1fr) 76px 76px; } .rp-gr.h > div { padding:10px 8px; font-size:10.5px; } .rp-gr .l { padding:12px; }',
    '  .rp-mr { flex-direction:column; align-items:flex-start; } .rp-big b { font-size:40px; }',
    '  .rp-foot { flex-wrap:wrap; } .rp-msg { order:3; width:100%; text-align:left; } }',
    '@media (prefers-reduced-motion: reduce) { .rp-panel { animation:none; } .rp-prog div, .rp-opt, .rp-dot, .rp-td, .rp-box, .rp-q { transition:none; } }',
    '@media print { .rp-nav, .rp-foot { display:none; } .rp-shell { border:none; } .rp-tile.main { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }'
  ].join('\n');

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function injectCss() {
    if (document.getElementById('rp-css')) return;
    var st = document.createElement('style');
    st.id = 'rp-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var sri = opts.sri || { labels: CFG.sriLabels, colors: CFG.sriColors };
    var answers = clone(opts.answers || {});
    var ctx = opts.context || {};
    var flagged = {};            // question ids highlighted as still to answer
    var result = RP.evaluate(answers, ctx);
    var uid = 'rp' + Math.random().toString(36).slice(2, 7);
    var cur = null;              // the part on screen: a section id, or 'result'
    var msg = '';                // footer message

    host.innerHTML = '<div class="rp" id="' + uid + '"><div class="rp-shell">' +
      '<nav class="rp-nav" aria-label="Questionnaire parts"></nav>' +
      '<div class="rp-body"></div>' +
      '<div class="rp-foot"></div></div></div>';
    var root = host.querySelector('#' + uid), nav = root.querySelector('.rp-nav'),
        body = root.querySelector('.rp-body'), foot = root.querySelector('.rp-foot');

    function qs() { return RP.questions(ctx); }
    function numberOf(q) { return qs().indexOf(q) + 1; }
    function done(q) { return RP.isAnswered(q, answers[q.id], ctx); }
    // The sections that have questions, in order
    function secs() { return CFG.sections.filter(function(s) { return qs().some(function(q) { return q.section === s.id; }); }); }
    function secQs(id) { return qs().filter(function(q) { return q.section === id; }); }
    function secReq(id) { return secQs(id).filter(function(q) { return !q.optional; }); }
    function secLeft(id) { return secReq(id).filter(function(q) { return !done(q); }).length; }
    function order() { return secs().map(function(s) { return s.id; }).concat('result'); }
    function firstOpen() {
      var q = qs().filter(function(x) { return !x.optional && !done(x); })[0];
      return q ? q.section : 'result';
    }
    function notify() { if (opts.onChange) opts.onChange({ answers: clone(answers), result: result }); }

    // ── Question bodies ──
    function bodyHtml(q) {
      var a = answers[q.id], h = '', k = 'data-q="' + q.id + '"';
      if (q.type === 'date') {
        return '<div class="rp-date"><input type="date" id="' + uid + '-dob" ' + k + ' value="' + esc(a || '') + '" max="' + esc(ctx.atDate || '') + '" aria-label="' + esc(q.text) + '"></div>';
      }
      if (q.type === 'single') {
        h = '<div class="rp-opts' + (q.cols === 1 ? ' c1' : q.cols === 4 ? ' c4' : '') + '" role="radiogroup" aria-label="' + esc(q.text) + '">';
        q.options.forEach(function(o) {
          var on = a === o.id;
          h += '<button type="button" class="rp-opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + on + '" ' + k + ' data-v="' + o.id + '" data-fk="' + q.id + '-' + o.id + '">' +
            '<span class="rp-dot" aria-hidden="true"></span><span>' + esc(o.label) + '</span></button>';
        });
        return h + '</div>';
      }
      if (q.type === 'matrix') {
        h = '<div class="rp-mx">';
        q.rows.forEach(function(r) {
          h += '<div class="rp-mr"><span class="l" id="' + uid + '-' + r.id + '">' + esc(r.label) + '</span><div class="rp-seg" role="radiogroup" aria-labelledby="' + uid + '-' + r.id + '">';
          q.options.forEach(function(o) {
            var on = a && a[r.id] === o.id;
            h += '<button type="button" role="radio" aria-checked="' + !!on + '" class="' + (on ? 'on' : '') + '" ' + k + ' data-row="' + r.id + '" data-v="' + o.id + '" data-fk="' + q.id + '-' + r.id + '-' + o.id + '">' + esc(o.label) + '</button>';
          });
          h += '</div></div>';
        });
        return h + '</div>';
      }
      // products: one row per product, a tick box per column
      h = '<div class="rp-grid" role="group" aria-label="' + esc(q.text) + '"><div class="rp-gr h"><div>Product</div>' +
        q.columns.map(function(c) { return '<div>' + esc(c.label) + '</div>'; }).join('') + '</div>';
      q.options.forEach(function(o) {
        var cells = '', any = false;
        q.columns.forEach(function(c) {
          var on = !!(a && a[c.id] && a[c.id].indexOf(o.id) >= 0);
          any = any || on;
          cells += '<button type="button" class="c' + (on ? ' rp-on' : '') + '" role="checkbox" aria-checked="' + on + '" aria-label="' + esc(o.label + ' — ' + c.label) + '" ' +
            k + ' data-col="' + c.id + '" data-v="' + o.id + '" data-fk="' + q.id + '-' + c.id + '-' + o.id + '"><span class="rp-box" aria-hidden="true">' + (on ? '✓' : '') + '</span></button>';
        });
        h += '<div class="rp-gr' + (o.exclusive ? ' nn' : '') + (any ? ' sel' : '') + '"><div class="l">' + esc(o.label) + '</div>' + cells + '</div>';
      });
      return h + '</div>';
    }
    function questionHtml(q) {
      var d = done(q);
      return '<div class="rp-q' + (d ? ' done' : '') + (flagged[q.id] && !d ? ' flag' : '') + '" id="' + uid + '-q-' + q.id + '" data-qwrap="' + q.id + '">' +
        '<div class="rp-qh"><span class="rp-qn" aria-hidden="true">' + (d ? '✓' : numberOf(q)) + '</span><div><div class="rp-qt">' + esc(q.text) + (q.optional ? ' <span class="rp-optl">Optional</span>' : '') + '</div>' +
        (q.help ? '<div class="rp-qs">' + esc(q.help) + '</div>' : '') + '<div class="rp-req">Please answer this question</div></div></div>' +
        '<div class="rp-qb">' + bodyHtml(q) + '</div></div>';
    }
    function countHtml(id) {
      var list = secReq(id), left = secLeft(id);
      if (!list.length) return 'Optional';
      return left ? (list.length - left) + ' of ' + list.length + ' answered' : '✓ All answered';
    }
    // Every part is in the page; only the current one is shown, so answers keep their focus
    function renderBody() {
      var h = '', S = secs();
      S.forEach(function(s, i) {
        h += '<section class="rp-panel" data-panel="' + s.id + '" aria-labelledby="' + uid + '-h-' + s.id + '"' + (cur === s.id ? '' : ' hidden') + '>' +
          '<header class="rp-ph"><div><div class="rp-eb">Part ' + (i + 1) + ' of ' + S.length + '</div><h2 id="' + uid + '-h-' + s.id + '" tabindex="-1">' + esc(s.title) + '</h2>' +
          '<p class="rp-lead">' + esc(s.lead) + '</p></div><span class="rp-cnt" data-cnt="' + s.id + '"></span></header>' +
          secQs(s.id).map(questionHtml).join('') + '</section>';
      });
      h += '<section class="rp-panel rp-res" data-panel="result" aria-labelledby="' + uid + '-h-result" aria-live="polite"' + (cur === 'result' ? '' : ' hidden') + '></section>';
      body.innerHTML = h;
      renderChrome();
    }
    function renderQuestion(q) {
      var el = body.querySelector('[data-qwrap="' + q.id + '"]');
      if (!el) return;
      var focusKey = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-fk');
      var tmp = document.createElement('div');
      tmp.innerHTML = questionHtml(q);
      el.parentNode.replaceChild(tmp.firstChild, el);
      if (focusKey) { var f = body.querySelector('[data-fk="' + focusKey + '"]'); if (f) f.focus({ preventScroll: true }); }
    }

    // ── Step strip, counts, footer and the result ──
    function renderNav() {
      var h = '', S = secs();
      S.forEach(function(s, i) {
        var list = secReq(s.id), left = secLeft(s.id);
        var st = cur === s.id ? ' on' : !left ? ' done' : left < list.length ? ' part' : '';
        h += '<button type="button" class="rp-tab' + st + '" data-tab="' + s.id + '"' + (cur === s.id ? ' aria-current="step"' : '') +
          ' aria-label="Part ' + (i + 1) + ', ' + esc(s.title) + (left ? ', ' + left + ' to answer' : ', complete') + '">' +
          '<span class="rp-td" aria-hidden="true">' + (!left && cur !== s.id ? '✓' : i + 1) + '</span><span class="rp-tl">' + esc(s.short || s.title) + '</span></button><span class="rp-sep" aria-hidden="true"></span>';
      });
      var rst = cur === 'result' ? ' on' : result.complete ? ' done' : '';
      h += '<button type="button" class="rp-tab' + rst + '" data-tab="result"' + (cur === 'result' ? ' aria-current="step"' : '') + '>' +
        '<span class="rp-td" aria-hidden="true">' + (result.complete && cur !== 'result' ? '✓' : S.length + 1) + '</span><span class="rp-tl">Your result</span></button>';
      var pct = result.total ? Math.round(result.answered / result.total * 100) : 0;
      h += '<div class="rp-prog" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="' + result.total + '" aria-valuenow="' + result.answered + '"><div style="width:' + pct + '%"></div></div>';
      nav.innerHTML = h;
    }
    function renderCounts() {
      secs().forEach(function(s) {
        var el = body.querySelector('[data-cnt="' + s.id + '"]');
        if (el) { el.textContent = countHtml(s.id); el.classList.toggle('done', !secLeft(s.id)); }
      });
    }
    function renderFoot() {
      var O = order(), i = O.indexOf(cur), next = O[i + 1], h = '';
      if (i > 0) h += '<button type="button" class="rp-btn" data-act="back">← Back</button>';
      if (result.answered) h += '<button type="button" class="rp-link" data-act="reset">Clear all answers</button>';
      h += '<span class="sp"></span><span class="rp-msg' + (msg ? ' warn' : '') + '" role="status">' + esc(msg) + '</span>';
      if (next) {
        var ns = CFG.sections.filter(function(s) { return s.id === next; })[0];
        var label = next === 'result' ? 'See the result' : 'Continue to ' + (ns.short || ns.title).toLowerCase();
        h += '<button type="button" class="rp-btn pri" data-act="fwd">' + esc(label) + ' →</button>';
      } else if (!result.complete) {
        h += '<button type="button" class="rp-btn pri" data-act="next">Go to the next question →</button>';
      } else if (opts.onFinish) {
        h += '<button type="button" class="rp-btn pri" data-act="finish">' + esc(opts.finishLabel || 'Use this result') + '</button>';
      }
      foot.innerHTML = h;
    }
    function renderChrome() { renderNav(); renderCounts(); renderFoot(); renderResult(); }

    function badgeColor(n) { return 'background:' + sri.colors[n] + (n === 4 ? ';color:#2A2100' : ''); }
    function pips(n, of) { if (!of) return ''; var h = ''; for (var i = 1; i <= of; i++) h += '<i' + (i <= n ? ' class="on"' : '') + '></i>'; return '<div class="rp-pips" aria-hidden="true">' + h + '</div>'; }
    function renderResult() {
      var el = body.querySelector('[data-panel="result"]'), r = result, h;
      if (!el) return;
      h = '<header class="rp-ph"><div><div class="rp-eb">' + (r.complete ? 'Complete' : 'Not finished yet') + '</div><h2 id="' + uid + '-h-result" tabindex="-1">Your result</h2>' +
        '<p class="rp-lead">' + (r.complete ? 'Based on the answers given. Your adviser makes the final assessment of your attitude to risk.'
          : 'Your risk profile appears here once every question is answered.') + '</p></div></header>';
      if (!r.complete) {
        h += '<ul class="rp-todo">' + secs().map(function(s) {
          var left = secLeft(s.id), req = secReq(s.id).length;
          return '<li><button type="button" class="rp-link" data-tab="' + s.id + '">' + esc(s.title) + '</button>' +
            '<span class="st' + (left ? '' : ' ok') + '">' + (left ? left + ' still to answer' : req ? '✓ Complete' : 'Optional') + '</span></li>';
        }).join('') + '</ul>';
        el.innerHTML = h;
        return;
      }
      var X = r.experience, scale = '';
      for (var n = 1; n <= 7; n++) scale += '<span class="' + (n === r.sri ? 'on' : '') + '" style="' + badgeColor(n) + '">' + n + '</span>';
      h += '<div class="rp-hero">' +
        '<div class="rp-tile main"><div class="rp-k">Risk profile</div>' +
          '<div class="rp-big"><b>' + r.sri + '</b><span>' + esc(r.sriLabel) + '</span><small>out of 7</small></div>' +
          '<div class="rp-scale" aria-hidden="true">' + scale + '</div><div class="rp-scale-l"><span>Lower risk</span><span>Higher risk</span></div></div>' +
        '<div class="rp-tile"><div class="rp-k">Experience and knowledge</div>' +
          '<div class="rp-xl">' + esc(X.label) + '</div>' + pips(X.number, 3) +
          '<p class="rp-xd">The client has ' + esc(X.desc) + '.</p></div>' +
        '</div>';
      if (X.level === 'LOW') h += '<div class="rp-notes"><div class="rp-note">Experience and knowledge is low. Make sure the risks of the product are clearly explained.</div></div>';
      h += '<p class="rp-fine">' + esc(CFG.text.disclaimer) + '</p>';
      el.innerHTML = h;
    }

    // ── Moving between parts ──
    function show(id, focus) {
      if (order().indexOf(id) < 0) id = firstOpen();
      cur = id; msg = '';
      body.querySelectorAll('[data-panel]').forEach(function(p) { p.hidden = p.getAttribute('data-panel') !== id; });
      renderChrome();
      if (focus) {
        body.scrollTop = 0;   // when the host makes the questions scroll on their own (e.g. in a dialog)
        if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start', behavior: 'smooth' });
        var hd = body.querySelector('#' + uid + '-h-' + id); if (hd) hd.focus({ preventScroll: true });
      }
    }
    function flagAndScroll(list) {
      list.forEach(function(q) { flagged[q.id] = true; renderQuestion(q); });
      var el = body.querySelector('[data-qwrap="' + list[0].id + '"]');
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var f = el.querySelector('button, input'); if (f) f.focus({ preventScroll: true });
      }
    }
    function forward() {
      var open = secReq(cur).filter(function(q) { return !done(q); });
      if (open.length) {
        flagAndScroll(open);
        msg = open.length === 1 ? 'Please answer the highlighted question to continue.' : 'Please answer the ' + open.length + ' highlighted questions to continue.';
        renderFoot();
        return;
      }
      var O = order(); show(O[O.indexOf(cur) + 1], true);
    }

    // ── State changes ──
    function changed(q) {
      result = RP.evaluate(answers, ctx);
      if (q) { delete flagged[q.id]; renderQuestion(q); }
      if (msg && !secQs(cur).some(function(x) { return !done(x) && flagged[x.id]; })) msg = '';
      renderChrome();
      notify();
    }
    function toggle(list, id, q) {
      var o = RP.option(q, id), i = list.indexOf(id);
      if (i >= 0) { list.splice(i, 1); return list; }
      if (o.exclusive) return [id];
      return list.filter(function(x) { var xo = RP.option(q, x); return !(xo && xo.exclusive); }).concat(id);
    }
    root.addEventListener('click', function(e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var tab = t.closest('[data-tab]');
      if (tab) { show(tab.getAttribute('data-tab'), true); return; }
      var act = t.closest('[data-act]');
      if (act) {
        var a = act.getAttribute('data-act');
        if (a === 'fwd') forward();
        else if (a === 'back') { var O = order(); show(O[Math.max(0, O.indexOf(cur) - 1)], true); }
        else if (a === 'next') api.goToNext();
        else if (a === 'reset') api.reset();
        else if (a === 'finish') opts.onFinish(api.getState());
        return;
      }
      var b = t.closest('button[data-q]');
      if (!b) return;
      var q = RP.question(b.getAttribute('data-q')), v = b.getAttribute('data-v');
      if (q.type === 'single') answers[q.id] = v;
      else if (q.type === 'matrix') { answers[q.id] = answers[q.id] || {}; answers[q.id][b.getAttribute('data-row')] = v; }
      else if (q.type === 'products') {
        var col = b.getAttribute('data-col');
        answers[q.id] = answers[q.id] || {};
        answers[q.id][col] = toggle((answers[q.id][col] || []).slice(), v, q);
      }
      changed(q);
    });
    root.addEventListener('input', function(e) {
      var el = e.target;
      if (el.getAttribute('data-q') !== 'dob') return;
      answers.dob = el.value;
      var q = RP.question('dob'), wrap = body.querySelector('[data-qwrap="dob"]');
      result = RP.evaluate(answers, ctx);
      var d = done(q);
      if (d) delete flagged.dob;
      if (wrap) { wrap.classList.toggle('done', d); wrap.classList.toggle('flag', !d && !!flagged.dob); wrap.querySelector('.rp-qn').textContent = d ? '✓' : numberOf(q); }
      if (msg && d) msg = '';
      renderChrome();
      notify();
    });

    var api = {
      getState: function() { return { answers: clone(answers), result: result }; },
      setAnswers: function(a) { answers = clone(a || {}); flagged = {}; result = RP.evaluate(answers, ctx); cur = firstOpen(); msg = ''; renderBody(); },
      setContext: function(c) {
        ctx = c || {};
        var before = JSON.stringify(result);
        result = RP.evaluate(answers, ctx);
        if (order().indexOf(cur) < 0) cur = firstOpen();
        renderBody();
        if (JSON.stringify(result) !== before) notify();
      },
      reset: function() { answers = {}; flagged = {}; result = RP.evaluate(answers, ctx); cur = order()[0]; msg = ''; renderBody(); notify(); show(cur, true); },
      // Opens the part with the first unanswered question, highlights it and scrolls to it
      goToNext: function() {
        var q = qs().filter(function(x) { return !x.optional && !done(x); })[0];
        if (!q) { show('result', true); return; }
        if (cur !== q.section) show(q.section);
        flagAndScroll([q]);
      },
      goTo: function(id) { show(id, true); },
      section: function() { return cur; },
      destroy: function() { host.innerHTML = ''; }
    };
    cur = firstOpen();
    renderBody();
    return api;
  }

  return { mount: mount };
})();
