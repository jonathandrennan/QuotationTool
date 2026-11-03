# Handoff: IB allocation, special deal, and the scenarios page

Written 2 Nov 2026 for picking this work up in a new chat. Repo: `c:\Github\QuotationTool`. Nothing from this work is committed yet.

## 1. What was asked

1. Compare how allocation rates work on the Investment Bond (IB) in the IB workbook (source of truth) against the tool.
2. Make ARF and IB support a **special deal** (company-funded extra commission) separate from the commission stepper (a client trade-off against allocation).
3. Explain a broker request (B3, Strategy Select 75 with 85% guarantee, 102% allocation, 1.80% charge, +1% bonus commission, €750k).
4. Build a separate one-off page (not a toggle in the tool) showing 5-year and 10-year example returns, editable per year, with the Annual Guarantee, reusing the tool's engine and quote-pack styling.

## 2. How allocation works (IB workbook v0.12, `AdditionalInfo/InvBond/IB Illustration Generator_v0.12.xlsx`)

- Single-contribution allocation (Projections C67): `1 + (upfront_commission − new_upfront_commission) + (RP Allocation Rate − 1, if non-zero) + tiered bonus`.
  - `upfront_commission` is the **Parameters col F "SP Upfront Special Deal"** value, which is base + special deal if the special-deal indicator is on.
  - `new_upfront_commission` is the commission actually used (C66): the default, or the manually adjusted figure (C64, a multiple of 0.25%, max 4.5%).
  - So a special deal raises the base and leaves allocation at 100%. A manual change moves allocation: higher commission means less invested, lower means more.
- K1/L1/M1 have an RP allocation rate of 1.01 (also applied to the single contribution); K2/L2/M2 have 1.00.
- Tiered bonus (0.5% from €100k, 1% from €500k) is switched off (C65 = "No") and the product spec says charges are not tiered.
- Government levy 1% on every premium is taken from the raw premium; commission is on the raw premium.
- ARF has the same allocation trade-off (ARF Projections C75). PRSA does not: its commission never changes the amount invested (contribution charge is a separate 2% below fixed thresholds).

## 3. What was found and changed

Findings (before changes): core allocation formulas and all 41 IB code data matched the workbook. Gaps were (a) PDF hardcoded "Contribution charge: None" for ARF/IB even when allocation was not 100%, (b) the commission stepper used 0.5% steps and no cap (workbook: multiples of 0.25%, max 4.5% IB / 6% ARF), (c) no special deal.

Changes made (uncommitted):

- `js/engine_arf.js`, `js/engine_ib.js`: `specialDeal` input; `arfBaseSpUp/ibBaseSpUp` (standard + special deal); allocation `1 + (base − used)`; `spAllocRate` / `rpAllocRate` on results.
- `js/arf_data.js` (`ARF_MAX_SP_COMM` 6%), `js/ib_data.js` (`IB_MAX_SP_COMM` 4.5%).
- `quotation_tool.html`: `specialDeal` in state and `engineInput()`; commission panel has a **Special deal** stepper, a corrected **Initial commission** stepper (measured from base, capped), and an **Allocation** row; remuneration card shows a "Special deal" badge; charges notes use the new allocation wording.
- `js/quote_text.js`: `allocCharge`, `allocExtra`, `allocExtraRp` strings (DRAFT, need Compliance sign-off) and `qtAllocation(r)`.
- `js/quote_pdf.js`: contribution charge shown as a % where commission exceeds base; additional allocation sentence; "remuneration differs from standard" note also for a special deal.
- `tests/excel_parity_test.py`: new cases I9, I10 (IB) and R8, R9 (ARF) for special deal alone and with a manual override; `tests/ib_ui_test.py` updated.
- `js/engine_ib.js` (second change, for the scenarios page): `ibRunProjection(inp, rates)` also accepts an **array of gross rates, one per policy year**, and `inp.gteeLevel` (for example 0.85) applies the **Annual Guarantee floor** at each anniversary. New result fields: `ratesByYear`, `gteeLevel`, `gteeTopUp`; per-year `growth`, `topUp`, `gross`, `protectedNext`. Standard quotes do not use any of it.
- `oneoff/ib_scenarios.html` and `oneoff/README.md`: the scenarios page (section 5).

## 4. How it was verified

- Excel parity suite (`tests/excel_parity_test.py`): 12,408 checks, 0 mismatches, after both engine changes. The old failures on K1/L1 (SP allocation 1.01) are fixed.
- Array of one repeated rate equals the single rate (identical except float noise in `effectiveGross`); guarantee floor does not trigger at a flat 6%; at −25% in year 2 it tops up €87,474 on the B3/€750k example.
- `tests/ib_ui_test.py` and `tests/ui_test.py` pass. The scenarios page builds the tool's pack (10 pages) with no console errors.
- **Node is not installed on this machine.** The Excel parity test calls `node`, so it was run through a temporary wrapper that executes the engines in headless Edge (`/tmp/qtrun/parity_browser.py`, not in the repo). The run takes about 8–10 minutes; run it in the background. Anyone with Node can run `python tests/excel_parity_test.py` directly. It also needs Excel (COM), pywin32 and openpyxl.

