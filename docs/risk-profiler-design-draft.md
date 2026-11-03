# Risk profiler – proposed questions and scoring

This is the suitability section of the advised sale. The adviser uses it with the client to set a risk rating from 1 to 6 on the ESMA scale. It has 8 scored questions and a date of birth. The sustainability questions (Part E) are left out for now. After the introduction, the client sees an "Important information" screen and must accept it. The result ends with a similar box. Draft for Compliance review, 22/10/2026, updated 27/10/2026. Every cut-off in it is a proposal.

The tool is used by brokers (advisers) only. The broker gives the advice and signs the Statement of Suitability, so the legal duty to assess suitability is theirs. AGL's part is to give brokers a clear, accurate and tested tool. Who is responsible for what, and which regulations apply to whom, is in the *Allianz Risk Profiler: regulatory summary* (section 4 gives the short version).

_Generated alongside `Risk-Profiler-Proposal.docx` by `build_risk_profiler_docx.py`; edit this file, then rebuild._

## 1. Summary

| Part | # | Question | Used for |
|---|---|---|---|
| Your finances | Q1 | Financial cushion | Capacity for loss |
|  | Q2 | Impact of a loss | Capacity for loss |
| Your timing | Q3 | Investment horizon (slider, whole years) | Time limit |
| Your attitude to risk | Q4 | Largest 12-month fall you could accept (slider) | Attitude rating |
|  | Q5 | What you would do after a 20% fall | Attitude rating |
|  | Q6 | What you want from the investment | Attitude rating |
| Your knowledge | Q7 | Knowledge and experience | Knowledge level (flag) |
|  | Q8 | Knowledge check: rank four investments by risk | Knowledge level (flag) |
| About you | DOB | Date of birth | Age (flag) |
| Sustainability | S1–S4 | Sustainability preferences (**left out for now**; the adviser records the preference in the quotation tool) | Fund choice only |

### How the rating is worked out

| Step | How | Result |
|---|---|---|
| 1. Attitude | The middle value of the Q4, Q5 and Q6 ratings, and no more than one level above Q4 | 1 to 6 |
| 2. Limits | Time limit from Q3. Capacity limit: Low capacity (Q1 + Q2) allows no more than 4 | A ceiling, or none |
| 3. Risk rating | The lower of steps 1 and 2. The adviser may lower or raise it (up to 6), with a recorded reason. The client is told when a limit applies | 1 to 6 |

Knowledge and age do not change the rating. They raise flags for the adviser (section 3).

### The rating scale

| Rating | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Volatility | 0–0.5% | 0.5–2% | 2–5% | 5–10% | 10–15% | 15–25% | over 25% |
| Risk | Very low | Low | Low to medium | Medium | Medium to high | High | Very high (not given) |

### Key design choices

- **Highest rating 6:** Level 7 is not offered, as at Aviva.
- **The loss answer anchors the rating:** The attitude rating can be at most one level above the Q4 answer, so a client who will accept only a small loss cannot be rated high on objectives alone.
- **Capacity limits the rating:** Low capacity for loss caps the rating at 4. Aviva and Zurich only report it. We limit it because the client must be able to bear the losses.
- **Short horizons limit the rating:** Under 3 years allows no more than 3, and 3 to under 5 years no more than 4. A horizon under 3 years also raises a warning for the adviser.
- **Sustainability preferences do not change the rating:** They are left out of the tool for now. When they are asked, it is after the rating and they only narrow the fund list.
- **Important information after the introduction:** The client accepts a short notice before the questions. A similar box ends the result and the Risk profile record. If they do not accept, the questions are not shown.
- **Volatility bands:** Checked against the UCITS synthetic risk and reward bands (0.5%, 2%, 5%, 10%, 15%, 25%).
- **Knowledge and age raise flags only:** They don't change the rating. The adviser decides what to do.
- **Scope:** This tool supports the broker's suitability assessment; it does not replace it. The broker's fact find collects personal and financial details, and the broker handles updates, vulnerability and joint applicants (section 4).

## 2. The questions

### Introduction (shown before Q1)

> **Introduction – "Before you begin":** These questions help your adviser recommend investments that suit you. They take about 5 minutes.
> We will ask about:
> • Your finances, and how long you plan to invest
> • How you feel about risk, and what you would do if your investment fell in value
> • Your knowledge and experience of investing
> Please answer as honestly and fully as you can. If your answers are not accurate and complete, we cannot recommend an investment.
> Your answers give a risk rating from 1 (very low risk) to 6 (high risk). Your adviser will go through it with you. Your adviser will review your risk profile with you at least once a year, and sooner if your circumstances change. If they do, tell your adviser.

- *Regulation:* Explains why the questions are asked and that the firm decides suitability (ESMA 11–12). States how the answers are used and that an adviser is involved (ESMA 17). The introduction itself contains no disclaimer (see Important information above). The tool shows it on a "Before you begin" screen with a "Start the questions" button.

### Important information (shown after the introduction, before Q1)

> **Important information:** The Risk Profiler is a guide. It helps you and your adviser talk about how much risk you are comfortable with before you invest. It does not recommend a product or a fund.
> The questions cover only some of the things that matter when choosing an investment. Before anything is recommended, your adviser will go through your wider situation and needs with you.
> By choosing "I accept", you confirm that:
> • you have not been given investment advice by Allianz through this tool; and
> • you understand that the Risk Profiler supports, but does not replace, the advice of your financial adviser.
>
> [I accept] [I do not accept]

- *If the client does not accept:* The questions are not shown. The screen says the Risk Profiler cannot be used without accepting, asks the client to talk to their adviser, and has a "Go back" button.
- *Record:* The time of acceptance is recorded and shown in the Risk profile record.
- *Regulation:* **Changed from the earlier draft.** The earlier draft had no disclaimer and asked the client to confirm nothing (ESMA 14–15). This screen was added at the business's request, so those paragraphs no longer fit. Compliance must approve the wording and decide whether the acceptance sits well with ESMA 14–15.
- *Versus competitors:* Zurich shows a notice with the same two confirmations and Accept / Do not accept buttons. Our wording is our own.

### Part A – Your finances

**Q1 Financial cushion** – If your income stopped, how long could you cover your normal spending from savings?

_Help text shown:_ Include loan or mortgage repayments and family support. Leave out pensions and this investment.

| Answer | Points |
|---|---|
| 12 months or more | 3 |
| 3 to 11 months | 2 |
| Less than 3 months | 1 |

