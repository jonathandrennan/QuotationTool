# Risk profiler: ten worked test cases

Ten example clients run through the risk profiler, with the answers each gives, how the tool works out the rating, and why that rating suits the client. Draft for Compliance review. Questionnaire version 4.0 (draft 22/10/2026); ages and results as at 28/10/2026, the date of the Aviva and Zurich comparison.

_Generated alongside `Risk-Profiler-Test-Cases.docx` by `tests/build_risk_profiler_cases.js`; edit the cases in `tests/risk_profiler_cases.js`, then rebuild._

## Summary

The cases are chosen so that every rule in the tool decides at least one of them, and every rating from 1 to 6 appears. Each result below is produced by the tool itself. The same ten cases are checked by the automated test, so if a rule changes, the test fails until this document is updated.

| Case | Client | Age | Rating | Flags | What it shows |
|---|---|---|---|---|---|
| 1 | Most cautious | 80 | 1 (Very Low) | F4 | All answers cautious: the lowest rating, and a horizon warning |
| 2 | Most adventurous | 25 | 6 (High) | – | All answers adventurous: the highest rating the tool gives, no flags |
| 3 | Mid-range | 40 | 4 (Medium) | – | Typical client: consistent answers give the matching rating |
| 4 | Keen but no cushion | 30 | 4 (Medium) | F3 | Capacity for loss overrides an adventurous attitude |
| 5 | Cautious but wealthy | 60 | 1 (Very Low) | – | High capacity does not push a cautious client up |
| 6 | Adventurous, short horizon | 50 | 3 (Low to Medium) | F4 | A short horizon overrides an adventurous attitude |
| 7 | Adventurous in retirement | 70 | 5 (Medium to High) | F5 | Age raises a flag for the adviser, not an automatic cut |
| 8 | Accepts only 2.5% but wants the highest return | 45 | 3 (Low to Medium) | F1 | Contradictory answers: the loss figure anchors the rating |
| 9 | First-time investor with a growth attitude | 35 | 5 (Medium to High) | F2 | Low knowledge raises a flag; it does not cut the rating |
| 10 | Cautious retiree | 67 | 2 (Low) | – | Rating 2: a cautious attitude respected; the knowledge check lifts the level |

## How the rating is worked out

| Step | Rule |
|---|---|
| 1. Attitude | The middle of the Q4, Q5 and Q6 ratings, and no more than one level above the loss answer (Q4) |
| 2. Limits | Under 3 years: no more than 3. 3 to under 5 years: no more than 4. Low capacity for loss (Q1 + Q2 = 2 or 3 points): no more than 4 |
| 3. Rating | The lower of the attitude and the limits, from 1 to 6. The adviser may lower or raise it, with a recorded reason |
| Flags | F1 mixed attitude, F2 low knowledge with rating 5+, F3 capacity limit, F4 short horizon, F5 age 65+ with rating 5+, F6 answers changed. Flags never change the rating |

A "bad year" below is a fall of twice a fund's volatility, about 1 year in 40, taken at the middle of the ESMA band for each rating: about 2.5% for rating 2, 7% for 3, 15% for 4, 25% for 5 and 40% for 6 (Proposal, Appendix B). These are the marks on the Q4 slider. So a client's Q4 answer can be read directly against the funds a rating allows.

## The cases

### Case 1. Most cautious: rating 1

