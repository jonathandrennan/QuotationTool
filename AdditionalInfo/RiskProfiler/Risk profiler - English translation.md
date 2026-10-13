# Client Risk Profiler: English translation and scoring logic

Source: `Allianz_Simulatore_Quest_IBIPs_FINALE.xlsm` ("Customer and Product Questionnaire Simulator", Allianz Italy, IBIPs). Translated from Italian on 12/10/2026. The questionnaire is an Italian MiFID II / IDD suitability tool, so some wording is Italy-specific. Those items are marked **[localise]**.

The workbook has 11 sheets: instructions, four customer-questionnaire sections (13 questions), a customer-profile calculation (hidden), a product questionnaire (1 question), an admissible-products matrix (hidden), a print layout, and macros (VBA) for navigation and the PDF summary.

## What it produces
1. **Experience & Knowledge profile**: Low / Medium / High.
2. **Sustainable Risk Profile**: 1 to 4. This combines the client's financial capacity (income and assets) with their risk tolerance, so it works as attitude to risk and capacity for loss in one number.
3. **Admissible products**: the Italian product list filtered by both profiles and the product-purpose answer. This part is Italy-specific and would not carry over.

---

## Section 1: Personal and socio-demographic information

**I. Date of birth** (dd/mm/yyyy). Age is calculated from it.

**II. What is your level of education?** *(score)*
1. Secondary school diploma (50)
2. University degree / postgraduate qualification (200)
3. Diploma / degree / postgraduate in economics or finance (300)
4. Other, e.g. lower secondary school (0)

**III. What is your employment status?** *(score)*
1. Employee (80)
2. Senior executive / person in a top position (board members, general managers, etc.) (100)
3. Entrepreneur (70)
4. Professional / freelancer (70)
5. Self-employed worker (70)
6. Not employed (0)
7. Retired (100)

**IV. Do you work, or have you worked, in banking, insurance or finance?** *(score)*
1. Yes (300)
2. No (0)

**V. What is your marital status?** *(score)*
1. Single (70)
2. Married or living with a partner (100)
3. Separated or divorced (30)
4. Widowed (70)

**VI. Does anyone in your household depend on you financially, wholly or partly?** *(score)*
1. No, nobody (100)
2. Yes, one person (50)
3. Yes, two people (30)
4. Yes, three or more people (10)

## Section 2: Experience and knowledge

**VII. Which of the following investment products do you know, hold, or have held in the last three years?**
Two columns: **Know** and **Hold / have held**. Tick at least one in each column. "None of the above" cannot be combined with any other answer. *(score is the highest value among everything ticked in either column)*
1. Government bonds (BOT, BTP, CCT, …) (50) **[localise]**
2. Bonds (corporate, bank, …) (100)
3. Unit-linked and/or index-linked policies (300)
4. Traditional life policies with a guaranteed return (separate management / "GS") (200) **[localise]**
5. Units in collective investment funds ("OICR") (250) **[localise]**
6. None of the above (0)

**VIII. What potential level of risk and return do you associate with each of these asset classes?** (Low or High, one answer per row)
- Equities
- Money market
- Bonds

Scoring: 100 points for each answer that matches the intended view: **Equities = High, Money market = Low, Bonds = Low**. Total 0 to 300.

## Section 3: Financial situation

**IX. Which band does your total gross annual income fall into?** *(score)*
1. Up to €100,000 (2)
2. Over €100,000 (3)

**X. What proportion of your income goes on regular financial commitments (e.g. mortgage or loan repayments)?** *(score)*
1. None, I have no regular financial commitments (3)
2. Low (less than 10%) (3)
3. Medium (between 10% and 40%) (2)
4. High (over 40%) (1)

**XI. Do you own property?** *(score)*
1. I do not own property (1)
2. Yes, only my main home (2)
3. Yes, my main home and further property* (3)

\* Choose answer 3 only if the further property is worth approximately more than €100,000.

**XII. Roughly how much do you hold in financial assets in total (cash, securities, funds, managed portfolios, policies, etc.)?** *(score)*
1. I hold nothing with other providers (no score in the source, see issues below)
2. Up to €50,000 (1)
3. €50,000 to €150,000 (2)
4. Over €150,000 (3)

## Section 4: Risk tolerance

**XIII. To help us understand your tolerance for risk, which of these would be your reaction to negative market movements if you managed your own investments?** *(score)*
1. Sell immediately, because I would not accept further losses (1)
2. Keep the investment and wait for it to recover its value before selling (2)
3. Keep the investment and wait for it to recover, so as to earn a positive long-term return (3)
4. Keep the investment and partly increase my position to take advantage of the market shock (4)