- *Why:* Shows whether a fall in value could force the client to sell. It is a fact the client can work out, not a feeling. Pensions are excluded because the client usually cannot reach them.
- *Regulation:* Ability to bear losses (IDD Art 30; ESMA 80). Asks for facts, not whether the client feels they have enough (ESMA 46). Similar to Zurich Q8.

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | Q8: Do you have other savings for a financial emergency? (No savings / Some, nothing earmarked / Yes, specific savings) | Same purpose. Ours asks for a length of time the client can work out; Zurich asks about savings in general. Zurich shows the result as capacity for loss |
| Aviva | Q2: How important is this investment? (very reliant … surplus funds) | Covers reliance on the money, not the size of the buffer. Used only for confirmation prompts, not the rating |
| Standard Life, Irish Life | None | Capacity for loss is not assessed |

**Q2 Impact of a loss** – If this investment lost a large part of its value, what impact would this have on your finances?

| Answer | Points |
|---|---|
| A big impact: I would struggle to meet my living costs or commitments | 1 |
| Some impact: I would need to make adjustments to my plans, but I could manage | 2 |
| Little or no impact: I have other savings and income to rely on | 3 |

- *Why:* Q1 measures the cash buffer; Q2 measures how much rides on this money. The first answer is about hardship, not purpose: almost all pension money has a specific purpose (retirement), and that alone should not make capacity Low.
- *Regulation:* Ability to bear losses (IDD Art 30; ESMA 12, 80). Based on Zurich Q9, in our own words.

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | Q9: If this investment performed poorly, what impact on your financial well-being? (Big, required for a specific purpose / Some, would adjust plans / None, I have other savings) | Ours is based on it. Our first answer is about hardship, not purpose, so pension money is not automatically Low |
| Aviva | Q2: How important is this investment? | Reliance only; prompts, not the rating |
| Standard Life, Irish Life | None | Not assessed |

> **Result:** Capacity for loss = Q1 + Q2: Low (2–3), Medium (4), High (5–6). Low capacity limits the risk rating to 4. Medium and High are shown to the adviser but do not change the rating.

### Part B – Your timing

**Q3 Investment horizon** – How long do you plan to hold this investment?

_Built as a slider_ in whole years (help text: "Move the slider to the number of years."), from "Less than 1 year" to "12 years or more", starting with no value selected. The band is shown as the client moves it.

| Slider value | Highest rating allowed |
|---|---|
| Under 3 years | 3 |
| 3 years to under 5 years | 4 |
| 5 years or more | No limit |

- *Why:* Higher-risk funds need time to recover from falls. The ESMA scale assumes 5 years or more.
- *Regulation:* Holding period (ESMA 24, 37, 80). Zurich also lowers the profile for short terms.
- *Consistency check:* Aviva ignores the horizon for the rating. Zurich lowers the score and warns at 5 years or less. Ours limits the rating and warns under 3 years.

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | Q2: How long do you plan to invest for? (slider 1–15+ years) | Lowers the score (about 5 to 6 points at 3 years) and shows a warning at 5 years or less. Ours is also a slider, with a fixed ceiling for each band |
| Aviva | Investment term slider (5–30 years) | Used only for the long-term chart; it does not change the rating |
| Standard Life, Irish Life | None | Time horizon is explicitly excluded |

### Part C – Your attitude to risk

**Q4 Largest fall you could accept** – If you invested €10,000 today and its value fell over the next 12 months, what is the maximum drop you would be willing to accept before considering a change to your investment?

_Built as a slider_ (help text: "Move the slider to the largest fall you could accept.") from "No fall" to "40% or more", in 0.5% steps, starting with no value selected. The € amount is shown as the client moves it. A value between two marks scores the lower band.

| Slider value | Shown as | Rating |
|---|---|---|
| 0% to under 2.5% | No fall, or under €250 | 1 |
| 2.5% to under 7% | About €250 to €700 | 2 |
| 7% to under 15% | About €700 to €1,500 | 3 |
| 15% to under 25% | About €1,500 to €2,500 | 4 |
| 25% to under 40% | About €2,500 to €4,000 | 5 |
| 40% or more | About €4,000 or more | 6 |

- *Why:* Each mark is a "bad year" for a fund at that level: twice the middle of its volatility band, which is the 97.5% level that PRIIPs uses for its risk indicator (Appendix B). This answer anchors the attitude rating.
- *Regulation:* This is the question ESMA gives as its example: what loss over a given period the client would accept (ESMA 46). It uses concrete figures (ESMA 31, 48). Aviva asks it the same way (a 0–40% slider).

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Aviva | Q5: Maximum percentage loss you could tolerate in a 12-month period? (slider 0–40%) | Same question and range. Aviva combines it with its Q4 expectation answer in a lookup; we anchor the attitude rating on it |
| Zurich | Q6: What range of values would you accept after 5 years on €10,000? (five ranges, €6,300–€17,200 to €9,800–€11,600). Q5: How concerned would you be about a 10% fall in 6 months? | Ranges over 5 years, not a 12-month loss. Q5 asks for a feeling, not an amount |
| Irish Life, Standard Life | Q9 / Q7: How much would you put in an investment with possible high returns and a similar chance of losing some money? | A share of the money, with no loss figure. Added into a total score |

**Q5 Reaction to a fall** – Six months after you invest €10,000, markets fall and your investment is worth €8,000. What would you most likely do?

| Answer | Rating |
|---|---|
| Sell everything | 2 |
| Sell part, to limit further losses | 3 |
| Keep it and wait for a recovery | 5 |
| Keep it and invest more | 6 |

- *Why:* Asks what the client would do, not how they would feel.
- *Regulation:* Asks about the client's own choices when facing a loss, with figures (ESMA 31, 48). Similar to Irish Life Q7.

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Irish Life | Q7: Six months after investing, markets perform badly and your investment drops significantly. Reaction? (transfer to a safer product / monitor and wait / invest more) | Ours is based on it, with a figure (€10,000 falls to €8,000) and four choices. Standard Life drops this question |
| Zurich | Q5: How concerned would you be about a 10% fall in 6 months? (not concerned … extremely) | Asks how the client would feel, not what they would do |
| Aviva | None | No behaviour question |

**Q6 Objective** – What is your investment objective?

| Answer | Rating |
|---|---|
| To keep my money safe: I want to get back at least what I put in | 1 |
| A return a little better than a deposit account, with very little risk | 2 |
| Growth a little above inflation, accepting small rises and falls in value | 3 |
| Steady growth over the long term, accepting that the value will go up and down | 4 |
| Strong growth over the long term, accepting large rises and falls in value | 5 |
| The highest return possible, accepting a high level of risk to get it | 6 |

