# Handoff: Quotation Tool redesign

## Overview
A visual and UX redesign of the Allianz Global Life Quotation Tool (`jonathandrennan/QuotationTool`, file `quotation_tool.html`). The 7-step flow (Adviser → Product & client → Risk → Plan → Portfolio → Results → Pack), the data and the calculation engines stay the same. What changes is the layout, the navigation, the hierarchy on Results and Pack, and a few new inputs from broker feedback.

The mockups show a **PRSA** quote. ARF and Investment Bond should follow the same patterns. The step layouts already exist in the current code (`.arf-only`, `.ib-only`).

## About the design files
The files in `designs/` are **design references built in HTML**. They show the intended look and behaviour; they are not production code. They are "Design Component" files (`*.dc.html`) that need `support.js` beside them to render. Open `designs/Quotation Tool Mockups.dc.html` in a browser to see every screen on one canvas.

**The task is to restyle and restructure the existing `quotation_tool.html` app** in its current environment: a single HTML file with vanilla JS, no framework or build step, and the logic in `js/*.js`. Keep all engine, data and PDF logic. Change the markup in `quotation_tool.html`, the `<style>` block, and the render functions that build HTML strings (`renderResults`, `resCharges`, `resRemuneration`, `syncDiyFunds`, `renderPfSummary`, the step-7 section rendering and so on). Do **not** port the DC/React runtime.

## Fidelity
**High fidelity.** Colours, type sizes, spacing, radii and copy are final. Recreate them closely using plain CSS classes in the existing stylesheet. The mockups use inline styles only because of how they were authored.

Sample numbers in the mockups were computed separately from the engines. In the app, every figure must come from the existing engines (`S.result`).

---

## Global layout (all steps)

**Frame:** a full-height two-column layout. `body` background `#F4F7FA`.

### Left rail (replaces `header` + `nav.steps`)
- Width 272px, white, `border-right: 1px solid #E2E8EF`. Sticky full height.
- Top block (padding 26px 24px 22px, bottom border `#EDF1F5`): Allianz logo (height 24px), "Quotation Tool" (15px/700, `#003781`), then "Ref. Q-…" (12px, `#5E6B78`, tabular figures).
- Step list (padding 18px 14px, gap 2px). Each row: padding 10px, radius 8px, flex with gap 12px.
  - Dot: 26px circle, 12px/700 text.
    - Done: bg `#E6F2EA`, text `#0B7A3E`, shows ✓.
    - Active: bg `#003781`, text white, shows the number.
    - Upcoming: white with a 1.5px inset `#D5DDE6` ring, text `#8A96A3`.
  - Label: 14px. Active 700 `#003781`; done 600 `#0E1E33`; upcoming 600 `#8A96A3`.
  - Caption under the label: 12px `#5E6B78`, ellipsis. On done steps it shows a summary of what was entered (examples below). Active steps show "In progress".
  - Active row background `#EEF4FA`.
  - Done rows are clickable and go back to that step (same rule as the current `maxStep`). Upcoming rows are disabled.
- Caption content per step:
  1. `{adviser name} · {firm}`
  2. `{PRODUCT} · {Title First Last}`
  3. `{sri} · {ESMA label} · ESG preference` (the last part only if sustainability = yes)
  4. `{PRSA type short} {code} · €{lump sums}k + €{rp}/m`
  5. `Own selection · {n} funds`, or the strategy name
  6. `€{projected value} at {nra}`
- Rail footer (margin-top auto, top border): 12px muted note "Adviser details are saved in this browser. Client details are cleared when you close the quote." Below it, links "Export settings" and "Import settings" (12px/600, `#0377A8`). These move here from step 1.

### Main column
- Padding 48px 64px (40px top on sub-views). Content gap 32px.
- Page header:
  - Eyebrow "Step N of 7": 12px/700, uppercase, letter-spacing .08em, `#0377A8`.
  - H1: 32px/700, line-height 1.15, `#003781`, letter-spacing -.01em.
  - Lead: 15px/1.55, `#5E6B78`, max-width 640px.
