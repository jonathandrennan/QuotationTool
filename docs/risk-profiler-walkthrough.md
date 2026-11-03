# Risk profiler

A short guide to the proposed risk profiler: how it works, the questions, how it meets the regulations, and how it compares with Aviva and Zurich. The full detail, including every answer and score, is in the Risk Profiler Proposal.

_Generated alongside `Risk-Profiler-Walkthrough.docx` by `build_risk_profiler_docx.py`; edit this file, then rebuild._

## What it is

The broker uses the profiler with the client during an advised sale. It asks 8 questions and the date of birth, and gives a risk rating from 1 to 6 on the ESMA scale. It also gives capacity for loss and knowledge level, and flags anything the broker should check. The broker makes the final decision and provides the Statement of Suitability. The answers, the result and how it was worked out go into the client's pack.

## How it works

| Part | Question | What it does |
|---|---|---|
| Your finances | Q1 Savings cushion · Q2 Impact of a loss | Capacity for loss (Low, Medium, High) |
| Your timing | Q3 How long the client will hold the investment | Time limit on the rating |
| Your attitude to risk | Q4 Largest 12-month fall they could accept (in €) · Q5 What they would do after a 20% fall · Q6 What they want from the investment | Attitude rating 1–6 |
| Your knowledge | Q7 Knowledge and experience · Q8 Rank four investments by risk (has a right answer) | Knowledge level (flag only) |
| About you | Date of birth | Age (flag only) |

| Step | Rule |
|---|---|
| 1. Attitude | The middle of the Q4, Q5 and Q6 ratings, and no more than one level above the loss answer (Q4) |
| 2. Limits | Under 3 years: no more than 3. 3 to under 5 years: no more than 4. Low capacity for loss: no more than 4 |
| 3. Rating | The lower of the attitude and the limits. The client is told when a limit applies. The adviser may lower or raise it (up to 6), with a reason that goes into the Statement of Suitability |
| 4. Flags | Mixed answers, low knowledge with a high rating, capacity limit, short horizon, age 65+ with a high rating, answers changed after the result was shown. Flags never block; the broker decides |

## The questions

Each question below shows the wording and the answer options as the client sees them, with how each answer scores. Then why it is asked, the rule it meets and how Aviva and Zurich ask the same thing. No answer is preselected and every question must be answered.

**Q1 Financial cushion** – If your income stopped, how long could you cover your normal spending from savings?

_Help text:_ Include loan or mortgage repayments and family support. Leave out pensions and this investment.

| Answer | Points |
|---|---|
| 12 months or more | 3 |
| 3 to 11 months | 2 |
| Less than 3 months | 1 |

- **Why:** Shows whether a fall in value could force the client to sell. It is a fact the client can work out, not a feeling.
- **Regulation:** Ability to bear losses (IDD Art 30; ESMA 80). Asks for facts, not feelings (ESMA 46).
- **Aviva:** Asks how reliant the client is on the money, for prompts only. It does not change the rating.
- **Zurich:** Asks whether the client has emergency savings. Used for capacity for loss, which Zurich reports but does not apply to the rating.

**Q2 Impact of a loss** – If this investment lost a large part of its value, what impact would this have on your finances?

| Answer | Points |
|---|---|
| A big impact: I would struggle to meet my living costs or commitments | 1 |
| Some impact: I would need to make adjustments to my plans, but I could manage | 2 |
| Little or no impact: I have other savings and income to rely on | 3 |

- **Why:** Q1 measures the cash buffer; Q2 measures how much rides on this money. The first answer is about hardship, not purpose, so pension money is not automatically Low.
- **Regulation:** Ability to bear losses (IDD Art 30; ESMA 12, 80).
- **Aviva:** Same reliance question as for Q1; prompts only.
- **Zurich:** Ours is based on Zurich's well-being question. Zurich reports capacity but does not limit the rating; we do.

Q1 + Q2 give capacity for loss: Low (2–3), Medium (4), High (5–6). Low limits the rating to 4.

**Q3 Investment horizon** – How long do you plan to hold this investment?

_Built as a slider_ in whole years, from "Less than 1 year" to "12 years or more", starting with no value. The band is shown as the client moves it.

| Answer | Highest rating allowed |
|---|---|
| Under 3 years | 3 |
| 3 years to under 5 years | 4 |
| 5 years or more | No limit |

- **Why:** Higher-risk funds need time to recover from falls. The ESMA scale assumes 5 years or more.
- **Regulation:** Holding period (ESMA 24, 37, 80).
- **Aviva:** Asks the term for its charts only. It does not change the rating.
- **Zurich:** Asks the term and lowers the score for short terms, with a warning at 5 years or less.

**Q4 Largest fall you could accept** – If you invested €10,000 today and its value fell over the next 12 months, what is the maximum drop you would be willing to accept before considering a change to your investment?

