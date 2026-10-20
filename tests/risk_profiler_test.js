// Checks the Risk Profiler engine against the rules in docs/risk-profiler-design-draft.md (draft 19/10/2026).
//
// DRAFT below is an independent transcription of the draft's "How the rating is worked out" and section 3
// (flags), written from the document's tables rather than from the engine's data. The test walks every
// combination of the scored answers (with Q4 at each band's edges) through both and requires the same
// rating, capacity, attitude, limits and flags. Then knowledge, completeness, sustainability, the written
// outputs, and the draft's own test clients (Appendix A) where their answers can be read from the description.
//
// Run:  node tests/risk_profiler_test.js
const path = require('path');
const RP = require(path.join(__dirname, '..', 'js', 'risk_profiler.js'));

let fails = 0, checks = 0;
function eq(actual, expected, msg) {
  checks++;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) { fails++; if (fails < 40) console.log('  FAIL', msg, '\n    expected', JSON.stringify(expected), '\n    got     ', JSON.stringify(actual)); }
}

// ─── The draft's rules, transcribed ──────────────────────────────────────────────────
const Q1 = { '12plus': 3, '3to11': 2, under3: 1 };                          // points
const Q2 = { big: 1, some: 2, little: 3 };                                   // points
const Q3 = { under1: 1, '1to3': 2, '3to5': 4, '5plus': null };               // highest rating allowed
const Q4 = (v) => (v < 2.5 ? 1 : v < 7 ? 2 : v < 15 ? 3 : v < 25 ? 4 : v < 40 ? 5 : 6);
const Q5 = { sellall: 2, sellpart: 3, wait: 4, investmore: 6 };
const Q6 = { safe: 1, deposit: 2, inflation: 3, steady: 4, strong: 5, highest: 6 };
function DRAFT(a, age) {
  const pts = Q1[a.cushion] + Q2[a.impact];
  const capacity = pts <= 3 ? 'LOW' : pts === 4 ? 'MEDIUM' : 'HIGH';
  const r = [Q4(a.loss), Q5[a.reaction], Q6[a.objective]];
  const middle = r.slice().sort((x, y) => x - y)[1];
  const attitude = Math.min(middle, r[0] + 1);
  const timeLimit = Q3[a.horizon], capLimit = capacity === 'LOW' ? 4 : null;
  let rating = attitude;
  if (timeLimit != null) rating = Math.min(rating, timeLimit);
  if (capLimit != null) rating = Math.min(rating, capLimit);
  const flags = [];
  if (Math.max(...r) - Math.min(...r) >= 3) flags.push('F1');
  if (capacity === 'LOW' && attitude > 4) flags.push('F3');
  if ((timeLimit != null && timeLimit < attitude) || (timeLimit != null && rating > 3)) flags.push('F4');
  if (age != null && age >= 65 && rating >= 5) flags.push('F5');
  return { rating, capacity, attitude, flags };
}

const AT = '2026-10-20';
const ctx40 = { dob: '1986-06-15', atDate: AT };       // aged 40: no age flag
const KNOW = { experience: 'regular', check: { order: ['deposit', 'govbonds', 'fund', 'share'] } };   // High, right
const NOSUS = { s1: 'no' };

// 1. Every combination of the scored answers
const lossValues = [0, 2, 2.5, 6.5, 7, 14.5, 15, 24.5, 25, 39.5, 40];
let n = 0;
for (const cushion of Object.keys(Q1)) for (const impact of Object.keys(Q2)) for (const horizon of Object.keys(Q3))
for (const loss of lossValues) for (const reaction of Object.keys(Q5)) for (const objective of Object.keys(Q6)) {
  const a = Object.assign({ cushion, impact, horizon, loss, reaction, objective }, KNOW, NOSUS);
  for (const [c, age] of [[ctx40, 40], [{ dob: '1956-01-01', atDate: AT }, 70]]) {
    const r = RP.evaluate(a, c), d = DRAFT(a, age);
    const got = { rating: r.sri, capacity: r.capacity.level, attitude: r.attitude.rating, flags: r.flags.map((f) => f.id) };
    eq(got, d, 'combination ' + JSON.stringify(a) + ' age ' + age);
    n++;
  }
}
console.log('  ' + n + ' answer combinations compared with the draft');

