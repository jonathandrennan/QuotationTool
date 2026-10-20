# Risk Profile / Suitability Questionnaires – Aviva, Standard Life, Irish Life, Zurich

Compiled from four public tools. Each entry marks what was **read directly from the tool's code/config** and what is **inferred**.

| Provider | Tool | Questions | Output scale | Logic visibility |
|---|---|---|---|---|
| Aviva | Investment Suitability Tool (IST) | 5 (+ term slider, + confirmation prompts) | ESMA 1–7 (calculated result is 0, 3, 4, 5 or 6) | **Full** – decision table read from `istLogic.js` |
| Standard Life | EV Risk Profiler (13 Qs, plus 3 optional ESG Qs) | 13 | 5 categories (Low → High), mapped to ESMA 1–7 | Questions from the official PDF; **scoring not public** (inferred) |
| Irish Life | Risk Profiler (served from Invesco demo host) | 15 | 7 categories, levels 1–7 | **Full** – scores and bands read from the tool's JSON config |
| Zurich | Risk Profiler (zurichlife.ie) | 9 (age, term, 7 scored/profile Qs incl. knowledge, + 2 capacity-for-loss Qs) | Risk Profile 1–7 + Capacity for Loss 1–3 | **Partly** – points per answer read from the page; class cut-offs and adjustments inferred by probing |

Key finding: **Standard Life and Irish Life use the same EV (EValue) question bank.** Standard Life's 13 questions are Irish Life's 15 minus two (Irish Life Q6 and Q7). That lets us infer Standard Life's scoring with reasonable confidence.

---

## 1. Aviva – Investment Suitability Tool

Source: `https://secure.avivabroker.ie/ole/ist/ist.html` (logic in `javascript/istLogic.js`).

Flow: *What do we mean by risk?* (educational: market, inflation, counterparty, liquidity, concentration) → *A few questions* → *Investment suitability* (result + volatility charts) → *Validation* (confirmation prompts) → *Fund options & report*.

### Questions

| # | Param | Question | Options (value) |
|---|---|---|---|
| 1 | `experience` | How experienced an investor are you? | 1 – I am not experienced; I have rarely invested in the past<br>2 – I have invested before, but only in relatively simple products<br>3 – Although I am not an expert, I do understand how markets work and am comfortable in my ability to make most investment decisions<br>4 – I have made many investments in the past and would consider myself experienced |
| 2 | `importance` | How important to you is the investment you are considering now? | 1 – I am very reliant on this money and would be in trouble if anything happened to it<br>2 – I have other funds/sources of income but would feel pain now if anything happened to my investment<br>3 – I won't rely on it for 10 years but will after that<br>4 – Surplus funds; unlikely to depend on them |
| 3 | `safety` | "I want my investment to be safe even if it means lower returns in the long run" | 1 Strongly agree · 2 Tend to agree · 3 Neither · 4 Tend to disagree · 5 Strongly disagree |
| 4 | `expectations` | What risk and return expectations do you have? | 1 – Guarantee of getting original investment back<br>2 – Earn a little more than deposits; small amount of risk<br>3 – Steady long-term growth; accept short-term fluctuations<br>4 – Strong long-term growth; comfortable with large fluctuations<br>5 – Maximise returns; very comfortable with a high degree of risk |
| 5 | `loss` | Maximum percentage loss you could tolerate in a 12-month period? | Slider 0–40 (%), default `-1` (unset) |
| – | `term` | Investment term (used only for the long-term volatility chart, not the risk level) | Slider 5–30 years, default 5 |

(Option wording for Q2/Q4 is paraphrased where the page was summarised; the values and the confirmation-prompt text in the code confirm the meaning.)

### Core logic (verbatim from `calculateRiskLevel`)

The risk level is **a lookup on Q4 (expectations) × Q5 (max loss %)**. Q1–Q3 do not change the number; they only trigger confirmation prompts.