- Sub-views (Portfolio pick/allocate) replace the eyebrow with a back link (13px/600, `#0377A8`, "← Strategy selection" / "← Change funds"). A sub-step indicator follows the H1 (see Portfolio).
- Sticky footer (replaces `.foot`):
  - `position: sticky; bottom: 0`, padding 16px 64px, background `rgba(255,255,255,.92)` with an 8px backdrop blur, top border `#E2E8EF`.
  - Left: secondary "← Back" button. Hidden on step 1.
  - Right: a status message (13px `#5E6B78`), then the primary button labelled with the next step: "Continue to client →", "Continue to risk →", "Continue to plan →", "Continue to portfolio →", "See results →", "Build the quotation pack →".
  - Validation errors go in the status message, coloured `#C8103E`.

### Common components
- **Card:** white, `1px solid #E2E8EF`, radius 12px, padding 28px.
- **Form-section card (steps 1, 2, 3):** a two-column grid, `200px | 1fr`, gap 28px. The left column holds the section title (16px/700) and a one-line description (13px/1.5 `#5E6B78`). The right column holds the fields in a grid with gap 18px 16px.
- **Label:** 13px/600 `#0E1E33`. Optional hint inline: "· optional", weight 400, `#5E6B78`.
- **Input/select:**
  - Height 44px, padding 0 14px, `1px solid #D5DDE6`, radius 8px, 15px text.
  - Focus: `2px solid #0377A8` plus `box-shadow: 0 0 0 4px rgba(3,119,168,.12)`.
  - Invalid: border `#C8103E`, bg `#FFF6F8`.
  - Currency inputs show a "€" prefix inside the field (`#5E6B78`). Percentages show a "%" suffix.
- **Hint:** 12px `#5E6B78`, 6px under the field.
- **Primary button:** height 44px, padding 0 22px, radius 8px, bg `#003781`, white 15px/600. Disabled: opacity .4.
- **Secondary button:** same size, white, `1px solid #D5DDE6`, text `#0E1E33`.
- **Segmented control:** a 44px (40px compact) container with `1px solid #D5DDE6`, radius 8px, 3px padding, 3px gap. The selected segment is bg `#003781`, white 14px/600, radius 6px.
- **Selectable card (radio card):** radius 12px.
  - Unselected: `box-shadow: inset 0 0 0 1px #E2E8EF`.
  - Selected: `inset 0 0 0 2px #003781` plus `0 6px 20px rgba(0,55,129,.10)`, a 22px navy ✓ disc top-right, and the title in `#003781`.
- **Toggle:** 40×24, radius 12px. On `#003781`, off `#C9D3DE`, white 16px knob.
- **SRI badge:** 28×24, radius 5px, bg `ESMA_COLORS[n]`, white 12px/700 text. For SRI 4 the text is dark: `#2A2100`.
- **SFDR badge:** 11px/700, padding 2px 7px, radius 4px. Article 8: bg `#E6F2EA`, text `#0B7A3E`. Article 6: bg `#F0F2F4`, text `#5E6B78`.
- **Status pill ("Required" / "Coming soon"):** 12px/600, padding 3px 9px, radius 999px.
  - Required: bg `#EEF2F6`, text `#5E6B78`.
  - Coming soon: white, `inset 0 0 0 1px #D5DDE6`, text `#8A96A3`.
- **"New" tag:** 11px/700, padding 1px 7px, radius 4px, bg `#FDF4E7`, text `#8A4708`.
- **Table:**
  - Header row: bg `#F7FAFC`, 12px/700 `#5E6B78`, padding 10px 24px.
  - Body rows: 14px, padding 12–13px 24px, `border-bottom: 1px solid #EEF2F6`, tabular figures, numbers right-aligned.
  - Total/retirement row: bg `#EEF4FA`, 700, `#003781`.
  - Built as CSS grid rows in the mockups; `<table>` is fine.

---

## Screens

### 1 · Adviser (`01-Adviser.dc.html`)
- Grid `1fr | 320px`, gap 32px.
- **Left column:**
  - Form-section card "Your firm" with Firm name, Firm address (textarea) and Regulatory statement, all full width.
  - Form-section card "You": Adviser name, Job title (optional), Email and Phone, in 2 columns.
  - Consent card: checkbox plus the text from `QT_TEXT.consent`.
- **Right column:** a sticky "Preview on your pages" card. It shows a live mini letterhead built from the inputs:
  - Firm name and address above a 2px `#003781` rule.
  - Placeholder text lines.
  - Signature block: name, title, email · phone.
  - Regulatory statement as a footer.
  - It updates on input.