const base = Object.assign({ cushion: '12plus', impact: 'little', horizon: '5plus', loss: 15, reaction: 'wait', objective: 'steady' }, KNOW, NOSUS);
const ev = (o, c) => RP.evaluate(Object.assign({}, base, o), c || ctx40);
let r;

// 2. Ratings never exceed 6, and are always at least 1
eq(ev({ loss: 40, reaction: 'investmore', objective: 'highest' }).sri, 6, 'the highest answers give 6 (7 is not offered)');
eq(ev({ loss: 0, reaction: 'sellall', objective: 'safe' }).sri, 1, 'the lowest answers give 1');

// 3. Q4 bands: a value between two marks scores the lower band
eq([0, 2.4, 2.5, 6.9, 7, 14.9, 15, 24.9, 25, 39.9, 40].map((v) => RP.lossBand(v).rating), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], 'Q4 bands');

// 4. Knowledge: from Q7, one level lower if Q8 is wrong or "I don't know"
const kn = (exp, check) => ev({ experience: exp, check }).knowledge;
const right = { order: ['deposit', 'govbonds', 'fund', 'share'] }, wrong = { order: ['deposit', 'fund', 'govbonds', 'share'] };
eq([kn('regular', right).level, kn('regular', wrong).level, kn('regular', { dontKnow: true }).level], ['HIGH', 'MEDIUM', 'MEDIUM'], 'High stated: right stays High, wrong or don\'t know is Medium');
eq([kn('recent', right).level, kn('recent', wrong).level], ['MEDIUM', 'LOW'], 'Medium stated');
eq([kn('none', right).level, kn('passive', wrong).level], ['LOW', 'LOW'], 'Low stays Low');
eq(kn('professional', { order: wrong.order, dontKnow: true }).check, 'dontknow', '"I don\'t know" counts even with an order left from before');
eq(ev({ experience: 'recent', check: { order: ['fund', 'share', 'deposit', 'govbonds'] } }).knowledge.check, 'wrong', 'the starting order is wrong');
// F2: rating 5 or more with knowledge Low
eq(ev({ loss: 25, objective: 'strong', reaction: 'investmore', experience: 'none' }).flags.map((f) => f.id), ['F2'], 'F2 knowledge flag at rating 5 with Low knowledge');
eq(ev({ experience: 'none' }).flags.map((f) => f.id), [], 'no F2 at rating 4');
// Knowledge never changes the rating
eq(ev({ experience: 'none', check: { dontKnow: true } }).sri, ev({}).sri, 'knowledge does not change the rating');

// 5. F5 age flag, at 65 (inclusive), and age does not change the rating
const hi = { loss: 25, reaction: 'investmore', objective: 'strong' };
eq(ev(hi, { dob: '1961-10-20', atDate: AT }).flags.map((f) => f.id), ['F5'], 'F5 on the 65th birthday with rating 5');
eq(ev(hi, { dob: '1961-10-21', atDate: AT }).flags.map((f) => f.id), [], 'no F5 the day before');
eq(ev(hi, { dob: '1931-01-01', atDate: AT }).sri, 5, 'age does not change the rating');

// 6. F6: scored answers changed after the result was shown
r = ev({ loss: 25 }, Object.assign({ seen: Object.assign({}, base) }, ctx40));
eq([r.changed, r.flags.map((f) => f.id)], [['loss'], ['F6']], 'F6 names the changed answer');
eq(/Q4 largest fall you could accept/.test(r.flags[0].text), true, 'F6 text');
r = ev({ s1: 'yes', s2: ['general'] }, Object.assign({ seen: Object.assign({}, base) }, ctx40));
eq(r.changed, [], 'sustainability answers are not checked for changes');
eq(ev({}, Object.assign({ seen: JSON.parse(JSON.stringify(base)) }, ctx40)).changed, [], 'unchanged answers: no F6');