| Q4 expectation | Loss < … → level |
|---|---|
| 1 Guarantee | loss < 5 → **0** (no risk) · else → **3** |
| 2 Small risk | < 3 → **0** · < 12 → **3** · else → **4** |
| 3 Steady growth | < 8 → **3** · < 18 → **4** · else → **5** |
| 4 Strong growth | < 8 → **3** · < 16 → **4** · < 35 → **5** · else → **6** |
| 5 Maximise | < 8 → **3** · < 16 → **4** · < 28 → **5** · else → **6** |

Notes:
- Levels 1 and 2 on the ESMA scale are never produced; the result jumps 0 → 3. Aviva's funds start at level 3.
- Level 0 = "no risk / deposit-like". `isCalculatedNoRisk()` is `level < 3`.
- Levels are clamped to 3–6 when the user adjusts them (`incrementRisk` caps at 6, floors at 3; `decrementRisk` below 3 drops to 0).
- The user can move the level up/down by one after seeing the result (the "validation" step).

### Consistency-check (validation) prompts

These produce a "please confirm" dialog when answers conflict:

1. **After Q3 (reliance message)** – shown if (Q3 = 4 *and* Q2 = 1) or Q3 = 5, and Q2 is 1 or 2: *"You indicated you were very reliant on this money… Are you happy to say you tend to / strongly disagree with the safety statement?"*
2. **After Q4 (expectations message)**
   - Q4 = 1 and Q3 ∈ {4,5} → confirm they would only invest with a capital guarantee.
   - Q4 ∈ {2,3} and Q3 = 5 → confirm the stated expectation.
   - Q4 = 4 and Q3 = 1 → confirm "strong growth" despite strongly wanting safety.
   - Q4 = 5 → builds a message from any of: Q3 ∈ {1,2} (wants safety), Q2 ∈ {1,2} (reliant on money), Q1 = 1 (inexperienced); if at least one applies, asks to confirm they want to maximise returns with high risk.
3. **After Q5 (loss message)** – flags unrealistic return/loss pairings ("unlikely to be achievable for the risk you accept"):
   - Q4 ∈ {3,4,5} and loss < 5
   - Q4 ∈ {4,5} and loss < 10
   - Q4 = 5 and loss < 20
   - Q4 = 1 and loss > 4 (guarantee but accepts loss)
   - Q4 = 2 and loss > 10 (small risk but accepts a large loss)

### Outputs
ESMA rating, short-term (12-month) low/average/high ranges, long-term low/average/high by year for the chosen term (data tables in `istValues.js`), then matching Aviva Series 1 funds and a PDF report.

---

## 2. Standard Life – EV Risk Profiler (13 questions)

Source: Standard Life PDF questionnaire (`risk-profile-questionnaire.pdf`) and Adviser Guide (`what-is-your-clients-attitude-to-risk.pdf`). The interactive tool loads questions from a backend (AppSync GraphQL), so scoring is not exposed.

All questions are single-choice. The 5-point agree scale is *Strongly agree / Tend to agree / In between / Tend to disagree / Strongly disagree*.

