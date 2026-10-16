# Quotation Tool vs actuarial workbooks: parity testing

This note records how the Quotation Tool's calculation engines were checked against the actuarial illustration workbooks: what was tested, what was found, what has been changed, and what is still open.

Last run: 16 October 2026. Result: 10,256 checks, 0 unexpected mismatches, 261 known differences. Every known difference has a documented cause (sections 5 and 6) and is listed by reason at the end of each run.

## 1. Workbooks and engines

| Product | Workbook | Engine |
|---|---|---|
| PRSA | `AdditionalInfo/prsa/Copy of PRSA Illustration Generator V5 - IVP013380.xlsx` (sheet `SRP`) | `js/engine_prsa.js`, `js/prsa_data.js` |
| Investment Bond | `AdditionalInfo/InvBond/IB Illustration Generator_v0.12.xlsx` (sheet `Projections`) | `js/engine_ib.js`, `js/ib_data.js` |
| ARF | `AdditionalInfo/ARF/ARF Illustration Generator_v13_assumptions_update - 3rd Check.xlsx` (sheet `ARF Projections`) | `js/engine_arf.js`, `js/arf_data.js` |

## 2. How to run it

```
python tests/excel_parity_test.py            # everything
python tests/excel_parity_test.py arf        # one or more of: prsa ib arf data
```

- Takes about 6 minutes (about 1 to 2 minutes per product). It needs Excel and `pywin32`.
- Each workbook is copied to a temporary folder and driven through Excel in a hidden instance. The originals are never opened.
- The engines run in Node through `tests/engine_runner.js`, which loads the same files in the same order as `quotation_tool.html`.
- Results are written to `tests/out/`:
  - `excel_parity_run.txt`: per-case summary
  - `excel_parity_diff.csv`: every value compared
  - `excel_parity_results.json`: summary and all mismatches
- Known, agreed differences are declared in the `KNOWN` list at the top of the script. They stay in the CSV (column `known`) but do not fail the run.
- Tolerances: €0.01 on values, 1e-6 on rates, ±0.51 on table figures the engine rounds to whole euros.
- Self-check: values rebuilt from the workbook's monthly rows agree with the workbook's own summary tables to 1e-6. This confirms the cell mapping.

### Workbook settings changed for the test

| Workbook | Cell | Saved as | Set to | Why |
|---|---|---|---|---|
| PRSA | `SRP!E78` maximum return | `=F5` (caps all returns at the Strategy Select 30 rate, 5.135%) | 6% | Matches the ASP cap used by the engine |
| PRSA | `SRP!D87` special deal | Yes | No | "Yes" changes the RP commission scale. A commission override is entered as a special-deal SP increase instead |
| IB | `Projections!C65` tiered bonus | No | No (left as saved) | The engine now has it off too (see section 5) |
| IB | policyholder type | – | `"Corporate "` | Only works with a trailing space (see section 6) |
| ARF | `C45` growth rate 1 | – | overwritten for case R4 | The workbook has no rate override input |

## 3. What is compared

**PRSA (`SRP` sheet)**
- Term in months and the final-month factor.
- Charges: AMC, ongoing commission, SP and RP contribution charges, SP upfront and RP upfront commission %.
- Rates: gross growth, fund charge and guarantee charge, month by month.
- Gross IRR, net IRR and reduction in yield.
- Maturity value with and without charges, total contributions, value in current prices, annuity factor, monthly and annual income.
- Initial commission.
- Each snapshot year: fund with and without charges, contributions, growth, commission, and charges in the year and to date.

**Investment Bond (`Projections` sheet)**
- Exit tax rate, blended growth, fund and guarantee charges, policy charge, ongoing commission.
- SP and RP allocation, SP and RP initial commission.
- Income start month, year the fund runs out, IRRs and reduction in yield.
- Every year 1–40: fund value, policy value, commission, charges including the levy, gross income and tax.
- The A–F table in the pack.

**ARF (`ARF Projections` sheet, both growth rates)**
- Blended growth, fund and guarantee charges, policy charge, ongoing commission, growth rates 1 and 2.
- SP allocation, initial commission, income start month.
- Per rate: year the fund runs out, IRRs, reduction in yield, first-year income.
- Every year 1–40: fund value, value after exit charge, income, commission, charges.
- The A–E table in the pack.

