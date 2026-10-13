// risk_profiler.js — scoring engine and summaries for the Risk Profiler. No DOM, no dependencies
// except risk_profiler_data.js (RP_CONFIG), so it runs in a browser or in Node.
//
// The calculation follows the Allianz Global Life risk profile website (its SurveyService._calculation,
// with the cell-named helpers from the source workbook: E5, E8, E9, J11, J24, J33, J45, J57, J66, J82,
// H93, H94, I93), step by step, with these corrections (each is noted where it happens):
//   • the two highest market-fall answers swap scores (6 and 7),
//   • the income-side weights are the workbook's 0.25, 0.10 and 0.65 (the site has 25, 10 and 65),
//   • the last capacity step uses adjusted earning capacity, as in the workbook (the site uses liquid assets),
//   • the wealth table is read with liquid assets as the row, as in the workbook (the site swaps them),
//   • several products ticked score the highest one, and an experience score of 0 is LOW.
// Pass ctx.siteQuirks = true to reproduce the site exactly; the tests use this to check against it.
//
//   RiskProfiler.evaluate(answers, ctx)  -> result (risk profile 1–7, experience profile, eligible funds, every step)
//   RiskProfiler.summary(answers, ctx)   -> the questions and answers as readable rows, by section
//   RiskProfiler.narrative(answers, ctx, result, opts) -> sentences for a written suitability statement
//
// answers: { <questionId>: <optionId> }, except
//   products:  { known: [optionId], held: [optionId] }
//   assetView: { <rowId>: <optionId> }
//   dob:       'YYYY-MM-DD'
// ctx (all optional): { dob: 'YYYY-MM-DD'  – when the host already holds the date of birth, the profiler does not ask for it
//                       purpose: 'A'–'E'    – when the host already knows the purpose (pQ_14), it is not asked
//                       atDate: 'YYYY-MM-DD' – the date the age is worked out at. The site uses today, the default.
//                       siteQuirks: true     – reproduce the site exactly, without the corrections (for verification only) }