Aged 80. Needs the money within a year. Has less than 3 months of savings and would struggle if this investment fell. Has only ever used deposit accounts.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | Less than 3 months | 1 point |
| Q2 Impact of a loss | A big impact: I would struggle to meet my living costs or commitments | 1 point |
| Q3 Investment horizon | 1 year | Limit 3 |
| Q4 Largest fall you could accept | No fall | Rating 1 |
| Q5 Reaction to a fall | Sell everything | Rating 2 |
| Q6 Objective | To keep my money safe: I want to get back at least what I put in | Rating 1 |
| Q7 Knowledge and experience | I have not invested before, other than in deposits or savings accounts | Low stated |
| Q8 Knowledge check | I don't know | Counts as wrong: one level down |
| Age | 80 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 2 points | Low |
| Attitude | Middle of 1, 2, 1 is 1; no more than Q4 + 1 = 2 | 1 |
| Limits | Time 3 (does not bite); capacity 4 (does not bite) | 3 (not reached) |
| Risk rating | Lower of the attitude and the limits | **1 (Very Low)** |
| Knowledge | Low stated; Q8 "I don't know" | Low |
| Flags | Shown to the adviser; they do not change the rating | F4 Short horizon |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 0 (deposit-type only) / 1 |

> **Why 1 is suitable:** Every attitude answer says the client wants to avoid any loss: no fall accepted (1), would sell everything after a fall (2), wants their money back (1). A rating of 1 means funds whose value barely moves (volatility under 0.5%). That is the only level that matches.
> **The limits agree:** The 1-year horizon (limit 3) and low capacity for loss (limit 4) would both hold the rating down, but the attitude is already below them. Every part of the profile points the same way.
> **What the adviser sees:** F4 Short horizon is still raised. At 1 year, even a rating-1 fund may be the wrong product, so the adviser should consider whether a deposit fits better. Knowledge is Low, but at rating 1 there is nothing to flag.

### Case 2. Most adventurous: rating 6

Aged 25. Plans to invest for 12 years or more. Would accept a fall of €4,000 or more on €10,000, and would invest more after a fall. Wants the highest return. Has 12 months or more of savings, a loss would hardly matter, and works in financial services.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 12 months or more | 3 points |
| Q2 Impact of a loss | Little or no impact: I have other savings and income to rely on | 3 points |
| Q3 Investment horizon | 12 years or more | No limit |
| Q4 Largest fall you could accept | 40% or more (€4,000 or more on €10,000) | Rating 6 |
| Q5 Reaction to a fall | Keep it and invest more | Rating 6 |
| Q6 Objective | The highest return possible, accepting a high level of risk to get it | Rating 6 |
| Q7 Knowledge and experience | I work or have worked in investments or financial services, or hold a finance qualification, and I invest regularly | High stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 25 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 6 points | High |
| Attitude | Middle of 6, 6, 6 is 6; no more than Q4 + 1 = 7 (above the top rating, 6) | 6 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **6 (High)** |
| Knowledge | High stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | None |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 6 / 7 |

> **Why 6 is suitable:** All three attitude answers are at the top (6, 6, 6). Capacity for loss is High (6 points), the horizon is well beyond the 5 years the ESMA scale assumes, and the client ranked the four investments correctly. Nothing in the profile argues for less.
> **Why not 7:** The tool stops at 6, as Aviva does. Even the most adventurous client is not put into the most volatile funds (volatility over 25%) by the tool alone. The adviser can still discuss them.

### Case 3. Mid-range: rating 4

Aged 40. Investing for 10 years. Would accept a fall of €1,500 on €10,000, and would keep the investment and wait for a recovery. Wants steady growth. Has 3 to 11 months of savings and would need to adjust their plans after a large loss. Has held funds in the last 5 years.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 3 to 11 months | 2 points |
| Q2 Impact of a loss | Some impact: I would need to make adjustments to my plans, but I could manage | 2 points |
| Q3 Investment horizon | 10 years | No limit |
| Q4 Largest fall you could accept | 15% (€1,500 on €10,000) | Rating 4 |
| Q5 Reaction to a fall | Keep it and wait for a recovery | Rating 5 |
| Q6 Objective | Steady growth over the long term, accepting that the value will go up and down | Rating 4 |
| Q7 Knowledge and experience | In the last 5 years I have held funds, shares or bonds. I have seen their value fall as well as rise, and I know that spreading money across many investments reduces risk but does not remove it | Medium stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 40 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 4 points | Medium |
| Attitude | Middle of 4, 5, 4 is 4; no more than Q4 + 1 = 5 | 4 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **4 (Medium)** |
| Knowledge | Medium stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | None |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 4 / 4 |