| # | Type (per guide) | Question | Options |
|---|---|---|---|
| 1 | Emotion | I would enjoy exploring investment opportunities for my money. | Agree scale |
| 2 | Self-assessment | I would go for the best possible return even if there were risk involved. | Always / Usually / Sometimes / Rarely / Never |
| 3 | Self-assessment | How would you describe your typical attitude when making important financial decisions? | Very adventurous / Fairly adventurous / Average / Fairly cautious / Very cautious |
| 4 | Behaviour | What amount of risk do you feel you have taken with your past financial decisions? | Very large / Large / Medium / Small / Very small |
| 5 | Self-assessment | To reach my financial goal I prefer an investment which is safe and grows slowly but steadily, even if it means lower growth overall. | Agree scale |
| 6 | Emotion | I am looking for high investment growth. I am willing to accept the possibility of greater losses to achieve this. | Agree scale |
| 7 | Scenario | If you had money to invest, how much would you be willing to place in an investment with possible high returns but a similar chance of losing some of your money? | All of it / More than half / Half / Less than half / Very little, if any |
| 8 | Self-assessment | How do you think a friend who knows you well would describe your attitude to taking financial risks? | Daring / Sometimes daring / A thoughtful risk taker / Careful / Very cautious and risk averse |
| 9 | Emotion | If you had picked an investment with potential for large gains but also the risk of large losses, how would you feel? | Panicked and very uncomfortable / Quite uneasy / A little concerned / Accepting of the possible highs and lows / Excited by the potential for gain |
| 10 | Scenario | Imagine you have money to invest and a choice of two products, which would you choose? | Low average return, almost no risk of loss / Higher average return, some risk of losing part of the investment / A mixture of the two |
| 11 | Self-assessment | I would prefer small certain gains to large uncertain ones. | Agree scale |
| 12 | Emotion | When considering a major financial decision, which statement BEST describes how you think about possible losses or gains? | I'm excited about the possible gains / I'm optimistic about possible gains / I think about both gains and losses / I am conscious of the possible losses / I worry about the possible losses |
| 13 | Self-assessment | I want my investment money to be safe even if it means lower returns. | Agree scale |

Optional sustainability (IDD/SFDR) questions – **not part of the risk score**:
1. Invest in "environmentally sustainable investments" (EU Taxonomy)? Yes/No + minimum %.
2. Invest in "sustainable investments" (SFDR)? Yes/No + minimum %.
3. Invest in assets that reduce negative environmental impact ("just avoid harm")? Yes/No.

### Logic (stated vs inferred)

Stated by Standard Life: each answer gets a score; scores are totalled and compared to a scorecard; result is one of **five categories** – Low, Low-Medium, Medium, Medium-High, High. EV also shows where within the band the client sits. The guide gives the ESMA mapping:

| EV category | ESMA 1–7 |
|---|---|
| Low | 1, 2 |
| Low-Medium | 3 |
| Medium | 4 |
| Medium-High | 5 |
| High | 6, 7 |

Not shown: band thresholds. **Inference:** because the questions and options are identical to Irish Life's, the item scores are almost certainly the same as Irish Life's (section 3), with the two dropped questions removed. The raw total would run **13–63** (twelve 5-point items + the 3-option Q10). The five bands are then probably a coarsening of Irish Life's seven (Low = Irish Life's levels 1–2, Low-Medium = 3, Medium = 4, Medium-High = 5, High = 6–7), with cut-offs rescaled for the shorter test. Exact cut-offs cannot be recovered without EV's scorecard; a defensible approximation is to scale Irish Life's thresholds proportionally (see section 4).

Limitations Standard Life states: excludes people unwilling to take any capital risk; ignores capacity for loss, time horizon and age; inconsistent answers need discussion; result is a point-in-time measure.

---

## 3. Irish Life – Risk Profiler (15 questions)

Source: the tool's own JSON (`ajaxGetSurveryData.json` for questions, `ajaxGetSurveryConfig.json` for scores and bands). Title in the data: "Irish Life Risk Profiler". Host page is an Invesco demo site.

### Scoring

Score per question is the position of the answer on the scale. For "risk-positive" statements (more adventurous = higher score) the scale is 5→1 down the list; for "safety" statements (Q5, Q6, Q13, Q15) it is reversed so agreeing with safety scores low.