// 7. Completeness and the conditional sustainability questions
r = RP.evaluate({}, ctx40);
eq([r.complete, r.rated, r.answered, r.total, r.sri], [false, false, 0, 9, null], 'nothing answered: 9 questions (date of birth supplied)');
eq(RP.evaluate({}, { atDate: AT }).total, 10, 'the date of birth is asked when the host does not supply it');
r = ev({ s1: undefined });
eq([r.complete, r.rated, r.sri, r.missing], [false, true, 4, ['s1']], 'the rating is set before the sustainability questions are answered');
r = ev({ s1: 'yes' });
eq([r.complete, r.total, r.missing], [false, 10, ['s2']], 'S1 yes asks S2');
r = ev({ s1: 'yes', s2: ['general'] });
eq([r.complete, r.total], [true, 10], 'a general preference ends the questions');
r = ev({ s1: 'yes', s2: ['taxonomy', 'pai'] });
eq([r.complete, r.missing], [false, ['s3', 's4']], 'A asks S3, C asks S4');
r = ev({ s1: 'yes', s2: ['taxonomy', 'sustainable'], s3: { taxonomy: '10' } });
eq([r.complete, r.missing], [false, ['s3']], 'S3 needs a share for each of A and B');
r = ev({ s1: 'yes', s2: ['taxonomy', 'sustainable', 'pai'], s3: { taxonomy: '10', sustainable: '30' }, s4: ['ghg'] });
eq([r.complete, r.sustainability], [true, { preference: 'yes', general: false, types: ['taxonomy', 'sustainable', 'pai'], shares: { taxonomy: 10, sustainable: 30 }, effects: ['ghg'] }], 'sustainability recorded');
r = ev({ s1: 'no', s2: ['pai'], s4: ['ghg'] });
eq([r.complete, r.total, r.sustainability.effects], [true, 9, []], 'answers left over from "Yes" are ignored after "No"');
eq(ev({ s1: 'yes', s2: ['taxonomy', 'pai'], s3: { taxonomy: '50' }, s4: ['social'] }).sri, ev({}).sri, 'sustainability does not change the rating');
eq(ev({ loss: -1 }).missing, ['loss'], 'a slider value out of range is not an answer');
eq(ev({ check: { order: ['deposit'] } }).missing, ['check'], 'an incomplete order is not an answer');

// 8. The draft's test clients (Appendix A), with the answers their descriptions give
const P = (o, c) => ev(o, c);
r = P({ cushion: '12plus', impact: 'little', horizon: '3to5', loss: 2, reaction: 'sellall', objective: 'safe' }, { dob: '1954-03-01', atDate: AT });
eq([r.sri, r.capacity.label], [1, 'High'], 'P1 retired, 72, 4 years, about 2%: 1, capacity High');
r = P({ cushion: 'under3', impact: 'big', horizon: '5plus', loss: 40, reaction: 'investmore', objective: 'highest' }, { dob: '2001-05-01', atDate: AT });
eq([r.sri, r.capacity.label, r.flags.map((f) => f.id)], [4, 'Low', ['F3']], 'P7 keen, no savings, relies on the money: 4, capacity Low, capacity limit');
r = P({ horizon: '3to5', loss: 25, reaction: 'wait', objective: 'strong' }, { dob: '1971-01-01', atDate: AT });
eq([r.sri, r.flags.map((f) => f.id)], [4, ['F4']], 'P8 growth attitude, needs the money in 3 years: 4, short horizon');
r = P({ cushion: '3to11', impact: 'some', loss: 7, reaction: 'wait', objective: 'steady' });
eq([r.sri, r.capacity.label], [4, 'Medium'], 'P10 first-time investor, 20 years, about 7%: 4 (one above the loss answer)');
r = P({ cushion: '3to11', impact: 'some', loss: 7, reaction: 'wait', objective: 'inflation' });
eq(r.sri, 3, 'P10 choosing the new level-3 objective: 3, as the draft notes');
r = P({ cushion: '3to11', impact: 'some', horizon: '1to3', loss: 7, reaction: 'wait', objective: 'deposit' }, { dob: '1959-01-01', atDate: AT });
eq([r.sri, r.flags.map((f) => f.id)], [2, ['F4']], 'P13 drawing income in 2 years, about 7%: 2, short horizon');
r = P({ horizon: '3to5', loss: 40, reaction: 'investmore', objective: 'highest' });
eq([r.sri, r.flags.map((f) => f.id)], [4, ['F4']], 'P17 adventurous, needs the money in 4 years: 4, short horizon');
r = P({ loss: 2.5, reaction: 'investmore', objective: 'highest' });
eq([r.sri, r.flags.map((f) => f.id)], [3, ['F1']], 'P18 accepts only 2.5% but wants maximum return: 3 (anchored on the loss answer), mixed attitude');