> **Why 4 is suitable:** The three attitude answers agree to within one level (4, 5, 4) and the middle is 4. A €1,500 fall on €10,000 (15%) is a bad year for a rating-4 fund: twice the middle of its 5–10% volatility band. So the fall the client says they can accept is the fall a rating-4 fund can deliver.
> **Why the rating is not 5:** The "wait for a recovery" answer (5) is outvoted by the loss and objective answers. One brave answer does not lift the rating.
> **No limits:** Medium capacity and a 10-year horizon do not limit the rating. All three tools give 4.

### Case 4. Keen but no cushion: rating 4

Aged 30. Investing for 10 years, and as keen as client 2: would accept a 40% fall, would invest more after a fall, wants the highest return. But has less than 3 months of savings and would struggle to meet living costs if this investment lost a large part of its value.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | Less than 3 months | 1 point |
| Q2 Impact of a loss | A big impact: I would struggle to meet my living costs or commitments | 1 point |
| Q3 Investment horizon | 10 years | No limit |
| Q4 Largest fall you could accept | 40% or more (€4,000 or more on €10,000) | Rating 6 |
| Q5 Reaction to a fall | Keep it and invest more | Rating 6 |
| Q6 Objective | The highest return possible, accepting a high level of risk to get it | Rating 6 |
| Q7 Knowledge and experience | I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 30 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 2 points | Low |
| Attitude | Middle of 6, 6, 6 is 6; no more than Q4 + 1 = 7 (above the top rating, 6) | 6 |
| Limits | Capacity 4 (applies) | Capped at 4 |
| Risk rating | Lower of the attitude and the limits | **4 (Medium)** |
| Knowledge | High stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | F3 Rating limited by capacity for loss |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 6 / 6 |

> **Why 4 is suitable:** On attitude alone the client is a 6. But a bad year for a rating-6 fund is a fall of about 40% (€4,000 on €10,000), and this client says that would leave them struggling. Being willing to take a loss is not the same as being able to bear it. The rules require both (IDD Art 30; ESMA 80). Low capacity limits the rating to 4, which still gives long-term growth over 10 years.
> **What the client and adviser see:** The client is told on the result screen that their rating is limited because a large fall would be hard to bear. F3 tells the adviser that the attitude alone gave 6. If the fact find shows wealth the client left out, the adviser can raise the rating, and the reason is recorded in the Statement of Suitability.
> **Against competitors:** Aviva and Zurich both give 6: neither lets capacity for loss change the rating. This is where the proposal is deliberately stricter.

### Case 5. Cautious but wealthy: rating 1

Aged 60. Investing for 12 years or more. Has 12 months or more of savings and a loss would hardly matter. But would accept only a €200 fall, would sell everything after a fall, and wants their money back.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 12 months or more | 3 points |
| Q2 Impact of a loss | Little or no impact: I have other savings and income to rely on | 3 points |
| Q3 Investment horizon | 12 years or more | No limit |
| Q4 Largest fall you could accept | 2% (€200 on €10,000) | Rating 1 |
| Q5 Reaction to a fall | Sell everything | Rating 2 |
| Q6 Objective | To keep my money safe: I want to get back at least what I put in | Rating 1 |
| Q7 Knowledge and experience | I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 60 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 6 points | High |
| Attitude | Middle of 1, 2, 1 is 1; no more than Q4 + 1 = 2 | 1 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **1 (Very Low)** |
| Knowledge | High stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | None |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 0 (deposit-type only) / 2 |

> **Why 1 is suitable:** The client could afford a loss but does not want one. Capacity for loss can only lower the rating, never raise it. Putting a client into higher-risk funds because they can bear losses they have said they will not accept would ignore their risk tolerance (IDD Art 30; ESMA 46).
> **The mirror of case 4:** Case 4 has the attitude but not the capacity; this client has the capacity but not the attitude. Both are held to the lower of the two. The tool takes the safer reading either way.