| # | Question | Option → score |
|---|---|---|
| 1 | I would enjoy exploring investment opportunities for my money. | Strongly agree 5 · Tend to agree 4 · In between 3 · Tend to disagree 2 · Strongly disagree 1 |
| 2 | I would go for the best possible return even if there were risk involved. | Always 5 · Usually 4 · Sometimes 3 · Rarely 2 · Never 1 |
| 3 | How would you describe your typical attitude when making important financial decisions? | Very adventurous 5 · Fairly adventurous 4 · Average 3 · Fairly cautious 2 · Very cautious 1 |
| 4 | What amount of risk do you feel you have taken with your past financial decisions? | Very large 5 · Large 4 · Medium 3 · Small 2 · Very small 1 |
| 5 | To reach my financial goal I prefer an investment which is safe and grows slowly but steadily, even if it means lower growth overall. | Strongly agree **1** · Tend to agree 2 · In between 3 · Tend to disagree 4 · Strongly disagree **5** |
| 6 | When I consider investments that have an element of risk I feel quite anxious. | Strongly agree **1** … Strongly disagree **5** |
| 7 | Imagine that six months after investing, markets perform badly and your investment drops significantly. Reaction? | Transfer to a more secure product 1 · Monitor and wait 2 · Invest more at the lower price 3 |
| 8 | I am looking for high investment growth. I am willing to accept the possibility of greater losses to achieve this. | Strongly agree 5 … Strongly disagree 1 |
| 9 | How much would you place in an investment with possible high returns but a similar chance of losing some of your money? | All of it 5 · More than half 4 · Half 3 · Less than half 2 · Very little, if any 1 |
| 10 | How would a friend who knows you well describe your attitude to financial risk? | Daring 5 · Sometimes daring 4 · A thoughtful risk taker 3 · Careful 2 · Very cautious and risk averse 1 |
| 11 | If you had picked an investment with potential for large gains but risk of large losses, how would you feel? | Panicked 1 · Quite uneasy 2 · A little concerned 3 · Accepting of highs and lows 4 · Excited 5 |
| 12 | Choice of two products – which would you choose? | Low return/almost no risk 1 · Mixture of the two **2** · Higher return/some risk of loss **3** |
| 13 | I would prefer small certain gains to large uncertain ones. | Strongly agree **1** … Strongly disagree **5** |
| 14 | Which statement BEST describes how you think about possible losses or gains? | Excited by gains 5 · Optimistic about gains 4 · Both gains and losses 3 · Conscious of losses 2 · Worry about losses 1 |
| 15 | I want my investment money to be safe even if it means lower returns. | Strongly agree **1** … Strongly disagree **5** |

Total range: **15 – 71** (thirteen 5-point items, two 3-point items).

### Bands (total score → category)

| Score | Level | Category |
|---|---|---|
| 0–22 | 1 | Safety First |
| 23–29 | 2 | Careful |
| 30–37 | 3 | Conservative |
| 38–45 | 4 | Balanced |
| 46–53 | 5 | Experienced |
| 54–61 | 6 | Adventurous |
| 62–99 | 7 | Very Adventurous |

Each category has a two-paragraph narrative and a 7-point volatility graphic. Result page notes it is an educational tool and not advice.

---

## 4. Comparison and what carries over to our tool

| | Aviva | Standard Life | Irish Life | Zurich |
|---|---|---|---|---|
| Method | Stated-preference decision table (expectation × max loss) | Additive psychometric score (EV) | Additive psychometric score (EV) | Additive points, then adjusted by age / term / knowledge |
| Uses max-loss % | Yes (primary driver) | No | No | No (uses 6-month 10% fall concern and 5-year value range) |
| Uses experience / reliance | Only for consistency prompts | No | No | Knowledge adjusts score; reliance feeds capacity for loss |
| Uses time horizon | Chart only, not the level | No (explicitly excluded) | No | **Yes** – adjusts score and triggers a ≤5-year warning |
| Result levels | 0, 3–6 | 5 categories | 7 categories | 1–7 plus capacity for loss 1–3 |
| Consistency checks | Yes (3 stages, user can override ±1) | Advisers told to discuss inconsistent answers | None | Yes – any pair of Q4–Q7 scores more than 2 apart |

Suggested approximation if we need a Standard Life-style result from an EV score without EV's scorecard (**assumption, to be verified against EV/Standard Life**): take the 13-question total and scale Irish Life's 15-question thresholds by roughly 13/15 on the lower side, then map levels 1–2 → Low, 3 → Low-Medium, 4 → Medium, 5 → Medium-High, 6–7 → High.


---

## 5. Zurich – Risk Profiler

