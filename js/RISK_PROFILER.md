# Risk Profiler module

A self-contained client risk questionnaire. It sets a risk rating from 1 to 6 on the ESMA scale (level 7 is not
offered), works out the client's capacity for loss and knowledge level, raises flags for the adviser and records
the client's sustainability preferences. It is used by the Quotation Tool (Step 3) and also runs on its own: open
`risk_profiler.html`.

Source: `docs/risk-profiler-design-draft.md` ("Risk profiler – proposed questions and scoring", draft for
Compliance review, 22/10/2026). The questions, answers, scores, limits and flags are the draft's. Every cut-off
in it is a proposal, so change the numbers in `risk_profiler_data.js` only with Compliance.

## How the answers become a rating

| Part | # | Question | Used for |
|---|---|---|---|
| Your finances | Q1 | Financial cushion | Capacity for loss (3, 2 or 1 points) |
|  | Q2 | Impact of a loss | Capacity for loss (1, 2 or 3 points) |
| Your timing | Q3 | Investment horizon (slider, whole years 0–12) | Time limit: under 3 years 3, 3 to under 7 years 5, 7 or more none |
| Your attitude to risk | Q4 | Largest 12-month fall you could accept (slider, 0–40% in 0.5% steps) | Rating 1–6 by band |
|  | Q5 | What you would do after a 20% fall | Rating 2, 3, 5 or 6 |
|  | Q6 | What you want from the investment | Rating 1–6 |
| Your knowledge and experience | Q7 | Knowledge and experience | Knowledge level stated |
|  | Q8 | Rank four investments by risk | Right, wrong or "I don't know" |
| About you | – | Date of birth (not asked when the host supplies it) | Age flag |
| Your sustainability preferences | S1–S4 | **Switched off for now** (`sustainability: false` in the data file). When on: asked after the rating; S2–S4 only when they apply | Recorded only |

1. **Attitude:** the middle value of the Q4, Q5 and Q6 ratings, and no more than one level above Q4.
2. **Limits:** the time limit from Q3. Capacity for loss = Q1 + Q2 points: Low (2–3), Medium (4), High (5–6).
   Low capacity allows no more than 4.
3. **Risk rating:** the lower of the attitude and the limits. The rating is set (`result.rated`) once Q1–Q6 are
   answered; `result.complete` also needs the knowledge, date of birth and sustainability questions.
4. **Knowledge level:** from Q7, one level higher if Q8 is right (High stays High), one level lower if Q8 is wrong or "I don't know". It does not change the rating.
5. **Important information:** after the introduction and before Q1 the client must choose "I accept". "I do not accept" shows a stop message with a way back. The time of acceptance is in `state.accepted` (pass it back as `accepted` when mounting) and in the pack's Risk profile section.

Q3 bands: under 3 years is capped at 3, 3 to under 7 years at 5, 7 or more has no cap.

Q4 bands: under 2.5% is 1, under 7% is 2, under 15% is 3, under 25% is 4, under 40% is 5, 40% or more is 6. A value
between two marks scores the lower band.

### Flags (shown to the adviser and recorded; they never block)

| Flag | Raised when |
|---|---|
| F1 Mixed attitude | The Q4, Q5 and Q6 ratings are 3 or more apart |
| F2 Knowledge | Rating 5 or more and knowledge Low |
| F3 Capacity limit | Capacity is Low and the attitude is above 4 |
| F4 Short horizon | The time limit lowers the rating, or the horizon is under 3 years |
| F5 Age | Age 65 or over and rating 5 or more |
| F6 Changed answers | A scored answer (Q1–Q8) differs from the answers held when the rating was first shown |

For F6 the UI records the scored answers (`seen`) the first time it shows the rating: on the result screen, or at
the top of the sustainability part. The host keeps `seen` with the answers and passes it back in the context.

## Files

| File | What it is | Depends on |
|---|---|---|
| `risk_profiler_data.js` | Questions, answers, scores, limits, flag rules and every piece of wording (questions, result screen, Statement of Suitability sentences, record of answers). Wording can be edited; change the numbers only with Compliance. All wording is DRAFT. | nothing |
| `risk_profiler.js` | Scoring engine, flags and summaries. No DOM. Runs in a browser or Node. | `risk_profiler_data.js` |
| `risk_profiler_ui.js` | The questionnaire as a component: parts shown one at a time (step strip, Back / Continue), the introduction and the important information before Q1, then a "Your result" screen in this order: the rating (with knowledge level), capacity for loss, any limit (in words for the client), the client's answers, then the adviser's flags and an "Important information" box (`text.resultNotice`, also in the pack). Continue holds back until every question in the part is answered. Injects its own styles (all under `.rp`) and picks up the host's CSS variables (`--navy`, `--line` ...) if present. | the two above |