### Case 6. Adventurous, short horizon: rating 3

Aged 50. As adventurous as client 2, with high capacity for loss and regular investing experience. But needs the money in 2 years.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 12 months or more | 3 points |
| Q2 Impact of a loss | Little or no impact: I have other savings and income to rely on | 3 points |
| Q3 Investment horizon | 2 years | Limit 3 |
| Q4 Largest fall you could accept | 40% or more (€4,000 or more on €10,000) | Rating 6 |
| Q5 Reaction to a fall | Keep it and invest more | Rating 6 |
| Q6 Objective | The highest return possible, accepting a high level of risk to get it | Rating 6 |
| Q7 Knowledge and experience | I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 50 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 6 points | High |
| Attitude | Middle of 6, 6, 6 is 6; no more than Q4 + 1 = 7 (above the top rating, 6) | 6 |
| Limits | Time 3 (applies) | Capped at 3 |
| Risk rating | Lower of the attitude and the limits | **3 (Low to Medium)** |
| Knowledge | High stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | F4 Short horizon |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 6 / 5 |

> **Why 3 is suitable:** A rating-6 fund can fall about 40% in a bad year and may need several years to recover. With 2 years there may be no time to wait. Higher-risk funds are built for holding periods of 5 years or more, as the ESMA scale assumes. Under 3 years the rating is limited to 3 (volatility 2–5%), where a bad year is a fall of about 7%, which can be made back within the horizon.
> **What the client and adviser see:** The client is told that the horizon limits the rating. F4 tells the adviser that the attitude alone gave 6.
> **Against competitors:** Zurich lowers for the term but gives 5, and Aviva ignores the term and gives 6. Ours is the only result that respects the holding period (ESMA 80).

### Case 7. Adventurous in retirement: rating 5

Aged 70. Plans to hold for 10 years, for example an ARF they will draw from slowly or leave to family. Would accept a €3,000 fall on €10,000, would invest more after a fall, and wants strong growth. Has good savings, a loss would hardly matter, and invests regularly.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 12 months or more | 3 points |
| Q2 Impact of a loss | Little or no impact: I have other savings and income to rely on | 3 points |
| Q3 Investment horizon | 10 years | No limit |
| Q4 Largest fall you could accept | 30% (€3,000 on €10,000) | Rating 5 |
| Q5 Reaction to a fall | Keep it and invest more | Rating 6 |
| Q6 Objective | Strong growth over the long term, accepting large rises and falls in value | Rating 5 |
| Q7 Knowledge and experience | I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 70 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 6 points | High |
| Attitude | Middle of 5, 6, 5 is 5; no more than Q4 + 1 = 6 | 5 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **5 (Medium to High)** |
| Knowledge | High stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | F5 Age |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 5 / 5 |

> **Why 5 is suitable:** The attitude answers agree (5, 6, 5) and the middle is 5. Capacity is High, the horizon is 10 years, and the knowledge check is right. On these answers the client can take, and wants, a rating of 5.
> **Why age does not lower it:** Age is not a reason to cut risk on its own. What matters is how long the money is invested and whether the client can bear losses, and both are already measured. A 70-year-old investing for 10 years is in the same position as a 50-year-old investing for 10 years. Zurich deducts for age; we do not.
> **What the adviser sees:** F5 Age asks the adviser to check that a rating of 5 suits the client's wider circumstances (health, income needs, possible vulnerability: ESMA 24, 40). The adviser makes that call, with the facts in front of them.

### Case 8. Accepts only 2.5% but wants the highest return: rating 3