Source: `https://www.zurichlife.ie/pensions-retirement/calculators/risk-profiler/` (server-rendered wizard). Flow: sustainability preference gate (Yes/No; Yes leads to a separate Sustainability Assessment, not explored) → compliance acceptance ("not advice") → **one page of 9 questions** → results (Risk Profile + Capacity for Loss + conflict warnings) → PDF / hand-off to Zurich Portfolio Builder (`riskProfile` and `capacityForLoss` passed as parameters).

### Questions

| # | Field | Question | Options (value) |
|---|---|---|---|
| 1 | `clientAge` | What age are you? | Slider 19–100 |
| 2 | `lengthOfInvestment` | How long do you plan to invest for? | Slider 1–15 years ("15 = 15+ years") |
| 3 | `knowledgeOfInvesting` | How would you describe your investment knowledge? | 1 Expert (in-depth) · 2 High (good understanding of types and risks) · 3 Moderate (basic types and risks) · 4 Little · 5 None |
| 4 | `investmentObjective` | What is your investment objective? | 1 Maximise returns, regardless of risk · 2 High returns, without excessive risk · 3 Good returns, limited risk to capital · 4 Returns that beat inflation, without significant risk to capital · 5 Protect my capital |
| 5 | `investmentDecline` | How concerned would you be with a short-term (6 months) 10% decline in your investment? | 1 Not concerned · 2 Slightly · 3 Moderately · 4 Very · 5 Extremely concerned |
| 6 | `investmentChoice` | Appetite for risk: if you invested €10,000 today, what range of values would you consider acceptable after 5 years? | 1 €6,300–€17,200 · 2 €6,800–€16,300 · 3 €7,900–€14,000 · 4 €8,900–€12,100 · 5 €9,800–€11,600 |
| 7 | `increaseInvestmentbyRisk` | If you could increase the value of your investment by taking more risk, would you… | 1 Take a LOT more risk with ALL your money · 2 A LITTLE more risk with ALL · 3 A LITTLE more risk with SOME · 4 Be UNWILLING to take any more risk |
| 8 | `financialEmergency` | Do you have other savings for a financial emergency? | 1 No savings I can use · 2 Some savings, nothing earmarked · 3 Yes, specific savings for emergencies |
| 9 | `financialWellBeing` | If this investment performed poorly, what impact on your financial well-being? | 1 Big impact (required for a specific purpose) · 2 Some impact (would need to adjust plans) · 3 No impact (I have other savings) |

### Scoring (observed by submitting answers and reading the returned page)

Q4–Q7 are scored in the page as risk points (higher = more risk-tolerant). The scores shown in the results script:

| Option chosen | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Q4 objective, Q5 decline, Q6 range | 8 | 6 | 4 | 2 | 0 |
| Q7 approach to risk (4 options) | 8 | 6 | **2** | 0 | – |

Note Q7 option 3 scores 2 (not 4), so it is not evenly spaced. Sum of Q4–Q7 ranges 0–32.

### Risk Profile (1–7) – inferred

Probing with Q1–Q3 held at neutral values (age 40, 10 years, "moderate" knowledge), the class depended only on the Q4–Q7 sum:

| Q4–Q7 sum | Risk Profile |
|---|---|
| 0–6 | 2 |
| 8–12 | 3 (boundary 7 or 8 not isolated) |
| 14–20 | 4 |
| 22–26 | 5 |
| 28–32 | 6 |

Consistent with an adjusted score banded in **sevens**: profile = floor(adjusted score / 7) + 2, clamped to 1–7 (7→3, 14→4, 21→5, 28→6, 35→7; below 0 → 1). Boundaries 13/14, 20/21 were bracketed by the probes; the 7 and 27/28 boundaries only to within 1.

Q1–Q3 then act as additive **adjustments to that sum** (approximate sizes, from boundary tests):

