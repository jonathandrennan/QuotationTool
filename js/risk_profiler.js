// risk_profiler.js — scoring engine and summaries for the Risk Profiler. No DOM, no dependencies
// except risk_profiler_data.js (RP_CONFIG), so it runs in a browser or in Node.
//
// The rules are those of docs/risk-profiler-design-draft.md (draft 19/10/2026):
//   1. Attitude: the middle value of the Q4, Q5 and Q6 ratings, and no more than one level above Q4.
//   2. Limits: the time limit from Q3; low capacity for loss (Q1 + Q2 points) allows no more than 4.
//   3. Risk rating: the lower of the attitude and the limits (1 to 6). It is set (result.rated) once Q1–Q6 are
//      answered; result.complete also needs the knowledge, date of birth and sustainability questions.
//   Knowledge (Q7, one level lower if Q8 is wrong or "I don't know") and age raise flags only. The
//   sustainability questions are recorded and do not change the rating.
//
//   RiskProfiler.evaluate(answers, ctx)  -> result (rating 1–6, capacity, limits, knowledge, flags, sustainability)
//   RiskProfiler.summary(answers, ctx)   -> the questions and answers as readable rows, by section
//   RiskProfiler.narrative(answers, ctx, result, opts) -> sentences for a written suitability statement
//
// answers: { <questionId>: <optionId> }, except
//   loss:  a number, the slider's percentage (0–40)
//   check: { order: [itemId × 4] } or { dontKnow: true }
//   s2, s4: [optionId]
//   s3:    { <s2 optionId>: <optionId> }
//   dob:   'YYYY-MM-DD'
// ctx (all optional): { dob: 'YYYY-MM-DD'  – when the host already holds the date of birth, the profiler does not ask for it
//                       atDate: 'YYYY-MM-DD' – the date the age is worked out at (default today)
//                       seen: answers       – the scored answers when the result was first shown (flag F6) }