_Built as a slider_ from "No fall" to "40% or more", in 0.5% steps, starting with no value. The € amount is shown as the client moves it.

| Answer | Rating |
|---|---|
| 0% to under 2.5% (no fall, or under €250) | 1 |
| 2.5% to under 7% (about €250 to €700) | 2 |
| 7% to under 15% (about €700 to €1,500) | 3 |
| 15% to under 25% (about €1,500 to €2,500) | 4 |
| 25% to under 40% (about €2,500 to €4,000) | 5 |
| 40% or more (about €4,000 or more) | 6 |

- **Why:** Each mark is a bad year for a fund at that level. This answer anchors the attitude rating.
- **Regulation:** This is ESMA's own example: the loss the client would accept over a given period (ESMA 46), in concrete figures (ESMA 31, 48).
- **Aviva:** The same question and range (0–40% over 12 months). It is Aviva's main driver, with the objective.
- **Zurich:** Asks which range of values after 5 years would be acceptable, and how concerned the client would be by a 10% fall. A feeling, not an amount.

**Q5 Reaction to a fall** – Six months after you invest €10,000, markets fall and your investment is worth €8,000. What would you most likely do?

| Answer | Rating |
|---|---|
| Sell everything | 2 |
| Sell part, to limit further losses | 3 |
| Keep it and wait for a recovery | 5 |
| Keep it and invest more | 6 |

- **Why:** Asks what the client would do, not how they would feel. Based on Irish Life's question, with a figure added.
- **Regulation:** The client's own choices when facing a loss, with figures (ESMA 31, 48).
- **Aviva:** No behaviour question.
- **Zurich:** Asks how concerned the client would be, a feeling rather than an action, and how much more risk they would take.

**Q6 Objective** – What is your investment objective?

| Answer | Rating |
|---|---|
| To keep my money safe: I want to get back at least what I put in | 1 |
| A return a little better than a deposit account, with very little risk | 2 |
| Growth a little above inflation, accepting small rises and falls in value | 3 |
| Steady growth over the long term, accepting that the value will go up and down | 4 |
| Strong growth over the long term, accepting large rises and falls in value | 5 |
| The highest return possible, accepting a high level of risk to get it | 6 |

- **Why:** Set against Q4 and Q5, it shows a cautious attitude with ambitious objectives, or the reverse.
- **Regulation:** Investment objectives (IDD Art 30; ESMA 12); contradictions between objectives and attitude (ESMA 51).
- **Aviva:** Five steps, from a guarantee to maximising returns. Combined with the loss answer, it sets Aviva's rating.
- **Zurich:** Five steps, from protecting capital to maximising returns. Our level 3 matches Zurich's "beat inflation without significant risk".

The attitude rating is the middle of the Q4, Q5 and Q6 ratings, and no more than one level above Q4.

**Q7 Knowledge and experience** – Which statement best describes your investment knowledge and experience?

| Answer | Knowledge level |
|---|---|
| I have not invested before, other than in deposits or savings accounts | Low |
| I have a pension or an investment, but I have not followed how its value changes or what it invests in | Low |
| In the last 5 years I have held funds, shares or bonds. I have seen their value fall as well as rise, and I know that spreading money across many investments reduces risk but does not remove it | Medium |
| I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High |
| I work or have worked in investments or financial services, or hold a finance qualification, and I invest regularly | High |

- **Why:** Each answer describes what the client has done and how recently, not how they rate themselves.
- **Regulation:** Knowledge and experience (IDD Art 30); avoid self-assessment (ESMA 46–47).
- **Aviva:** Asks how experienced the client is, partly a self-rating. Prompts only.
- **Zurich:** A self-rating from Expert to None, which ESMA advises against. It lowers the score; ours raises a flag only.

**Q8 Knowledge check** – Put these four investments in order, from the one with the lowest risk of losing money to the one with the highest.

_Built as_ four items the client drags into order, shown in a mixed order, with an "I don't know" box.

| Answer | Right position |
|---|---|
| A savings deposit | 1 (lowest risk) |
| Government bonds | 2 |
| A fund holding shares in many different companies | 3 |
| Shares in a single company | 4 (highest risk) |
| I don't know | Counts as wrong |

- **Why:** Checks Q7 with a question that has a right answer, and tests that spreading money is less risky than one share.
- **Regulation:** Test real knowledge (ESMA 46); guard against over-confidence (ESMA 52); understanding of risk and concentration (ESMA 31).
- **Aviva:** Explains the types of risk on a page, but tests nothing.
- **Zurich:** No question with a right answer. Q8 is unique to our profiler.

The knowledge level comes from Q7, one level higher if Q8 is right and one lower if it is wrong or "I don't know". It does not change the rating; low knowledge with a rating of 5 or more is flagged.