### 2 · Product and client (`02-Product-and-Client.dc.html`)
- **Product:** 3 radio cards (PRSA / ARF / Investment Bond), each with a one-line description. These replace the `#c-product` select and call `setProduct()`.
- **Client card:** Title (select, 120px), First name, Last name; then Date of birth (spans 2 columns, shows "Age N" right-aligned inside the field) and Gender as a segmented control (PRSA only); then Address (textarea).
- **Policy card:**
  - Start date.
  - Retirement age as a stepper (− value +, 44px), range 60–75, PRSA only.
  - Quotation reference (read-only, grey bg `#F4F7FA`).
  - Below: a tinted strip (`#EEF4FA`, radius 10px) with "Age at start **46** · Term **18 years 6 months** · Retires **April 2045**". This replaces `#age-hint`.

### 3 · Attitude to risk (`03-Attitude-to-Risk.dc.html`)
- **SRI picker card:** 7 equal columns, aligned to the bottom.
  - Unselected tile: 56px tall, radius 10px, `ESMA_COLORS` background, 22px/700 number, with the ESMA label below (13px `#5E6B78`).
  - Selected tile: 84px tall, 34px number, ring `0 0 0 3px #fff, 0 0 0 5px #003781`, label 700 `#003781`.
  - Scale captions below: "← Lower risk, typically lower rewards" / "Higher risk, typically higher rewards →".
- Under the picker, a grey panel (`#F4F7FA`) with two parts:
  - "Client rating" with the value "4 — Medium".
  - "Managed strategies suited to a {n}": chips listing every strategy whose `STRATEGY_SUITABLE` range includes the rating.
- **NEW "Profiling" card:**
  - "Does the client have sustainability preferences?" Yes/No segmented control. Store as `S.risk.esg`.
  - "Risk profiler used" text input (optional), for example "Voyant risk questionnaire, 02/10/2026". Store as `S.risk.profiler`.
  - Both values feed the Statement of Suitability template.
  - When ESG = yes, Article 8 funds are highlighted in the fund builder.

### 4 · Plan details (`04-Plan-Details.dc.html`)
- Grid `1fr | 300px`.
- **PRSA type and version card:**
  - Two radio cards: "Non-Standard PRSA — Full fund range, including multi-asset and building blocks" and "Standard PRSA — Capped charges, restricted fund range". These replace `#ptype-seg`.
  - Version select and Commission level select (160px each).
  - An always-visible **commission panel** (bordered, radius 10px) with a header strip "Commission and charges · A5" and "Adjust in steps of 0.50%". Its rows:
    - AMC 1.15%, with "of which trail commission 0.25%".
    - Initial commission on single contributions, with a stepper and an "Edited · standard 4.00% · Reset" line in `#A3540B` when overridden.
    - Initial commission on regular contributions, with a stepper and the cap note.
  - This replaces the "Edit commission" popover (`.pop`) with inline steppers.
- **Contributions card:** the contribution-type `<select>` becomes **3 multi-select chips**: "Transfer from another pension", "Single contribution", "Regular contributions". Selected chip: bg `#003781`, white, with a ✓ disc. Map the chip combination to the existing `ctype` values (`sp`, `rp`, `sp_rp`, `ofv`, `ofv_sp`, `ofv_rp`, `ofv_sp_rp`). Fields show or hide as they do today.
- **Right column:** a sticky navy summary card (`#003781`, white text) showing contributions in year 1 (30px/700), lines for Transfer, Single and Regular (per year), a divider, then Total to retirement and Initial commission. Values come from the engine.

