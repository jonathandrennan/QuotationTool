# Risk profiler: handoff notes (12/10/2026)

Everything needed to continue this work in a new session. Nothing has been committed.

## 1. The request

Build a risk profile tool into the Quotation Tool that:
- could also live separately (for example on the website),
- matches the tool's design,
- follows the scoring in the Excel (`Allianz_Simulatore_Quest_IBIPs_FINALE.xlsm`),
- feeds the selected risk rating on the Attitude to risk step (Step 3),
- helps populate the Statement of Suitability (SoS),
- can be added to the output document as a formatted section.

Later the user pointed to Allianz's own web version (https://riskprofile.allianzgloballife.ie/#/survey/questions), which scores 1 to 7, and asked how it maps to 1 to 7.

## 2. What is built (now: a replica of the Allianz Global Life website's engine)

**Decision (12/10/2026):** the user chose to replicate the website's engine exactly, bugs included ("some wording not
perfect in it but we want to replicate how it generates the numbers anyway"). This is option A in section 6. The
earlier 1 to 4 version, which followed the workbook with a 4-to-7 mapping, has been replaced.

**Then corrected (same day):** the user asked for the two experience quirks found on 12/10/2026 (section 4, items 4
and 5) to be fixed. Several product rows now score the highest one, and a total of 0 is LOW. Neither changes the 1 to
7 rating; they affect only the experience profile and so the eligible funds. `ctx.siteQuirks = true` reproduces the
site exactly, and the site-comparison tests use it.

**Then (same day) the rest was corrected too:** the user asked for the three financial bugs (items 1 to 3) to be
fixed and for the 6 and 7 market-fall scores to be swapped ("buy more" 7, "buy more with an adviser" 6). The engine
now follows the workbook's logic: weights 0.25 / 0.10 / 0.65, financial capacity = adjusted earning capacity × wealth,
and the wealth table read with liquid assets as the row. Employment, health, dependants, income and commitments now
affect the rating. Over all 56,448 combinations of those answers with the market-fall and savings answers, 11% of
ratings differ from the site: most go up one, some go down one (before the 6/7 swap). `siteQuirks` still reproduces
the site exactly, including the original 6 and 7. The data file keeps the site's values as `siteScore` /
`siteWeights`. Section 4 below describes the site as it is.

| File | Purpose |
|---|---|
| `js/risk_profiler_data.js` | The site's questions (tidied wording) with its exact scores, tables, age rule and fund list. Each question and option carries the site's id (`src`). |
| `js/risk_profiler.js` | Scoring engine: a step-by-step port of the site's `SurveyService._calculation`. No DOM. Browser or Node. `evaluate`, `summary`, `narrative`. |
| `js/risk_profiler_ui.js` | Questionnaire component: parts one at a time (step strip, Back / Continue) and a final "Your result" screen (no side panel). It shows the risk profile, experience profile, eligible funds and the full calculation. |
| `risk_profiler.html` | Standalone page using only those three files. |
| `js/RISK_PROFILER.md` | How the numbers are produced, and how to reuse the module. |
| `tests/risk_profiler_test.js` | Engine test: every answer combination (1,054,080) through our engine and a line-by-line transcription of the site's code, plus hand-worked cases. |
| `tests/risk_profiler_ui_test.py` | Selenium test (standalone page and the tool end to end). |

Edits to existing files:
- `quotation_tool.html`: Step 3 has the questionnaire above the rating picker. `rpContext()` passes the date of birth, the purpose (PRSA = A, Investment Bond = B, ARF = C) and today's date.
- `js/quote_pdf.js`: "Risk profile" page (1 to 7 result, answers, how it was worked out).
- `js/quote_text.js`: SoS wording.
- `tests/ui_test.py`: one expected count changed.

