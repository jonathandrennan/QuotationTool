# Risk profiler – legal requirements for what the tool does

Draft for Compliance review, 22/10/2026. Checked against the legal texts in `docs/regs-research/` (read 22/10/2026), not from memory. This is a working analysis, not legal advice. Compliance or Legal must confirm the points marked **Confirm**.

## 1. What the tool is, and why that narrows the law

The tool gives the adviser a **general risk rating (1 to 6)** to use when choosing funds. The adviser runs it alongside their own fact find, and the adviser (not Allianz) gives the advice and issues the Statement of Suitability.

That is the same role Zurich's profiler plays. In Zurich's PRSA sample report the profiler supplies two things: a risk rating and a capacity-for-loss statement. The adviser's Statement of Suitability uses them, and the report says the tool "does not constitute advice from Zurich Life" and that the adviser must review the client's overall situation. Zurich's profiler does not test knowledge, does not cap the rating, and has no attitude-to-risk answer that depends on a fact find.

So the law does not require the tool to carry the whole suitability assessment. It requires the tool to be a **sound input** to the adviser's assessment. Sections 3 and 4 separate what the law requires of the tool from what the adviser's fact find must cover and from what is only good practice.

## 2. Which rules apply, by product

| Product | Regime | Operative text |
|---|---|---|
| **Investment Bond** | IDD suitability for insurance-based investment products (IBIPs) | IDD Art 30(1); Irish Insurance Distribution Regulations 2018 (S.I. 229/2018) Reg 42; Delegated Reg (EU) 2017/2359 Arts 9–14, 17, 19 as amended by 2021/1257 |
| **PRSA** | Consumer Protection Code 2025 (S.I. 81/2025) Regs 16–19 | The IBIP definition (IDD via PRIIPs Art 2(2)(c); S.I. 229/2018 Reg 2) excludes "pension products which, under national law, are recognised as having the primary purpose of providing the investor with an income in retirement". The Code then applies: Reg 11(3) switches off Regs 16–19 only for advice on IBIPs |
| **ARF** | Same as PRSA, if it is outside the IBIP definition | **Confirm.** An ARF is a post-retirement income product, so the exclusion is likely, but the draft correctly leaves it open |
| All products | Code Regs 38–39 (digital platforms), 47 and 64 (plain language), 34–37 (vulnerable consumers) | Reg 38 applies to any regulated entity that engages a consumer "by means of a digital platform" |

The draft's section 4 already says this. Two corrections: the IDD, 2359 and 2021/1257 references are now checked against the texts, and the draft treats the ESMA guidelines as the benchmark, which is only a benchmark. **ESMA35-43-3172 is a MiFID document. It does not bind an insurer or insurance intermediary under IDD or the Code.** Nothing in the supplied texts adopts it for IBIPs. Failing an ESMA paragraph is therefore not in itself a breach for these products.

## 3. What the law requires of the tool

These are the requirements that attach to the tool itself, and so to what we are building.