### 5a · Portfolio: strategy (`05a-Portfolio-Strategy.dc.html`)
- H1 "How would you like to invest?"
- **Hero radio card "Build Your Own Portfolio":** padding 28px 30px, title 20px, with a "13 funds available" count on the right.
- Divider "OR A MANAGED STRATEGY" (12px/700, letter-spacing .1em, rules either side).
- **3 strategy cards** (DIS, Autopilot, Life Cycle), each with an "i" info button (keep the existing `.qt-pop` popovers).
  - DIS shows a pill "✓ Suits ratings 3–4" (green when the client's rating fits).
  - Autopilot and Life Cycle list their Balanced / Dynamic / Opportunity options, each with its suitable range. Ranges that suit the client are green ✓ `#0B7A3E`; the others are grey. Clicking an option selects it, replacing the current expand/sub-options panel.
- Note: "Choosing a strategy outside the client's rating is allowed, with a recorded reason that appears in the Statement of Suitability." The existing mismatch banner and override flow stay.
- **Right column:** a "Portfolio at a glance" panel with the client rating and sustainability preference. Its empty state reads "Portfolio risk, charges and asset split appear here as you build."

### 5b · Portfolio: choose funds (`05b-Portfolio-Choose-Funds.dc.html`)
- Sub-step indicator: "① Choose funds — ② Allocate" (22px dots; active navy, done green ✓).
- **Toolbar:**
  - Fund search input (filters rows).
  - When ESG = yes, a green pill "● Sustainability preference: Article 8 funds highlighted".
- **Column header** (11px uppercase `#8A96A3`): Fund | Fund charge | Risk | SFDR.
- **One card per category** (Fixed income & cash / Multi-asset / Equity):
  - Header `#F7FAFC` with a count ("2 of 6 selected").
  - The Multi-asset card has a tinted note: "Strategy Select funds can carry the Optional Annual Guarantee — switch it on in the next step."
- **Fund rows:** grid `28px | 1fr | 86px | 70px | 64px`, padding 13px 20px.
  - Columns: checkbox, name, sub-line (volatility range / guarantee availability from `QT_CONTENT.funds`), FMC, SRI badge, SFDR badge.
  - Selected row: bg `#F6FAFE`, 3px navy left border, name 700 navy.
  - When ESG = yes, Article 6 rows show at 0.6 opacity with "Article 6, outside sustainability preference".
  - Funds unavailable on a Standard PRSA stay greyed out, as today.
- **Right column:** a "Selected funds" list (name plus SRI badge) and an "Allocate {n} funds →" button.

### 5c · Portfolio: allocate (`05c-Portfolio-Allocate.dc.html`)
- **Allocation card:**
  - "{x}% allocated": green `#0B7A3E` at 100%, amber `#A3540B` below, red `#C8103E` above.
  - "Split equally" link.
  - A 10px segmented bar with one segment per fund, using the per-fund swatch colours (`#003781`, `#3D6FB5`, `#0082be`, `#7fb2d9`, …).
- **One fund list card.** Each row is a grid `12px swatch | 1fr | 54px SRI | 120px % input`, padding 20px 22px.
  - Name 15px/700 navy; sub-line "{category} · fund charge x%".
  - The % input is right-aligned 16px/700 navy; when focused it gets a 2px navy border.
  - Guarantee-eligible funds have a full-width green strip below the row (bg `#E6F4EC`) containing:
    - a toggle (on = `#0B7A3E`),
    - "Optional Annual Guarantee · 90% protected",
    - "Reset each policy anniversary · extra charge 0.75% a year on this fund",
    - an "i" button.
- **Right column: sticky "Portfolio at a glance".**
  - Two tiles side by side: Client (4, Medium) and Portfolio (4, "(4.1)" decimal, Medium).
  - A 7-segment SRI strip with the portfolio value outlined (`box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #0E1E33`).
  - Alignment pill: green "✓ Aligned with the client's rating", or amber when misaligned.
  - Fund category split bar plus legend (`CAT_COLORS`).
  - Annual charges: AMC (incl. 0.25% trail), blended fund charge, guarantee, and a dashed rule above **Total annual charge** (15px/700 navy).
  - SFDR summary, "100% Article 8 ✓", computed from the allocations.
- Keep the existing mobile collapse behaviour (`.pf-mini`) for narrow widths.

### 6 · Results (`06-Results.dc.html`, prop `tab` = proj | chg | rem)
- Header lead: `{productName} · {strategyName} · {client}` (existing `res-lead`).
- **KPI band:** a single card, grid `1.25fr 1fr 1fr 1fr`, radius 14px.
  - First cell, navy `#003781`: "Projected value at 65" in 38px/700 white, with the sub-line "after charges, at x% growth before charges".
  - Other cells: In today's money (26px navy), Estimated income (a year, today's money), Total annual charge ("reduces growth by x% a year").
  - **The band stays visible on all three tabs.** This is the main change: results lead with outcomes.
