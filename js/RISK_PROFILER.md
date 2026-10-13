# Risk Profiler module

A self-contained client risk questionnaire. It works out a risk profile from 1 to 7 (the same scale as the ESMA
risk rating), an experience and knowledge profile (low, medium or high) and the Allianz Global Life funds that are
eligible. It is used by the Quotation Tool (Step 3) and also runs on its own: open `risk_profiler.html`.

Source: the Allianz Global Life risk profile website, riskprofile.allianzgloballife.ie (build `main-MEMR5U7I.js`,
read 12/10/2026). The questions, scores and tables are the site's, with **corrections** (listed below) that make
the calculation work as the original Allianz Italy workbook intended. The question wording is tidied. The site's
behaviour is described in `AdditionalInfo/RiskProfiler/Risk profiler - handoff.md`, section 4.

## How the answers become a 1 to 7 rating

Two strands are worked out and combined: what the client can **earn** and what they **have**. That gives their
financial capacity. Capacity is then combined with their **reaction to a market fall**, and finally **age** is applied.

1. **Household level (low, medium or high).** Score = 25% × employment + 10% × health + 65% × dependants (each out of
   100). Below 35 is low, 35 to 64 is medium, 65 or more is high. Dependants count most: no dependants alone gives 65.
2. **Earning capacity.** With income up to €100k it equals the household level. With income over €100k, a low
   household level is lifted to medium.
3. **After commitments.**
   - **No or low commitments (under 10%):** medium is lifted to high.
   - **Medium commitments (10% to 40%):** no change.
   - **High commitments (over 40%):** high drops to medium.
4. **Wealth**, from liquid assets and the time horizon:

   | Liquid assets | Under 5 years | 6 to 10 years | Over 10 years |
   |---|---|---|---|
   | Up to €50k | Low | Low | Medium |
   | €50k to €150k | Medium | Medium | High |
   | Over €150k | Medium | High | High |

5. **Financial capacity** starts at the wealth level, and earnings can lift it:
   - **Low earnings (after commitments):** capacity = wealth.
   - **Medium earnings:** low wealth is lifted to medium.
   - **High earnings:** wealth is lifted one level, up to high.
6. **Reaction to a fall: a score from 1 to 7.** The answers are not shown in score order:

   | Shown | Answer (short) | Score |
   |---|---|---|
   | 1st | Sell immediately | 1 |
   | 2nd | Wait to recover, then sell | 2 |
   | 3rd | Hold for a positive long-term return | 5 |
   | 4th | Keep it and buy more | **7** |
   | 5th | Stay calm, wait, but look for advice | 4 |
   | 6th | Look for advice only | 3 |
   | 7th | Keep it and buy more, with an adviser | **6** |

7. **Combine capacity and reaction.** The reaction score is the starting point, and low capacity can pull it down:
   - **High capacity:** the rating is the reaction score.
   - **Medium capacity:** the same, except a 7 becomes 6.
   - **Low capacity:** one lower (minimum 1), so 1 stays 1, 2 becomes 1, and 7 becomes 6.
8. **Age.** A client aged 81 or over cannot be rated 7. A 7 becomes 6. Age is in whole years at today's date.

**Experience and knowledge** (low, medium or high) does not change the rating. It only decides which funds are listed.
- **Score:** 20% × the higher of education and finance work + 60% × the highest-scoring product ticked + 20% × asset
  classes answered correctly (100 points each).
- **Bands:** below 100 is low, below 200 is medium, otherwise high.
- **Eligible funds:** a fund is listed if its complexity is within the experience level, its risk is at or below the
  rating, and it is offered for the purpose (PRSA, investment, ARF ...).

### Corrected from the site

| | The site | Here |
|---|---|---|
| Market-fall scores | Buy more 6, buy more with an adviser 7 | Buy more 7, with an adviser 6 |
| Household weights | 25, 10 and 65: always "high", so employment, health and dependants never count | 0.25, 0.10 and 0.65, as in the workbook |
| Financial capacity | Uses liquid assets instead of earnings, so income and commitments never count | Earnings after commitments × wealth, as in the workbook |
| Wealth table | Rows and columns swapped (two of nine cells differ) | Liquid assets as the row, as in the workbook |
| Several products ticked | A broken value (NaN), which counts as high experience | The highest product counts |
| Experience score of 0 | "Na", counted as high | Low |

