# Zurich Life Risk Profiler: questions and scoring (reverse-engineered)

Source: https://www.zurichlife.ie/pensions-retirement/calculators/risk-profiler/riskProfiler
Tested 13/10/2026 (about 110 runs, headless Edge). The scoring is calculated server-side, so nothing here is read from
source code. Everything below is inferred from inputs and outputs. **Capacity for Loss is fully established. The Risk
Profile (1 to 7) is only partly established** (see "Gaps").

## Flow

1. `startBroker`: sustainability question (Yes / No). Tested with "No".
2. `sustainabilityQuestion`: "I accept" / "I do not accept" (illustrative tool, not advice).
3. `complianceQuestion` page: one form (`riskProfiler`, POST) with the 9 questions below.
4. Result page: Risk Profile, Capacity For Loss, Pension Investment Strategy (GuidePath).

The site is behind Incapsula bot protection (reese84), so a real browser is needed. Plain HTTP requests will not work.

## Questions (form field, answer values)

Option 1 is the first one shown. For 3 to 7 the lower value is the more aggressive answer.

| # | Field | Question | Values |
|---|---|---|---|
| 1 | `clientAge` | What age are you? | Slider 19 to 100, step 1 |
| 2 | `lengthOfInvestment` | How long do you plan to invest for? | Slider 1 to 15 years, step 1 |
| 3 | `knowledgeOfInvesting` | How would you describe your investment knowledge? | 1 Expert, 2 High, 3 Moderate, 4 Little, 5 None |
| 4 | `investmentObjective` | What is your investment objective? | 1 Maximise returns regardless of risk; 2 High returns without excessive risk; 3 Good returns with limited risk to capital; 4 Beat inflation without significant risk to capital; 5 Protect my capital |
| 5 | `investmentDecline` | How concerned would you be with a short-term (6 months) 10% decline in your investment? | 1 Not concerned; 2 Slightly; 3 Moderately; 4 Very; 5 Extremely concerned |
| 6 | `investmentChoice` | What is your appetite for taking risk? If you invested €10,000 today, what range of values would you consider acceptable after 5 years? | 1 €6,300 to €17,200; 2 €6,800 to €16,300; 3 €7,900 to €14,000; 4 €8,900 to €12,100; 5 €9,800 to €11,600 |
| 7 | `increaseInvestmentbyRisk` | What is your approach to taking risks? If you could increase the value of your investment by taking more risk, would you: | 1 Take a LOT more risk with ALL of your money; 2 A LITTLE more risk with ALL; 3 A LITTLE more risk with SOME; 4 Be UNWILLING to take any more risk |
| 8 | `financialEmergency` | Do you have other savings available should you encounter a financial emergency? | 1 No other savings; 2 Some savings, nothing earmarked; 3 Yes, specific savings for an emergency |
| 9 | `financialWellBeing` | If this investment performed poorly, what impact would this have on your financial well-being? | 1 Big impact, required for a specific purpose; 2 Some impact, would need to adjust plans; 3 No impact, I have other savings |

Q1 to Q7 are the attitude-to-risk inputs. Q8 and Q9 are the capacity-for-loss inputs.

## Outputs

- **Risk Profile 1 to 7** (shown as "Risk Profile N - Low/Medium/High risk" with a description).
- **Capacity For Loss**: Low / Medium / High, with a paragraph of text.
- **Pension Investment Strategy**: Low / Medium / High risk / return GuidePath strategy (non-PRSA only).
  A "Portfolio Builder" button is also shown.

## Capacity For Loss (established, all 9 combinations tested)

Capacity = Q8 + Q9 (each 1 to 3):

| Q8 + Q9 | Capacity | Combinations (Q8,Q9) |
|---|---|---|
| 2 to 3 | **Low** | (1,1) (1,2) (2,1) |
| 4 to 5 | **Medium** | (2,2) (1,3) (3,1) (2,3) (3,2) |
| 6 | **High** | (3,3) |

Q8 and Q9 do **not** affect the Risk Profile number. This was checked at the mid, all-aggressive and all-cautious
baselines.

## Risk Profile 1 to 7 (partly established)

Inputs: Q1 to Q7 only. Findings are monotonic: older age, shorter horizon, or a more cautious answer never raises the
profile.

**Corners**

| Answers | Profile | Capacity | Strategy |
|---|---|---|---|
| All aggressive (age 19, 15 yrs, Q3 to Q7 = 1, Q8 = Q9 = 3) | 7 | High | High |
| All cautious (age 100, 1 yr, Q3 to Q5 = 5, Q6 = 5, Q7 = 4, Q8 = Q9 = 1) | 1 | Low | Low |
| Mid (age 40, 10 yrs, Q3 to Q7 = 3, Q8 = Q9 = 2) | 4 | Medium | Medium |

**One-at-a-time sweeps** (all other answers held at the baseline)

From the **mid** baseline (profile 4):

| Input | Result |
|---|---|
| Age | 19 to 40 gives 4; 41 to 100 gives 3 |
| Horizon | 1 to 9 yrs gives 3; 10 to 15 yrs gives 4 |
| Q3 knowledge | 1, 2, 3 give 4; 4, 5 give 3 |
| Q4 objective | 1, 2, 3 give 4; 4, 5 give 3 |
| Q5 decline | 1, 2, 3 give 4; 4, 5 give 3 |
| Q6 range | 1, 2, 3 give 4; 4, 5 give 3 |
| Q7 approach | 1, 2, 3 give 4; 4 gives 3 |

From the **all-aggressive** baseline (profile 7):

| Input | Result |
|---|---|
| Age | 19 to 60 gives 7; 70 and 100 give 6 |
| Horizon | 15 yrs gives 7; 1, 5, 10 yrs give 6 (11 to 14 not tested) |
| Q3 knowledge | 1, 2, 3 give 7; 4, 5 give 6 |
| Q4 to Q6 | 1, 2 give 7; 3, 4, 5 give 6 |
| Q7 approach | 1, 2 give 7; 3, 4 give 6 |

From the **all-cautious** baseline (profile 1): no single input moved to a more aggressive value changes the result
(all stayed 1, including age 19 and a 15-year horizon).

**Strategy label** seen: profile 1 gives Low; 3 and 4 give Medium; 6 and 7 give High. Profiles 2 and 5 were not
observed.

**What the pattern says.** The same answer has different effects at different baselines (for example Q4 = 3 changes
nothing at the mid baseline but costs a profile at the aggressive one). So it is not a per-question lookup and not a
plain minimum. It looks like an additive points score across Q1 to Q7, banded into 7 profiles. The mid case sits near
the top of its band, so improvements do not lift it but worsening does.

## Gaps (not tested)

- The points per answer and the band edges. Pinning these down needs a designed set of roughly 150 to 300 more runs.
- Horizon 11 to 14 years and ages 61 to 69 at the aggressive baseline.
- Profiles 2 and 5, and their strategy labels.
- The "Yes" branch of the sustainability assessment.
- Whether the PRSA/non-PRSA choice changes the strategy text.
- Interactions between pairs of inputs, such as age with horizon.

## Reproducing

The harness was a small Selenium (Edge, headless) script. It set `clientAge` and `lengthOfInvestment` through the hidden
inputs `#riskProfiler_clientAge` and `#riskProfiler_lengthOfInvestment`, clicked the radio `#riskProfiler_<field><value>`,
submitted with `button[name=navButton][value=Next]`, and read "Risk Profile N" and "Capacity For Loss - X" from the
result page. It used the Prev button to go back between runs. The scripts and raw results are not in the repo
(`%TEMP%\zrp`).