What the questionnaire asks (the site's questions):
- **About you:** date of birth, education, employment (7 options), finance work, state of health, dependants.
- **Experience:** products (optional), asset classes (optional).
- **Finances:** income, commitments, time horizon, liquid assets.
- **Attitude to risk:** the 7-option market-fall question.
- **Needs:** purpose. This is asked on the standalone page only; the tool sets it from the product.

The site's name and sustainability questions are not asked: the tool already holds the client's name and asks the ESG question itself. They have no effect on any number.

Behaviour in the tool:
- **Step 3.** Completing the questionnaire sets the selected rating (state in `S.risk`: `pAnswers`, `pSuggested`, `pReason`, `pDate`, `pOpen`).
- **Overriding.** The adviser can choose a different rating but must give a reason, which is recorded in the SoS. Changing an answer so the result changes replaces the rating and clears the reason.
- **Age.** The date of birth comes from Step 2. Age is counted at today's date, as on the site. A result of 7 becomes 6 for a client aged 81 or over.
- **SoS.** "Personal and financial circumstances" and "Attitude to risk" are filled from the answers (grey auto-filled text, still editable). Health is not quoted.
- **Pack.** A "Risk profile" section follows the SoS on the adviser's letterhead.

Saved answers from the earlier 1 to 4 version (old ids such as `marital` and `property`) are simply treated as unanswered.

## 3. Test status

- `node tests/risk_profiler_test.js`: passes. All 1,054,080 combinations match the transcription of the site's code.
- **Live check (12/10/2026):** 358 answer sets were set on the live site's own form, through its `window.logPrevAndNowState` debug hook, which exposes the form. The site's `RESULTS` and `ELIGIBLE_PRODUCTS` were then read back. Every number and every eligible-fund selection matched our engine. The cases covered all 9 liquid-assets × horizon cells at ages 80 and 81, every tolerance option at each capacity extreme, the "Na" case and 300 random sets. The only data difference is one fund name I reworded: "75 - 30 funds" became "75 and 30 funds".
- `python tests/risk_profiler_ui_test.py`: 0 failures. Output screenshots and a sample pack PDF are in `tests/out/rp_*`.
- `python tests/ui_test.py` (existing suite): 9 failures. The same 9 fail on an untouched copy of the committed code, so they predate this work.
- Test runs rewrite tracked files in `tests/out/`. Restore them afterwards with `git checkout -- tests/out`.

## 4. Allianz website version (riskprofile.allianzgloballife.ie)

Method: I read the site's published JavaScript (an Angular app, all logic in the browser), compared its formulas with the workbook (`H_ProfiloCliente` sheet formulas and cached values), and ran the live site with controlled answers, reading the saved results from `localStorage['STATE']`. The site's function names are the workbook's cell references (`J33`, `J57`, `J82`).

### How the 1 to 7 rating is produced

**Step 1: tolerance score (1 to 7).** The market-fall question has 7 options, scored out of display order:

| Option shown | Wording (short) | Score |
|---|---|---|
| 1 | Disinvest immediately | 1 |
| 2 | Keep it, wait to recover before selling | 2 |
| 3 | Hold and wait, for a positive long-term return | 5 |
| 4 | Keep it and partly increase the position | 6 |
| 5 | Stay calm and wait, but look for professional advice | 4 |
| 6 | Look for professional advice only | 3 |
| 7 | Keep it, partly increase the position, with an adviser | 7 |

**Step 2: financial capacity (1 to 3).** This is the intermediate step. On the site's results object it is called `financialSustainability`, but it is not the ESG "sustainability". Inputs: liquid assets (1 = up to €50k, 2 = €50k to €150k, 3 = over €150k) and time horizon (1 = under 5 years, 2 = 6 to 10, 3 = over 10). The site's results:

| | Horizon 1 | Horizon 2 | Horizon 3 |
|---|---|---|---|
| Assets 1 | 1 | 2 | 2 |
| Assets 2 | 2 | 2 | 3 |
| Assets 3 | 3 | 3 | 3 |

**Step 3: the rating.**

| Financial capacity | Tol 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 3 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| 2 | 1 | 2 | 3 | 4 | 5 | 6 | 6 |
| 1 | 1 | 1 | 2 | 3 | 4 | 5 | 6 |

**Step 4: age.** A result of 7 for a client aged 81 or over becomes 6. Exactly 80 is not capped.

Not a scaling: the old 1 to 4 was not divided by 4 and multiplied by 7. The site hard-codes the 7 option scores and uses a lookup table. Its equivalents of the workbook's four options give 1, 2, 5 and 6 (strong finances).

### The three bugs (differences from the workbook)

1. **Income weights are 100 times too large.**
   - The site's constants are 25, 10 and 65, and the workbook's are 0.25, 0.10 and 0.65. The workbook's constants are in `H_ProfiloCliente!C19:C21`.
   - The minimum possible score on the site is 950, always above the cut-off of 65. Income capacity is always level 3.
   - Live check: the weakest answers returned level 3. The workbook gives level 1.
2. **The final step is fed liquid assets instead of adjusted income capacity.**
   - Workbook: `J66 = VLOOKUP(J45, …, HLOOKUP(J57, …)+1)`, adjusted income against wealth.
   - Site: `getFinancialSustainability(w, h)` where `w` is liquid assets. Adjusted income capacity is calculated and never used.
   - Live check: income-side answers moved adjusted capacity from 3 to 2 and the rating stayed at 7.
3. **The wealth lookup has its rows and columns swapped.**
   - Workbook: rows are liquid assets and columns are property. Cached values: row 3 = [2,3,3], row 2 = [2,2,3], row 1 = [1,1,2].
   - Site: same numbers, but property is the row and assets the column. The table is not symmetric, so exactly two of nine cells differ: assets 1 with horizon 2 (site 2, workbook 1) and assets 2 with horizon 1 (site 1, workbook 2).
   - Caveat: the Irish version's "property" slot now holds time horizon, so the table's meaning has shifted.

Net effect: only the market-fall answer, liquid assets, time horizon and age affect the rating. Employment, health, dependants, income band and commitments are collected but ignored. Experience and knowledge (low, medium or high) affects only which products are eligible.

### Two more quirks found on 12/10/2026 (experience and knowledge only)

4. **Two or more product rows give NaN, which scores as HIGH.** The site passes the list of ticked product rows to `Math.max` as one array (`Q11: t => Math.max(t)`). One row gives its weight, but two or more give NaN. NaN fails both of `J11`'s comparisons, so the experience profile becomes HIGH. A row counts if either column is ticked, including "None of the above" (for example "None" understood, mutual funds held). The workbook takes the highest weight instead.
5. **A total of exactly 0 is "Na", counted as 3.** `H93` returns "Na" when the three parts add up to 0, and `I93` turns anything other than LOW or MEDIUM into 3. So the eligible-funds check treats "Na" like HIGH.

Also: the product and asset-class questions have no "required" check on the site. "None of the above" clears and disables the matching column on the other rows. A check for both columns of "None" is misspelled (`lenght`) and never runs.

### Other differences from the workbook

- "Marital status" became "state of health" but kept the marital weights (70, 100, 30, 70). The health answers have no effect, and the question collects special-category data under GDPR.
- "Do you own property" became "time horizon for this investment".
- The "nothing with other providers" assets option and the economics/finance education option are gone. Employment weights differ (manager 80 not 100, entrepreneur 80 not 70).
- The 7-column tolerance table has no workbook reference. It follows the workbook's pattern (row 3: identity; row 2: capped one below the maximum; row 1: one below the tolerance score).

### Site product ratings (eligibility: product complexity at or below client experience, product rating at or below client rating)

Euro Cash 1; Short Duration Fixed Income 2; Euro Fixed Income 3; Strategy Select 30 and 50 and SRI 50 multi-asset 4; Strategy Select 75 and SRI 75 multi-asset 5; Best Styles Global Equity 6; Life Cycle Balanced 2, Dynamic 3, Opportunity 5; Autopilot low 4, medium 4, high 5. The Default Investment Strategy has no rating. This is a one-sided cap, unlike the tool's `STRATEGY_SUITABLE` ranges.

### What is verified and what is not

Verified live:
- The tolerance mapping (all 7 options, strong finances).
- The age rule at 80, 81 and 86 (tolerance 7 only).
- All nine assets and horizon combinations (tolerance 6 and 7 only).
- Strongest against weakest income-side answers (changed together) give the same rating.
- The user's own run: everything as negative as possible except the max-risk option gave 6. That matches the model (assets 1 and horizon 1 give capacity 1, and capacity 1 with tolerance 7 gives 6). It does not distinguish the bugs, because the fixed logic also gives 6 there.

Not verified live:
- Each income-side question on its own.
- Education, finance work, product knowledge and the asset-class questions (code reading only).
- Tolerance 1 to 5 at capacities 1 and 2.
- The site could change; I read build `main-MEMR5U7I.js`.

A test that would show the bugs: weakest income-side answers, over €150k assets, horizon over 10 years, max-risk option. The site should give 7. The workbook logic with the fixes would give lower.

## 5. Terminology note

The site's output label "Sustainable Risk Profile (ESMA)" is a translation of the Italian "Profilo di Rischio Sostenibile" and means the risk level the client can sustain financially. It is the ESMA-style 1 to 7 rating, not ESG. I should use "financial capacity" for the intermediate 1 to 3 step in future write-ups. The earlier analysis note (`Website risk profiler - how it maps to 1-7.md`) still says "sustainability" for that step and could be renamed.

## 6. Open decisions

1. **Which scheme should the tool follow?** Decided 12/10/2026: A, replicate the site exactly (built and verified, see sections 2 and 3).
   - A: adopt the site's 1 to 7 as it is live (inherits the bugs).
   - B: the 7-option question with the workbook's logic fixed (my recommendation).
   - C: keep my 4-profile version.
2. **Confirm the three bugs with whoever owns the site.** Ask whether they are known or intended.
3. **The 4-to-7 mapping.** Mine is 2, 3, 4, 5. The site's treatment of the equivalent four options suggests 1, 2, 5, 6. Compliance to decide.
4. **The 7-column tolerance table** has no workbook reference. Allianz to confirm.
5. **Health question.** Scored with marital weights and unrelated to the result. Remove, or rescore deliberately.
6. **Time horizon in the wealth step.** It is a different concept from property. Business to decide.

## 7. Suggested next steps

1. Build a comparison harness: recalculate the workbook with LibreOffice, compare with a corrected engine across all 4-column inputs, and confirm the corrected engine matches the site wherever the site is not wrong. This would verify the fixes.
2. Run the exhaustive live check on the site (every combination that matters, plus one-at-a-time variation of the remaining questions).
3. Once a scheme is chosen, update the profiler: 7 tolerance options, the new table, the age rule, and the SoS and pack wording to match.
4. Rename "sustainability" to "financial capacity" in the notes.