- **Tabs:** an underline tab bar (15px; active 700 navy with a 3px navy bottom border). Each tab has a number dot that becomes a green ✓ once visited. Right-aligned note: "Review all three tabs to continue · n of 3". The footer primary button is disabled until all three have been seen (same rule as today).
- **Projection tab:**
  - Grid `1fr | 320px`.
  - Chart card: "How the fund could grow" with a legend (after charges: solid navy 2.5px; before charges: dashed `#0377A8`; contributions paid: filled `#E3EAF2`), a light navy area under the after-charges line, an end-point dot, and €k gridlines. Footnote with the assumed growth rate. Rework `qtPrsaChart` to this style.
  - Side card "Fund choice": fund list with percentages (guarantee marked green), an "Edit" link back to Portfolio, and "Risk · client / portfolio 4 / 4 ✓".
  - Below: the projected benefits table (Year, Age, A. Contributions, B. Growth, C. Effect of charges, D. Value after charges). It shows years 1–5, 10, 15 and Retirement by default, with a "Show every year" toggle.
- **Charges tab:**
  - Grid `1fr | 340px`.
  - Table card "Charges by fund" (Fund, Allocation, AMC, Fund charge, Guarantee, Total) with a Portfolio total row. Below it, 3 stats: Effect of charges (x% a year, "growth a → b"), Contribution charge, Charges to retirement (€).
  - Side card "Value at 65": before-charges vs after-charges bars, then "What makes up {total}%": a stacked bar plus legend (AMC excluding trail, Trail commission, Fund charges, Guarantee).
- **Remuneration tab:**
  - 3 KPI cards:
    - Initial remuneration (€, with a breakdown per contribution type and an "Edited" tag if overridden).
    - Trail remuneration (€ projected, "0.25% a year of fund value").
    - Clawback ("Applies" in amber, with its condition).
  - "Remuneration by year" card: a bar chart per policy year, initial in navy stacked on trail in `#7fb2d9`, with a "Show table" toggle for the existing year table.

### 7 · Quotation pack (`07-Quotation-Pack.dc.html`, prop `view` = contents | sos | review)
Step 7 becomes a **4-stage sub-flow** with an indicator: ① Contents — ② Cover letter — ③ Statement of Suitability — ④ Review & generate. Each stage has its own footer button.

**7.1 Contents**
- **No preset selector.** The Full pack / Quotation only / Custom segmented control is removed. Users toggle sections directly.
- Three group cards (header `#F7FAFC`, uppercase 12px navy title plus note). Each row shows the name (14px/600), an optional sub-line, and a control on the right:
  - **Your documents** (on your letterhead):
    - Cover letter: toggle. Sub-line "Use the template or write your own in the next step".
    - Statement of Suitability: toggle. Sub-line "Use the template or write your own in a later step".
  - **Quotation** (Allianz Global Life):
    - Your quotation at a glance: toggle.
    - Projected benefits: *Required*.
    - Charges: *Required*.
    - Your investment and risk: toggle.
    - Remuneration statement: **toggle** (now optional).
  - **Supporting information:**
    - Product Brochure (renamed from "About the product"): **Coming soon**.
    - Tax information: **Coming soon**.
    - Important information: *Required*.
    - Glossary: **Required**.
    - Fund information ("Factsheets for the selected funds"): **Coming soon**, New.
    - Key Information Documents ("KIDs for the selected funds"): **Coming soon**, New.
    - Application form ("Pre-filled with client and plan details"): **Coming soon**, New.
- "Coming soon" rows are visible but not selectable and are excluded from the pack.
- Update `REQUIRED_SECTIONS` to `['projection','charges','important','glossary']`. Remove `remun` from it. Remove `SECTION_PRESETS` and the preset UI. Add keys for the coming-soon items, flagged as unavailable.
- **Right column:** sticky "Pack order" list, numbered, with a "Letterhead" tag on the first two and a count ("9 sections").

**7.2 Cover letter / 7.3 Statement of Suitability**
- These stages only appear if the document is toggled on.
- At the top of each stage, a choice: **"Use the Allianz template"** or **"Write your own"**.
  - Template: the guided editor below.
  - Write your own: a plain large textarea with no prompts, using the same `##` / `-` formatting rules.