(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./risk_profiler_data.js'));
  else root.RiskProfiler = factory(root.RP_CONFIG);
})(typeof self !== 'undefined' ? self : this, function(CFG) {

  function question(id) {
    for (var i = 0; i < CFG.questions.length; i++) if (CFG.questions[i].id === id) return CFG.questions[i];
    return null;
  }
  function option(q, id) {
    var o = (q && q.options) || [];
    for (var i = 0; i < o.length; i++) if (o[i].id === id) return o[i];
    return null;
  }
  function item(q, id) {
    for (var i = 0; i < q.items.length; i++) if (q.items[i].id === id) return q.items[i];
    return null;
  }
  // Whether a question is asked, given the answers so far (its `when` condition)
  function applies(q, answers) {
    var w = q.when;
    if (!w) return true;
    var a = (answers || {})[w.q];
    if (w.is) return a === w.is && applies(question(w.q), answers);
    return Array.isArray(a) && w.any.some(function(id) { return a.indexOf(id) >= 0; }) && applies(question(w.q), answers);
  }
  // The questions asked, in order: the date of birth is left out when the host supplies it
  function questions(ctx, answers) {
    return CFG.questions.filter(function(q) { return !(q.id === 'dob' && ctx && ctx.dob) && applies(q, answers); });
  }
  // S3's rows: the options ticked in S2 that ask for a minimum share
  function shareRows(q, answers) {
    var src = question(q.rowsFrom), t = (answers && answers[q.rowsFrom]) || [];
    return src.options.filter(function(o) { return o.share && t.indexOf(o.id) >= 0; });
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // Whole years from dob to `at`. null if either date is invalid.
  function ageAt(dob, at) {
    var b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || '')), a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(at || today()));
    if (!b || !a) return null;
    var by = +b[1], bm = +b[2], bd = +b[3], ay = +a[1], am = +a[2], ad = +a[3];
    if (bm < 1 || bm > 12 || bd < 1 || bd > new Date(by, bm, 0).getDate()) return null;
    var age = ay - by;
    if (am < bm || (am === bm && ad < bd)) age--;
    return age;
  }
  function validDob(dob, at) { var a = ageAt(dob, at); return a != null && a >= 0 && a <= 120; }

  function isAnswered(q, a, ctx, answers) {
    if (q.type === 'date') return validDob(a, ctx && ctx.atDate);
    if (q.type === 'single') return !!(a && option(q, a));
    if (q.type === 'slider') return typeof a === 'number' && a >= q.min && a <= q.max;
    if (q.type === 'rank') return !!a && (a.dontKnow === true || (Array.isArray(a.order) && a.order.length === q.items.length));
    if (q.type === 'multi') return Array.isArray(a) && a.some(function(id) { return option(q, id); });
    if (q.type === 'shares') {
      var rows = shareRows(q, answers);
      return rows.length > 0 && rows.every(function(r) { return a && option(q, a[r.id]); });
    }
    return false;
  }

  // The Q4 band a slider value falls in: the last band whose `from` it reaches
  function lossBand(v) {
    var q = question('loss'), b = null;
    if (typeof v !== 'number') return null;
    q.bands.forEach(function(x) { if (v >= x.from) b = x; });
    return b;
  }
  function median3(a, b, c) { return Math.max(Math.min(a, b), Math.min(Math.max(a, b), c)); }
  function lower(level) { var L = CFG.levels.order, i = L.indexOf(level); return L[Math.max(0, i - 1)]; }
  function fill(str, vals) { return String(str).replace(/\{(\w+)\}/g, function(m, k) { return vals[k] != null ? vals[k] : m; }); }
  function fmtPct(v) { return (Math.round(v * 10) / 10) + '%'; }
  function fmtEur(n) { return '€' + Math.round(n).toLocaleString('en-IE'); }
  function lossText(v) {
    var q = question('loss');
    if (v <= 0) return 'no fall';
    return fmtPct(v) + (v >= q.max ? ' or more' : '') + ' (' + fmtEur(q.amount * v / 100) + (v >= q.max ? ' or more' : '') + ' on ' + fmtEur(q.amount) + ')';
  }
  function list(xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; }

  // ─── The calculation ─────────────────────────────────────────────────────────────────
  function evaluate(answers, ctx) {
    var A = answers || {}; ctx = ctx || {};
    var qs = questions(ctx, A);
    var missing = qs.filter(function(q) { return !isAnswered(q, A[q.id], ctx, A); }).map(function(q) { return q.id; });
    var ok = function(id) { var q = question(id); return isAnswered(q, A[id], ctx, A); };
    var dob = ctx.dob || A.dob, age = dob && validDob(dob, ctx.atDate) ? ageAt(dob, ctx.atDate) : null;

    var res = { complete: missing.length === 0, missing: missing, answered: qs.length - missing.length, total: qs.length, age: age,
                rated: false, sri: null, sriLabel: '', capacity: null, horizon: null, attitude: null, limits: null,
                knowledge: null, flags: [], sustainability: null, changed: [] };

    // Capacity for loss = Q1 + Q2 points: Low (2–3), Medium (4), High (5–6)
    if (ok('cushion') && ok('impact')) {
      var pts = option(question('cushion'), A.cushion).points + option(question('impact'), A.impact).points;
      var cl = pts >= CFG.capacity.high ? 'HIGH' : pts >= CFG.capacity.medium ? 'MEDIUM' : 'LOW';
      res.capacity = { points: pts, level: cl, label: CFG.levels.capacity[cl] };
    }
    // Time limit from Q3 (null = no limit)
    if (ok('horizon')) { var ho = option(question('horizon'), A.horizon); res.horizon = { cap: ho.cap, term: ho.term }; }
    // Attitude: the middle of the Q4, Q5 and Q6 ratings, and no more than one level above Q4
    if (ok('loss') && ok('reaction') && ok('objective')) {
      var lr = lossBand(A.loss).rating, rr = option(question('reaction'), A.reaction).rating, orr = option(question('objective'), A.objective).rating;
      var mid = median3(lr, rr, orr);
      res.attitude = { lossPct: A.loss, loss: lr, reaction: rr, objective: orr, median: mid, rating: Math.min(mid, lr + CFG.attitude.aboveLoss),
                       spread: Math.max(lr, rr, orr) - Math.min(lr, rr, orr) };
    }
    // The risk rating: the lower of the attitude and the limits
    if (res.capacity && res.horizon && res.attitude) {
      var att = res.attitude.rating, timeCap = res.horizon.cap, capCap = res.capacity.level === 'LOW' ? CFG.capacity.lowCap : null;
      var caps = [timeCap, capCap].filter(function(c) { return c != null; });
      var ceiling = caps.length ? Math.min.apply(null, caps) : null;
      var sri = Math.min(att, ceiling != null ? ceiling : CFG.maxRating, CFG.maxRating);
      res.limits = { time: timeCap, capacity: capCap, ceiling: ceiling,
                     timeApplied: timeCap != null && timeCap < att, capacityApplied: capCap != null && capCap < att };
      res.rated = true; res.sri = sri; res.sriLabel = CFG.sriLabels[sri];
    }
    // Knowledge: from Q7, one level lower if Q8 is wrong or "I don't know"
    if (ok('experience') && ok('check')) {
      var stated = option(question('experience'), A.experience).level, ck = A.check, cq = question('check');
      var check = ck.dontKnow ? 'dontknow' : cq.items.every(function(it, i) { return ck.order[i] === it.id; }) ? 'right' : 'wrong';
      var kl = check === 'right' ? stated : lower(stated);
      res.knowledge = { stated: stated, check: check, level: kl, label: CFG.levels.knowledge[kl].label, desc: CFG.levels.knowledge[kl].desc };
    }
    // Sustainability preferences, as recorded (they do not change the rating)
    if (ok('s1')) {
      var s2 = A.s1 === 'yes' && Array.isArray(A.s2) ? A.s2 : [], s3q = question('s3');
      var shares = {};
      if (A.s1 === 'yes') shareRows(s3q, A).forEach(function(r) { if (A.s3 && option(s3q, A.s3[r.id])) shares[r.id] = +A.s3[r.id]; });
      res.sustainability = { preference: A.s1, general: s2.indexOf('general') >= 0,
                             types: s2.filter(function(id) { return id !== 'general'; }), shares: shares,
                             effects: A.s1 === 'yes' && s2.indexOf('pai') >= 0 && Array.isArray(A.s4) ? A.s4.slice() : [] };
    }
    // F6: scored answers that differ from those held when the result was first shown
    if (ctx.seen) {
      res.changed = CFG.questions.filter(function(q) {
        return q.scored && JSON.stringify(ctx.seen[q.id]) !== JSON.stringify(A[q.id]);
      }).map(function(q) { return q.id; });
    }
    res.flags = flags(res);
    return res;
  }

  // ─── Checks and flags (shown to the adviser, recorded; they never block) ─────────────
  function flags(r) {
    var F = CFG.flags, out = [];
    function add(id, vals) { out.push({ id: id, title: F.text[id].title, text: fill(F.text[id].text, vals) }); }
    var a = r.attitude, sri = r.sri;
    if (a && a.spread >= F.mixedSpread) add('F1', { loss: a.loss, reaction: a.reaction, objective: a.objective, spread: a.spread });
    if (r.rated && r.knowledge && sri >= F.knowledgeRating && r.knowledge.level === 'LOW') add('F2', { sri: sri });
    if (r.rated && r.limits.capacityApplied) add('F3', { capacityCap: r.limits.capacity, attitude: a.rating });
    if (r.rated && r.horizon.cap != null && (r.limits.timeApplied || sri > F.horizonRating)) {
      add('F4', { horizon: r.horizon.term, horizonEffect: r.limits.timeApplied ? fill(F.horizonLowered, { timeCap: r.horizon.cap, attitude: a.rating }) : fill(F.horizonShort, { sri: sri }) });
    }
    if (r.rated && r.age != null && r.age >= F.age && sri >= F.ageRating) add('F5', { age: r.age, sri: sri });
    if (r.changed.length) add('F6', { changed: list(r.changed.map(function(id) { var q = question(id); return 'Q' + q.num + ' ' + q.short.toLowerCase(); })) });
    return out;
  }

  // ─── Readable answers ────────────────────────────────────────────────────────────────
  function fmtDob(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  // The answer to one question as lines of text
  function answerLines(q, a, answers) {
    if (q.type === 'date') return [fmtDob(a)];
    if (q.type === 'single') return [option(q, a).label];
    if (q.type === 'slider') return [a <= 0 ? q.minLabel : lossText(a).replace(/^./, function(c) { return c.toUpperCase(); })];
    if (q.type === 'rank') return a.dontKnow ? [q.dontKnow] : a.order.map(function(id, i) { return (i + 1) + '. ' + item(q, id).label; });
    if (q.type === 'multi') return a.map(function(id) { return option(q, id).label; });
    if (q.type === 'shares') return shareRows(q, answers).map(function(r) { return r.label.slice(0, 2) + ' ' + option(q, a[r.id]).label; });
    return [];
  }
  // [{ id, title, rows: [{ id, num, q, a: [lines] }] }] for the answered questions, in questionnaire order
  function summary(answers, ctx) {
    answers = answers || {}; ctx = ctx || {};
    var out = [];
    CFG.sections.forEach(function(s) {
      var rows = [];
      questions(ctx, answers).forEach(function(q) {
        if (q.section !== s.id || !isAnswered(q, answers[q.id], ctx, answers)) return;
        rows.push({ id: q.id, num: q.num, q: q.text, a: answerLines(q, answers[q.id], answers) });
      });
      if (rows.length) out.push({ id: s.id, title: s.title, rows: rows });
    });
    return out;
  }

  // ─── Sentences for a suitability statement ──────────────────────────────────────────
  function phraseOf(qid, answers) {
    var q = question(qid), o = q && answers ? option(q, answers[qid]) : null;
    return o && o.phrase ? o.phrase : '';
  }
  // opts: { suggestedSri, chosenSri, overrideReason } to add the adviser's lower rating
  function narrative(answers, ctx, result, opts) {
    answers = answers || {}; opts = opts || {};
    var T = CFG.text;
    var out = { circumstances: '', risk: '', experience: '', override: '', sustainability: '' };
    out.circumstances = ['cushion', 'impact', 'horizon'].map(function(id) { return phraseOf(id, answers); }).filter(Boolean).join(' ');
    if (!result || !result.rated) return out;
    var r = result, a = r.attitude, risk = [fill(T.riskSentence, {
      loss: a.lossPct > 0 ? fill(T.lossSome, { lossText: lossText(a.lossPct) }) : T.lossNone, reaction: phraseOf('reaction', answers), objective: phraseOf('objective', answers),
      attitude: a.rating, attitudeLabel: CFG.sriLabels[a.rating], capacity: r.capacity.label.toLowerCase()
    })];
    // The limit that sets the rating (both, when they are the same)
    if (r.limits.timeApplied && r.limits.time === r.limits.ceiling) risk.push(fill(T.timeCapSentence, { horizon: r.horizon.term, cap: r.limits.time }));
    if (r.limits.capacityApplied && r.limits.capacity === r.limits.ceiling) risk.push(fill(T.capacityCapSentence, { cap: r.limits.capacity }));
    risk.push(fill(T.ratingSentence, { sri: r.sri, sriLabel: r.sriLabel }));
    out.risk = risk.join(' ');
    if (r.knowledge) out.experience = fill(T.knowledgeSentence, { level: r.knowledge.label.toLowerCase() });
    if (opts.suggestedSri && opts.chosenSri && opts.chosenSri < opts.suggestedSri) {
      out.override = fill(T.overrideSentence, { suggested: opts.suggestedSri, chosen: opts.chosenSri, reason: String(opts.overrideReason || '').trim() });
    }
    var s = r.sustainability;
    if (s) {
      if (s.preference === 'no') out.sustainability = T.sustainNo;
      else if (s.general) out.sustainability = T.sustainGeneral;
      else if (s.types.length) {
        var s2 = question('s2'), s4 = question('s4');
        var types = s.types.map(function(id) { return option(s2, id).short + (s.shares[id] ? ' (at least ' + s.shares[id] + '% of your investment)' : ''); });
        out.sustainability = fill(T.sustainTypes, { types: list(types) });
        if (s.effects.length) out.sustainability += ' ' + fill(T.sustainEffects, { effects: list(s.effects.map(function(id) { return option(s4, id).short; })) });
      }
    }
    return out;
  }

  return {
    config: CFG, questions: questions, question: question, option: option, applies: applies, shareRows: shareRows,
    isAnswered: isAnswered, evaluate: evaluate, summary: summary, narrative: narrative, lossBand: lossBand, lossText: lossText,
    ageAt: ageAt, fmtDob: fmtDob
  };
});
