// Runs the ten worked test cases (tests/risk_profiler_cases.js) through the Risk Profiler engine and writes
// docs/risk-profiler-test-cases.md, then Risk-Profiler-Test-Cases.docx with docs/build_risk_profiler_docx.py.
// Every number in the document comes from the engine. It stops if a case's result is not the one its
// reasoning was written for. Aviva and Zurich results for cases 1–8 come from tests/out/compare_profilers.json.
//
// Run:  node tests/build_risk_profiler_cases.js
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const RP = require(path.join(__dirname, '..', 'js', 'risk_profiler.js'));
const { CASES, AT } = require('./risk_profiler_cases.js');
const CFG = RP.config, DOCS = path.join(__dirname, '..', 'docs');
const MD = path.join(DOCS, 'risk-profiler-test-cases.md'), DOCX = path.join(DOCS, 'Risk-Profiler-Test-Cases.docx');

let comp = null;
try { comp = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'compare_profilers.json'), 'utf8')); } catch (e) { /* competitors left out */ }
function competitors(k) {
  if (!comp) return null;
  const i = comp.cases.findIndex((x) => sameAnswers(x, k));
  if (i < 0) return null;
  const av = comp.aviva[i].level;
  return { aviva: av === 0 ? '0 (deposit-type only)' : String(av), zurich: String(comp.zurich[i].profile) };
}
function sameAnswers(x, k) {
  return ['cushion', 'impact', 'horizon', 'loss', 'reaction', 'objective', 'experience'].every((f) => x[f] === k.answers[f]) && x.age === k.age;
}

const flagTitle = (id) => id + ' ' + CFG.flags.text[id].title;
const capWord = (lvl) => CFG.levels.capacity[lvl];
const knowWord = (lvl) => CFG.levels.knowledge[lvl].label;
const checkWord = { right: 'right', wrong: 'wrong', dontknow: '"I don\'t know"' };
const checkEffect = { right: 'Right: one level up', wrong: 'Wrong: one level down', dontknow: 'Counts as wrong: one level down' };
const pts = (n) => n + (n === 1 ? ' point' : ' points');

function run(k) {
  const r = RP.evaluate(k.answers, { dob: k.dob, atDate: AT });
  const got = { sri: r.sri, attitude: r.attitude.rating, capacity: r.capacity.level, knowledge: r.knowledge.level, flags: r.flags.map((f) => f.id) };
  if (JSON.stringify(got) !== JSON.stringify(k.expect)) {
    console.error('Case ' + k.id + ' (' + k.name + ') gives ' + JSON.stringify(got) + ', but its reasoning was written for ' + JSON.stringify(k.expect));
    process.exit(1);
  }
  if (!r.complete) { console.error('Case ' + k.id + ' is incomplete: ' + r.missing.join(', ')); process.exit(1); }
  return r;
}