Aged 45. Investing for 10 years. Says they want the highest return and would invest more after a fall. But the largest fall they would accept is €250 on €10,000.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 3 to 11 months | 2 points |
| Q2 Impact of a loss | Some impact: I would need to make adjustments to my plans, but I could manage | 2 points |
| Q3 Investment horizon | 10 years | No limit |
| Q4 Largest fall you could accept | 2.5% (€250 on €10,000) | Rating 2 |
| Q5 Reaction to a fall | Keep it and invest more | Rating 6 |
| Q6 Objective | The highest return possible, accepting a high level of risk to get it | Rating 6 |
| Q7 Knowledge and experience | In the last 5 years I have held funds, shares or bonds. I have seen their value fall as well as rise, and I know that spreading money across many investments reduces risk but does not remove it | Medium stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 45 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 4 points | Medium |
| Attitude | Middle of 2, 6, 6 is 6; no more than Q4 + 1 = 3 | 3 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **3 (Low to Medium)** |
| Knowledge | Medium stated; Q8 right | High |
| Flags | Shown to the adviser; they do not change the rating | F1 Mixed attitude |
| Aviva / Zurich | Same client in their tools (28/10/2026) | 3 / 5 |

> **Why 3 is suitable:** Two answers say 6 and the loss answer says 2. Taking the middle would give 6. But the loss answer is the only one with a concrete figure, and a rating-6 fund can fall about €4,000 in a bad year. A client who acts at €250 would very likely sell near the bottom. So the attitude can be at most one level above the loss answer, giving 3. This is what ESMA asks for: base the assessment on concrete figures, not on wishes (ESMA 31, 46, 48).
> **Why not 2:** The other two answers show some appetite for growth, so the tool allows one level above the loss answer rather than holding the client at it.
> **What the adviser sees:** F1 Mixed attitude shows the three answers (2, 6, 6) and asks the adviser to talk through how much risk the client really wants. If the client then moves the Q4 slider, F6 records that the answers changed after the result was shown. Aviva also gives 3; Zurich adds up points and gives 5.

### Case 9. First-time investor with a growth attitude: rating 5

Aged 35. Investing a lump sum for 12 years or more. Would accept a €3,000 fall on €10,000, would keep the investment and wait for a recovery, and wants strong growth. Has 3 to 11 months of savings and a partner's income, so a loss would have little impact. Has never invested beyond deposit accounts, and ticked "I don't know" on the knowledge check.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 3 to 11 months | 2 points |
| Q2 Impact of a loss | Little or no impact: I have other savings and income to rely on | 3 points |
| Q3 Investment horizon | 12 years or more | No limit |
| Q4 Largest fall you could accept | 30% (€3,000 on €10,000) | Rating 5 |
| Q5 Reaction to a fall | Keep it and wait for a recovery | Rating 5 |
| Q6 Objective | Strong growth over the long term, accepting large rises and falls in value | Rating 5 |
| Q7 Knowledge and experience | I have not invested before, other than in deposits or savings accounts | Low stated |
| Q8 Knowledge check | I don't know | Counts as wrong: one level down |
| Age | 35 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 5 points | High |
| Attitude | Middle of 5, 5, 5 is 5; no more than Q4 + 1 = 6 | 5 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **5 (Medium to High)** |
| Knowledge | Low stated; Q8 "I don't know" | Low |
| Flags | Shown to the adviser; they do not change the rating | F2 Low knowledge, high rating |

> **Why 5 is suitable:** Attitude (5, 5, 5), capacity (High) and horizon (12 years) all support 5. The client has given a clear, consistent answer about the risk they want and can bear.
> **Why low knowledge does not lower it:** Knowledge is about whether the client understands what they are buying. The adviser can fix that by explaining it. Cutting the rating would steer every new investor into low-growth funds for 12 years, whatever their attitude and capacity. So the tool keeps the rating and raises a flag.
> **What the adviser sees:** F2 Low knowledge, high rating asks the adviser to check that the client understands how the recommended funds can rise and fall, and that 5 still suits them once they do (ESMA 51–52). The Q8 explanation is also shown to the client with the result.