- *Why:* One answer for each rating from 1 to 6. Set against Q4 and Q5, it shows a cautious attitude with ambitious objectives, or the reverse.
- *Regulation:* Investment objectives (IDD Art 30; ESMA 12). Contradictions between objectives and attitude (ESMA 51). Aviva Q4 and Zurich Q4 use five steps; the level-3 answer matches Zurich's "beat inflation without significant risk".

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Aviva | Q4: What risk and return expectations do you have? (five options, guarantee … maximise returns) | Five steps against our six. This is Aviva's main driver, combined with the loss answer |
| Zurich | Q4: What is your investment objective? (five options, maximise returns … protect my capital) | Five steps. Our level-3 answer matches Zurich's "beat inflation without significant risk" |
| Irish Life, Standard Life | Several attitude statements (for example "I would go for the best possible return even if there were risk involved") | Agree/disagree self-assessments added into a total, not a stated objective |

> **Result:** Attitude rating = the middle value of the Q4, Q5 and Q6 ratings, but no more than one level above Q4.
>
> *Why the middle value:* Tested against the average over all 144 combinations of the three ratings (22/10/2026). A rounded average differs from the middle value in 46 of them, always higher, because one high answer pulls it up. The middle value ignores a single outlier, so it is kept.

### Part D – Your knowledge and experience

**Q7 Knowledge and experience** – Which statement best describes your investment knowledge and experience?

| Answer | Knowledge level |
|---|---|
| I have not invested before, other than in deposits or savings accounts | Low |
| I have a pension or an investment, but I have not followed how its value changes or what it invests in | Low |
| In the last 5 years I have held funds, shares or bonds. I have seen their value fall as well as rise, and I know that spreading money across many investments reduces risk but does not remove it | Medium |
| I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them | High |
| I work or have worked in investments or financial services, or hold a finance qualification, and I invest regularly | High |

- *Why:* Each answer describes what the client has done and how recently, not how they rate themselves.
- *Regulation:* Knowledge and experience (IDD Art 30). Ask what the client has done and how recently, and avoid self-assessment (ESMA 46–47).

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | Q3: How would you describe your investment knowledge? (Expert … None) | A self-rating, which ESMA 46–47 advises against. It adjusts the score (roughly +2 for Expert, −2 for None). Ours asks what the client has done and raises a flag only |
| Aviva | Q1: How experienced an investor are you? (four options) | Partly self-assessed. Used only for confirmation prompts |
| Standard Life, Irish Life | None | Knowledge is not asked |

**Q8 Knowledge check** – Put these four investments in order, from the one with the lowest risk of losing money to the one with the highest.

| Investment | Right position |
|---|---|
| A savings deposit | 1 (lowest risk) |
| Government bonds | 2 |
| A fund holding shares in many different companies | 3 |
| Shares in a single company | 4 (highest risk) |

_Built as_ four items the client drags into order, shown in a mixed order, with an "I don't know" box and the help text "Drag the investments into order, or use the arrows. Lowest risk at the top." Correct only if all four are in the right order. Afterwards the client is shown the right order and why.

- *Why:* Checks Q7 with a question that has a right answer. It tests that cash is safest, that shares carry more risk than bonds, and that spreading money is less risky than one share.
- *Regulation:* Test real knowledge with a question that has a right answer (ESMA 46). Guards against clients overestimating their knowledge (ESMA 52). Tests understanding of risk and concentration (ESMA 31).

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Aviva | "What do we mean by risk?" page (market, inflation, counterparty, liquidity, concentration) | Teaches, but nothing is tested |
| Zurich, Irish Life, Standard Life | None | No question with a right answer. Q8 is unique to the proposal |

> **Result:** Knowledge level = from Q7, one level higher if Q8 is right (High stays High), and one level lower if Q8 is wrong or "I don't know".

### Part E – Your sustainability preferences (not scored, asked after the risk rating)

> **Left out for now.** The tool does not ask S1–S4. The quotation tool's own Yes / No question records the preference. The questions below are kept so they can be switched back on.

These questions do not change the risk rating. They are asked once the rating is set, and are used only to choose among the funds that suit that rating.

**S1 Sustainability preferences** – Some investments aim to support environmental or social goals, or to limit harm to them. Would you like your investment to include any of these?

| Answer | Next |
|---|---|
| Yes | S2 |
| No, or I have no preference | End. Funds with and without sustainability features can be recommended |

**S2 Type of investment** – Which of these would you like your investment to include? Tick any that apply.

| Answer | Next |
|---|---|
| A. Investments in activities that count as environmentally sustainable under EU rules (the EU Taxonomy) | S3 |
| B. Sustainable investments: companies or projects that contribute to an environmental or social goal without doing significant harm (as defined in EU rules) | S3 |
| C. Investments that take account of their main negative effects on the environment and society | S4 |
| I have a preference but not for any of these in particular | End. The adviser records this and explains the funds' sustainability features |

**S3 Minimum share** – For each of A and B that you ticked, what is the smallest share of your investment you would like it to make up?

| Answer | Next |
|---|---|
| At least 10% | S4 if C ticked, else end |
| At least 20% | S4 if C ticked, else end |
| At least 30% | S4 if C ticked, else end |
| At least 50% | S4 if C ticked, else end |

**S4 Negative effects** – Which negative effects matter most to you? Tick any that apply.

| Answer | Next |
|---|---|
| Greenhouse gas emissions and energy use | End |
| Biodiversity, water and waste | End |
| Social and employee matters, including human rights | End |
| Corruption and bribery | End |

- *Why:* Collects the client's sustainability preferences in plain language, so the adviser can match them to the funds' features. The options are shown in a fixed, neutral order, and "No" is as easy to give as "Yes".
- *Regulation:* Sustainability preferences are part of the suitability assessment for insurance-based investment products (Delegated Regulation 2017/2359 as amended by 2021/1257, from memory) and are information the Code requires (Reg 16(3)). Follows ESMA 26–28: a yes or no, then which of the three types, a minimum share for A and B, and the negative-effect categories for C. Asked only after suitability is assessed (ESMA 81), and in a neutral way (ESMA 26). If no fund meets the preferences, the client may change them for this recommendation only, and the reason is recorded (ESMA 82–83).

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | A gate question, then a separate Sustainability Assessment: the three categories, how important each is (five-point scale), a free % field for the minimum proportion, and 11 negative-effect categories | Longer. Ours uses fixed minimum-share bands and four plain-language effect groups, and "No" is as easy as "Yes" |
| Standard Life | Three optional questions: Taxonomy-aligned? Sustainable investments? Reduce negative impact? (Yes/No, with a minimum % for the first two) | Same three categories. Ours adds a "no particular type" answer and the negative-effect groups |
| Aviva, Irish Life | None found in the tools reviewed | |

