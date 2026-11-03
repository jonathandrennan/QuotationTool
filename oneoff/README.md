# One-off illustrations

Pages here sit outside the Quotation Tool. They load the tool's own files from `../js/` and add the one-off extras. Nothing in the tool's screens, flow or output changes.

## ib_scenarios.html

Investment Bond example returns, year by year, with the Annual Guarantee. Open the file in a browser, fill in the client and plan, type a return for each policy year (default: a 5-year and a 10-year example), then **Open to print / save as PDF**. Inputs are saved in the browser.

### How it stays in step with the tool

| Part | Comes from |
|---|---|
| Every number (allocation, commission, special deal, charges, levy, exit charge, exit tax, deemed disposal) | `engine_ib.js`: `ibRunProjection` (year-by-year returns, guarantee) and `runIbQuote` (the standard quotation) |
| The quotation pages (summary, fund information, charges, remuneration, important information, glossary) | `quote_pdf.js`: `qtBuildPack`, at the standard growth rate, exactly as the tool prints them |
| Look of the example pages (fonts, headers and footers, tables, stat boxes, chart, warning box) | the same pack styles and helpers (`qtPackCss`, `qtSvgLineChart`, `qtStat3`, `qtWarnBox`) |
| Wording | `quote_text.js` / `quote_content.js` (guarantee wording, warnings, company details) |

The example pages are added into the pack's page flow just before the Charges pages, so they get the same headers, footers and page numbers.

### The one change to a shared file

`ibRunProjection` in `engine_ib.js` now also accepts:

- **a rate for each policy year**: pass an array instead of a number (the last rate carries on if the array is short). A single number behaves exactly as before.
- **an Annual Guarantee floor**: set `inp.gteeLevel` (for example `0.85`). At each policy anniversary units are added if the value is below the level times the value at the previous anniversary (plus contributions since). Absent in every standard quote.

New fields on the result: `ratesByYear`, `gteeLevel`, `gteeTopUp`, and on each `yearly` entry `growth`, `topUp`, `gross`, `protectedNext`. The tool does not use any of these. Checked against the Excel parity suite after the change (see the commit notes).

### Assumptions to confirm before use

- Returns entered "after the fund charge" are grossed up as (1 + r) / (1 − fund charge) − 1, then charged as the engine always does.
- The floor assumes the whole policy is in the guaranteed fund. It is meant for a single fund such as Strategy Select 75.
- At year 8 the top-up (if any) comes before the deemed-disposal tax, and the protected value is reset on the value after tax.
- Withdrawals reduce the protected value in proportion (not used here; no income is modelled).
- The guarantee only applies on policy anniversaries, and "value if encashed" is shown at anniversaries.
- The new wording is DRAFT and needs Compliance sign-off. Examples above the 6% cap, or stress paths, should be approved before they go to a client.
- Factsheet history preset: SS75 WT2, 12 months to 30 September 2017–2026 (factsheet 30/09/2026). Update `FACTSHEET` in the page when a new factsheet is out.

### Illustration wording and layout (2 Nov 2026)

- The pack is worded as an **illustration**, not a quotation (broker request). `illustrate()` in the page re-words `QT_TEXT` in memory and fixes the two hard-coded strings in `quote_pdf.js`; the tool's own files are untouched.
- The summary page shows the allocation rate, the levy and the amount invested under Contributions. The Charges page has an "Allocation rate and contribution charge" section straight after the charges table. There is no separate commission page; the adviser sees the commission split on the input screen.
- Each example has an editable **label** and **description**.
- With the guarantee on, each example has a guarantee box (level and ratchet rule) and the table shows the floor in force and the new floor (▲ raised, ▼ lowered); a year with a top-up is shaded.
- Each example shows the return a year after all charges, before tax and after exit tax (the before-tax figure is the same run with an exempt policyholder).
- Charts start their axis just below the lowest value: the page wraps `qtSvgLineChart` and sets the new opt-in `yMin: 'auto'` (the tool's own charts still start at €0).
- Example tables follow the workbook's A–F table (Projections B5:M16): growth to date (B); charges to date (C: policy, fund and guarantee charges and the levy, less any additional allocation, plus the exit charge if encashed); tax to date (D: deemed-disposal tax plus exit tax if encashed); value if encashed (F) = contributions + B − C − D (+ guarantee top-ups). The figures come from new per-year fields on `ibRunProjection`'s `yearly` (`premToDate`, `growthToDate`, `chargesToDate`, `taxToDate`, `incomeToDate`, `topUpToDate`).
- `python tests/ib_scenarios_excel_test.py` sets the page and the workbook to the same plan at flat rates and compares every year (5 cases, 290 checks, 0 mismatches on 2 Nov 2026). Year-by-year returns and the guarantee floor cannot be checked this way: the workbook has neither.
- **+ Add another example** adds an example (same length as the last one, flat 6%); each example has a **Remove** button while there is more than one.