(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./risk_profiler_data.js'));
  else root.RiskProfiler = factory(root.RP_CONFIG);
})(typeof self !== 'undefined' ? self : this, function(CFG) {

  function questions(ctx) {
    return CFG.questions.filter(function(q) { return !(q.id === 'dob' && ctx && ctx.dob) && !(q.id === 'purpose' && ctx && ctx.purpose); });
  }
  function question(id) {
    for (var i = 0; i < CFG.questions.length; i++) if (CFG.questions[i].id === id) return CFG.questions[i];
    return null;
  }
  function option(q, id) {
    var o = q.options || [];
    for (var i = 0; i < o.length; i++) if (o[i].id === id) return o[i];
    return null;
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // Whole years from dob to `at`, as moment().diff(dob, 'years') counts them: whole calendar months,
  // with a month added to the 29th–31st landing on the last day of a shorter month (so someone born
  // on 29 February has a birthday on 28 February in other years). null if either date is invalid.
  function ageAt(dob, at) {
    var b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || '')), a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(at || today()));
    if (!b || !a) return null;
    var by = +b[1], bm = +b[2], bd = +b[3], ay = +a[1], am = +a[2], ad = +a[3];
    if (bm < 1 || bm > 12 || bd < 1 || bd > new Date(by, bm, 0).getDate()) return null;
    var months = (ay - by) * 12 + (am - bm);
    var anchorDay = Math.min(bd, new Date(ay, am, 0).getDate());   // dob + months, clamped to the month's end
    if (ad < anchorDay) months--;
    return Math.floor(months / 12);
  }
  function validDob(dob, at) { var a = ageAt(dob, at); return a != null && a >= 0 && a <= 120; }

  function isAnswered(q, a, ctx) {
    if (q.type === 'date') return validDob(a, ctx && ctx.atDate);
    if (q.type === 'single') return !!(a && option(q, a));
    if (q.type === 'matrix') return q.rows.every(function(r) { return a && !!option(q, a[r.id]); });
    if (q.type === 'products') {
      if (!a) return false;
      return q.columns.some(function(c) { return a[c.id] && a[c.id].length; });
    }
    return false;
  }

  // tables.x[row][col - 1], or 0 if either input is below 1 (the site's guard on every lookup)
  function tbl(name, row, col) { return row < 1 || col < 1 ? 0 : CFG.tables[name][row][col - 1]; }
  // An answer's score, or 0 when unanswered (the site's default for every input). `site` uses the
  // site's score where it differs (siteScore).
  function scoreOf(id, answers, site) {
    var q = question(id), o = q && answers ? option(q, answers[id]) : null;
    if (!o) return 0;
    var v = site && o.siteScore != null ? o.siteScore : o.score;
    return v || 0;
  }

  // ─── The calculation (the site's _calculation, step by step) ─────────────────────────
  function evaluate(answers, ctx) {
    var A = answers || {}; ctx = ctx || {};
    var qs = questions(ctx), req = qs.filter(function(q) { return !q.optional; });
    var missing = req.filter(function(q) { return !isAnswered(q, A[q.id], ctx); }).map(function(q) { return q.id; });
    var dob = ctx.dob || A.dob, purpose = ctx.purpose || A.purpose || null;
    var W = CFG.experience.weights, site = !!ctx.siteQuirks;

    // Experience and knowledge
    // E5 = max(finance work, education) × 0.2
    var e5 = Math.max(scoreOf('financeWork', A), scoreOf('education', A)) * W.edu;
    // E8 = 0.6 × the highest weight among the product rows ticked (in either column), 0 if none.
    // Corrected: the site hands Math.max the array as one argument, so two or more rows give NaN,
    // which then scores as HIGH.
    var pq = question('products'), pa = A.products || {}, rows = [];
    pq.options.forEach(function(o) {
      if (pq.columns.some(function(c) { return (pa[c.id] || []).indexOf(o.id) >= 0; })) rows.push(o.score);
    });
    var q11 = rows.length === 0 ? 0 : rows.length > 1 && ctx.siteQuirks ? NaN : Math.max.apply(null, rows);
    var e8 = W.products * q11;
    // E9 = 0.2 × (100 for each asset class answered as intended)
    var aq = question('assetView'), av = A.assetView || {}, aSum = 0;
    aq.rows.forEach(function(r) { if (option(aq, av[r.id])) aSum += av[r.id] === r.correct ? aq.pointsEach : 0; });
    var e9 = W.assets * aSum;
    var eScore = e5 + e8 + e9;
    // J11 (with the site's quirks, NaN fails both comparisons and lands on HIGH)
    var j11 = eScore < CFG.experience.medium ? 'LOW' : eScore >= CFG.experience.medium && eScore < CFG.experience.high ? 'MEDIUM' : 'HIGH';
    // H93: corrected so that a total of 0 is LOW. The site calls it "Na" and counts it as 3, like HIGH.
    var expLevel = eScore === 0 && ctx.siteQuirks ? 'Na' : j11;
    var expNumber = CFG.experience.number[expLevel];   // I93: LOW 1, MEDIUM 2, HIGH 3

    // Financial position
    // C24, J24: personal information level from employment, health and dependants.
    // Corrected: weights 0.25, 0.10 and 0.65, worked in hundredths and rounded halves up, so the result
    // is exact. The site's weights are 100 times larger, so its level is always 3.
    var PW = CFG.personal.weights, personalScore;
    if (site) {
      PW = CFG.personal.siteWeights;
      personalScore = Math.round(scoreOf('employment', A) * PW.employment + scoreOf('health', A) * PW.health + scoreOf('dependants', A) * PW.dependants);
    } else {
      var hundredths = Math.round(PW.employment * 100) * scoreOf('employment', A) + Math.round(PW.health * 100) * scoreOf('health', A) +
                       Math.round(PW.dependants * 100) * scoreOf('dependants', A);
      personalScore = Math.floor((hundredths + 50) / 100);
    }
    var personal = personalScore < CFG.personal.medium ? 1 : personalScore >= CFG.personal.medium && personalScore < CFG.personal.high ? 2 : 3;
    var income = scoreOf('income', A);
    var earning = tbl('earningCapacity', income, personal);              // J33
    var commitments = scoreOf('commitments', A);
    var adjusted = tbl('adjustedEarning', commitments, earning);         // J45
    var horizon = scoreOf('horizon', A), liquid = scoreOf('assets', A);
    // J57: corrected so liquid assets is the row, as in the workbook (the site makes horizon the row)
    var totalAssets = site ? tbl('totalAssets', horizon, liquid) : tbl('totalAssets', liquid, horizon);
    // J66: corrected to adjusted earning capacity × total assets, as in the workbook (the site uses liquid assets)
    var capacity = tbl('financialCapacity', site ? liquid : adjusted, totalAssets);

    // Risk tolerance and the risk profile
    var tolerance = scoreOf('tolerance', A, site);
    var profileRaw = tbl('profile', capacity, tolerance);                // J82
    var age = dob && validDob(dob, ctx.atDate) ? ageAt(dob, ctx.atDate) : null;
    // H94: only a 7 is capped, and only over 80. No date of birth gives 0.
    var sri = age == null ? 0 : profileRaw === CFG.ageCap.from && age > CFG.ageCap.over ? CFG.ageCap.to : profileRaw;

    // Eligible funds: complexity ≤ experience number, risk ≤ risk profile, offered for the purpose
    var eligible = CFG.eligibleFunds.filter(function(f) {
      return !!(expNumber && sri && f.complexity <= expNumber && f.risk <= sri) && !!purpose && f.purposes.indexOf(purpose) >= 0;
    });

    var res = {
      complete: missing.length === 0, missing: missing,
      answered: req.length - missing.length, total: req.length,
      age: age, purpose: purpose,
      experience: { e5: e5, e8: e8, e9: e9, score: eScore, level: expLevel, number: expNumber,
                    label: CFG.levels.experience[expLevel].label, desc: CFG.levels.experience[expLevel].desc,
                    productRows: rows.length },
      steps: { personalScore: personalScore, personal: personal, income: income, earningCapacity: earning,
               commitments: commitments, adjustedEarningCapacity: adjusted, horizon: horizon, liquidAssets: liquid,
               totalAssets: totalAssets, financialCapacity: capacity },
      tolerance: tolerance, profileRaw: profileRaw, ageCapped: sri !== profileRaw && age != null,
      sri: sri, sriLabel: CFG.sriLabels[sri] || '', eligible: eligible
    };
    if (!res.complete) { res.sri = null; res.sriLabel = ''; res.ageCapped = false; res.eligible = []; }
    return res;
  }

  // ─── Readable answers ────────────────────────────────────────────────────────────────
  function fmtDob(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  // [{ id, title, rows: [{ id, q, a: [lines] }] }] for the answered questions, in questionnaire order
  function summary(answers, ctx) {
    answers = answers || {}; ctx = ctx || {};
    var out = [];
    CFG.sections.forEach(function(s) {
      var rows = [];
      questions(ctx).forEach(function(q) {
        if (q.section !== s.id) return;
        var a = answers[q.id], lines;
        if (q.type === 'products') {
          var none = function(col) { return { id: q.id + ':' + col, q: col === 'known' ? 'Investment products you understand' : 'Investment products you hold or have held in the last three years', a: ['None ticked'] }; };
          ['known', 'held'].forEach(function(col) {
            var v = (a && a[col]) || [];
            rows.push(v.length ? { id: q.id + ':' + col, q: none(col).q, a: v.map(function(id) { return option(q, id).label; }) } : none(col));
          });
          return;
        }
        if (q.type === 'matrix') {
          lines = q.rows.map(function(r) { var o = a ? option(q, a[r.id]) : null; return r.label + ': ' + (o ? o.label : 'Not answered'); });
          rows.push({ id: q.id, q: q.text, a: lines });
          return;
        }
        if (!isAnswered(q, a, ctx)) return;
        lines = q.type === 'date' ? [fmtDob(a)] : [option(q, a).label];
        rows.push({ id: q.id, q: q.text, a: lines });
      });
      if (rows.length) out.push({ id: s.id, title: s.title, rows: rows });
    });
    return out;
  }

  // ─── Sentences for a suitability statement ──────────────────────────────────────────
  function fill(str, ctx) { return String(str).replace(/\{(\w+)\}/g, function(m, k) { return ctx[k] != null ? ctx[k] : m; }); }
  function phraseOf(qid, answers) {
    var q = question(qid), o = q && answers ? option(q, answers[qid]) : null;
    return o && o.phrase ? o.phrase : '';
  }
  // opts: { suggestedSri, chosenSri, overrideReason } to add the adviser's override
  function narrative(answers, ctx, result, opts) {
    answers = answers || {}; opts = opts || {};
    var T = CFG.text;
    var out = { circumstances: '', risk: '', experience: '', override: '' };
    out.circumstances = ['employment', 'dependants', 'income', 'commitments', 'assets', 'horizon', 'financeWork']
      .map(function(id) { return phraseOf(id, answers); }).filter(Boolean).join(' ');
    if (!result || !result.complete) return out;
    out.risk = fill(T.riskSentence, {
      tolerance: option(question('tolerance'), answers.tolerance).phrase,
      capacity: CFG.levels.capacity[result.steps.financialCapacity].toLowerCase(),
      sri: result.sri, sriLabel: result.sriLabel
    });
    if (result.ageCapped) out.risk += ' ' + fill(T.ageCapSentence, { to: CFG.ageCap.to });
    out.experience = fill(T.experienceSentence, { level: result.experience.label.toLowerCase(), levelDesc: result.experience.desc });
    if (opts.suggestedSri && opts.chosenSri && opts.suggestedSri !== opts.chosenSri) {
      out.override = fill(T.overrideSentence, { suggested: opts.suggestedSri, chosen: opts.chosenSri, reason: String(opts.overrideReason || '').trim() });
    }
    return out;
  }

  return {
    config: CFG, questions: questions, question: question, option: option,
    isAnswered: isAnswered, evaluate: evaluate, summary: summary, narrative: narrative,
    ageAt: ageAt, fmtDob: fmtDob
  };
});