> **Result:** Sustainability preferences recorded with the profile: none, or the types chosen, minimum shares and negative effects. They filter the fund list after the rating is set, and do not change the rating.

### About you

**DOB Date of birth** – What is your date of birth?

- *Tool:* Not asked when the host system (for example the application form) already holds the date of birth.
- *Why:* Age does not change the rating; the horizon (Q3) does that work. Clients aged 65 or over with a rating of 5 or more are flagged for the adviser.
- *Regulation:* Age (ESMA 24); more care with older clients, who may be vulnerable (ESMA 40).

**Versus competitors**

| Provider | Their question | How it differs |
|---|---|---|
| Zurich | Q1: What age are you? (slider 19–100) | Age lowers the score (roughly −1 at 50, −3 or more at 70). Ours uses a flag only, because the horizon (Q3) already limits the rating |
| Aviva, Standard Life, Irish Life | None | Age is not asked |

## 3. Checks and flags

Flags do not block the client. They are shown to the adviser and recorded.

| Flag | Shown when | Regulation |
|---|---|---|
| F1 Mixed attitude | The Q4, Q5 and Q6 ratings are 3 or more apart | Contradictions in the answers (ESMA 32, 49, 51) |
| F2 Low knowledge, high rating | Rating 5 or more and knowledge Low | Check the client understands how the funds can rise and fall, and that the rating still suits them (ESMA 51–52) |
| F3 Capacity limit | Capacity is Low and the attitude rating is above 4, so the rating is limited to 4 | The client must be able to bear the losses (ESMA 80) |
| F4 Short horizon | The time limit lowers the rating, or the horizon is under 3 years | Holding period (ESMA 80) |
| F5 Age | Age 65 or over and rating 5 or more | Older clients (ESMA 24, 40) |
| F6 Changed answers | Answers changed after the result was shown | Guard against answers changed to reach a product (ESMA 50, 58) |

## 4. How the design meets the regulations

### Who is responsible

All AGL business is advised broker business, and the tool is not offered to clients directly. The law puts the suitability duty on whoever gives the advice, which is the broker. AGL is the insurer, with duties of product governance and of giving brokers clear, accurate information.