- Guided editor layout: grid `260px | 1fr`.
  - **Left:** a progress card ("Prompts completed 6 of 10" with an amber bar) and an outline of the SoS headings. Each heading shows ✓ (done), "Auto" (fully generated), or "1 left" (amber tag). Clicking a heading jumps to it. Note: "Text in grey boxes is filled from your answers. Amber prompts need your own words before the pack can be generated."
  - **Right:** a document-style editor card.
    - Toolbar: B, Heading, • List, an amber "Next prompt ↓" button, and a "Reset to template" link.
    - Body: padding 40px 56px, 15px/1.65 serif-free text, `##` headings rendered as 18px navy.
    - Auto-filled values sit in grey chips (`#EEF2F6`, radius 4px).
    - `[[prompts]]` render as amber chips (`#FDF4E7` with a 1.5px `#E8A33D` inset, text `#8A4708`/600).
  - This replaces the raw textarea plus chips. The underlying storage can stay as the same text string with `[[…]]` markers. Render it as a contenteditable view, or keep a textarea and add a rendered preview. Pick whichever is simpler to make robust.
- Add a "Your sustainability preferences" section to the PRSA (and ARF) SoS templates in `quote_text.js`, driven by `S.risk.esg`. Add `S.risk.profiler` to the attitude-to-risk paragraph. **The new wording needs compliance sign-off.**

**7.4 Review & generate**
- **Left:** a 4-column grid of A4 page thumbnails (aspect 210/297, white, soft shadow), one per included section, labelled with page numbers.
- **Right:** sticky "Ready to generate" card:
  - A checklist with green ✓ or amber items: cover letter complete, SoS prompts n of n, results reviewed, risk aligned or override recorded.
  - A file-name box ("Quotation_{ref}_{Surname}.pdf · {pages} pages · A4").
  - **Generate PDF** (primary, 48px), then **Preview full pack** (secondary).
  - Note: "Opens the print dialog — choose Save as PDF."
- Generate is disabled until the checklist is complete. This uses the existing `gen-errs` logic.

### 8 · PDF pages (`08-PDF-Pages.dc.html`)
A restyle direction for `quote_pdf.js` output, A4 at 794×1123 px.
- Header: logo, then product and quote ref in 11px muted text, above a thin rule. The heavy navy top bar is dropped.
- **At a glance page:**
  - Eyebrow, then "Prepared for {name}" (30px navy).
  - Hero split: navy panel with the projected value (36px) | key facts list.
  - Slim projection chart.
  - Two cards: Investment and risk (with the SRI strip), and Charges and remuneration.
  - Warnings box.
  - Footer.
- **Investment and risk page:** 3 KPI tiles (your rating / indicative portfolio risk / sustainability), a fund table (with category, risk, SFDR, charge and allocation), a category split bar, a guarantee note, and the indicative-risk footnote.
- **Cover letter:** the adviser's letterhead (firm name over a 2px dark rule), then the letter. The "Enclosed" list follows the included sections.
- Remove the "About the product" and "Tax information" pages while they are coming soon.

### 9 · Mobile (`09-Mobile.dc.html`, 390×844)
- The rail collapses to a top bar: logo, "Step n of 7", and a 7-segment progress bar (done green, current navy, upcoming `#E2E8EF`).
- The sticky bottom bar has a 52px back button and a full-width 50px primary button.
- **Risk:** vertical list of SRI rows. The selected row is 60px tall with a navy ring.
- **Allocate:** compact fund rows with an 84px % input. A summary strip above the footer reads "Risk 4 / 4 ✓ · Charge 1.84% · Details ▴" and opens the full panel.
- **Results:** navy hero with the projected value (40px) and two KPI tiles. Then tabs, chart, and a compact table (Age, Paid in, Value).
- **Pack contents:** toggles grouped by section.

---

## State changes
- `S.risk.esg`: `true | false | null`. New. Set on step 3; used by step 5b highlighting and the SoS.
- `S.risk.profiler`: string. New. Optional; used in the SoS.
- `S.packStage`: `'contents' | 'cover' | 'sos' | 'review'`. New sub-flow position within step 7.
- `S.coverMode`, `S.sosMode`: `'template' | 'own'`. New.
- `S.resSeen`: a set of visited result tabs. This may already exist implicitly, since the gating "review all three tabs" logic does.
- `S.sections`: drop the preset; add the coming-soon keys as permanently false or unavailable.
- Contribution type: derived from 3 booleans (transfer / single / regular) mapped to the existing `ctype` codes.