| # | Requirement | Source | Status in the current design |
|---|---|---|---|
| L1 | Capture the client's **risk tolerance / attitude to risk**, including their preferences regarding risk taking and the "risk profile" | IDD Art 30(1); 2359 Art 9(2)(a), 9(4); Code Reg 16(3)(d), 17(2)(c) | **Met** by Q4–Q6 |
| L2 | Capture the **holding period** and purpose of the investment | 2359 Art 9(4); Code Reg 16(4)(a) | **Met** by Q3 (purpose by Q6) |
| L3 | Capture the **importance of capital security** to the client | Code Reg 16(7) (PRSA/ARF only) | **Partly met.** Q4 ("no fall") and Q6 option 1 ("keep my money safe") touch it, but nothing asks it directly. Either note that they cover it, or have the fact find ask it |
| L4 | The tool must be **fit for purpose**, with limits identified and mitigated | 2359 Art 10(b) | Met in principle. The limits are written down (this tool gives a general rating only, and the adviser reviews it) |
| L5 | Questions **likely to be understood** and to capture the client's real objectives | 2359 Art 10(c); Code Regs 47, 64 | **Not yet shown.** The draft says "Not yet tested with clients" |
| L6 | **Consistency checks** on the client's information | 2359 Art 10(d) | Met by flag F1 (mixed attitude) and F6 (changed answers) |
| L7 | A digital platform must be **easy to use, understand and navigate, and tested to show it is** | Code Reg 38(a), 38(b) | **Gap.** Client usability testing has not been done. This is a legal requirement for PRSA and ARF, not just good practice |
| L8 | Algorithms must give **objective, consistent outcomes, be documented, and be tested** | Code Reg 38(c) | **Largely met.** The rules are documented (`RISK_PROFILER.md`) and tested (`tests/risk_profiler_test.js`). Still needed: a named sign-off and a versioned test record |
| L9 | **No preselected option** showing the client has read or understood the information | Code Reg 39 | **Met.** "I accept" is a button the client must choose; nothing is ticked in advance |
| L10 | **Do not blur who is responsible** for the suitability assessment. Say plainly the assessment is to act in the client's best interest. Responsibility is not reduced because a tool is used | 2359 Arts 11, 12 | **Met** if the "Important information" wording keeps saying the tool supports the adviser and does not replace them. See L12 below for one sentence that overreaches |
| L11 | Keep **records**, including the answers, the result and **any change to the client's risk tolerance** | 2359 Art 19(2)(a),(c); Code Reg 16(1) | **Met.** The record holds the answers, ratings, limits, flags, any lower rating chosen by the adviser and its reason, and the version |
| L12 | Do not commit the adviser to things the tool cannot promise. If a periodic review will be provided, the client must be told; the Statement of Suitability must say whether a periodic review is likely to be needed | 2359 Art 14(2),(4); Code Reg 374 | **Gap.** The introduction says the adviser "will review your risk profile with you at least once a year". That is a promise on the adviser's behalf. Reword to "should be reviewed at least once a year" unless every adviser contractually does so |
| L13 | Do not ask again for information already obtained | 2359 Art 17(3) | **Met.** The date of birth is taken from Step 2 |
| L14 | The adviser may not raise the rating above what the answers support, and may lower it only with a recorded reason | 2359 Arts 9(2), 19(2)(c) | **Met.** Higher ratings are locked and a lower rating needs a reason |

## 4. What the law requires, but the adviser's fact find must cover

The law requires this information for the suitability assessment. The tool does not have to collect it, because the adviser does. The tool should say it does not.

| Information | Source | Where it should sit |
|---|---|---|
| Income, assets, liquid assets, regular commitments, debts | 2359 Art 9(3); Code Reg 16(6) | The fact find. **Q1 and Q2 do not satisfy this.** They give a two-question view of capacity for loss, not the financial information the law lists |
| Dependants, health, employment, known future changes | Code Reg 16(5) | The fact find |
| Knowledge and experience of the product type (products known, number, value and frequency of past transactions, education and profession) | IDD Art 30(1); 2359 Art 17(1); Code Reg 16(5)(c) | The fact find. Q7 and Q8 are a short version of this; they are not required in the tool |
| Whether the client can bear losses, and whether any product is suitable | IDD Art 30(1); 2359 Art 9(2)(b), 9(6); Code Reg 17(2)(b),(c) | The adviser. The tool's capacity result is an input to this, not the finding |
| **Certification by the client that the information is accurate** | Code Reg 16(13) | The fact find declaration. **Confirm it covers the profiler answers.** If it does not, add a client-ticked confirmation at the end of the result (not preselected, per Reg 39) |
| Material changes since last time | Code Reg 16(9)–(10) | The adviser |
| The Statement of Suitability, including the required notice for the Code | Code Reg 18(6); 2359 Art 14 | The adviser, using the tool's output. The notice already appears in the generated statement |

## 5. Sustainability preferences (Part E, currently off)