| | AGL (insurer) | Broker (adviser) |
|---|---|---|
| Gives the advice | No | Yes |
| Full fact find (income, assets, debts, health, dependants) | No | Yes |
| Assesses suitability and signs the Statement of Suitability | No | Yes |
| Decides the final risk rating | No (the tool suggests one) | Yes |
| Provides a clear, accurate, tested tool | Yes | No |
| Sets the target market for each product and fund | Yes | No |
| Keeps records of the advice | Supports this (the tool's record) | Yes |

Delegated Regulation 2017/2358, Article 8(4) confirms the split: the insurer's duty to monitor brokers does not extend to the general requirements brokers must meet when dealing with individual customers.

### Which rules apply

- **Investment bond (an insurance-based investment product):** The broker must meet the Insurance Distribution Directive (IDD), Article 30, transposed by S.I. 229/2018 (Reg 42), and Delegated Regulation (EU) 2017/2359 (Articles 9–14 and 19). The Consumer Protection Code 2025 switches off its own suitability chapter for advice on these products (Reg 11(3)).
- **PRSA and ARF:** These are pension products and may fall outside the definition of an insurance-based investment product. If so, the Code's suitability chapter (Regs 16–18) applies to the broker. Compliance to confirm.
- **For AGL as insurer:** Product oversight and governance (IDD Article 25; Delegated Regulation 2017/2358) and the Code's rules on information passed to clients (Regs 64–65). Reg 39 (nothing pre-ticked) is built in.
- **For the broker when using the tool with a client:** Code Reg 38 (a digital tool must be easy to use, tested, and its logic documented and consistent).
- **The ESMA suitability guidelines (ESMA35-43-3172):** These are written for MiFID firms and do not bind insurers or insurance brokers. They are used here as the detailed good-practice benchmark, because neither the IDD nor the Code sets out how a questionnaire should be built. Paragraph numbers below are ESMA's.
- **Rules that do not apply:** Code Regs 16–19 for the investment bond (switched off by Reg 11(3)); PRIIPs for the PRSA and ARF (outside PRIIPs, so no KID); the appropriateness test for sales without advice (IDD Article 30(2)), because all business is advised. The Code's direct-to-consumer digital rules (Regs 38–41) do not fall on AGL for the same reason, **but this changes if the profiler is put on the public website for clients to use alone**.
- **Sources:** The Code was read on the Central Bank website on 19/10/2026. The IDD and Delegated Regulation references were checked against the legal texts for the regulatory summary (23/10/2026). Compliance has not yet signed off.

### Requirement by requirement

These are the requirements the tool helps the broker meet, measured against the ESMA benchmark. "Met" means the design meets the benchmark, not that AGL carries the legal duty.

| Requirement | Source | How the design meets it | Status |
|---|---|---|---|
| Explain the purpose; the firm decides suitability; no disclaimers | ESMA 11–15 | The introduction says why we ask, that suitability is our decision, and why complete answers matter. **Changed:** the client now accepts an "Important information" screen first, which says the tool is not advice. The client is still never asked to confirm suitability. Wording for Compliance to approve, including whether this fits ESMA 14–15 | Met |
| Knowledge and experience | IDD Art 30; ESMA 30, 46–47, 52 | Q7 asks what the client has done and how recently. Q8 checks it with a question that has a right answer, and a wrong answer lowers the level. Low knowledge with a high rating is flagged | Met |
| Financial situation, including ability to bear losses | IDD Art 30; ESMA 12, 80; Code Reg 17 | Q1 and Q2 give capacity for loss. Low capacity limits the rating to 4, so a client who cannot bear losses cannot be given a high rating, whatever their attitude | Met |
| Objectives, including risk tolerance | IDD Art 30; ESMA 46, 48 | Q4 asks the largest € loss over 12 months the client would accept, which is ESMA's own example. Q5 asks what they would do after a 20% fall, and Q6 asks the objective. The loss answer anchors the rating | Met |
| Holding period | ESMA 24, 37, 80 | Q3. Horizons under 3 years cap the rating at 3 and under 5 years at 4. Under 3 years also raises a warning | Met |
| Objective questions, not self-assessment | ESMA 44–48 | Every scored question asks for a fact, an amount, an action or past experience. None asks the client to rate themselves | Met |
| Clear questions, one topic each | ESMA 21–22; Code Regs 47, 64 | Plain language, one topic per question. Q8 is one ordering task with one right answer, not the grid of self-ratings that ESMA 22 warns against. Not yet tested with clients | Met |
| Layout must not steer; nothing preselected | ESMA 22; Code Reg 39 | Build rules: no answer preselected, the Q4 slider starts empty, Q8 starts in a mixed order | Met |
| No skipping | ESMA 22 | Every question must be answered; there is no "prefer not to say" | Met |
| Contradictions and over-confidence | ESMA 32, 49, 51–52 | Flags F1 to F5 (section 3) | Met |
| Answers changed to reach a product | ESMA 50, 58 | F6 flags answers changed after the result was shown | Met |
| Records | ESMA 109–111 | The record holds the answers, ratings, limits applied, flags, any adviser override and its reason, the questionnaire version and the date | Met |
| Understanding of risk and return | ESMA 23, 31, 80 | Q4 and Q5 show what losses look like in €. Q8 tests the order of risk and concentration. Nothing tests that a higher return needs more risk | Partly met |
| Tool documented and tested | ESMA 78–79, 90; Code Reg 38 | This document sets out every rule, the scoring is automatically tested, and 50 test clients were compared with Aviva and Zurich (section 5). Still needed: client testing, a test plan, version control, error handling and a named sign-off | Partly met |
| Sustainability preferences | Delegated Reg 2017/2359 Arts 2(4), 9(4), 9(6) as amended by 2021/1257; Code Reg 16(3)(e); ESMA 26–28, 81–83 | The broker asks about preferences (investment bond) or gathers them in the fact find (PRSA and ARF). The tool's Part E, which asks the full questions, is built but switched off. The tool records the broker's Yes / No, which should be described as a record of the broker's finding, not as the assessment. Gaps for AGL: the funds' Taxonomy %, sustainable investment % and principal adverse impacts are not in the fund information, and the Statement of Suitability wording must not imply that an Article 8 fund meets the client's preferences | Partly met |
| Illiquid products | ESMA 36–37, 80 | No complex products are offered. Whether PRSA lock-in, ARF terms or bond exit charges make a product illiquid is not settled. If they do, Q3 must be checked against them | Open |

### Covered outside this tool

These are the broker's job, or AGL's through guidance. A one-page broker guidance note from AGL, saying what the tool does and does not do, would close most of the rows below.

| Requirement | Source | Whose job, and where it is covered |
|---|---|---|
| Income and its source, assets, debts, employment, dependants, health, marital status | Code Reg 16(4)–(7); ESMA 24, 37 | Broker, in the fact find. The two capacity questions are not a substitute. Aviva, Zurich, Standard Life and Irish Life do not ask these in their risk tools either |
| Other investments and the portfolio as a whole | ESMA 39, 43 | Broker |
| Demands and needs test | IDD Art 20 | Broker. Nothing in the tool; the guidance note should say so |
| Client confirming their answers are accurate | Code Reg 16(13) | Broker. Confirm the fact find declaration covers the profiler, or add a confirmation the client ticks at the end (not pre-ticked) |
| Importance of capital security (PRSA and ARF) | Code Reg 16(7) | Broker. Covered in part by Q4 and Q6; the guidance note should say the fact find covers it |
| Identifying and helping clients in vulnerable circumstances | Code Regs 34–37; ESMA 40 | Broker. The tool adds the age and knowledge flags |
| Updating the profile and re-profiling | ESMA 53–59 | Broker. The tool records the date and version of each profile |
| Joint applicants and legal entities | ESMA 60–70 | Broker. The tool profiles one person; brokers need guidance for joint policies |
| Keeping the record of the advice | Delegated Reg 2017/2359 Art 19 | Broker keeps the pack as their record. The tool does not store profiles centrally |
| Staff competence and training | Minimum Competency Code; ESMA 104–108 | Broker. Not affected by the tool |
| Version control and sign-off of the scoring | ESMA 78–79 | AGL. Name an owner, and keep each version and its test results |

### Open points for Compliance

1. **Sustainability preferences:** Part E is switched off, and the broker records a Yes / No. AGL must give brokers each fund's Taxonomy %, sustainable investment % and principal adverse impacts, and the Statement of Suitability wording must not imply that an Article 8 fund meets the preferences (2359 Art 9(6)). If Part E is switched back on: approve the wording and set the minimum-share bands (S3) against the funds offered.
2. **Which rules apply to PRSA and ARF:** Confirm the ARF is a pension product and so outside the IDD investment-product rules. Also whether any product counts as illiquid.
3. **Capacity limit of 4:** This makes us stricter than Aviva and Zurich, which both give 6 to client 4 (a keen client with no savings who relies on the money).
4. **Loss figures (Q4):** Test them against our funds' worst 12-month falls and KID stress scenarios, and confirm the slider step and rounding.
5. **Time limits (Q3), 3 / 4 / none at 3 and 5 years:** Check them against the recommended holding periods of the funds offered.
6. **Fund ratings:** Check that the tool's 1 to 6 bands line up with the fund risk ratings in the KIDs.
7. **Introduction and result wording:** Approve it. Change "your adviser will review your risk profile … at least once a year" to "should be reviewed", because AGL cannot promise what the broker will do. This is in the introduction, the result notice and the pack.
8. **Client testing:** Test the questions with a small group of clients and keep the results (Code Regs 38 and 65).
9. **Data Protection:** Confirm who is controller and who is processor. The answers are probably stored in the Allvest portal, so the roles may sit with Allvest.
10. **Public website:** Do not publish the profiler for direct client use without a separate review (Code Regs 38–41).
11. **Governance:** Add a test plan, version control, error handling and a named sign-off.
12. **Broker guidance note:** Write the one-page note described above.

## 5. Testing against Aviva and Zurich

50 example clients were run through the proposed questions, Aviva's tool and Zurich's tool. The first 8 test the edges (the most cautious, the most adventurous, a keen client with no savings, a short horizon and so on) and the other 42 are random answer sets. Aviva's results come from its decision table, read from the tool's own script. Zurich's come from its live tool, run on 28/10/2026. The proposal is as at 28/10/2026, with Q3 limits of 3 (under 3 years), 4 (3 to under 5 years) and none from 5 years.

| Pair | Same rating | Within one level | Average gap | Higher or lower | Largest gap |
|---|---|---|---|---|---|
| Proposed and Zurich | 22 of 50 | 42 of 50 | 0.72 | -0.04 | 2 |
| Proposed and Aviva | 17 of 50 | 39 of 50 | 0.92 | +0.36 | 3 |
| Aviva and Zurich (for reference) | 15 of 50 | 29 of 50 | 1.28 | -0.40 | 4 |

Higher or lower is the second tool minus the first (Zurich minus Aviva in the last row): a positive number means the second tool rates higher.

- **Overall:** The proposal agrees with each competitor more often than the two agree with each other. Aviva is the outlier: it rates on the objective and maximum loss alone, so it runs higher than both of us. It also gives 0 (deposit-type only) to 7 clients. Leaving those out, the proposal and Aviva agree on 17 of 43 and are within one level on 36.
- **Where we are stricter:** Clients 4 and 6 (a keen client with no savings, and an adventurous client who needs the money in 2 years). Our capacity and horizon limits hold us to 4 and 3; Zurich gives 6 and 5, and Aviva 6.
- **Where Zurich is lower:** Clients 9, 20, 37 and 43 would sell everything after a 20% fall but gave aggressive answers to the loss and objective questions. We take the middle of the three attitude answers and rate them 3 to 5; Zurich adds up points and gives 1 to 3.
- **Translation caveat:** Each client was set by our answers and translated into the other two tools' answers by us (the mapping is in `tests/compare_profilers.py`), so a one-level difference can come from that translation.

Results for each client are in Appendix A.

## Appendix A. Test results by client

| Client | Proposed | Aviva | Zurich | What it shows |
|---|---|---|---|---|
| **1. Corner: most cautious.** Age 80; 1 year; accepts no fall; would sell all after a 20% fall; wants safety; savings under 3 months; a loss would hit hard; no experience | 1<br>Capacity Low<br>Flags: short horizon | 0 (no-risk) | 1<br>Capacity Low | Same as Zurich. Aviva's 0 means deposit-type only. |
| **2. Corner: most adventurous.** Age 25; 12 years; accepts 40% fall; would invest more; highest return; savings 12 months or more; a loss would hardly matter; professional | 6<br>Capacity High | 6 | 7<br>Capacity High | Zurich 1 higher. Same as Aviva. |
| **3. Mid-range.** Age 40; 10 years; accepts 15% fall; would wait; steady growth; savings 3 to 11 months; a loss would have some effect; some recent experience | 4<br>Capacity Medium | 4 | 4<br>Capacity Medium | Same in all three. |
| **4. Keen but no cushion.** Age 30; 10 years; accepts 40% fall; would invest more; highest return; savings under 3 months; a loss would hit hard; regular investor | 4<br>Capacity Low<br>Flags: capacity limit | 6<br>Prompts: reliance, expectations | 6<br>Capacity Low | Zurich 2 higher. Aviva 2 higher. Our capacity limit applies; Aviva ignores it. |
| **5. Cautious but wealthy.** Age 60; 12 years; accepts 2% fall; would sell all after a 20% fall; wants safety; savings 12 months or more; a loss would hardly matter; regular investor | 1<br>Capacity High | 0 (no-risk) | 2<br>Capacity High | Zurich 1 higher. Aviva's 0 means deposit-type only. |
| **6. Adventurous, short horizon.** Age 50; 2 years; accepts 40% fall; would invest more; highest return; savings 12 months or more; a loss would hardly matter; regular investor | 3<br>Capacity High<br>Flags: short horizon | 6 | 5<br>Capacity High | Zurich 2 higher. Aviva 3 higher. Our horizon limit applies; Aviva ignores it. |
| **7. Age 70 adventurous.** Age 70; 10 years; accepts 30% fall; would invest more; strong growth; savings 12 months or more; a loss would hardly matter; regular investor | 5<br>Capacity High<br>Flags: age | 5 | 5<br>Capacity High | Same in all three. |
| **8. Loss 2.5 but wants max return.** Age 45; 10 years; accepts 2.5% fall; would invest more; highest return; savings 3 to 11 months; a loss would have some effect; some recent experience | 3<br>Capacity Medium<br>Flags: mixed attitude | 3<br>Prompts: reliance, expectations, loss | 5<br>Capacity Medium | Zurich 2 higher. Same as Aviva. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **9.** Age 61; 11 years; accepts 37% fall; would sell all after a 20% fall; strong growth; savings 12 months or more; a loss would hardly matter; passive holder | 5<br>Capacity High<br>Flags: mixed attitude | 6 | 3<br>Capacity High | Zurich 2 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **10.** Age 53; 4 years; accepts no fall; would invest more; a little above a deposit; savings 12 months or more; a loss would hit hard; professional | 2<br>Capacity Medium<br>Flags: mixed attitude | 0 (no-risk) | 4<br>Capacity Medium | Zurich 2 higher. Aviva's 0 means deposit-type only. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **11.** Age 59; 12 years; accepts 2% fall; would sell all after a 20% fall; a little above a deposit; savings 12 months or more; a loss would hardly matter; regular investor | 2<br>Capacity High | 0 (no-risk) | 2<br>Capacity High | Same as Zurich. Aviva's 0 means deposit-type only. |
| **12.** Age 44; 3 years; accepts 13.5% fall; would invest more; wants safety; savings 12 months or more; a loss would hardly matter; professional | 3<br>Capacity High<br>Flags: mixed attitude | 3<br>Prompts: loss | 4<br>Capacity High | Zurich 1 higher. Same as Aviva. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **13.** Age 74; 1 year; accepts 12.5% fall; would invest more; wants safety; savings under 3 months; a loss would hardly matter; professional | 3<br>Capacity Medium<br>Flags: mixed attitude, short horizon | 3<br>Prompts: loss | 3<br>Capacity Medium | Same in all three. |
| **14.** Age 31; 12 years; accepts 25% fall; would sell some; a little above a deposit; savings under 3 months; a loss would hit hard; regular investor | 3<br>Capacity Low<br>Flags: mixed attitude | 4<br>Prompts: loss | 3<br>Capacity Low | Same as Zurich. Aviva 1 higher. |
| **15.** Age 37; 10 years; accepts 26.5% fall; would wait; highest return; savings 3 to 11 months; a loss would have some effect; some recent experience | 5<br>Capacity Medium | 5<br>Prompts: reliance, expectations | 5<br>Capacity Medium | Same in all three. |
| **16.** Age 36; 5 years; accepts 31% fall; would invest more; highest return; savings 3 to 11 months; a loss would hit hard; no experience | 4<br>Capacity Low<br>Flags: capacity limit | 6<br>Prompts: reliance, expectations | 5<br>Capacity Low | Zurich 1 higher. Aviva 2 higher. Our capacity limit applies; Aviva ignores it. |
| **17.** Age 53; 4 years; accepts 8.5% fall; would sell all after a 20% fall; highest return; savings 12 months or more; a loss would hardly matter; no experience | 3<br>Capacity High<br>Flags: mixed attitude | 4<br>Prompts: expectations, loss | 2<br>Capacity High | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **18.** Age 33; 2 years; accepts 19% fall; would sell all after a 20% fall; wants safety; savings 12 months or more; a loss would have some effect; some recent experience | 2<br>Capacity High<br>Flags: mixed attitude, short horizon | 3<br>Prompts: loss | 1<br>Capacity Medium | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **19.** Age 68; 11 years; accepts 36% fall; would invest more; strong growth; savings 3 to 11 months; a loss would have some effect; some recent experience | 5<br>Capacity Medium<br>Flags: knowledge, age | 6 | 5<br>Capacity Medium | Same as Zurich. Aviva 1 higher. |
| **20.** Age 70; 9 years; accepts 9.5% fall; would sell all after a 20% fall; growth above inflation; savings under 3 months; a loss would have some effect; passive holder | 3<br>Capacity Low | 3 | 1<br>Capacity Low | Zurich 2 lower. Same as Aviva. Zurich deducts for age, term or knowledge. |
| **21.** Age 69; 4 years; accepts 37.5% fall; would sell all after a 20% fall; wants safety; savings 3 to 11 months; a loss would hit hard; no experience | 2<br>Capacity Low<br>Flags: mixed attitude | 3<br>Prompts: loss | 1<br>Capacity Low | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **22.** Age 26; 10 years; accepts 24% fall; would sell some; growth above inflation; savings under 3 months; a loss would hardly matter; some recent experience | 3<br>Capacity Medium | 4<br>Prompts: loss | 3<br>Capacity Medium | Same as Zurich. Aviva 1 higher. |
| **23.** Age 39; 4 years; accepts 8% fall; would invest more; a little above a deposit; savings 3 to 11 months; a loss would hardly matter; passive holder | 3<br>Capacity High<br>Flags: mixed attitude | 3 | 3<br>Capacity Medium | Same in all three. |
| **24.** Age 36; 8 years; accepts 34.5% fall; would sell all after a 20% fall; highest return; savings 3 to 11 months; a loss would hit hard; regular investor | 4<br>Capacity Low<br>Flags: mixed attitude, capacity limit | 6<br>Prompts: reliance, expectations | 4<br>Capacity Low | Same as Zurich. Aviva 2 higher. Our capacity limit applies; Aviva ignores it. |
| **25.** Age 41; 1 year; accepts 17% fall; would invest more; highest return; savings under 3 months; a loss would hit hard; passive holder | 3<br>Capacity Low<br>Flags: capacity limit, short horizon | 5<br>Prompts: reliance, expectations, loss | 4<br>Capacity Low | Zurich 1 higher. Aviva 2 higher. Our capacity limit and horizon limit applies; Aviva ignores it. |
| **26.** Age 73; 8 years; accepts no fall; would sell all after a 20% fall; wants safety; savings 12 months or more; a loss would hardly matter; some recent experience | 1<br>Capacity High | 0 (no-risk) | 1<br>Capacity High | Same as Zurich. Aviva's 0 means deposit-type only. |
| **27.** Age 70; 9 years; accepts 30.5% fall; would invest more; strong growth; savings 12 months or more; a loss would hit hard; some recent experience | 5<br>Capacity Medium<br>Flags: knowledge, age | 5<br>Prompts: reliance | 5<br>Capacity Medium | Same in all three. |
| **28.** Age 62; 3 years; accepts 5% fall; would sell some; strong growth; savings under 3 months; a loss would hardly matter; some recent experience | 3<br>Capacity Medium<br>Flags: mixed attitude | 3<br>Prompts: loss | 2<br>Capacity Medium | Zurich 1 lower. Same as Aviva. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **29.** Age 69; 8 years; accepts 28.5% fall; would invest more; a little above a deposit; savings 12 months or more; a loss would hardly matter; no experience | 5<br>Capacity High<br>Flags: mixed attitude, knowledge, age | 4<br>Prompts: loss | 4<br>Capacity High | Zurich 1 lower. Aviva 1 lower. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **30.** Age 32; 7 years; accepts 28.5% fall; would sell some; highest return; savings under 3 months; a loss would have some effect; regular investor | 4<br>Capacity Low<br>Flags: mixed attitude, capacity limit | 6<br>Prompts: reliance, expectations | 4<br>Capacity Low | Same as Zurich. Aviva 2 higher. Our capacity limit applies; Aviva ignores it. |
| **31.** Age 51; under 1 year; accepts 30% fall; would sell all after a 20% fall; highest return; savings 12 months or more; a loss would have some effect; passive holder | 3<br>Capacity High<br>Flags: mixed attitude, short horizon | 6<br>Prompts: reliance, expectations | 2<br>Capacity Medium | Zurich 1 lower. Aviva 3 higher. Our horizon limit applies; Aviva ignores it. |
| **32.** Age 25; 12 years; accepts 22% fall; would invest more; wants safety; savings 3 to 11 months; a loss would have some effect; regular investor | 4<br>Capacity Medium<br>Flags: mixed attitude | 3<br>Prompts: loss | 5<br>Capacity Medium | Zurich 1 higher. Aviva 1 lower. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **33.** Age 54; 7 years; accepts 4% fall; would invest more; wants safety; savings 3 to 11 months; a loss would have some effect; some recent experience | 2<br>Capacity Medium<br>Flags: mixed attitude | 0 (no-risk) | 3<br>Capacity Medium | Zurich 1 higher. Aviva's 0 means deposit-type only. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **34.** Age 27; 2 years; accepts 4.5% fall; would invest more; steady growth; savings under 3 months; a loss would hit hard; regular investor | 3<br>Capacity Low<br>Flags: mixed attitude, short horizon | 3<br>Prompts: loss | 4<br>Capacity Low | Zurich 1 higher. Same as Aviva. Mixed answers: we anchor on the loss answer, Zurich adds up points. |
| **35.** Age 47; 1 year; accepts 2.5% fall; would wait; strong growth; savings 12 months or more; a loss would hit hard; passive holder | 3<br>Capacity Medium<br>Flags: mixed attitude, short horizon | 3<br>Prompts: reliance, loss | 3<br>Capacity Medium | Same in all three. |
| **36.** Age 63; 5 years; accepts 29.5% fall; would sell all after a 20% fall; growth above inflation; savings 3 to 11 months; a loss would have some effect; regular investor | 3<br>Capacity Medium<br>Flags: mixed attitude | 4<br>Prompts: loss | 2<br>Capacity Medium | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **37.** Age 56; 11 years; accepts 35% fall; would sell all after a 20% fall; strong growth; savings 12 months or more; a loss would have some effect; professional | 5<br>Capacity High<br>Flags: mixed attitude | 6 | 3<br>Capacity Medium | Zurich 2 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **38.** Age 44; 9 years; accepts 21% fall; would wait; a little above a deposit; savings 3 to 11 months; a loss would have some effect; regular investor | 4<br>Capacity Medium<br>Flags: mixed attitude | 4<br>Prompts: loss | 4<br>Capacity Medium | Same in all three. |
| **39.** Age 30; 2 years; accepts 32.5% fall; would wait; wants safety; savings 12 months or more; a loss would hardly matter; regular investor | 3<br>Capacity High<br>Flags: mixed attitude, short horizon | 3<br>Prompts: loss | 3<br>Capacity High | Same in all three. |
| **40.** Age 38; 11 years; accepts 14% fall; would sell some; steady growth; savings 3 to 11 months; a loss would hardly matter; professional | 3<br>Capacity High | 4 | 3<br>Capacity Medium | Same as Zurich. Aviva 1 higher. |
| **41.** Age 44; 2 years; accepts 36% fall; would invest more; growth above inflation; savings under 3 months; a loss would hardly matter; regular investor | 3<br>Capacity Medium<br>Flags: mixed attitude, short horizon | 4<br>Prompts: loss | 4<br>Capacity Medium | Zurich 1 higher. Aviva 1 higher. Our horizon limit applies; Aviva ignores it. |
| **42.** Age 22; 9 years; accepts 20.5% fall; would sell some; highest return; savings 12 months or more; a loss would have some effect; no experience | 4<br>Capacity High<br>Flags: mixed attitude | 5<br>Prompts: reliance, expectations | 3<br>Capacity Medium | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **43.** Age 29; 8 years; accepts 26% fall; would sell all after a 20% fall; steady growth; savings 12 months or more; a loss would hardly matter; passive holder | 4<br>Capacity High<br>Flags: mixed attitude | 5 | 2<br>Capacity High | Zurich 2 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **44.** Age 59; 4 years; accepts 17.5% fall; would invest more; wants safety; savings 12 months or more; a loss would hardly matter; regular investor | 4<br>Capacity High<br>Flags: mixed attitude | 3<br>Prompts: loss | 3<br>Capacity High | Zurich 1 lower. Aviva 1 lower. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **45.** Age 56; 5 years; accepts 0.5% fall; would wait; growth above inflation; savings 12 months or more; a loss would hit hard; no experience | 2<br>Capacity Medium<br>Flags: mixed attitude | 0 (no-risk) | 2<br>Capacity Medium | Same as Zurich. Aviva's 0 means deposit-type only. |
| **46.** Age 46; under 1 year; accepts 19% fall; would sell some; growth above inflation; savings 12 months or more; a loss would have some effect; regular investor | 3<br>Capacity High<br>Flags: short horizon | 4<br>Prompts: loss | 2<br>Capacity Medium | Zurich 1 lower. Aviva 1 higher. Zurich deducts for age, term or knowledge. |
| **47.** Age 42; 7 years; accepts 34.5% fall; would sell all after a 20% fall; steady growth; savings under 3 months; a loss would hit hard; professional | 4<br>Capacity Low<br>Flags: mixed attitude | 5 | 3<br>Capacity Low | Zurich 1 lower. Aviva 1 higher. Mixed answers: we take the middle answer, Zurich is pulled down by the cautious one. |
| **48.** Age 33; 6 years; accepts 24% fall; would wait; a little above a deposit; savings under 3 months; a loss would hit hard; regular investor | 4<br>Capacity Low<br>Flags: mixed attitude | 4<br>Prompts: loss | 4<br>Capacity Low | Same in all three. |
| **49.** Age 30; 12 years; accepts 8% fall; would sell some; growth above inflation; savings 12 months or more; a loss would hardly matter; some recent experience | 3<br>Capacity High | 3 | 3<br>Capacity High | Same in all three. |
| **50.** Age 36; 11 years; accepts 11.5% fall; would sell some; steady growth; savings 3 to 11 months; a loss would hardly matter; some recent experience | 3<br>Capacity High | 4 | 3<br>Capacity Medium | Same as Zurich. Aviva 1 higher. |

## Appendix B. Where the Q4 loss figures come from

| Rating | Volatility band | Middle of band | Q4 mark (2 × middle) | Aviva 12-month worst case |
|---|---|---|---|---|
| 1 | 0–0.5% | 0.25% | No fall | none |
| 2 | 0.5–2% | 1.25% | 2.5% | 0% |
| 3 | 2–5% | 3.5% | 7% | 4.3% |
| 4 | 5–10% | 7.5% | 15% | 11.5% |
| 5 | 10–15% | 12.5% | 25% | 20.8% |
| 6 | 15–25% | 20% | 40% or more | 35.3% |

- **The rule:** A bad year is a fall of twice a fund's volatility, about 1 year in 40. Each mark is twice the middle of the ESMA band.
- **Against competitors:** Aviva uses the same rule but deducts its expected return, so its figures are a few points lower. Zurich's 5-year worst cases (11%, 21%, 32%, 37%) are higher. Ours sit between the two.
- **To test:** Real markets can fall further than this assumes. Test against our funds' worst 12-month falls and KID stress scenarios before sign-off.

## Appendix C. How competitors rate clients

| Provider | Questions | How the rating is produced | Capacity for loss | Time horizon | Highest |
|---|---|---|---|---|---|
| Proposed | 8 + date of birth (sustainability left out for now) | Attitude anchored on the loss answer, limited by horizon and capacity | 2 questions; Low limits the rating to 4 | Limits the rating | 6 |
| Aviva | 5 + term | Lookup of objective × maximum loss | Used only for prompts | Charts only | 6 |
| Zurich | 9 | Points, adjusted for age, term and knowledge | 2 questions; shown separately | Adjusts the score | 7 |
| Standard Life / Irish Life | 13 / 15 | Total score in bands (EV questionnaire) | Not assessed | Not assessed | SL 6; IL 7 |

The full competitor questions are in `docs/risk-questionnaires.md`.