### Case 10. Cautious retiree: rating 2

Aged 67 and retired. Investing for 6 years. Would accept a €500 fall on €10,000, would sell part after a fall, and wants a little more than a deposit account. Has 12 months or more of savings but would need to adjust their plans after a large loss. Has a pension they never followed, but ranked the four investments correctly.

| Question | Answer | Scores |
|---|---|---|
| Q1 Financial cushion | 12 months or more | 3 points |
| Q2 Impact of a loss | Some impact: I would need to make adjustments to my plans, but I could manage | 2 points |
| Q3 Investment horizon | 6 years | No limit |
| Q4 Largest fall you could accept | 5% (€500 on €10,000) | Rating 2 |
| Q5 Reaction to a fall | Sell part, to limit further losses | Rating 3 |
| Q6 Objective | A return a little better than a deposit account, with very little risk | Rating 2 |
| Q7 Knowledge and experience | I have a pension or an investment, but I have not followed how its value changes or what it invests in | Low stated |
| Q8 Knowledge check | Right order | Right: one level up |
| Age | 67 | – |

| Step | Working | Result |
|---|---|---|
| Capacity for loss | Q1 + Q2 = 5 points | High |
| Attitude | Middle of 2, 3, 2 is 2; no more than Q4 + 1 = 3 | 2 |
| Limits | None: 5 years or more, and capacity not Low | None |
| Risk rating | Lower of the attitude and the limits | **2 (Low)** |
| Knowledge | Low stated; Q8 right | Medium |
| Flags | Shown to the adviser; they do not change the rating | None |

> **Why 2 is suitable:** The attitude answers agree (2, 3, 2) and the middle is 2. A bad year for a rating-2 fund (volatility 0.5–2%) is a fall of about €250, inside the €500 the client would accept. A rating-3 fund could fall about €700, which is more than they would accept.
> **Room to take more, not used:** With High capacity and 6 years, the limits would allow any rating. The tool still follows the client's own attitude, as in case 5.
> **Knowledge check at work:** The client describes themselves modestly (Low), but the right answer on Q8 lifts them to Medium: the check rewards real understanding as well as catching over-confidence. No age flag: F5 is aimed at older clients taking high risk (5 or more), not at everyone over 65.

## What the cases show

- **The rating follows the client's own attitude:** Cases 3, 5, 7, 9 and 10 have no limit that applies, and the rating is the level the client's answers point to, with the Q4 fall they accept in line with a bad year for that rating.
- **Losses the client cannot bear are kept out:** Low capacity (case 4) and a short horizon (case 6) hold an adventurous client down, and the client is told why. Aviva and Zurich do not do this for case 4, and do it only in part for case 6.
- **Wishes do not outweigh figures:** A client who wants the highest return but will accept only a small loss is rated on the loss (case 8).
- **Capacity never pushes a client up:** A wealthy client who does not want risk stays at 1 (case 5).
- **Age and knowledge prompt the adviser, not the tool:** They raise flags (cases 7 and 9) and leave the decision with the adviser, who has the fact find.
- **Every flag that affects a rating appears at least once:** F1 (case 8), F2 (case 9), F3 (case 4), F4 (cases 1 and 6) and F5 (case 7). F6 (changed answers) is about the record rather than the rating; the automated test covers it.

## Limits of these cases

- **Chosen, not random:** The cases show each rule working. The 50-client comparison with Aviva and Zurich in the Proposal is the wider test, and the automated test checks every combination of answers against the written rules.
- **One pattern is still open:** A client who would sell everything after a 20% fall but accepts a large loss on Q4 and wants strong growth is rated on the other two answers, for example 5 (clients 9 and 37 in the comparison). F1 flags it for the adviser, but whether "sell everything" should limit the rating is decision 2 for Compliance.
- **Bad-year figures are a model:** Real markets can fall further. The Q4 marks should be tested against our funds' worst 12-month falls and KID stress scenarios before sign-off.