## 5. The scenarios page (`oneoff/ib_scenarios.html`)

Standalone page, opened from disk. It loads the tool's own files from `../js/`:

- numbers: `engine_ib.js` (`ibRunProjection` for the examples, `runIbQuote` for the standard quote);
- quote pages: `qtBuildPack` from `quote_pdf.js`, then the example pages are inserted before the Charges pages in the same page flow;
- looks and wording: pack styles and helpers (`qtPackCss`, `qtSvgLineChart`, `qtStat3`, `qtWarnBox`), `quote_text.js`, `quote_content.js`.

Inputs: client and adviser, plan (version, contribution, policyholder, fund, special deal, commission, guarantee and level), a 5-year and a 10-year example with an editable return for every year, presets (flat, factsheet history, −25% in year 2), choice of quote pages to include. Output: preview, **Open to print / save as PDF**, CSV download. Defaults are Michael's case.

## 6. The broker case (B3 / Strategy Select 75 / €750k)

- Total annual charge 1.80% = 0.70% policy charge (B3) + 0.25% fund charge (SS75) + 0.85% guarantee charge (85% level). That figure only fits the Investment Bond.
- "102% / +1% bonus / 101% to client, 2% to adviser": base commission is 2% standard + 1% special deal = 3%. Michael takes 2%, so allocation = 1 + (3% − 2%) = **101%**, i.e. €757,500 invested on €750,000 before the levy.
- In the tool: IB, version B3, €750,000, 100% Strategy Select 75 with the guarantee on, Special deal +1.00%, Initial commission −1.00% (down to 2.00%).
- The 8.86% he quoted is not on the SS75 or DMAS SRI 75 factsheets (nearest: SS75 10-year p.a. 8.00% net). Past performance cannot be used for the projection, which is capped at 6% gross.

## 7. Fund fee and factsheet notes

- The SS75 factsheet (WT2 share class) return is net of only the fund's **0.25% TER** (all-in fee 0.24%). It does not include the 0.70% policy charge, the 0.85% guarantee charge, the 1% levy or exit tax.
- Reversing the fund fee out of a 5-year figure: `gross p.a. = (1 + net p.a.) / (1 − 0.0025) − 1`. For the 30/09/2026 factsheet, 5 years p.a. is 6.39% net and 6.66% gross. Doing it on the cumulative figure and then annualising gives the same answer: `((1 + cumulative) / 0.9975^5)^(1/5) − 1`.
- The latest factsheet in `Downloads` (file name says 31102024, content is dated **30/09/2026**) is newer than `docs/factsheets/ss75.pdf` (31/08/2026). The repo copy has **not** been replaced. Decision pending.
- The page's "Factsheet history" preset uses the 12 months to 30 September 2017–2026 annual returns from the 30/09/2026 factsheet.

## 8. Government levy

1% of every contribution on the Investment Bond (single and regular), collected by Allianz for the State and deducted when each contribution is invested. Not on ARF or PRSA. Taken from the raw premium (before the allocation uplift), once at the point of investment. In month 1 the engine works out the percentage charges on the allocated amount before the levy comes out (the same as the workbook, Projections N75), so charges are on the post-levy fund from month 2. The effect is about €11 on €750k.

## 9. Open items and assumptions

- **Compliance:** new client wording (allocation charge / additional allocation sentences, the scenario pages) is DRAFT. Examples above the 6% cap and stress paths need approval before going to a client.
- **Guarantee assumptions to confirm with product/actuarial:** the whole policy is in the guaranteed fund; the top-up is applied before the year-8 deemed-disposal tax and the protected value is reset on the after-tax value; the guarantee only applies on anniversaries; withdrawals would reduce the protected value in proportion (not used on this page); returns entered "after the fund charge" are grossed up as `(1 + r) / (1 − fund charge) − 1`.
- **Commission stepper step size** is still 0.5% (shared with PRSA). The workbook allows 0.25% steps.
- **Special deal on the PDF summary page:** the "Contribution charge" line shows "None" for an uplifted allocation (correct); the allocation detail is on the Charges page.
- **Chart:** the tool's chart helper starts the axis at €0, so differences look flatter than on the earlier standalone prototype.
- **Not done:** replacing `docs/factsheets/ss75.pdf`; committing anything.
- Several files under `tests/out/` were overwritten by test runs; line endings of `quotation_tool.html` were briefly changed to CRLF during an edit and put back to LF.

## 10. Key files

| Area | Files |
|---|---|
| Engines | `js/engine_ib.js`, `js/engine_arf.js` |
| Data / caps | `js/ib_data.js`, `js/arf_data.js` |
| Commission panel and state | `quotation_tool.html` (`stepComm`, `renderCodeInfo`, `engineInput`) |
| Client wording and PDF | `js/quote_text.js`, `js/quote_pdf.js` |
| Scenarios page | `oneoff/ib_scenarios.html`, `oneoff/README.md` |
| Tests | `tests/excel_parity_test.py`, `tests/ib_ui_test.py` |
| Workbooks | `AdditionalInfo/InvBond/`, `AdditionalInfo/ARF/`, `AdditionalInfo/prsa/` |
