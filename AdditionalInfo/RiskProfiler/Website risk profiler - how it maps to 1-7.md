# Website risk profiler (riskprofile.allianzgloballife.ie): how it scores 1 to 7

Assessed on 12/10/2026 by reading the site's published JavaScript and then running the live site with controlled answers. The site is a port of the Italian workbook (`Allianz_Simulatore_Quest_IBIPs_FINALE.xlsm`): its functions are named after the workbook's cells (`J33`, `J57`, `J82` ...). All scoring runs in the browser.

## What the final rating is

The final "Sustainable Risk Profile (ESMA)" is a number from 1 to 7. In practice it is **the client's answer to the market-fall question, capped down by their liquid assets and investment time horizon, and by age.**

### Step 1: the market-fall question gives a tolerance score (1 to 7)

The seven options are not scored in the order they are shown:

| Option shown | Wording (short) | Tolerance score |
|---|---|---|
| 1 | Disinvest immediately | 1 |
| 2 | Keep it and wait to recover before selling | 2 |
| 6 | Look for professional advice only | 3 |
| 5 | Stay calm and wait, but look for professional advice | 4 |
| 3 | Hold and wait, for a positive long-term return | 5 |
| 4 | Keep it and partly increase the position | 6 |
| 7 | Keep it and partly increase the position, with an adviser | 7 |

### Step 2: financial sustainability (1 to 3) from liquid assets and time horizon

Liquid assets: 1 = up to €50k, 2 = €50k to €150k, 3 = over €150k. Time horizon: 1 = under 5 years, 2 = 6 to 10 years, 3 = over 10 years.

| | Horizon 1 | Horizon 2 | Horizon 3 |
|---|---|---|---|
| Assets 1 | 1 | 2 | 2 |
| Assets 2 | 2 | 2 | 3 |
| Assets 3 | 3 | 3 | 3 |

### Step 3: the rating

| Sustainability | Tol 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| 3 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| 2 | 1 | 2 | 3 | 4 | 5 | 6 | 6 |
| 1 | 1 | 1 | 2 | 3 | 4 | 5 | 6 |

Age rule: a result of 7 for a client aged 81 or over becomes 6. Exactly 80 is not capped.

## How it differs from the workbook

1. **Four defects mean most answers are ignored.** Employment, health, dependants, income band and regular commitments never reach the rating:
   - The income-capacity weights are 25, 10 and 65 where the workbook uses 0.25, 0.10 and 0.65, so the score is always at least 65. Income capacity is therefore always level 3.
   - The sustainability lookup is fed the liquid-assets score instead of the adjusted income capacity. The adjusted income capacity is calculated and then not used.
   - The wealth lookup has its rows and columns swapped compared with the workbook. Two of the nine cells differ: assets 2 with horizon 1, and assets 1 with horizon 2.
   - Test: the strongest and weakest income-side answers, with the same assets, horizon and tolerance, both gave 7.
2. **Questions changed.** "Marital status" became "state of health" but kept the marital-status weights (70, 100, 30, 70). The health answers do not affect the result. "Do you own property" became "time horizon for this investment" and takes its place in the wealth table. The "nothing with other providers" assets option and the economics/finance education option are gone. Employment weights differ from the workbook (manager 80 not 100, entrepreneur 80 not 70).
3. **Tolerance has 7 options instead of 4**, and the profile table has 7 columns. The extension keeps the workbook's pattern (row 3: identity; row 2: capped one below the maximum; row 1: one below the tolerance).

## Other things worth knowing

- Experience and knowledge (low/medium/high) is calculated as in the workbook. It only affects which products are eligible, not the rating.
- Product eligibility: a product is offered if its complexity is at or below the client's experience level and its risk rating is at or below the client's rating. The site lists these product ratings: Euro Cash 1; Short Duration Fixed Income 2; Euro Fixed Income 3; Strategy Select 30 and 50 and the SRI 50 multi-asset 4; Strategy Select 75 5; Best Styles Global Equity 6; Life Cycle Balanced 2, Dynamic 3, Opportunity 5; Autopilot low 4, medium 4, high 5. The Default Investment Strategy has no rating.
- The state of health question collects special-category data under GDPR and does not change the result.
- The sustainability preference questions (s_15, s_16) and "known changes in the next 5 years" (s_17) are not scored.