**Data tables:** all fund growth rates and charges; the PRSA, IB and ARF product version tables; PRSA glidepaths for every strategy at 0–540 months to retirement; the ILT15 mortality table.

### Not covered

- PRSA: RP commission override (no workbook input), half-yearly payments (not in the tool), different fund splits for transfer / SP / RP (the tool uses one mix), AVC PRSA, SP and transfer together (the workbook blocks it).
- IB: special-deal commission paths.
- ARF: override of growth rate 2 (fixed in the workbook).
- PDF and on-screen wording.

## 4. Cases and current result

| Product | Case | Description | Checks | Unexpected mismatches |
|---|---|---|---|---|
| PRSA | P1 | NS A5, DIS, SP 50k + RP 500/m, M, NRA 65 | 184 | 0 (+83 known) |
| PRSA | P2 | NS B3, Autopilot Dynamic (GMAB), transfer 120k + RP 300/q esc 3%, F, NRA 66 | 165 | 0 (+29 known) |
| PRSA | P3 | Std E2, Lifecycle Opportunity, SP 8k + RP 80/m (both under the charge thresholds) esc 2%, M, NRA 60 | 226 | 0 (+81 known) |
| PRSA | P4 | NS F4, DIY SS50 (GMAB) 40 / DMAS75 30 / MSCI World 30, SP 200k, SP commission override 2.5%, F, NRA 65 | 95 | 0 |
| PRSA | P5 | NS A3, Lifecycle Balanced, RP 1,000/yr only, M, NRA 68 | 249 | 0 |
| PRSA | P6 | NS C2, DIY Cash 20 / AFISD 30 / SS30 (GMAB) 50, SP 30k + RP 270/q, term under 5 years (Irish Life annuity), F, NRA 66 | 53 | 0 |
| PRSA | P7 | Std E1, DIS, RP 250/m esc 3%, F, NRA 67 | 119 | 0 (+38 known) |
| PRSA | P8 | NS D1, Lifecycle Dynamic, SP 100k only, M, NRA 70 | 207 | 0 (+10 known) |
| PRSA | P9 | Std E3, DIY SS75 60 / S&P500 40, transfer 60k + RP 400/m, M, NRA 66 | 150 | 0 (+13 known) |
| IB | I1 | D5, SP 100k, SS50 (GMAB) 75 / S&P500 25, individual, no income (the workbook's saved case) | 411 | 0 |
| IB | I2 | K1, SP 50k + RP 500/m, Euro Cash 100, individual | 414 | 0 |
| IB | I3 | A1, SP 200k, SS50 100, exempt, income 5% of fund from start | 412 | 0 |
| IB | I4 | C4, SP 600k, DMAS50 40 / MSCI World 30 / SS30 (GMAB) 30, corporate, income 30k esc 2% from age 70 | 400 | 0 |
| IB | I5 | M2, RP only 1,000/q esc 3%, Best Styles 50 / AFIE 50, individual | 412 | 0 |
| IB | I6 | G3, SP 150k, S&P500 60 / Euro Stoxx 40, individual, SP commission override 1.5% | 411 | 0 |
| IB | I7 | E6, SP 80k, SS75 100, individual, income 9,000 a year level from start (fund runs out) | 382 | 0 |
| IB | I8 | L1, SP 40k + RP 200/m, DMAS15 100, corporate | 414 | 0 |
| ARF | R1 | A5, SP 300k, SS50 60 / AFIE 40, default income (4%) from start, age 66 | 661 | 0 |
| ARF | R2 | B2, SP 150k, SS75 (GMAB) 50 / MSCI World 50, fixed 12,000 a year esc 3%, age 71 | 636 | 0 |
| ARF | R3 | F3, SP 2.5m (6% deemed), DMAS50 100, custom 7%, age 62, SP commission override 1% | 641 | 0 |
| ARF | R4 | D1, SP 40k, Euro Cash 100, fixed 9,000 a year esc 2%, age 76, growth rate 1 override 4.5% | 616 | 0 |
| ARF | R5 | C2, SP 500k, SS30 (GMAB) 50 / DMAS15 30 / S&P500 20, default income deferred to age 68 (starts at 65) | 671 | 0 |
| ARF | R6 | A1, SP 80k, Euro Stoxx 100, custom 4.5% from age 70 (crosses 71, so the 5% deemed minimum applies) | 666 | 0 |
| ARF | R7 | F5, SP 60k, AFISD 50 / Cash 50, fixed 6,000 a year level, age 65 (fund runs out) | 631 | 0 |
| Data | PRSA funds | | 42 | 0 |
| Data | PRSA codes | B3 single contribution commission (section 5) | 110 | 0 (+1 known) |
| Data | PRSA glidepaths | Monthly charge conversion (section 5) | 55 | 0 (+4 known) |
| Data | PRSA mortality | Workbook table runs to age 152; the engine treats 120+ as qx = 1 | 4 | 0 (+2 known) |
| Data | IB/ARF funds, IB codes, ARF codes, ARF funds | | 823 | 0 |

## 5. Decisions taken

| Item | Decision | Status |
|---|---|---|
| PRSA B3 single contribution commission. Workbook `Parameters!F14` is 3.5%; the tool is 2% | 2% is correct | Tool unchanged. **Workbook to be corrected** |
| PRSA Non-Standard DIS guarantee charge. Workbook charges it only from 96 months to retirement (`Investment Strategies!BL`); the tool charged it from 107 | Match the workbook | **Done:** `gmabMaxMtr: 96` on NS DIS in `prsa_data.js`, applied by `prsaGmabOn()` in `engine_prsa.js` |
| IB tiered large-case bonus. Workbook default off (`C65` = "No"); product spec §1.4.6 says "Charges and commissions will not be tiered"; the tool always applied it | Match the workbook | **Done:** `IB_TIERED_BONUS_ON = false` in `ib_data.js` |
| PRSA initial commission on transfer values. The workbook pays trail only on the transfer | Match the workbook | Tool unchanged (it already pays trail only) |
| PRSA monthly charge conversion for DIS and Standard Lifecycle Opportunity | Open: for the actuaries | See below. Switching the three affected conversions in memory makes P1 and P7 match (P3 then differs only by workbook issue 1) |
| Workbook issues 1 and 2 (section 6) | Do not copy workbook bugs | Tool unchanged; shown as known differences |
| Transfer value in PRSA "contributions paid" | Open: the workbook leaves it out of `SRP!D20`, the tool includes it so that contributions + growth = fund | Tool unchanged; shown as a known difference |
| PRSA regular contribution escalation cap | Open: the workbook caps it at 3% (`SRP!G62`); the tool lets the user enter up to 10% | Tool unchanged |

### Monthly charge conversion (open)

An annual charge `x` can be turned into a monthly deduction in two ways:

- `1-(1-x)^(1/12)`: twelve monthly deductions take exactly `x` off the fund over a year.
- `(1+x)^(1/12)-1`: twelve monthly deductions take off `x/(1+x)`, which is slightly less than `x`.

The workbook uses the first formula for the AMC, ongoing commission, every DIY fund and every glidepath strategy except these three:

- **Default Investment Strategy, Non-Standard and Standard:** `Investment Strategies!BN` (guarantee) and `BP` (fund charge).
- **Standard Lifecycle Opportunity:** `Investment Strategies!AT` and `AV`, rows 1089–1629.

The engine uses the first formula everywhere, so it agrees with the workbook except for these three. The effect is small: on a DIS fund charge of about 0.57% a year the workbook deducts about 0.003% a year less. The workbook is not consistent with itself here, so the actuaries should say which formula is intended before either side is changed.

## 6. Workbook issues to raise

1. **PRSA: charge on single-contribution funds scaled twice in the final month.**
   - `SRP!R340:R689` ends with an extra `*IF(D=$A$91,SRP_finalmonthfactor,1)`, so the final-month charge on the SP fund is multiplied by the final-month factor twice.
   - Rows 91–339 of the same column, and columns J (transfer fund) and AA (regular contributions), apply it once.
   - Row 339: `-((O+P*(1-chg)+Q/2)*(admin+M+N)*IF(D=$A$91,fmf,1)+P*chg)`
   - Row 340: `-((O+P*(1-chg)+Q/2)*(admin+M+N)*IF(D=$A$91,fmf,1)+P*chg)*IF(D=$A$91,fmf,1)`
   - Only plans with an SP fund and a term of 250 months or more are affected, and only in the final month. Case P8 is about €53 out at retirement because of it.
2. **PRSA: trail commission on the transfer value does not grow after month 1.**
   - In `SRP!AD`, the year-1 branch uses the current month's transfer-fund value (`$H92`, `$H93`, …).
   - From year 2 the branch uses `H$91`, which is anchored to the opening transfer value. Example from `AD104`: `-((H$91+$I104/2+$O104+…)*SRP_Ren_Com_Mthly)`.
   - Growth on the transfer (`$I`) is still included, but the fund value itself stays at its starting level, so trail on transfers is understated as the fund grows, or overstated if it falls. The SP and RP funds (`$O`, `$W`) are not anchored.
   - In case P2 (transfer 120k), trail commission differs by up to about €186 a year.
3. **IB: "Corporate" policyholder needs a trailing space.** `Parameters!C107` holds `"Corporate "`. Choosing "Corporate" without the space gives `#N/A` for the tax rate.
4. **IB: year the fund runs out not always found.** `Projections!C52 =MATCH(0,X76:X674,0)` looks for an exact 0. In case I4 the fund ends at −2.3e−13, so the workbook reports no depletion year while the tool reports year 28. A test such as `<=0`, or rounding before the match, would fix it.
5. **PRSA: saved maximum return.** `SRP!E78` is saved as `=F5`, which caps every strategy at the Strategy Select 30 rate (5.135%) rather than the 6% ASP cap.

## 7. Engine changes made to match the workbook

All of these were made on 16 October 2026 and verified by the parity run.

**PRSA (`engine_prsa.js`)**
1. Term: `ROUNDUP((NRA − age)×12)` with age = (start − DOB)/365.25, final-month factor `(NRA − age)×12 + 1 − term`. RP upfront commission uses `NRA − age`.
2. Glidepath lookup uses months to retirement `T − m + 1`.
3. RP contribution charge is tested on every payment using its monthly equivalent, escalated amounts included.
4. Initial commission is paid on the gross contribution (SP and RP). The PDF no longer says "after contribution charge".
5. Trail commission: opening value plus half the month's growth, contributions at gross value, `1-(1-x)^(1/12)`. The transfer value is not anchored (workbook issue 2 is not copied).
6. Annuity: adjusted qx = 1 from age 120.
7. Charges in year include the SP contribution charge.
8. The last part-year is labelled with its policy year.

**Investment Bond (`engine_ib.js`)**
1. K, L and M versions allocate 101% of the single contribution.
2. The RP commission clawback is removed from the policy value and charges (the workbook has none).
3. Column E of the table is income after tax, so F = A + B − C − D − E holds. The tool no longer takes the withdrawal tax off twice. The column header now says "after tax".
4. A negative exit tax (deemed-disposal credit) is allowed.
5. Reduction in yield follows the workbook window (`AX:BB`): cash-in at the opening pool value, the levy included in the no-charge pool, and the 20-year or fund-zero-year horizon.

**ARF (`engine_arf.js`)**
1. The age-71 deemed rate uses the age at the start of the month.
2. A commission override changes the allocation (`1 + standard − used`). The workbook's month-1 quirks are reproduced: commission base and no-charge fund exclude the uplift, and the table's charges column nets it off.
3. Reduction in yield: the fund-runs-out cash-in is the no-charge fund at the start of the last month.

**Note.** The header of `engine_prsa.js` still says the maths must match `prsa_tool.html`. That is no longer true. `tests/parity_test.py` compares against the old tools and will now show differences.

## 8. Other notes

- **PRSA regular contribution charge threshold.** The workbook applies the €100 threshold to the monthly equivalent, so €250 a quarter (about €83 a month) is charged. This confirms PRSA fix 3.
- **Standard DIY fund list.** The workbook leaves Advanced Fixed Income Euro out of Standard DIY (`SRP!K3` is blank for Standard), but the tool's `STD_FUND_IDS` includes it. Product to confirm.