// 9. Written outputs
const full = Object.assign({}, base, { horizon: '3to5', loss: 40, reaction: 'investmore', objective: 'highest', s1: 'yes', s2: ['sustainable', 'pai'], s3: { sustainable: '20' }, s4: ['ghg'] });
r = RP.evaluate(full, ctx40);
const nr = RP.narrative(full, ctx40, r, { suggestedSri: 4, chosenSri: 3, overrideReason: 'Wants to keep part in cash.' });
eq(/12 months or more/.test(nr.circumstances) && /between 3 and 5 years/.test(nr.circumstances), true, 'circumstances come from Q1 to Q3');
eq(/40% or more \(€4,000 or more on €10,000\)/.test(nr.risk) && /keep it and invest more/.test(nr.risk) && /attitude to risk of 6 \(High\)/.test(nr.risk), true, 'risk sentence quotes the attitude answers');
eq(/limited to 4\. This gives a risk rating of 4 \(Medium\)\./.test(nr.risk), true, 'risk sentence tells the client the limit');
eq(nr.experience, 'Your investment knowledge and experience was assessed as high.', 'knowledge sentence');
eq(/lower risk rating of 3 because: Wants to keep part in cash\./.test(nr.override), true, 'override sentence');
eq(RP.narrative(full, ctx40, r, { suggestedSri: 4, chosenSri: 5 }).override, '', 'no override sentence for a higher rating');
eq(/sustainable investments as defined in EU rules \(at least 20% of your investment\)/.test(nr.sustainability) && /greenhouse gas/.test(nr.sustainability), true, 'sustainability sentence');
eq(/could not accept any fall/.test(RP.narrative(Object.assign({}, base, { loss: 0 }), ctx40, ev({ loss: 0 })).risk), true, 'no fall accepted');
eq(RP.narrative(base, ctx40, ev({})).sustainability, RP.config.text.sustainNo, 'no sustainability preferences');
const sum = RP.summary(full, ctx40);
eq(sum.map((s) => s.title), ['Your finances', 'Your timing', 'Your attitude to risk', 'Your knowledge and experience', 'Your sustainability preferences'], 'summary sections (no date of birth when supplied)');
eq(sum[2].rows[0].a, ['40% or more (€4,000 or more on €10,000)'], 'slider answer in the summary');
eq(sum[3].rows[1].a, ['1. A savings deposit', '2. Government bonds', '3. A fund holding shares in many different companies', '4. Shares in a single company'], 'ranking answer in the summary');
eq(sum[4].rows.map((x) => x.num), ['S1', 'S2', 'S3', 'S4'], 'all four sustainability questions recorded');

console.log(fails ? fails + ' of ' + checks + ' check(s) FAILED' : 'risk profiler engine: all ' + checks + ' checks passed');
process.exit(fails ? 1 : 0);