Pass `siteQuirks: true` in the context to reproduce the site exactly; the tests use this to compare against it. The
site's original value is kept beside each corrected one in `risk_profiler_data.js` (`siteScore`, `siteWeights`).
Products and asset classes are optional, as on the site.

## Files

| File | What it is | Depends on |
|---|---|---|
| `risk_profiler_data.js` | Questions, scores, lookup tables, the fund list and the wording used in written outputs. Each question and option carries the site's id (`src`), and the site's value beside any corrected one. Wording can be edited; change the numbers only with Compliance. | nothing |
| `risk_profiler.js` | Scoring engine and summaries: a step-by-step port of the site's calculation, with the corrections. No DOM. Runs in a browser or Node. | `risk_profiler_data.js` |
| `risk_profiler_ui.js` | The questionnaire as a component: parts shown one at a time (step strip, Back / Continue), then a "Your result" screen with the risk profile and experience profile only. The scores behind them, and the eligible funds, stay in the engine's result and are not shown. Continue holds back until the required questions in the part are answered. Injects its own styles (all under `.rp`) and picks up the host's CSS variables (`--navy`, `--line` ...) if present. | the two above |

To use it on a website, copy those three files and load them in that order (see `risk_profiler.html`):

```js
var profiler = RiskProfilerUI.mount(document.getElementById('host'), {
  answers: {},                          // optional starting answers
  context: { dob: '1985-06-15', purpose: 'A' },   // optional: if given, these questions are not asked
  sri: { labels: [...], colors: [...] },// optional: defaults to the scale in the data file
  onChange: function(state) { /* state.answers, state.result */ },
  onFinish: function(state) { /* optional: adds a button to the completed result */ },
  finishLabel: 'Use this result'
});
profiler.goTo('finances');             // or 'result'; profiler.section() gives the part on screen
profiler.goToNext();                    // opens the first unanswered question
```

Or use the engine alone:

```js
var result = RiskProfiler.evaluate(answers, { dob: '1985-06-15', purpose: 'A' });
// result.complete, result.sri (1-7), result.experience.level ('LOW' | 'MEDIUM' | 'HIGH' | 'Na'),
// result.steps.financialCapacity, result.eligible, and every intermediate step
RiskProfiler.summary(answers, ctx);    // the questions and answers as rows, by section
RiskProfiler.narrative(answers, ctx, result);   // sentences for a suitability statement
```

## How the Quotation Tool uses it

- **Step 3.** The adviser first chooses how the attitude to risk was assessed: the Allianz Risk Profiler or their own
  risk profiling. The profiler runs in a dialog. Nothing on the page changes until the adviser chooses "Use this
  result", which sets the risk rating. Closing part-way keeps the answers for later. Closing after editing a finished
  profile undoes the edits. The adviser can choose another rating, but must give a reason, which is recorded in the
  Statement of Suitability. Applying changed answers that give a new result replaces the rating. The date of birth
  comes from Step 2 and the purpose from the product (PRSA = A, Investment Bond = B, ARF = C). Eligible funds are not
  used: the fund builder compares the blended portfolio's risk with the rating.
- **Statement of Suitability.** "Your personal and financial circumstances" and "Your attitude to risk" are filled
  from the answers (wording in `quote_text.js` and `risk_profiler_data.js`). Health is not quoted.
- **Pack.** A "Risk profile" section (after the Statement of Suitability, on the adviser's letterhead) lists the
  answers and the result. It is offered once the questionnaire is complete.

## Tests

- `node tests/risk_profiler_test.js` runs every answer combination (over a million) through the engine (with
  `siteQuirks`) and through a line-by-line transcription of the site's code, and requires identical numbers. It also
  checks the corrected engine against the same transcription with only the corrections applied, on every
  combination, plus hand-worked cases.
- `python tests/risk_profiler_ui_test.py` drives the standalone page and the tool end to end (headless Edge).
- `python tests/risk_profiler_live_check.py` checks the engine (with `siteQuirks`) against the live site. Run on
  12/10/2026: 358 answer sets were set on the site's own form, and the site's results and eligible funds matched in
  every case.
