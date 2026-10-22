// risk_profiler_ui.js — the Risk Profiler questionnaire, as a component you mount into any element.
// The questions are split into parts (one shown at a time, with a step strip and Back / Continue),
// and the result has its own final screen: the risk rating, capacity for loss, knowledge level, any limit
// that applies and, for the adviser, the flags. It injects its own scoped styles (everything is under
// .rp) and reads the host's CSS variables (--navy, --line, ...) when they exist, so it matches the
// Quotation Tool and still looks right on a plain page.
//
//   var rp = RiskProfilerUI.mount(document.getElementById('host'), {
//     answers: {},                                  // optional starting answers
//     seen: null,                                   // optional: the answers when the result was first shown (flag F6)
//     context: { dob: '1985-06-15' },               // optional, see RiskProfiler.evaluate
//     sri: { labels: [...], colors: [...] },        // optional, defaults to RP_CONFIG
//     showFlags: true,                              // optional: list the adviser's flags on the result
//     onChange: function(state) { ... },            // state = { answers, seen, result }
//     onFinish: function(state) { ... },            // optional: adds a button to the completed result
//     finishLabel: 'Use this result'                // its label
//   });
//   rp.getState(); rp.setAnswers(a, seen); rp.setContext(c); rp.reset(); rp.goToNext(); rp.goTo('finances' | 'result');
//   rp.section(); rp.destroy();
//
// "seen" is recorded the first time the rating is shown (on the result, or above the sustainability
// questions). Scored answers that differ from it afterwards raise flag F6.
//
// Needs risk_profiler_data.js and risk_profiler.js loaded first.