| Input | Effect (approx. points) |
|---|---|
| Knowledge | Expert/High (1–2) push up (Expert ≈ +2 or more); Moderate 0; Little ≈ −1; None ≈ −2 |
| Age | Young (≈19) raises; ≤45 ≈ 0; ~50 ≈ −1; 55–60 ≈ −2; 70 ≈ −3 or more |
| Investment term | 10 years 0; 15+ years raises; 7 ≈ −2; 5–6 ≈ −3 to −4; 3 ≈ −5 to −6 (1 year lowest) |

Evidence the profile is not capped: a maximum-risk set of answers (sum 32) with age 19, 15-year term, expert knowledge gives **Profile 7**, and a minimum set (sum 0) with age 100, 1-year term, no knowledge gives **Profile 1**; with all neutral modifiers those same answers give 6 and 2. So Profiles 1 and 7 are only reachable through age/term/knowledge. Exact weights for each age/term/knowledge value were not pinned down (the weights are server-side).

### Capacity for Loss (1–3) – inferred from the 9 combinations

Let s = Q8 + Q9: **s ≤ 3 → Low (1)**; **s = 4–5 → Medium (2)**; **s = 6 → High (3)**. Separate from the risk profile; displayed with the result and passed to the portfolio builder.

### Consistency checks (read from the result page)

- Compare the scores of Q4, Q5, Q6, Q7 pairwise (six pairs). If any pair differs by **more than 2 points**, show a conflict warning naming the two questions, with a button to go back and change either (e.g. objective says "protect capital" but the 10% decline question says "not concerned").
- If Risk Profile > 2 and term ≤ 5 years, show a time-horizon warning.
- Term 15 is shown as "15+ years".

### Sustainability Assessment (read from the live tool, 20/10/2026)

Gate question at the start: "Yes – I have sustainability preferences and would like to complete the Sustainability Assessment" / "No – I do not have sustainability preferences and do not need to complete the Sustainability Assessment". Choosing Yes adds a page after the 9 risk questions. It does not change the Risk Profile; the answers are listed on the result page and PDF.

The page explains the three categories (EU Taxonomy-aligned, SFDR-aligned, investments that consider Principal Adverse Impacts), says they "should not be viewed as a hierarchy" and that "there are no right or wrong answers", and notes that several funds hold sovereign bonds, which the client may include or exclude. Then:

1. "Please tick the boxes below to indicate your sustainability preferences": the three categories as checkboxes.
2. For each of Taxonomy-aligned and SFDR-aligned: "How important it is to you that you invest in …" (Not / Slightly / Moderately / Very / Extremely important) and "Please specify the minimum proportion that you would like invested in …" (a free % field with − / + buttons, default 0).
3. For PAIs: the same importance scale, then "Please select all categories that you would like to be considered in your investment decisions from the sample list below" (11 checkboxes):
   - Environmental: Greenhouse gas emissions; Carbon footprint; Activities that negatively affect biodiversity-sensitive areas; Emissions to water
   - Social: Exposure to controversial weapons; Gender pay gap and board gender diversity; Adherence with the UN Global Compact
   - Governance: Corruption and bribery matters; Inadequate governance; Tax evasion; Breaches of regulation, international norms and conventions
   - Followed by: "the above is not an exhaustive list … please discuss these with your Financial Advisor."

### Differences from the others
Zurich is the only one of the four that feeds **age and investment term** into the risk number, and the only one that produces a separate **capacity for loss** result. Q4–Q7 are a bespoke question set (not the EV bank). Its result descriptions cover 7 profiles ("Very low risk" … ) with an explanation of the typical fund mix for each.

---

## 6. Caveats

- Aviva Q2 and Q4 option wording was taken from a summarised page read; values and message text in the source code confirm the intent but double-check wording before reuse.
- The Standard Life interactive tool was not scoreable from outside; everything on its scoring is inference from Irish Life's config plus the Adviser Guide.
- Irish Life's config comes from a demo host (Invesco), and may not exactly match production.
- These are third-party tools; reusing their wording and scoring in our product should be cleared with the relevant provider/compliance.
- Zurich's class boundaries and the age/term/knowledge weights are inferred from about 90 test submissions to the public tool, not read from source; treat the exact weights as approximate.