| Regime | Requirement | Current design |
|---|---|---|
| Investment Bond (IBIP) | The adviser must obtain the client's sustainability preferences, defined as the choice "whether and, if so, to what extent" the client wants taxonomy-aligned, SFDR sustainable, or PAI-considering investments (2359 Art 2(4) as added by 2021/1257; Art 9(4)). A product that does not meet them must not be recommended as meeting them, and the reason is recorded (Art 9(6)). Recital 36 says to assess other objectives first | **Gap.** A bare Yes/No does not capture "to what extent". Either the adviser's fact find asks the three-way question with a minimum share, or Part E is switched back on for the Investment Bond |
| PRSA, ARF (Code) | "Any sustainability preferences with regard to the financial service" must be gathered (Reg 16(3)(e)). They are excluded from the suitability test itself (Regs 17(2), 18(3)) and must be identified in the statement where met (Reg 18(5)) | A Yes/No is a thinner basis than the IBIP rules, but the Code does not prescribe the form. **Confirm** |
| Order | Ask after the other objectives (recital 36) | Part E is designed to come after the rating |

## 6. What is only good practice

These are in the draft but are not required by the IDD texts, the Irish regulations, or the Code. They are ESMA benchmarks, Zurich's choices, or our own design. Keep, drop or tune them as the business wishes. They need no legal justification, but if kept they must work as documented, because Code Reg 38(c) requires consistent, documented outcomes.

| Feature | Basis | Comment |
|---|---|---|
| Knowledge test (Q8) and the knowledge level | ESMA 46, 52 | Not required in the tool. Zurich asks a one-line self-rating only. If kept, it raises flags and never changes the rating, which is the safest use |
| Hard cap on the rating from Low capacity (4), and from horizon (3 and 5) | Our own design | The law requires the recommendation to fit risk tolerance and ability to bear losses, and that is the adviser's duty. Zurich shows capacity separately and lowers the profile only for short terms. A cap is stricter than Zurich and Aviva and creates a locked ceiling for the adviser (higher ratings are locked). That is a choice for the business |
| "No skipping", forced answers | ESMA 22 | Fine, and consistent with Reg 16(11) (no information, no advice). Not an express tool requirement |
| Flags F2 (low knowledge), F5 (age 65+) | ESMA 24, 40, 51–52 | Useful for vulnerable-consumer and over-confidence checks (Code Regs 34–37). Not tool requirements |
| Slider, drag-and-drop layout rules | ESMA 22 | Only Reg 38(a)–(b) (easy to use, tested) is binding |
| Age and date-of-birth question | ESMA 24; Code Reg 16(5)(a) | Age is information the adviser must hold (Code), not a tool requirement. Taking it from Step 2 is right |
| Volatility bands, the Q4 loss marks | Our design, checked against PRIIPs risk bands | Not a legal requirement. Test against fund KIDs before sign-off |

## 7. Verdict on the current design

- **Legally sound as an input to the adviser's assessment**, provided the L3, L5, L7 and L12 gaps are closed and the fact-find points in section 4 and 5 are confirmed.
- **Over-built for its legal purpose.** Q1, Q2, Q7, Q8, the caps and most flags go beyond what the law requires of a rating tool. That is not a legal problem, but each extra rule is something that must be documented, tested and defended (Reg 38(c)), and the capacity cap makes us stricter than both Zurich and Aviva.
- **The "Important information" acceptance is acceptable.** It does not shift responsibility (Arts 11–12 are satisfied while it says the tool supports the adviser). Zurich uses the same two confirmations. The draft's own note that this conflicts with ESMA 14–15 is not a legal conflict for IDD or the Code.

## 8. Actions

1. **Compliance to confirm** the product mapping in section 2 (especially the ARF) and that ESMA is a benchmark only.
2. **Run client usability testing** and keep the record (Code Reg 38(b)). This is the one clear legal gap in the tool itself.
3. **Reword the annual review sentence** in the introduction (L12).
4. **Decide L3:** note that Q4 and Q6 cover the importance of capital security, or add it to the fact find.
5. **Confirm the fact find** covers the items in section 4 (financial information, knowledge and experience, the accuracy certification).
6. **Decide sustainability for the Investment Bond** (section 5): extend the fact find, or switch Part E on for that product.
7. **Decide whether to keep** the section 6 extras. A lighter tool (Q3–Q6 plus capacity as a reported result, like Zurich) would meet the same legal requirements with fewer rules to defend.
8. **Name a sign-off owner** and keep versioned test results (Reg 38(c)).