## Product questionnaire

**XIV. What is the main purpose of your investment?**
A. Seek short-term returns, with no death or disability protection for the insured
B. Plan an investment aimed mainly at growing capital over the medium to long term, with limited death or disability protection for the insured
C. Plan an investment aimed at growing capital over the medium to long term, which also provides, for an additional premium, enhanced death or disability protection
D. Set up a long-term individual savings plan (PIR) under Italian Law 232 of 11 December 2016 (2017 Stability Law), including to obtain the related tax benefits **[localise: Italian tax scheme, not applicable]**
E. Plan an investment aimed at growing capital over the medium to long term, with a revaluable lifetime annuity at maturity **[localise]**

---

## How the profile is calculated

### Experience & Knowledge
Score = 0.2 × max(Q II education, Q IV finance work) + 0.6 × Q VII + 0.2 × Q VIII (maximum 300).
- Below 100: **Low**
- 100 to under 200: **Medium**
- 200 or more: **High**

### Financial sustainability (four steps)
1. **Income capacity score** = round(0.25 × Q III + 0.10 × Q V + 0.65 × Q VI). Below 35 gives level 1, 35 to under 65 gives level 2, 65 or more gives level 3.
2. **Income capacity** (level from step 1 against Q IX income score of 2 or 3):

| Step 1 level | Income score 2 (≤ €100k) | Income score 3 (> €100k) |
|---|---|---|
| 3 | 3 | 3 |
| 2 | 2 | 2 |
| 1 | 1 | 2 |

3. **Adjusted income capacity** (Q X commitments score against income capacity):

| Q X score | Income capacity 1 | 2 | 3 |
|---|---|---|---|
| 3 | 1 | 3 | 3 |
| 2 | 1 | 2 | 3 |
| 1 | 1 | 2 | 2 |

4. **Wealth** (Q XII financial assets score against Q XI property score):

| Financial assets score | Property 1 | 2 | 3 |
|---|---|---|---|
| 3 | 2 | 3 | 3 |
| 2 | 2 | 2 | 3 |
| 1 | 1 | 1 | 2 |

**Financial sustainability** (adjusted income capacity against wealth):

| Adjusted income capacity | Wealth 1 | 2 | 3 |
|---|---|---|---|
| 3 | 2 | 3 | 3 |
| 2 | 2 | 2 | 3 |
| 1 | 1 | 2 | 3 |

### Sustainable Risk Profile (1 to 4)
Financial sustainability against the Q XIII risk tolerance score:

| Financial sustainability | Tolerance 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 3 | 1 | 2 | 3 | 4 |
| 2 | 1 | 2 | 3 | 3 |
| 1 | 1 | 1 | 2 | 3 |

**Age rule:** if the client is over 80 and the result is 4, it becomes 3.

### Product matching (Italy-specific)
A product is "admissible" if its complexity level is at or below the client's Experience & Knowledge level, its risk level is at or below the client's Sustainable Risk Profile, and the product-purpose answer (Q XIV) matches the product. The sheet lists 17 Allianz Italy products and combinations (Active4Life, Invest4Life, Target4Life), all of medium complexity and risk level 1 or 2.

---

## Points to settle before reuse

**Issues in the source**
1. Q XII answer 1 ("I hold nothing with other providers") has no score in the file. Reading the formulas, selecting it would most likely break the wealth lookup in the spreadsheet (I haven't run the workbook). It should score the lowest value (1).
2. The print layout shows Q XII bands as "up to / over €100,000", but the working sheet uses €50,000 and €150,000. The calculation uses the working sheet's bands.
3. Q VIII treats "Bonds = Low" as the correct answer. Some bond funds carry real risk, so that is debatable.
4. Q VII asks about "know" and "hold" separately, but the score takes the single highest value across both columns, so the two columns never score differently.

**Items to localise for Ireland**
- Government bonds (BOT, BTP, CCT) to Irish and eurozone government bonds or State savings; "separate management policies" to guaranteed or with-profits life policies; "OICR" to UCITS / collective investment funds.
- Education and employment categories: "Professional / freelancer" and "Self-employed" can merge; check the education levels against Irish qualifications.
- Q XIV: replace with PRSA / ARF / Investment Bond purposes. Drop the PIR option.
- Income and asset bands are euro amounts, so they can stay, but confirm they suit your client base.
- The output is a 1 to 4 profile. This tool uses the 1 to 7 SRI scale, so a mapping from 1 to 4 onto the 1 to 7 scale is needed, and Compliance should approve it.