**DOB Date of birth** – What is your date of birth?

_Not asked_ when the quotation tool already holds it.

- **Why:** Age does not change the rating; the horizon does that work. Clients aged 65 or over with a rating of 5 or more are flagged.
- **Regulation:** Age (ESMA 24); more care with older clients, who may be vulnerable (ESMA 40).
- **Aviva:** Age is not asked.
- **Zurich:** Age lowers the score, so older clients get a lower profile. Ours uses a flag only, because the horizon already limits the rating.

## How it meets the regulations

The broker gives the advice, so the suitability duty is theirs (IDD Article 30; Consumer Protection Code for PRSA and ARF). AGL's part is a clear, accurate and tested tool, and product governance. The ESMA suitability guidelines are used as the good-practice benchmark.

| Requirement | How the profiler meets it | Status |
|---|---|---|
| Ability to bear losses | Q1 and Q2; low capacity limits the rating | Met |
| Risk tolerance and objectives | Q4 asks the € loss the client would accept (ESMA's own example); Q5 and Q6 check it | Met |
| Holding period | Q3 limits the rating for short horizons | Met |
| Knowledge and experience | Q7, checked by Q8, which has a right answer | Met |
| Objective, clear, unbiased questions | Facts and actions, not self-ratings; nothing preselected; no skipping | Met |
| Contradictions and changed answers | Flagged for the broker and recorded | Met |
| Records | Answers, rating, limits, flags, any override and reason, version and date | Met |
| Tested and documented | Every rule is documented and tested automatically; 50 clients compared with Aviva and Zurich | Partly met |
| Sustainability preferences | Recorded by the broker; the full questions are built but switched off | Partly met |

The fact find (income, assets, debts, dependants, health), the demands and needs test, vulnerable clients and reviews stay with the broker. A one-page broker guidance note from AGL should say so.

## How it compares with Aviva and Zurich

| | Proposed | Aviva | Zurich |
|---|---|---|---|
| Questions | 8 + date of birth | 5 + term | 9 |
| How the rating is set | Middle of three attitude answers, anchored on the loss answer, then limited | Lookup of objective × largest loss | Points added up, adjusted for age, term and knowledge |
| Capacity for loss | 2 questions; Low limits the rating to 4 | Prompts only | 2 questions; reported, does not change the rating |
| Time horizon | Limits the rating | Not used | Lowers the score |
| Age and knowledge | Flags for the broker | Prompts only | Lower the score |
| Scale | 1–6 | 0 (no risk), then 3–6 | 1–7 |

## Results: 50 test clients

50 clients were run through all three tools on 28/10/2026. The first 8 test the edges; the other 42 are random. Zurich was run on its live website; Aviva's result comes from the scoring table in its tool.

| Pair | Same rating | Within one level | Average gap |
|---|---|---|---|
| Proposed and Zurich | 22 of 50 | 42 of 50 | 0.72 |
| Proposed and Aviva | 17 of 50 | 39 of 50 | 0.92 |
| Aviva and Zurich (for reference) | 15 of 50 | 29 of 50 | 1.28 |

- **Closest to both:** The proposal agrees with each competitor more often than they agree with each other. On average it sits level with Zurich and slightly below Aviva.
- **Aviva runs high:** It ignores capacity for loss and the time horizon, and it gives 0 (deposit-type only) to cautious clients instead of 1 or 2.
- **Where we are stricter:** A keen client with no savings gets 4 from us and 6 from both competitors (capacity limit). An adventurous client who needs the money in 2 years gets 3 from us, 5 from Zurich and 6 from Aviva (time limit).
- **Where Zurich is lower:** Four clients would sell everything after a 20% fall but gave aggressive answers elsewhere. We take the middle answer and rate them 3 to 5; Zurich gives 1 to 3. The largest gap with Zurich is 2 levels.
- **Caveat:** Each client's answers were translated into the other tools' questions by us, so a one-level difference can come from the translation.

## Decisions for Compliance

1. **Capacity limit:** Keep Low capacity at a maximum of 4, which is stricter than both competitors, and decide whether Medium capacity should also be limited.
2. **Clients who would sell after a fall:** Decide whether a "sell everything" answer to Q5 should limit the rating, instead of being outvoted by the other two answers.
3. **Time limits:** Confirm 3 / 4 / no limit at 3 and 5 years against the funds' recommended holding periods.
4. **Age and knowledge:** Confirm they stay as flags only, or decide on a limit (for example at age 80).
5. **Adviser changes:** The adviser can lower or raise the rating (up to 6) with a reason. Decide whether raising it past a time or capacity limit needs more than a reason, for example a confirmation that the client was told of the limit.
6. **Wording and client testing:** Approve the client wording and test it with a small group of clients before launch.