// The answers, with what each one scores
function answerRows(k, r) {
  const A = k.answers, q = RP.question, opt = (id) => RP.option(q(id), A[id]);
  const rows = {};
  RP.summary(A, { dob: k.dob, atDate: AT }).forEach((s) => s.rows.forEach((x) => { rows[x.id] = x.a.join('<br>'); }));
  const hz = RP.band('horizon', A.horizon);
  return [
    ['Q1 Financial cushion', rows.cushion, pts(opt('cushion').points)],
    ['Q2 Impact of a loss', rows.impact, pts(opt('impact').points)],
    ['Q3 Investment horizon', rows.horizon, hz.cap == null ? 'No limit' : 'Limit ' + hz.cap],
    ['Q4 Largest fall you could accept', rows.loss, 'Rating ' + r.attitude.loss],
    ['Q5 Reaction to a fall', rows.reaction, 'Rating ' + r.attitude.reaction],
    ['Q6 Objective', rows.objective, 'Rating ' + r.attitude.objective],
    ['Q7 Knowledge and experience', rows.experience, knowWord(r.knowledge.stated) + ' stated'],
    ['Q8 Knowledge check', A.check.dontKnow ? 'I don\'t know' : r.knowledge.check === 'right' ? 'Right order' : 'Wrong order', checkEffect[r.knowledge.check]],
    ['Age', String(r.age), '–']
  ];
}
function cap(s) { return s.replace(/^"?./, (m) => m.toUpperCase()); }

// How the engine worked it out
function workingRows(k, r) {
  const a = r.attitude, L = r.limits, top = a.loss + CFG.attitude.aboveLoss;
  const limits = [];
  if (L.time != null) limits.push('time ' + L.time + (L.timeApplied ? ' (applies)' : ' (does not bite)'));
  if (L.capacity != null) limits.push('capacity ' + L.capacity + (L.capacityApplied ? ' (applies)' : ' (does not bite)'));
  const rows = [
    ['Capacity for loss', 'Q1 + Q2 = ' + pts(r.capacity.points), capWord(r.capacity.level)],
    ['Attitude', 'Middle of ' + a.loss + ', ' + a.reaction + ', ' + a.objective + ' is ' + a.median + '; no more than Q4 + 1 = ' + top + (top > CFG.maxRating ? ' (above the top rating, ' + CFG.maxRating + ')' : ''), String(a.rating)],
    ['Limits', limits.length ? cap(limits.join('; ')) : 'None: 5 years or more, and capacity not Low', L.ceiling == null ? 'None' : L.timeApplied || L.capacityApplied ? 'Capped at ' + L.ceiling : L.ceiling + ' (not reached)'],
    ['Risk rating', 'Lower of the attitude and the limits', '**' + r.sri + ' (' + r.sriLabel + ')**'],
    ['Knowledge', knowWord(r.knowledge.stated) + ' stated; Q8 ' + checkWord[r.knowledge.check], knowWord(r.knowledge.level)],
    ['Flags', 'Shown to the adviser; they do not change the rating', r.flags.length ? r.flags.map((f) => f.id + ' ' + f.title).join('<br>') : 'None']
  ];
  const c = competitors(k);
  if (c) rows.push(['Aviva / Zurich', 'Same client in their tools (28/10/2026)', c.aviva + ' / ' + c.zurich]);
  return rows;
}

const table = (head, rows) => ['| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|'].concat(rows.map((x) => '| ' + x.join(' | ') + ' |'));

const results = CASES.map((k) => ({ k, r: run(k) }));
const out = [];
out.push('# Risk profiler: ten worked test cases', '');
out.push('Ten example clients run through the risk profiler, with the answers each gives, how the tool works out the rating, and why that rating suits the client. Draft for Compliance review. Questionnaire version ' + CFG.version + '; ages and results as at ' + AT.split('-').reverse().join('/') + ', the date of the Aviva and Zurich comparison.', '');
out.push('_Generated alongside `Risk-Profiler-Test-Cases.docx` by `tests/build_risk_profiler_cases.js`; edit the cases in `tests/risk_profiler_cases.js`, then rebuild._', '');

out.push('## Summary', '');
out.push('The cases are chosen so that every rule in the tool decides at least one of them, and every rating from 1 to 6 appears. Each result below is produced by the tool itself. The same ten cases are checked by the automated test, so if a rule changes, the test fails until this document is updated.', '');
out.push(...table(['Case', 'Client', 'Age', 'Rating', 'Flags', 'What it shows'], results.map(({ k, r }) =>
  [String(k.id), k.name, String(k.age), r.sri + ' (' + r.sriLabel + ')', r.flags.length ? r.flags.map((f) => f.id).join(', ') : '–', k.shows])), '');

out.push('## How the rating is worked out', '');
out.push(...table(['Step', 'Rule'], [
  ['1. Attitude', 'The middle of the Q4, Q5 and Q6 ratings, and no more than one level above the loss answer (Q4)'],
  ['2. Limits', 'Under 3 years: no more than 3. 3 to under 5 years: no more than 4. Low capacity for loss (Q1 + Q2 = 2 or 3 points): no more than 4'],
  ['3. Rating', 'The lower of the attitude and the limits, from 1 to 6. The adviser may lower or raise it, with a recorded reason'],
  ['Flags', 'F1 mixed attitude, F2 low knowledge with rating 5+, F3 capacity limit, F4 short horizon, F5 age 65+ with rating 5+, F6 answers changed. Flags never change the rating']
]), '');
out.push('A "bad year" below is a fall of twice a fund\'s volatility, about 1 year in 40, taken at the middle of the ESMA band for each rating: about 2.5% for rating 2, 7% for 3, 15% for 4, 25% for 5 and 40% for 6 (Proposal, Appendix B). These are the marks on the Q4 slider. So a client\'s Q4 answer can be read directly against the funds a rating allows.', '');

out.push('## The cases', '');
results.forEach(({ k, r }) => {
  out.push('### Case ' + k.id + '. ' + k.name + ': rating ' + r.sri, '');
  out.push(k.story, '');
  out.push(...table(['Question', 'Answer', 'Scores'], answerRows(k, r)), '');
  out.push(...table(['Step', 'Working', 'Result'], workingRows(k, r)), '');
  k.why.forEach(([label, text]) => out.push('> **' + label + ':** ' + text));
  out.push('');
});

out.push('## What the cases show', '');
out.push(
  '- **The rating follows the client\'s own attitude:** Cases 3, 5, 7, 9 and 10 have no limit that applies, and the rating is the level the client\'s answers point to, with the Q4 fall they accept in line with a bad year for that rating.',
  '- **Losses the client cannot bear are kept out:** Low capacity (case 4) and a short horizon (case 6) hold an adventurous client down, and the client is told why. Aviva and Zurich do not do this for case 4, and do it only in part for case 6.',
  '- **Wishes do not outweigh figures:** A client who wants the highest return but will accept only a small loss is rated on the loss (case 8).',
  '- **Capacity never pushes a client up:** A wealthy client who does not want risk stays at 1 (case 5).',
  '- **Age and knowledge prompt the adviser, not the tool:** They raise flags (cases 7 and 9) and leave the decision with the adviser, who has the fact find.',
  '- **Every flag that affects a rating appears at least once:** F1 (case 8), F2 (case 9), F3 (case 4), F4 (cases 1 and 6) and F5 (case 7). F6 (changed answers) is about the record rather than the rating; the automated test covers it.',
  '');
out.push('## Limits of these cases', '');
out.push(
  '- **Chosen, not random:** The cases show each rule working. The 50-client comparison with Aviva and Zurich in the Proposal is the wider test, and the automated test checks every combination of answers against the written rules.',
  '- **One pattern is still open:** A client who would sell everything after a 20% fall but accepts a large loss on Q4 and wants strong growth is rated on the other two answers, for example 5 (clients 9 and 37 in the comparison). F1 flags it for the adviser, but whether "sell everything" should limit the rating is decision 2 for Compliance.',
  '- **Bad-year figures are a model:** Real markets can fall further. The Q4 marks should be tested against our funds\' worst 12-month falls and KID stress scenarios before sign-off.',
  '');

fs.writeFileSync(MD, out.join('\n'));
console.log('wrote', MD);
const py = spawnSync('python', [path.join(DOCS, 'build_risk_profiler_docx.py'), MD, DOCX], { stdio: 'inherit' });
if (py.status !== 0) { console.error('Word build failed (needs python with python-docx)'); process.exit(1); }