## Design tokens
| Token | Value |
|---|---|
| Ink | `#0E1E33` |
| Body text (secondary) | `#3A4756` |
| Muted | `#5E6B78` |
| Faint | `#8A96A3` |
| Primary (navy) | `#003781` |
| Link / focus (teal) | `#0377A8` |
| Navy tint | `#EEF4FA`, selected row `#F6FAFE` |
| Page bg | `#F4F7FA` |
| Surface | `#FFFFFF` |
| Card header bg | `#F7FAFC` |
| Border | `#E2E8EF`; input border `#D5DDE6`; row divider `#EEF2F6` |
| Success | `#0B7A3E`, bg `#E6F2EA` / `#E6F4EC` |
| Warning | `#A3540B`, text on bg `#8A4708`, bg `#FDF4E7`, ring `#E8A33D` |
| Error | `#C8103E`, bg `#FFF6F8` |
| SRI 1–7 | `#1a9e5c #4ab566 #a0c840 #f5c400 #f5820a #e03333 #990000` (existing `ESMA_COLORS`) |
| Category | fixed income `#7fb2d9`, multi-asset `#003781`, equity `#0082be` (existing `CAT_COLORS`) |
| Fund swatches (allocate bar) | `#003781 #3D6FB5 #0082be #7fb2d9`, then the existing fund `color` values |

- **Typography:** the mockups use Figtree as a stand-in. **Use `'Allianz Neo'`** (already loaded via a1-elements.css), with fallback `Arial, Helvetica, sans-serif`. Use `font-variant-numeric: tabular-nums` for all figures.
- **Type scale:**
  - H1 32/700
  - KPI hero 38/700
  - KPI 26/700
  - Section title 16/700
  - Body 14–15
  - Label 13/600
  - Small 12
  - Eyebrow 12/700 uppercase .08em
  - Table header 12/700
- **Spacing:** 4-based scale.
  - Main padding 48/64.
  - Card padding 28 (22–24 on side panels).
  - Section gap 32; card gap 16–20; field gap 18 vertical, 16 horizontal.
- **Radii:** inputs and buttons 8; cards 12; hero cards 14; chips 999; badges 4–5.
- **Shadows:**
  - Cards are flat (border only).
  - Selected card: `0 6px 20px rgba(0,55,129,.10)`.
  - Floating preview: `0 1px 2px rgba(14,30,51,.04), 0 12px 32px rgba(14,30,51,.06)`.
  - Focus ring: `0 0 0 4px rgba(3,119,168,.12)`.

## Assets
- `allianz-logo.svg`, from the repo root. No other imagery. Icons are text glyphs (✓ ← → ▾ i); swap in the a1-elements icon set if preferred.

## Files
- `screenshots/`: full-page PNGs of every screen and state (01–09). Quickest way to see the target.
- `designs/Quotation Tool Mockups.dc.html`: overview canvas with every screen. **Start here.**
- `designs/QTSidebar.dc.html`: the left rail (prop `step`).
- `designs/01-…09-*.dc.html`: one file per screen. `06-Results` takes `tab`; `07-Quotation-Pack` takes `view`.
- `designs/support.js`: runtime needed to open the `.dc.html` files locally. Not for production.

## Suggested implementation order
1. Global shell: rail, main column, sticky footer, tokens and base components in the `<style>` block.
2. Steps 1–4 (mostly markup and CSS; add the ESG and profiler fields).
3. Step 6 Results (KPI band, tab restyle, chart restyle).
4. Step 7 Pack sub-flow and section changes (`REQUIRED_SECTIONS`, coming-soon items, template/own choice).
5. Step 5 Portfolio restyle (the most JS-heavy; keep `syncDiyFunds` / `renderPfSummary` logic and change the markup).
6. PDF restyle in `quote_pdf.js`.
7. Mobile pass. Run `tests/ui_test.py` and `tests/parity_test.py` after each step. Selectors may need updating in `ui_test.py`.