var RiskProfilerUI = (function() {
  var RP = RiskProfiler, CFG = RP.config;

  var CSS = [
    '.rp { --rp-navy:var(--navy,#003781); --rp-navy-d:var(--navy-d,#002A63); --rp-teal:var(--teal,#0377A8); --rp-ink:var(--ink,#0E1E33); --rp-body:var(--body,#3A4756);',
    '  --rp-muted:var(--muted,#5E6B78); --rp-faint:var(--faint,#8A96A3); --rp-line:var(--line,#E2E8EF); --rp-div:var(--div,#EEF2F6); --rp-inp:var(--inp,#D5DDE6);',
    '  --rp-tint:var(--tint,#EEF4FA); --rp-sel:var(--sel,#F6FAFE); --rp-bg:var(--bg,#F4F7FA); --rp-hdr:var(--hdr,#F7FAFC); --rp-off:var(--off,#C9D3DE);',
    '  --rp-grn:var(--grn,#0B7A3E); --rp-grn-bg:var(--grn-bg,#E6F2EA); --rp-amb:var(--amb-ink,#8A4708); --rp-amb-bg:var(--amb-bg,#FDF4E7); --rp-amb-ring:var(--amb-ring,#E8A33D);',
    '  container-type:inline-size; color:var(--rp-ink); font-family:inherit; font-size:16px; line-height:1.5; scroll-margin-top:24px; }',
    '.rp *, .rp *::before, .rp *::after { box-sizing:border-box; }',
    '.rp button { font-family:inherit; }',
    '.rp [hidden] { display:none !important; }',
    '.rp button:focus-visible { outline:2px solid var(--rp-teal); outline-offset:2px; }',
    '.rp h2:focus, .rp h3:focus { outline:none; }',
    '.rp-shell { border:1px solid var(--rp-line); border-radius:12px; background:#fff; overflow:hidden; }',

    // step strip
    '.rp-nav { position:relative; display:flex; align-items:center; gap:10px; padding:16px 28px; border-bottom:1px solid var(--rp-line); background:var(--rp-hdr); }',
    '.rp-tab { display:inline-flex; align-items:center; gap:8px; flex:none; padding:4px 2px; border:none; background:none; color:var(--rp-muted); font:inherit; font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; }',
    '.rp-tab:not(.on):hover .rp-tl { text-decoration:underline; text-underline-offset:3px; }',
    '.rp-td { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px var(--rp-off); font-size:11px; font-weight:700; transition:background-color .15s, box-shadow .15s; }',
    '.rp-tab.part { color:var(--rp-body); } .rp-tab.part .rp-td { box-shadow:inset 0 0 0 1.5px var(--rp-navy); color:var(--rp-navy); }',
    '.rp-tab.done { color:var(--rp-grn); } .rp-tab.done .rp-td { background:var(--rp-grn-bg); box-shadow:none; color:var(--rp-grn); }',
    '.rp-tab.on { color:var(--rp-navy); font-weight:700; } .rp-tab.on .rp-td { background:var(--rp-navy); box-shadow:none; color:#fff; }',
    '.rp-sep { flex:1 1 12px; min-width:8px; max-width:40px; height:1px; background:var(--rp-off); }',
    '.rp-prog { position:absolute; left:0; right:0; bottom:-1px; height:2px; }',
    '.rp-prog div { height:100%; background:var(--rp-navy); transition:width .3s ease; }',

    // a part of the questionnaire
    '.rp-panel { padding:32px 28px 8px; animation:rp-in .22s ease; }',
    '@keyframes rp-in { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }',
    '.rp-ph { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; padding-bottom:8px; }',
    '.rp-eb { margin-bottom:6px; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--rp-teal); }',
    '.rp-ph h2 { margin:0; font-size:28px; line-height:1.2; font-weight:700; letter-spacing:-.005em; color:var(--rp-navy); }',
    '.rp-lead { max-width:680px; margin:8px 0 0; font-size:16px; line-height:1.55; color:var(--rp-body); }',
    '.rp-cnt { flex:none; padding:4px 10px; border-radius:999px; background:var(--rp-div); color:var(--rp-body); font-size:13px; font-weight:600; white-space:nowrap; }',
    '.rp-cnt.done { background:var(--rp-grn-bg); color:var(--rp-grn); }',
    '.rp-intro-p { display:flex; flex-direction:column; justify-content:center; min-height:min(560px, 70vh); max-width:760px; margin:0 auto; padding:48px 28px; }',
    '.rp-intro-p h2 { margin:0 0 20px; font-size:36px; line-height:1.15; font-weight:700; color:var(--rp-navy); }',
    '.rp-intro-p p { margin:0 0 16px; font-size:18px; line-height:1.6; color:var(--rp-body); }',
    '.rp-intro-p ul { margin:0 0 20px; padding-left:22px; font-size:18px; line-height:1.6; color:var(--rp-body); } .rp-intro-p li { margin:6px 0; }',
    '.rp-nav.hide { display:none; }',
    '.rp-set { max-width:760px; margin:16px 0 8px; padding:12px 16px; border-radius:10px; background:var(--rp-grn-bg); color:var(--rp-grn); font-size:15px; font-weight:600; }',
    '.rp-set.no { background:var(--rp-div); color:var(--rp-muted); font-weight:500; }',

    // a question
    '.rp-q { padding:24px 0; border-top:1px solid var(--rp-div); transition:background-color .2s; }',
    '.rp-ph + .rp-q { margin-top:16px; }',
    '.rp-q:last-child { padding-bottom:28px; }',
    '.rp-qh { display:flex; gap:14px; align-items:flex-start; margin-bottom:16px; }',
    '.rp-qn { flex:none; display:flex; align-items:center; justify-content:center; width:28px; height:28px; margin-top:-3px; border-radius:50%; background:var(--rp-tint); color:var(--rp-navy); font-size:12px; font-weight:700; transition:background-color .15s; }',
    '.rp-q.done .rp-qn { background:var(--rp-grn-bg); color:var(--rp-grn); }',
    '.rp-qt { font-size:19px; font-weight:600; line-height:1.4; color:var(--rp-ink); }',
    '.rp-qs { margin-top:4px; font-size:15px; line-height:1.5; color:var(--rp-body); }',
    '.rp-qb { padding-left:42px; }',
    '.rp-q.flag { margin:6px -16px; padding:22px 16px; border-top-color:transparent; border-radius:12px; background:var(--rp-amb-bg); box-shadow:inset 0 0 0 1px #F3D3A2; }',
    '.rp-q.flag + .rp-q { border-top-color:transparent; }',
    '.rp-q.flag .rp-qn { background:#fff; box-shadow:inset 0 0 0 1.5px var(--rp-amb-ring); color:var(--rp-amb); }',
    '.rp-req { display:none; margin-top:3px; font-size:12px; font-weight:600; color:var(--rp-amb); }',
    '.rp-q.flag .rp-req { display:block; }',

    // single and multiple choice: option cards
    '.rp-opts { display:grid; grid-template-columns:repeat(var(--rp-c, 2), minmax(0, 1fr)); gap:10px; }',
    '.rp-opts.c1 { --rp-c:1; max-width:800px; } .rp-opts.c2 { max-width:520px; }',
    '.rp-opt { display:flex; align-items:flex-start; gap:12px; width:100%; min-height:52px; padding:14px 16px; border:none; border-radius:10px; background:#fff; box-shadow:inset 0 0 0 1px var(--rp-line); color:var(--rp-ink); font:inherit; font-size:16px; line-height:1.45; text-align:left; cursor:pointer; transition:box-shadow .15s, background-color .15s; }',
    '.rp-opt:hover { box-shadow:inset 0 0 0 1px #BFCBD8; background:var(--rp-hdr); }',
    '.rp-opt.on { background:var(--rp-sel); box-shadow:inset 0 0 0 2px var(--rp-navy), 0 4px 14px rgba(0,55,129,.08); color:var(--rp-navy); font-weight:600; }',
    '.rp-dot { flex:none; width:20px; height:20px; margin-top:0; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 1.5px #A9B6C4; transition:box-shadow .15s; }',
    '.rp-opt.on .rp-dot { box-shadow:inset 0 0 0 6px var(--rp-navy); }',
    '.rp-box { flex:none; display:flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:4px; background:#fff; box-shadow:inset 0 0 0 1.5px #A9B6C4; color:#fff; font-size:13px; font-weight:700; line-height:1; transition:background-color .12s, box-shadow .12s; }',
    '.rp-opt.on .rp-box, .rp-chk.on .rp-box { background:var(--rp-navy); box-shadow:none; }',

    // slider (Q4)
    '.rp-sld { max-width:640px; }',
    '.rp-sv { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 14px; min-height:40px; margin-bottom:12px; }',
    '.rp-sv b { font-size:28px; line-height:1.1; font-weight:700; color:var(--rp-navy); }',
    '.rp-sv span { font-size:16px; color:var(--rp-body); }',
    '.rp-sld.unset .rp-sv span { color:var(--rp-muted); }',
    '.rp-range { -webkit-appearance:none; appearance:none; display:block; width:100%; height:28px; margin:0; background:transparent; cursor:pointer; }',
    '.rp-range:focus { outline:none; } .rp-range:focus-visible { outline:2px solid var(--rp-teal); outline-offset:4px; border-radius:4px; }',
    '.rp-range::-webkit-slider-runnable-track { height:6px; border-radius:3px; background:linear-gradient(to right, var(--rp-navy) 0, var(--rp-navy) var(--rp-p, 0%), var(--rp-off) var(--rp-p, 0%), var(--rp-off) 100%); }',
    '.rp-range::-moz-range-track { height:6px; border-radius:3px; background:var(--rp-off); }',
    '.rp-range::-moz-range-progress { height:6px; border-radius:3px; background:var(--rp-navy); }',
    '.rp-range::-webkit-slider-thumb { -webkit-appearance:none; width:26px; height:26px; margin-top:-10px; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 7px var(--rp-navy), 0 2px 6px rgba(14,30,51,.25); }',
    '.rp-range::-moz-range-thumb { width:26px; height:26px; border:none; border-radius:50%; background:#fff; box-shadow:inset 0 0 0 7px var(--rp-navy), 0 2px 6px rgba(14,30,51,.25); }',
    '.rp-sld.unset .rp-range::-webkit-slider-thumb { opacity:0; } .rp-sld.unset .rp-range::-moz-range-thumb { opacity:0; } .rp-sld.unset .rp-range::-moz-range-progress { background:transparent; }',
    '.rp-sl-l { display:flex; justify-content:space-between; margin-top:8px; font-size:14px; color:var(--rp-body); }',

    // ranking (Q8)
    '.rp-rank { max-width:640px; }',
    '.rp-rcap { margin:0 0 6px; font-size:12.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--rp-muted); }',
    '.rp-rcap.end { margin:6px 0 0; }',
    '.rp-rl { display:flex; flex-direction:column; gap:8px; margin:0; padding:0; list-style:none; }',
    '.rp-ri { display:flex; align-items:center; gap:12px; padding:8px 8px 8px 12px; border-radius:10px; background:#fff; box-shadow:inset 0 0 0 1px var(--rp-line); cursor:grab; -webkit-user-select:none; user-select:none; }',
    '.rp-ri.drag { opacity:.45; } .rp-ri.over { box-shadow:inset 0 0 0 2px var(--rp-teal); }',
    '.rp-rank.set .rp-ri { background:var(--rp-sel); box-shadow:inset 0 0 0 1px #BFCBD8; }',
    '.rp-rn { flex:none; display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:var(--rp-tint); color:var(--rp-navy); font-size:12px; font-weight:700; }',
    '.rp-rank.set .rp-rn { background:var(--rp-navy); color:#fff; }',
    '.rp-grip { flex:none; color:var(--rp-faint); font-size:14px; letter-spacing:-3px; }',
    '.rp-ri .l { flex:1; min-width:0; font-size:16px; }',
    '.rp-ra { display:flex; flex:none; gap:4px; }',
    '.rp-ra button { width:34px; height:34px; padding:0; border:1px solid var(--rp-inp); border-radius:7px; background:#fff; color:var(--rp-body); font-size:15px; cursor:pointer; }',
    '.rp-ra button:hover:not(:disabled) { border-color:var(--rp-navy); color:var(--rp-navy); }',
    '.rp-ra button:disabled { opacity:.35; cursor:default; }',
    '.rp-rank.off .rp-rl, .rp-rank.off .rp-rcap { opacity:.4; pointer-events:none; }',
    '.rp-rf { display:flex; flex-wrap:wrap; align-items:center; gap:12px 20px; margin-top:14px; }',
    '.rp-chk { display:inline-flex; align-items:center; gap:10px; padding:8px 14px 8px 10px; border:none; border-radius:8px; background:#fff; box-shadow:inset 0 0 0 1px var(--rp-line); color:var(--rp-ink); font:inherit; font-size:14px; cursor:pointer; }',
    '.rp-chk:hover { box-shadow:inset 0 0 0 1px #BFCBD8; }',
    '.rp-chk.on { box-shadow:inset 0 0 0 2px var(--rp-navy); color:var(--rp-navy); font-weight:600; }',

    // minimum shares (S3): a choice per row
    '.rp-mx { max-width:780px; border:1px solid var(--rp-line); border-radius:10px; overflow:hidden; }',
    '.rp-mr { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px 10px 10px 16px; border-top:1px solid var(--rp-div); }',
    '.rp-mr:first-child { border-top:none; }',
    '.rp-mr .l { font-size:14px; }',
    '.rp-seg { display:inline-flex; flex:none; gap:3px; height:38px; padding:3px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; }',
    '.rp-seg button { min-width:64px; padding:0 12px; border:none; border-radius:6px; background:none; color:var(--rp-body); font:inherit; font-size:13.5px; font-weight:500; white-space:nowrap; cursor:pointer; }',
    '.rp-seg button:hover:not(.on) { background:var(--rp-hdr); }',
    '.rp-seg button.on { background:var(--rp-navy); color:#fff; font-weight:600; }',

    // date of birth
    '.rp-date { max-width:240px; }',
    '.rp-date input { width:100%; height:44px; padding:0 14px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; color:var(--rp-ink); font:inherit; font-size:15px; }',
    '.rp-date input:focus { outline:none; border-color:var(--rp-teal); box-shadow:0 0 0 1px var(--rp-teal), 0 0 0 5px rgba(3,119,168,.12); }',

    // footer: Back / Continue
    '.rp-foot { display:flex; align-items:center; gap:16px; padding:16px 28px; border-top:1px solid var(--rp-line); background:var(--rp-hdr); }',
    '.rp-foot .sp { flex:1; }',
    '.rp-msg { font-size:14px; color:var(--rp-body); text-align:right; }',
    '.rp-msg.warn { color:var(--rp-amb); font-weight:600; }',
    '.rp-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:46px; padding:0 22px; border:1px solid var(--rp-inp); border-radius:8px; background:#fff; color:var(--rp-ink); font:inherit; font-size:16px; font-weight:600; white-space:nowrap; cursor:pointer; }',
    '.rp-btn:hover { border-color:#B6C3D1; }',
    '.rp-btn.sm { height:36px; padding:0 14px; font-size:13px; }',
    '.rp-btn.pri { border-color:var(--rp-navy); background:var(--rp-navy); color:#fff; }',
    '.rp-btn.pri:hover { border-color:var(--rp-navy-d); background:var(--rp-navy-d); }',
    '.rp-link { padding:0; border:none; background:none; color:var(--rp-teal); font:inherit; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }',
    '.rp-link:hover { color:var(--rp-navy); text-decoration:underline; }',

    // result
    '.rp-disc .rp-dpts { margin:0 0 28px; }',
    '.rp-disc .rp-dlead { margin-bottom:8px; font-weight:600; color:var(--rp-ink); }',
    '.rp-res { padding-bottom:28px; }',
    '.rp-imp { margin-top:20px; border-left:3px solid var(--rp-navy); border-radius:0 10px 10px 0; } .rp-imp p { margin:6px 0 0; }',
    '.rp-cap { margin-top:16px; }',
    '.rp-cap .rp-xl { display:inline-block; margin:0 14px 0 0; vertical-align:middle; }',
    '.rp-cap .rp-pips { display:inline-flex; width:120px; margin:0; vertical-align:middle; }',
    '.rp-cap p { margin:10px 0 0; font-size:15px; line-height:1.55; color:var(--rp-body); }',
    '.rp-ans { margin-top:24px; }',
    '.rp-ans h3 { margin:0 0 10px; font-size:20px; color:var(--rp-navy); }',
    '.rp-ans h4 { margin:18px 0 6px; font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--rp-body); }',
    '.rp-ans dl { margin:0; } .rp-ans .r { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:6px 24px; padding:10px 0; border-top:1px solid var(--rp-line); font-size:15px; line-height:1.5; }',
    '.rp-ans dt { color:var(--rp-body); } .rp-ans dd { margin:0; color:var(--rp-ink); font-weight:600; }',
    '.rp-hero { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(0, 1fr); gap:16px; margin-top:24px; }',
    '.rp-tile { padding:22px 24px; border:1px solid var(--rp-line); border-radius:12px; background:#fff; }',
    '.rp-tile.main { border:none; background:linear-gradient(135deg, var(--rp-navy) 0%, #0A4AA0 100%); color:#fff; box-shadow:0 10px 28px rgba(0,55,129,.18); }',
    '.rp-k { font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--rp-body); }',
    '.rp-tile.main .rp-k { color:rgba(255,255,255,.9); }',
    '.rp-big { display:flex; align-items:baseline; gap:12px; margin-top:10px; }',
    '.rp-big b { font-size:48px; line-height:1; font-weight:700; letter-spacing:-.02em; }',
    '.rp-big span { font-size:22px; font-weight:700; }',
    '.rp-big small { font-size:13px; font-weight:400; opacity:.72; }',
    '.rp-scale { display:grid; grid-template-columns:repeat(var(--rp-n, 6), minmax(0, 1fr)); gap:5px; align-items:end; height:64px; margin-top:16px; }',
    '.rp-scale span { display:flex; align-items:center; justify-content:center; height:30px; border-radius:7px; color:#fff; font-size:13px; font-weight:700; }',
    '.rp-scale span.on { height:58px; font-size:24px; }',
    '.rp-scale span.off { opacity:.4; }',
    '.rp-scale-l { display:flex; justify-content:space-between; margin-top:8px; font-size:13px; }',
    '.rp-tile.main .rp-scale span:not(.on) { opacity:.55; } .rp-tile.main .rp-scale span.off { opacity:.3; }',
    '.rp-tile.main .rp-scale span.on { box-shadow:0 0 0 2px var(--rp-navy), 0 0 0 4px #fff; }',
    '.rp-tile.main .rp-scale-l { color:rgba(255,255,255,.85); }',
    '.rp-side { display:flex; flex-direction:column; gap:18px; }',
    '.rp-xl { margin-top:6px; font-size:26px; line-height:1.1; font-weight:700; color:var(--rp-navy); }',
    '.rp-pips { display:flex; gap:4px; max-width:180px; margin-top:10px; }',
    '.rp-pips i { flex:1; height:6px; border-radius:3px; background:var(--rp-div); }',
    '.rp-pips i.on { background:var(--rp-navy); }',
    '.rp-notes { display:flex; flex-direction:column; gap:10px; margin-top:16px; }',
    '.rp-note { padding:14px 18px; border-radius:10px; background:var(--rp-tint); font-size:15px; line-height:1.55; color:var(--rp-body); }',
    '.rp-note b { color:var(--rp-ink); }',
    '.rp-note ol { margin:6px 0 6px 20px; padding:0; }',
    '.rp-note.warn { background:var(--rp-amb-bg); box-shadow:inset 0 0 0 1px #F3D3A2; color:var(--rp-amb); }',
    '.rp-note.warn b { color:var(--rp-amb); }',
    '.rp-note.warn ul { margin:6px 0 0 18px; padding:0; } .rp-note.warn li { margin:4px 0; }',

    // result before every question is answered
    '.rp-todo { margin:22px 0 0; padding:0; list-style:none; max-width:560px; border:1px solid var(--rp-line); border-radius:10px; overflow:hidden; }',
    '.rp-todo li { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border-top:1px solid var(--rp-div); font-size:14px; }',
    '.rp-todo li:first-child { border-top:none; }',
    '.rp-todo .st { font-size:12px; font-weight:600; color:var(--rp-amb); white-space:nowrap; }',
    '.rp-todo .st.ok { color:var(--rp-grn); }',
    '.rp-todo .rp-link { font-size:14px; color:var(--rp-ink); }',
    '.rp-todo .rp-link:hover { color:var(--rp-navy); }',

    // narrow hosts
    '@container (max-width: 860px) { .rp-hero { grid-template-columns:minmax(0, 1fr); } .rp-mr { flex-direction:column; align-items:flex-start; } }',
    '@container (max-width: 760px) { .rp-ans .r { grid-template-columns:minmax(0, 1fr); } .rp-nav { gap:6px; padding:14px 20px; } .rp-tab:not(.on) .rp-tl { display:none; } .rp-sep { max-width:20px; }',
    '  .rp-panel { padding:24px 20px 4px; } .rp-q.flag { margin:6px -10px; padding-left:10px; padding-right:10px; } .rp-foot { padding:14px 20px; }',
    '  .rp-qb { padding-left:0; } .rp-opts { --rp-c:1; } .rp-ph { flex-direction:column; align-items:flex-start; } }',
    '@container (max-width: 520px) { .rp-seg { flex-wrap:wrap; height:auto; } .rp-seg button { height:32px; } .rp-big b { font-size:40px; } .rp-grip { display:none; }',
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
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function fill(str, vals) { return String(str).replace(/\{(\w+)\}/g, function(m, k) { return vals[k] != null ? vals[k] : m; }); }
  function eur(n) { return '€' + Math.round(n).toLocaleString('en-IE'); }
  function cap1(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  // The scored answers, as held when the result is first shown
  function scoredOf(answers) {
    var o = {};
    CFG.questions.forEach(function(q) { if (q.scored && answers[q.id] !== undefined) o[q.id] = clone(answers[q.id]); });
    return o;
  }

  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var sri = opts.sri || { labels: CFG.sriLabels, colors: CFG.sriColors };
    var answers = clone(opts.answers || {});
    var seen = clone(opts.seen || null);
    var ctx = opts.context || {};
    var flagged = {};            // question ids highlighted as still to answer
    var uid = 'rp' + Math.random().toString(36).slice(2, 7);
    var cur = null;              // the part on screen: a section id, or 'result'
    var msg = '';                // footer message
    var accepted = opts.accepted || null;   // when the important information was accepted (ISO time), or null
    var declined = false;        // the important information was declined: show the stop message
    var dragId = null;           // the Q8 item being dragged
    var drawn = '';              // the questions on the page when it was last drawn (see visibleKey)
    function evalCtx() { var c = {}; for (var k in ctx) c[k] = ctx[k]; c.seen = seen; return c; }
    var result = RP.evaluate(answers, evalCtx());

    host.innerHTML = '<div class="rp" id="' + uid + '"><div class="rp-shell">' +
      '<nav class="rp-nav" aria-label="Questionnaire parts"></nav>' +
      '<div class="rp-body"></div>' +
      '<div class="rp-foot"></div></div></div>';
    var root = host.querySelector('#' + uid), nav = root.querySelector('.rp-nav'),
        body = root.querySelector('.rp-body'), foot = root.querySelector('.rp-foot');

    function qs() { return RP.questions(ctx, answers); }
    function visibleKey() { return qs().map(function(q) { return q.id + (q.type === 'shares' ? ':' + RP.shareRows(q, answers).length : ''); }).join(','); }
    function done(q) { return RP.isAnswered(q, answers[q.id], ctx, answers); }
    // The sections that have questions, in order
    function secs() { return CFG.sections.filter(function(s) { return qs().some(function(q) { return q.section === s.id; }); }); }
    function secQs(id) { return qs().filter(function(q) { return q.section === id; }); }
    function secLeft(id) { return secQs(id).filter(function(q) { return !done(q); }).length; }
    function order() { return (CFG.intro ? ['intro'] : []).concat(CFG.disclaimer ? ['disclaimer'] : []).concat(secs().map(function(s) { return s.id; }), 'result'); }
    function firstOpen() {
      // The introduction comes first, then the important information; once that is accepted the questions start
      if (!result.answered && !(CFG.disclaimer && accepted)) { if (CFG.intro) return 'intro'; if (CFG.disclaimer) return 'disclaimer'; }
      var q = qs().filter(function(x) { return !done(x); })[0];
      return q ? q.section : 'result';
    }
    function notify() { if (opts.onChange) opts.onChange(api.getState()); }
    function recompute() { result = RP.evaluate(answers, evalCtx()); }

    // ── Question bodies ──
    function sliderReadout(q, a) {
      if (typeof a !== 'number') return '<b>–</b><span>Not answered yet. Move the slider to choose.</span>';
      if (q.unit === 'years') return '<b>' + esc(cap1(RP.yearsText(a))) + '</b><span>' + esc(RP.band(q.id, a).shown) + '</span>';
      if (a <= 0) return '<b>' + esc(q.minLabel) + '</b><span>You would want to keep the full ' + eur(q.amount) + '.</span>';
      var top = a >= q.max, more = top ? ' or more' : '';
      return '<b>' + (Math.round(a * 10) / 10) + '%' + more + '</b><span>A fall of ' + eur(q.amount * a / 100) + more + ', leaving ' + (top ? eur(q.amount * (1 - a / 100)) + ' or less' : eur(q.amount * (1 - a / 100))) + '.</span>';
    }
    function sliderText(q, v) { return q.unit === 'years' ? cap1(RP.yearsText(v)) : v <= 0 ? q.minLabel : v + '%'; }
    function rankOrder(q, a) { return a && a.order ? a.order : q.start; }
    function bodyHtml(q) {
      var a = answers[q.id], h = '', k = 'data-q="' + q.id + '"';
      if (q.type === 'date') {
        return '<div class="rp-date"><input type="date" id="' + uid + '-dob" ' + k + ' value="' + esc(a || '') + '" max="' + esc(ctx.atDate || '') + '" aria-label="' + esc(q.text) + '"></div>';
      }
      if (q.type === 'single' || q.type === 'multi') {
        var multi = q.type === 'multi';
        h = '<div class="rp-opts' + (q.cols === 2 ? ' c2' : ' c1') + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-label="' + esc(q.text) + '">';
        q.options.forEach(function(o) {
          var on = multi ? !!(a && a.indexOf(o.id) >= 0) : a === o.id;
          h += '<button type="button" class="rp-opt' + (on ? ' on' : '') + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" ' + k + ' data-v="' + o.id + '" data-fk="' + q.id + '-' + o.id + '">' +
            (multi ? '<span class="rp-box" aria-hidden="true">' + (on ? '✓' : '') + '</span>' : '<span class="rp-dot" aria-hidden="true"></span>') + '<span>' + esc(o.label) + '</span></button>';
        });
        return h + '</div>';
      }
      if (q.type === 'slider') {
        var set = typeof a === 'number', v = set ? a : q.min, pct = (v - q.min) / (q.max - q.min) * 100;
        var marks = '';
        q.marks.forEach(function(mv, m) { marks += '<span>' + (m === 0 ? esc(q.minLabel) : m === q.marks.length - 1 ? esc(q.maxLabel) : mv + (q.unit === 'years' ? ' years' : '%')) + '</span>'; });
        return '<div class="rp-sld' + (set ? '' : ' unset') + '" data-sld="' + q.id + '"><div class="rp-sv" aria-hidden="true">' + sliderReadout(q, a) + '</div>' +
          '<input type="range" class="rp-range" ' + k + ' data-fk="' + q.id + '-range" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + v + '" style="--rp-p:' + pct + '%"' +
          ' aria-label="' + esc(q.text) + '" aria-valuetext="' + esc(set ? sliderText(q, a) : 'Not answered') + '">' +
          '<div class="rp-sl-l" aria-hidden="true">' + marks + '</div></div>';
      }
      if (q.type === 'rank') {
        var ord = rankOrder(q, a), dk = !!(a && a.dontKnow), placed = !!(a && a.order);
        h = '<div class="rp-rank' + (placed && !dk ? ' set' : '') + (dk ? ' off' : '') + '"><div class="rp-rcap">Lowest risk</div><ol class="rp-rl" aria-label="' + esc(q.text) + '">';
        ord.forEach(function(id, i) {
          var it = q.items.filter(function(x) { return x.id === id; })[0];
          h += '<li class="rp-ri" draggable="' + (dk ? 'false' : 'true') + '" data-ri="' + id + '"><span class="rp-rn" aria-hidden="true">' + (i + 1) + '</span><span class="rp-grip" aria-hidden="true">⋮⋮</span>' +
            '<span class="l">' + esc(it.label) + '</span><span class="rp-ra">' +
            '<button type="button" ' + k + ' data-mv="-1" data-v="' + id + '" data-fk="' + q.id + '-up-' + id + '" aria-label="Move ' + esc(it.label) + ' up"' + (i === 0 || dk ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" ' + k + ' data-mv="1" data-v="' + id + '" data-fk="' + q.id + '-dn-' + id + '" aria-label="Move ' + esc(it.label) + ' down"' + (i === ord.length - 1 || dk ? ' disabled' : '') + '>↓</button></span></li>';
        });
        h += '</ol><div class="rp-rcap end">Highest risk</div><div class="rp-rf">';
        if (!placed && !dk) h += '<button type="button" class="rp-btn sm" ' + k + ' data-keep="1" data-fk="' + q.id + '-keep">This order is my answer</button>';
        h += '<button type="button" class="rp-chk' + (dk ? ' on' : '') + '" role="checkbox" aria-checked="' + dk + '" ' + k + ' data-dk="1" data-fk="' + q.id + '-dk"><span class="rp-box" aria-hidden="true">' + (dk ? '✓' : '') + '</span>' + esc(q.dontKnow) + '</button>';
        return h + '</div></div>';
      }
      // shares: a choice for each row
      h = '<div class="rp-mx">';
      RP.shareRows(q, answers).forEach(function(r) {
        h += '<div class="rp-mr"><span class="l" id="' + uid + '-' + r.id + '">' + esc(r.label.slice(0, 3) + cap1(r.short)) + '</span><div class="rp-seg" role="radiogroup" aria-labelledby="' + uid + '-' + r.id + '">';
        q.options.forEach(function(o) {
          var on = a && a[r.id] === o.id;
          h += '<button type="button" role="radio" aria-checked="' + !!on + '" class="' + (on ? 'on' : '') + '" ' + k + ' data-row="' + r.id + '" data-v="' + o.id + '" data-fk="' + q.id + '-' + r.id + '-' + o.id + '">' + esc(o.label) + '</button>';
        });
        h += '</div></div>';
      });
      return h + '</div>';
    }
    function questionHtml(q) {
      var d = done(q);
      return '<div class="rp-q' + (d ? ' done' : '') + (flagged[q.id] && !d ? ' flag' : '') + '" id="' + uid + '-q-' + q.id + '" data-qwrap="' + q.id + '">' +
        '<div class="rp-qh"><span class="rp-qn" aria-hidden="true">' + (d ? '✓' : esc(q.num || '•')) + '</span><div><div class="rp-qt">' + esc(q.text) + '</div>' +
        (q.help ? '<div class="rp-qs">' + esc(q.help) + '</div>' : '') + '<div class="rp-req">Please answer this question</div></div></div>' +
        '<div class="rp-qb">' + bodyHtml(q) + '</div></div>';
    }
    function countHtml(id) {
      var n = secQs(id).length, left = secLeft(id);
      return left ? (n - left) + ' of ' + n + ' answered' : '✓ All answered';
    }
    // Every part is in the page; only the current one is shown, so answers keep their focus
    function renderBody() {
      var focusKey = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-fk');
      var h = '', S = secs();
      if (CFG.disclaimer) {
        var D = CFG.disclaimer;
        h += '<section class="rp-panel rp-intro-p rp-disc" data-panel="disclaimer" aria-labelledby="' + uid + '-h-disclaimer"' + (cur === 'disclaimer' ? '' : ' hidden') + '>' +
          (declined
            ? '<h2 id="' + uid + '-h-disclaimer" tabindex="-1">' + esc(D.declinedTitle) + '</h2><p>' + esc(D.declinedText) + '</p>'
            : '<h2 id="' + uid + '-h-disclaimer" tabindex="-1">' + esc(D.title) + '</h2>' + D.paragraphs.map(function(p) { return '<p>' + esc(p) + '</p>'; }).join('') +
              '<p class="rp-dlead">' + esc(D.confirmLead) + '</p><ul class="rp-dpts">' + D.points.map(function(p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>') +
          '</section>';
      }
      if (CFG.intro) {
        h += '<section class="rp-panel rp-intro-p" data-panel="intro" aria-labelledby="' + uid + '-h-intro"' + (cur === 'intro' ? '' : ' hidden') + '>' +
          '<h2 id="' + uid + '-h-intro" tabindex="-1">' + esc(CFG.introTitle || 'Before you begin') + '</h2>' +
          String(CFG.intro).split(/\n/).map(function(p) { return /^- /.test(p) ? '<ul><li>' + esc(p.slice(2)) + '</li></ul>' : '<p>' + esc(p) + '</p>'; }).join('').replace(/<\/ul><ul>/g, '') + '</section>';
      }
      S.forEach(function(s, i) {
        h += '<section class="rp-panel" data-panel="' + s.id + '" aria-labelledby="' + uid + '-h-' + s.id + '"' + (cur === s.id ? '' : ' hidden') + '>' +
          '<header class="rp-ph"><div><div class="rp-eb">Part ' + (i + 1) + ' of ' + S.length + '</div><h2 id="' + uid + '-h-' + s.id + '" tabindex="-1">' + esc(s.title) + '</h2>' +
          '<p class="rp-lead">' + esc(s.lead) + '</p></div><span class="rp-cnt" data-cnt="' + s.id + '"></span></header>' +
          (s.afterRating ? '<div class="rp-set" data-set></div>' : '') +
          secQs(s.id).map(questionHtml).join('') + '</section>';
      });
      h += '<section class="rp-panel rp-res" data-panel="result" aria-labelledby="' + uid + '-h-result" aria-live="polite"' + (cur === 'result' ? '' : ' hidden') + '></section>';
      body.innerHTML = h;
      drawn = visibleKey();
      renderChrome();
      if (focusKey) { var f = body.querySelector('[data-fk="' + focusKey + '"]'); if (f && !f.disabled) f.focus({ preventScroll: true }); }
    }
    function renderQuestion(q) {
      var el = body.querySelector('[data-qwrap="' + q.id + '"]');
      if (!el) return;
      var focusKey = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-fk');
      var tmp = document.createElement('div');
      tmp.innerHTML = questionHtml(q);
      el.parentNode.replaceChild(tmp.firstChild, el);
      if (focusKey) {
        var f = body.querySelector('[data-fk="' + focusKey + '"]');
        // a move button that is now disabled (top or bottom): keep focus on the item's other button
        if (f && f.disabled) f = body.querySelector('[data-fk="' + focusKey.replace(/-(up|dn)-/, function(m, d) { return d === 'up' ? '-dn-' : '-up-'; }) + '"]');
        if (!f && /^check-/.test(focusKey)) f = body.querySelector('[data-fk^="check-up-"]:not(:disabled)');
        if (f) f.focus({ preventScroll: true });
      }
    }

    // ── Step strip, counts, footer and the result ──
    function renderNav() {
      var h = '', S = secs();
      nav.classList.toggle('hide', cur === 'intro' || cur === 'disclaimer');
      S.forEach(function(s, i) {
        var n = secQs(s.id).length, left = secLeft(s.id);
        var st = cur === s.id ? ' on' : !left ? ' done' : left < n ? ' part' : '';
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
      var set = body.querySelector('[data-set]');
      if (set) {
        set.classList.toggle('no', !result.rated);
        set.textContent = result.rated ? 'Your risk rating is set at ' + result.sri + ' (' + sri.labels[result.sri] + '). These questions do not change it.'
          : 'Your risk rating is set from your answers to the earlier parts. These questions do not change it.';
      }
    }
    function renderFoot() {
      var O = order(), i = O.indexOf(cur), next = O[i + 1], h = '';
      if (cur === 'disclaimer') {
        var D = CFG.disclaimer;
        foot.innerHTML = declined ? '<button type="button" class="rp-btn" data-act="undecline">' + esc(D.back) + '</button>'
          : '<span class="sp"></span><button type="button" class="rp-btn" data-act="decline">' + esc(D.decline) + '</button><button type="button" class="rp-btn pri" data-act="accept">' + esc(D.accept) + '</button>';
        return;
      }
      if (i > 0) h += '<button type="button" class="rp-btn" data-act="back">← Back</button>';
      if (result.answered) h += '<button type="button" class="rp-link" data-act="reset">Clear all answers</button>';
      h += '<span class="sp"></span><span class="rp-msg' + (msg ? ' warn' : '') + '" role="status">' + esc(msg) + '</span>';
      if (next) {
        var ns = CFG.sections.filter(function(s) { return s.id === next; })[0];
        var label = cur === 'intro' ? (next === 'disclaimer' ? 'Continue' : 'Start the questions') : next === 'result' ? 'See the result' : 'Continue to ' + (ns.short || ns.title).toLowerCase();
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
    function pips(n, of) { var h = ''; for (var i = 1; i <= of; i++) h += '<i' + (i <= n ? ' class="on"' : '') + '></i>'; return '<div class="rp-pips" aria-hidden="true">' + h + '</div>'; }
    function renderResult() {
      var el = body.querySelector('[data-panel="result"]'), r = result, T = CFG.text, h;
      if (!el) return;
      h = '<header class="rp-ph"><div><div class="rp-eb">' + (r.complete ? 'Complete' : 'Not finished yet') + '</div><h2 id="' + uid + '-h-result" tabindex="-1">Your result</h2>' +
        '<p class="rp-lead">' + esc(r.complete ? T.resultLead : 'Your risk rating appears here once every question is answered.') + '</p></div></header>';
      if (!r.complete) {
        h += '<ul class="rp-todo">' + secs().map(function(s) {
          var left = secLeft(s.id);
          return '<li><button type="button" class="rp-link" data-tab="' + s.id + '">' + esc(s.title) + '</button>' +
            '<span class="st' + (left ? '' : ' ok') + '">' + (left ? left + ' still to answer' : '✓ Complete') + '</span></li>';
        }).join('') + '</ul>';
        el.innerHTML = h;
        return;
      }
      var max = CFG.maxRating, top = sri.labels.length - 1, scale = '', L = CFG.levels.order;
      for (var n = 1; n <= top; n++) scale += '<span class="' + (n === r.sri ? 'on' : n > max ? 'off' : '') + '" style="' + badgeColor(n) + '">' + n + '</span>';
      h += '<div class="rp-hero">' +
        '<div class="rp-tile main"><div class="rp-k">Risk rating</div>' +
          '<div class="rp-big"><b>' + r.sri + '</b><span>' + esc(sri.labels[r.sri]) + '</span><small>on a scale of 1 to ' + top + '</small></div>' +
          '<div class="rp-scale" style="--rp-n:' + top + '" aria-hidden="true">' + scale + '</div><div class="rp-scale-l"><span>Lower risk</span><span>Higher risk</span></div>' +
          (top > max ? '<div class="rp-scale-l"><span>The profiler gives a rating from 1 to ' + max + '.</span></div>' : '') + '</div>' +
        '<div class="rp-tile rp-side">' +
          '<div><div class="rp-k">Knowledge and experience</div><div class="rp-xl" data-kn>' + esc(r.knowledge.label) + '</div>' + pips(L.indexOf(r.knowledge.level) + 1, 3) + '</div>' +
        '</div></div>';
      // Capacity for loss, straight after the rating
      h += '<div class="rp-tile rp-cap" data-capbox><div class="rp-k">Capacity for loss</div>' +
        '<div><span class="rp-xl" data-cap>' + esc(r.capacity.label) + '</span>' + pips(L.indexOf(r.capacity.level) + 1, 3) + '</div>' +
        '<p>' + esc(T.capacitySummary[r.capacity.level]) + '</p>' +
        '<p>' + esc(T.capacityBasis) + '</p></div>';
      var notes = [], lim = r.limits;
      if (lim.timeApplied && lim.time === lim.ceiling) notes.push('<div class="rp-note">' + esc(fill(T.limitTime, { horizon: r.horizon.term, cap: lim.time })) + '</div>');
      if (lim.capacityApplied && lim.capacity === lim.ceiling) notes.push('<div class="rp-note">' + esc(fill(T.limitCapacity, { cap: lim.capacity })) + '</div>');
      if (notes.length) h += '<div class="rp-notes">' + notes.join('') + '</div>';
      // The answers, then the adviser's flags
      h += '<div class="rp-ans" data-answers><h3>Your answers</h3>' + RP.summary(answers, ctx).map(function(sec) {
        return '<h4>' + esc(sec.title) + '</h4><dl>' + sec.rows.map(function(rw) {
          return '<div class="r"><dt>' + esc((rw.num ? 'Q' + rw.num + '. ' : '') + rw.q) + '</dt><dd>' + rw.a.map(esc).join('<br>') + '</dd></div>';
        }).join('') + '</dl>';
      }).join('') + '</div>';
      if (opts.showFlags !== false && r.flags.length) {
        h += '<div class="rp-notes"><div class="rp-note warn" data-flags><b>For the adviser: ' + r.flags.length + ' flag' + (r.flags.length > 1 ? 's' : '') + '</b><ul>' +
          r.flags.map(function(f) { return '<li data-flag="' + f.id + '"><b>' + esc(f.title) + ':</b> ' + esc(f.text) + '</li>'; }).join('') + '</ul></div></div>';
      }
      h += '<div class="rp-note rp-imp" data-important><b>' + esc(T.resultNotice.title) + '</b><p>' + esc(T.resultNotice.text) + '</p></div>';
      el.innerHTML = h;
    }

    // ── Moving between parts ──
    // Showing the rating (the result, or the part asked after it) records the answers it was based on
    function noteSeen() {
      var s = CFG.sections.filter(function(x) { return x.id === cur; })[0];
      if (seen || !result.rated || !(cur === 'result' || (s && s.afterRating))) return;
      seen = scoredOf(answers);
      recompute(); notify();
    }
    function show(id, focus) {
      if (order().indexOf(id) < 0) id = firstOpen();
      cur = id; msg = '';
      body.querySelectorAll('[data-panel]').forEach(function(p) { p.hidden = p.getAttribute('data-panel') !== id; });
      noteSeen();
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
        var f = el.querySelector('button:not(:disabled), input'); if (f) f.focus({ preventScroll: true });
      }
    }
    function forward() {
      var open = secQs(cur).filter(function(q) { return !done(q); });
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
      recompute();
      if (q) delete flagged[q.id];
      if (visibleKey() !== drawn) renderBody();      // a sustainability question appeared or went away
      else if (q) renderQuestion(q);
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
    function moveItem(q, id, to) {
      var ord = rankOrder(q, answers[q.id]).slice(), from = ord.indexOf(id);
      if (from < 0 || to < 0 || to >= ord.length || to === from) return false;
      ord.splice(from, 1); ord.splice(to, 0, id);
      answers[q.id] = { order: ord };
      return true;
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
        else if (a === 'accept') { accepted = new Date().toISOString(); declined = false; notify(); show(secs().length ? secs()[0].id : 'result', true); }
        else if (a === 'decline' || a === 'undecline') { declined = a === 'decline'; renderBody(); var dh = body.querySelector('#' + uid + '-h-disclaimer'); if (dh) dh.focus({ preventScroll: true }); }
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
      else if (q.type === 'multi') answers[q.id] = toggle((answers[q.id] || []).slice(), v, q);
      else if (q.type === 'shares') { answers[q.id] = answers[q.id] || {}; answers[q.id][b.getAttribute('data-row')] = v; }
      else if (q.type === 'rank') {
        var cur8 = answers[q.id];
        if (b.hasAttribute('data-dk')) {
          if (cur8 && cur8.dontKnow) { if (cur8.order) answers[q.id] = { order: cur8.order }; else delete answers[q.id]; }
          else answers[q.id] = cur8 && cur8.order ? { order: cur8.order, dontKnow: true } : { dontKnow: true };
        } else if (b.hasAttribute('data-keep')) answers[q.id] = { order: q.start.slice() };
        else {
          var ord = rankOrder(q, cur8);
          if (!moveItem(q, v, ord.indexOf(v) + +b.getAttribute('data-mv'))) return;
        }
      }
      changed(q);
    });
    // Q4 slider: the readout follows the thumb without redrawing the question, so dragging stays smooth
    function sliderSet(el) {
      var q = RP.question(el.getAttribute('data-q')), v = +el.value, wrap = el.closest('[data-sld]'), qw = body.querySelector('[data-qwrap="' + q.id + '"]');
      answers[q.id] = v;
      recompute();
      delete flagged[q.id];
      wrap.classList.remove('unset');
      wrap.querySelector('.rp-sv').innerHTML = sliderReadout(q, v);
      el.style.setProperty('--rp-p', ((v - q.min) / (q.max - q.min) * 100) + '%');
      el.setAttribute('aria-valuetext', sliderText(q, v));
      if (qw) { qw.classList.add('done'); qw.classList.remove('flag'); qw.querySelector('.rp-qn').textContent = '✓'; }
      if (msg && !secQs(cur).some(function(x) { return !done(x) && flagged[x.id]; })) msg = '';
      renderChrome();
      notify();
    }
    root.addEventListener('input', function(e) {
      var el = e.target;
      if (el.classList && el.classList.contains('rp-range')) { sliderSet(el); return; }
      if (el.getAttribute('data-q') !== 'dob') return;
      answers.dob = el.value;
      var q = RP.question('dob'), wrap = body.querySelector('[data-qwrap="dob"]');
      recompute();
      var d = done(q);
      if (d) delete flagged.dob;
      if (wrap) { wrap.classList.toggle('done', d); wrap.classList.toggle('flag', !d && !!flagged.dob); wrap.querySelector('.rp-qn').textContent = d ? '✓' : (q.num || '•'); }
      if (msg && d) msg = '';
      renderChrome();
      notify();
    });
    // A click on the slider where the (hidden) thumb already sits fires no input event: still take it as the answer
    root.addEventListener('change', function(e) {
      var el = e.target;
      if (el.classList && el.classList.contains('rp-range') && answers[el.getAttribute('data-q')] === undefined) sliderSet(el);
    });
    root.addEventListener('pointerup', function(e) {
      var el = e.target;
      if (el.classList && el.classList.contains('rp-range') && answers[el.getAttribute('data-q')] === undefined) sliderSet(el);
    });
    // Q8: drag an item onto another to take its place
    root.addEventListener('dragstart', function(e) {
      var li = e.target.closest && e.target.closest('[data-ri]');
      if (!li) return;
      dragId = li.getAttribute('data-ri');
      li.classList.add('drag');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {}
    });
    root.addEventListener('dragover', function(e) {
      var li = dragId && e.target.closest && e.target.closest('[data-ri]');
      if (!li) return;
      e.preventDefault();
      body.querySelectorAll('.rp-ri.over').forEach(function(x) { if (x !== li) x.classList.remove('over'); });
      if (li.getAttribute('data-ri') !== dragId) li.classList.add('over');
    });
    root.addEventListener('drop', function(e) {
      var li = dragId && e.target.closest && e.target.closest('[data-ri]');
      if (!li) return;
      e.preventDefault();
      var q = RP.question('check'), to = rankOrder(q, answers.check).indexOf(li.getAttribute('data-ri')), id = dragId;
      dragId = null;
      if (moveItem(q, id, to)) changed(q); else renderQuestion(q);
    });
    root.addEventListener('dragend', function() {
      if (!dragId) return;
      dragId = null;
      body.querySelectorAll('.rp-ri.drag, .rp-ri.over').forEach(function(x) { x.classList.remove('drag', 'over'); });
    });

    var api = {
      getState: function() { return { answers: clone(answers), seen: clone(seen), accepted: accepted, result: result }; },
      setAnswers: function(a, s) { answers = clone(a || {}); seen = clone(s || null); flagged = {}; recompute(); cur = firstOpen(); msg = ''; renderBody(); },
      setContext: function(c) {
        ctx = c || {};
        var before = JSON.stringify(result);
        recompute();
        if (order().indexOf(cur) < 0) cur = firstOpen();
        renderBody();
        if (JSON.stringify(result) !== before) notify();
      },
      // Clears the answers. Once the rating has been shown, it stays recorded, so new answers count as changes (F6).
      reset: function() { answers = {}; flagged = {}; recompute(); cur = secs().length ? secs()[0].id : order()[0]; msg = ''; renderBody(); notify(); show(cur, true); },
      // Opens the part with the first unanswered question, highlights it and scrolls to it
      goToNext: function() {
        var q = qs().filter(function(x) { return !done(x); })[0];
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
    noteSeen();
    return api;
  }

  return { mount: mount };
})();