Build rules from the draft that the UI keeps: no answer is preselected; the Q4 slider starts with no value (the
thumb is hidden until the client moves or clicks it); Q8 starts in a mixed order with no item in its right place
and counts as answered only once the client moves an item, keeps the order or ticks "I don't know"; there is no
"prefer not to say". Q8 can be ordered by dragging or with the arrow buttons.

To use it on a website, copy those three files and load them in that order (see `risk_profiler.html`):

```js
var profiler = RiskProfilerUI.mount(document.getElementById('host'), {
  answers: {},                          // optional starting answers
  seen: null,                           // optional: the answers when the rating was first shown (F6)
  accepted: null,                       // optional: when the important information was accepted (ISO time)
  context: { dob: '1985-06-15' },       // optional: if given, the date of birth is not asked
  sri: { labels: [...], colors: [...] },// optional: defaults to the scale in the data file
  showFlags: true,                      // optional: list the adviser's flags on the result
  onChange: function(state) { /* state.answers, state.seen, state.result */ },
  onFinish: function(state) { /* optional: adds a button to the completed result */ },
  finishLabel: 'Use this result'
});
profiler.goTo('attitude');              // or 'result'; profiler.section() gives the part on screen
profiler.goToNext();                    // opens the first unanswered question
profiler.setAnswers(answers, seen);
```

Or use the engine alone:

```js
var result = RiskProfiler.evaluate(answers, { dob: '1985-06-15', seen: seen });
// result.complete, result.rated, result.sri (1-6), result.capacity, result.attitude, result.limits,
// result.knowledge, result.flags [{ id, title, text }], result.sustainability, result.changed
RiskProfiler.summary(answers, ctx);    // the questions and answers as rows, by section
RiskProfiler.narrative(answers, ctx, result, { suggestedSri, chosenSri, overrideReason });
                                        // sentences for a suitability statement
```

Answers are `{ questionId: optionId }`, except `horizon` (a number, whole years) and `loss` (a number, the slider's %), `check`
(`{ order: [4 item ids] }` or `{ dontKnow: true }`), `s2` and `s4` (arrays of option ids) and `s3`
(`{ taxonomy: '10', sustainable: '30' }`).

## How the Quotation Tool uses it

- **Step 3.** The adviser first chooses how the attitude to risk was assessed: the Allianz Risk Profiler or their own
  risk profiling. The profiler runs in a dialog. Nothing on the page changes until the adviser chooses "Use this
  result", which sets the risk rating (and the sustainability Yes/No when Part E is on).
  The sustainability Yes/No is recorded by the adviser while Part E is off. Closing part-way keeps the answers (and the acceptance) for later. Closing after editing a finished profile undoes the edits. The
  adviser may choose a lower rating, but must give a reason, which is recorded in the Statement of Suitability;
  higher ratings are locked (an adviser whose assessment is higher uses their own risk profiling). Applying changed
  answers that give a new result replaces the rating and clears the reason. The flags are listed above the rating
  picker. The date of birth comes from Step 2.
- **Statement of Suitability.** "Your personal and financial circumstances" (Q1–Q3), "Your attitude to risk" (the
  attitude answers, capacity, any limit, the rating, knowledge, and any lower rating with its reason) and "Your
  sustainability preferences" (the S1–S4 answers, then the SFDR split of the funds) are filled from the profiler.
  Wording in `risk_profiler_data.js` and `quote_text.js`.
- **Pack.** A "Risk profile" section (after the Statement of Suitability, on the adviser's letterhead) lists the
  answers, how the result was worked out, the knowledge check, the sustainability preferences, the flags and the
  questionnaire version. It is offered once the questionnaire is complete.

## Tests

- `node tests/risk_profiler_test.js` compares the engine with an independent transcription of the draft's rules on
  every combination of the scored answers (with Q4 at each band's edges, at two ages), then checks knowledge, flags,
  completeness, the conditional sustainability questions, the written outputs and the draft's test clients
  (Appendix A) whose answers can be read from their descriptions (P1, P7, P8, P10, P13, P17, P18).
- `python tests/risk_profiler_ui_test.py` drives the standalone page and the tool end to end (headless Edge), and
  saves screenshots and `rp_pack.pdf` in `tests/out`.
