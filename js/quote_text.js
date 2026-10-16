// quote_text.js — ALL customer-facing standard wording used by the Quotation Tool.
//
// This file is intended to be reviewed and edited by Compliance without touching any
// calculation code. Rules for editing:
//   • Text is plain; keep the quote marks and commas that separate entries.
//   • {tokens} in curly braces are filled in automatically from the quotation
//     (e.g. {clientName}, {rate}). Do not rename them; you may move or delete them.
//   • The Statement of Suitability has no prompts: the adviser is told to tailor the text
//     (see sosNote) and asked to confirm if it is left unedited (see sosUneditedConfirm).
//     The editor still supports [[double square brackets]] as a prompt the adviser replaces;
//     any left unwritten are removed from the pack.
//   • In the cover letter / Statement of Suitability templates, a line starting with
//     "## " is a heading, a line starting with "- " is a bullet point, and a blank line
//     starts a new paragraph.
//
// Wording marked "from SRP" / "from POI" is taken from the existing regulatory
// documents produced by prsa_tool.html / arf_tool.html. Wording marked "DRAFT" is new
// and should be reviewed by Compliance before release.

var QT_TEXT = {

  // ─── Company details ─────────────────────────────────────────────────────────
  company: {
    name: 'Allianz Global Life dac',
    addressLines: ['Maple House', 'Temple Road', 'Blackrock', 'Co. Dublin', 'A94 Y9E8'],
    phone: '01 242 2333',
    email: 'customersupport@allianzgloballife.ie',
    web: 'allianzgloballife.ie',
    regulatory: 'Allianz Global Life dac is regulated by the Central Bank of Ireland. Registered in Dublin, Ireland. Company Reg. No.: 458565.',
    directors: 'Directors: Caroline Schwarzer (Chair); Giampaolo Viseri (CEO); Michele Bricchi; Mary Fulton; Robert Scannell; Kai Wallbaum; Rebecca Wysocki.'
  },

  productNames: {
    prsaStandard: 'Allianz Vantage Standard PRSA',
    prsaNonStandard: 'Allianz Vantage Non-Standard PRSA ({version})',
    arf: 'Allianz Vantage ARF ({version})',
    ib: 'Allianz Vantage Investment Bond ({version})'
  },

  // ─── Adviser consent (Step 1) — DRAFT ────────────────────────────────────────
  consent: 'I confirm that I am an authorised intermediary, that I am preparing this quotation for a client I am advising, and that the client has agreed to their personal details being used for this purpose. Client details are not stored by this tool once the page is closed.',

  // ─── Document headings ───────────────────────────────────────────────────────
  disclaimerShort: 'This quotation is for illustration purposes only and does not form part of a contract. Figures are not guaranteed.',

  sections: {
    cover:     'Cover letter',
    sos:       'Statement of Suitability',
    riskprofile:'Risk profile',
    summary:   'Your quotation at a glance',
    projection:'Projected benefits',
    charges:   'Charges',
    funds:     'Your investment and risk',
    remun:     'Remuneration statement',
    product:   'Product Brochure',
    tax:       'Tax information',
    important: 'Important information',
    glossary:  'Glossary',
    factsheets:'Fund information',
    kids:      'Key Information Documents',
    appform:   'Application form'
  },

  // ─── Summary page — DRAFT ────────────────────────────────────────────────────
  summaryTitle: 'Prepared for {clientName}',
  summaryByline: 'by {brokerName}, {brokerFirm} · {date}',

  // ─── PRSA projection — from SRP ──────────────────────────────────────────────
  prsaProjectionIntro: 'The table below shows how your PRSA could grow up to your chosen retirement age of {nra}, based on the contributions shown in this quotation. Column D shows the projected value of your PRSA after all charges.',
  prsaImportantFlat: 'THESE ILLUSTRATIONS ASSUME AN INVESTMENT RETURN BEFORE RETIREMENT OF {rate} PER ANNUM AND INFLATION OF {inflation} PER ANNUM. THESE RATES ARE FOR ILLUSTRATION PURPOSES ONLY AND ARE NOT GUARANTEED.',
  prsaImportantGlidepath: 'THESE ILLUSTRATIONS ASSUME AN INVESTMENT RETURN BEFORE RETIREMENT OF UP TO {rate} PER ANNUM (GLIDEPATH, VARYING OVER TIME) AND INFLATION OF {inflation} PER ANNUM. THESE RATES ARE FOR ILLUSTRATION PURPOSES ONLY AND ARE NOT GUARANTEED.',
  prsaImportant2: 'ACTUAL INVESTMENT GROWTH WILL DEPEND ON THE PERFORMANCE OF THE UNDERLYING FUNDS AND MAY BE MORE OR LESS THAN ILLUSTRATED.',
  prsaInflation: 'The projections make no allowance for the effect of inflation, which will reduce the value of the projected benefits at retirement. The projected value at retirement of {fundValue} is worth {realValue} in terms of today\'s prices. This could purchase a retirement income of approximately {monthlyIncome} per month ({annualIncome} per year) in today\'s prices, assuming income is paid monthly in advance, guaranteed for {guarantee} years and increases by {annEsc} each year.',
  prsaAnnuityNote: 'Where the term to retirement is greater than five years, the annuity rate used is a long-term average rate. Where the term to retirement is less than five years, annuity rates available at retirement may differ from this illustration. Different retirement options, including an Approved Retirement Fund, can be chosen at retirement.',
  prsaDisNote: 'The Default Investment Strategy (DIS) is not suitable for contributors who want to generate an income from retirement through purchasing an annuity. If you invest in the DIS you will be exposed to investment risk.',
  prsaAverageNote: 'The assumed investment return is an average rate of return over the term of your plan, taking account of the asset mix over time. In practice investment returns will be more variable over the term of the plan.',

  // ─── ARF projection — from POI ───────────────────────────────────────────────
  arfProjectionIntro: 'The tables below show how your ARF could perform at two different assumed rates of investment growth, allowing for the income you take and all charges. Column E shows the projected value of your ARF after income.',
  arfImportant: 'THESE ILLUSTRATIONS ASSUME A RETURN OF {rate} PER ANNUM. THIS RATE IS FOR ILLUSTRATION PURPOSES ONLY AND IS NOT GUARANTEED. ACTUAL INVESTMENT GROWTH WILL DEPEND ON THE PERFORMANCE OF THE UNDERLYING INVESTMENTS AND MAY BE MORE OR LESS THAN ILLUSTRATED.',
  arfRiy: 'The deductions for charges shown in column C have the same effect as reducing the assumed investment growth from {rate} to {netRate}. The income figures in column D and the policy value figures in column E are shown gross of tax.',
  arfIncomeDefault: 'You have chosen an income level in line with the Revenue deemed distribution rules. These are described in the Tax information section.',
  arfIncomeAmount: 'You have chosen an initial income of {income} per annum, escalating at {esc} per annum. If this income is lower than the Revenue deemed distribution requirements at any point, this illustration assumes the higher amount is taken.',
  arfIncomePct: 'You have chosen an initial income of {incomePct} of the fund per annum ({income}). If this income is lower than the Revenue deemed distribution requirements, this illustration assumes the higher amount is taken.',
  arfDeferNote: 'Income is deferred until age {incomeAge}. Revenue deemed distribution rules apply from age 61 regardless of when withdrawals begin.',
  arfEscNote: 'This illustration assumes that the income you receive will escalate by {esc} per annum. There is no obligation on you to take income levels that increase in this way.',
  arfDepletes: 'At {rate} growth, your fund is projected to run out in year {year} (around age {age}), at which point your policy will end.',
  arfLasts: 'At {rate} growth, your fund is not projected to run out within 40 years.',
  arfDepletionWarning: 'Where amounts are withdrawn from your ARF, its value will reduce and could run out, particularly if a high level of income is taken, investment returns are poor or you live a long time.',
  arfSurrenderNote: 'The charges shown in column C for the early years assume that the policy is fully encashed and an exit charge is incurred. No exit charge applies to partial withdrawals or regular income. If the policy is not fully encashed during the exit charge period, no exit charge is payable and the charges actually deducted are lower than shown.',

  // ─── Investment Bond projection — DRAFT ──────────────────────────────────────
  ibProjectionIntro: 'The table below shows how your Investment Bond could perform at the assumed rate of investment growth, allowing for the income you take, all charges and tax. Column F shows the projected value of your policy.',
  ibImportant: 'THESE ILLUSTRATIONS ASSUME A RETURN OF {rate} PER ANNUM. THIS RATE IS FOR ILLUSTRATION PURPOSES ONLY AND IS NOT GUARANTEED. ACTUAL INVESTMENT GROWTH WILL DEPEND ON THE PERFORMANCE OF THE UNDERLYING INVESTMENTS AND MAY BE MORE OR LESS THAN ILLUSTRATED.',
  ibRiy: 'The deductions for charges shown in column C have the same effect as reducing the assumed investment growth from {rate} to {netRate}. Column D shows the exit tax that would be due if the policy were fully encashed at that point; no tax is actually deducted unless a chargeable event occurs.',
  ibIncomeNone: 'You have not chosen to take an income from this policy, so it is left to grow.',
  ibIncomeAmount: 'You have chosen an initial income of {income} per annum, escalating at {esc} per annum.',
  ibIncomePct: 'You have chosen an initial income of {incomePct} of the fund per annum ({income}).',
  ibDeferNote: 'Income is deferred until age {incomeAge}.',
  ibDepletes: 'At {rate} growth, your fund is projected to run out in year {year} (around age {age}), at which point your policy will end.',
  ibLasts: 'At {rate} growth, your fund is not projected to run out within 40 years.',
  ibTaxNote: 'This illustration assumes a {ptype} policyholder, with exit tax of {rate} applying to chargeable events, including the Revenue "deemed disposal" rule which taxes the gain on your policy every 8 years whether or not you make a withdrawal.',
  ibDepletionWarning: 'Where amounts are withdrawn from your Investment Bond, its value will reduce and could run out, particularly if a high level of income is taken, investment returns are poor or you live a long time.',
  ibSurrenderNote: 'The charges shown in column C for the early years assume that the policy is fully encashed and an exit charge is incurred. No exit charge applies to the regular, scheduled withdrawals described in this quotation. If the policy is not fully encashed during the exit charge period, no exit charge is payable and the charges actually deducted are lower than shown.',

  // ─── Charges ─────────────────────────────────────────────────────────────────
  chargesIntro: 'The charges below are deducted on a monthly basis, either directly from your policy or indirectly from the funds in which it invests.',
  prsaFundCharges: 'An Annual Management Charge (AMC) of {admin} and a Fund Management Charge (FMC), which varies by fund, apply to your PRSA. Where you have chosen a fund guarantee, a guarantee charge also applies.',
  arfFundCharges: 'An annual policy charge of {admin} and a fund management charge, which varies by fund, apply to your ARF. Where you have chosen the optional rolling guarantee, a guarantee charge also applies.',
  // Contribution charges table on the Charges page: when each charge applies
  prsaContribRule: { sp: '{charge} on single contributions below {threshold}', rp: '{charge} on regular contributions below {threshold}', ofv: 'No charge on transfers' },
  prsaRiy: 'For your plan, the total effect of these charges on the projected benefits at retirement is equivalent to a single charge of {riy} per annum. In other words, charges reduce the assumed growth rate from {gross} to {net}.',
  arfRiyCharges: 'At {rate} growth, the total effect of charges is equivalent to reducing the assumed growth rate to {netRate} per annum.',
  arfExitCharges: 'An exit charge applies if you fully encash your ARF in the early years, as shown below. No exit charge applies to income payments or partial withdrawals.',
  arfNoExitCharges: 'No exit charges apply to your ARF.',
  ibFundCharges: 'An annual policy charge of {admin} and a fund management charge, which varies by fund, apply to your Investment Bond. Where you have chosen the optional rolling guarantee, a guarantee charge also applies. A government levy also applies to every contribution.',
  ibGovtLevyNote: 'A government levy of {levy} applies to every contribution you make, including the single contribution and any regular contributions. This is a tax collected by Allianz Global Life on behalf of the State and is deducted at the time each contribution is invested.',
  ibExitCharges: 'An exit charge applies if you fully encash your Investment Bond in the early years, as shown below. No exit charge applies to the regular, scheduled withdrawals described in this quotation.',
  ibNoExitCharges: 'No exit charges apply to your Investment Bond.',
  ibExitTaxNote: 'Exit tax of {rate} applies to this policy, based on a {ptype} policyholder. Tax is due on a chargeable event, including full or partial encashment and the Revenue "deemed disposal" rule, which taxes the gain on your policy every 8 years whether or not you make a withdrawal.',
  ibRiyCharges: 'At {rate} growth, the total effect of charges is equivalent to reducing the assumed growth rate to {netRate} per annum. This is separate from the effect of exit tax, which is set out above.',
  // Why the Reduction in Yield (effect of charges) differs from the total annual charge
  riyWhy: 'The Reduction in Yield is higher than the annual charge because it accounts for all fees combined and their compounding effect on your fund over time.',
  guaranteeOnNote: 'Where you have chosen the optional guarantee on a fund, the projections assume the guarantee remains in place throughout. If you switch it off in the future, total charges will be lower than shown.',
  chargesFundNote: 'The illustration uses the current level of fund management charges, which may vary in the future. Further details are available in the Schedule of Fees and Charges.',

  // ─── Funds and risk — DRAFT ──────────────────────────────────────────────────
  // Lite mode: no client risk rating to compare with
  // The weighted-average explanation is in the footnote under the risk figures (riskFootnote), not repeated here
  fundsIntroLite: 'Each fund has a published ESMA risk rating from 1 (lower risk, typically lower rewards) to 7 (higher risk, typically higher rewards). Glidepath strategies change their fund mix as you approach retirement, so they are described by their risk profile instead.',
  fundsIntro: 'Each fund has a published ESMA risk rating from 1 (lower risk, typically lower rewards) to 7 (higher risk, typically higher rewards). Your own risk rating comes from the risk profiling your adviser carried out with you, and is compared below with the indicative risk of your portfolio. Glidepath strategies change their fund mix as you approach retirement, so they are matched to you on their risk profile instead.',
  riskMatch: 'The risk of your portfolio is in line with your assessed attitude to risk.',
  riskHigher: 'The indicative risk of your portfolio ({portfolioSri}) is higher than your assessed attitude to risk ({clientSri}). Your adviser has recorded the reason for this recommendation: {reason}',
  riskLower: 'The indicative risk of your portfolio ({portfolioSri}) is lower than your assessed attitude to risk ({clientSri}). Your adviser has recorded the reason for this recommendation: {reason}',
  // Footnote wherever an indicative (weighted) portfolio risk figure is printed. DRAFT.
  riskFootnote: '* Indicative portfolio risk is the allocation-weighted average of the published ESMA ratings of the funds ({exact}), rounded to the nearest whole number. It is a guide only. It is not an official ESMA risk rating, and it does not allow for the effect of diversification between funds.',
  riskFootnoteGlidepath: '* Indicative risk is the allocation-weighted average of the published ESMA ratings of the funds in the strategy ({start} at the start of your plan and {end} at retirement), rounded to the nearest whole number. It is a guide only and is not an official ESMA risk rating.',
  glidepathRiskPath: 'Indicative risk about {start} at the start of your plan, reducing to about {end} by your retirement age.*',
  riskHigherProfile: 'This strategy\'s risk profile ({profile}) is higher than the profile suited to your assessed attitude to risk ({clientSriLabel}). Your adviser has recorded the reason for this recommendation: {reason}',
  riskLowerProfile: 'This strategy\'s risk profile ({profile}) is lower than the profile suited to your assessed attitude to risk ({clientSriLabel}). Your adviser has recorded the reason for this recommendation: {reason}',
  glidepathNote: 'Your investment strategy is a glidepath: the fund mix shown is the allocation at the start of your plan, and it gradually moves into lower-risk funds as you approach your retirement age.',
  // Funds-page guarantee note. {funds} and {level} are built from the guaranteed funds actually in
  // the quotation, so the note reads correctly for one fund or several, at any protected percentage.
  // Wording agreed 16/10/2026.
  guaranteeFundNote: 'The Annual Guarantee applies only to the part of your plan invested in {funds}. At each policy anniversary, we set a guaranteed value equal to {level} of the value of your units in this fund. If, at the next policy anniversary, the value of your units in this fund is below that guaranteed value, we add units to top it back up to the guaranteed value. The guarantee does not apply to any other fund in your plan. Please see the product brochure for further details.',
  guaranteeFundNoteMixed: 'The Annual Guarantee applies only to the parts of your plan invested in the funds named above, each at its own guarantee level ({levels}). At each policy anniversary, we set a guaranteed value for each of these funds equal to its guarantee level of the value of your units in that fund. If, at the next policy anniversary, the value of your units in one of these funds is below its guaranteed value, we add units to top it back up to the guaranteed value. The guarantee does not apply to any other fund in your plan. Please see the product brochure for further details.',
  // Fallback when a guaranteed fund has no known guarantee level
  guaranteeFundNoteGeneric: 'The Annual Guarantee applies only to the part of your plan invested in a guaranteed fund. At each policy anniversary, we set a guaranteed value equal to a percentage of the value of your units in that fund. If, at the next policy anniversary, the value of your units in that fund is below its guaranteed value, we add units to top it back up to the guaranteed value. The guarantee does not apply to any other fund in your plan. Please see the product brochure for further details.',

  strategyProfiles: {
    Balanced: 'A more cautious blend weighted towards lower-volatility assets and bonds, with a smaller equity allocation. Prioritises capital preservation with modest growth potential.',
    Dynamic: 'A medium-risk mix balancing equities and bonds in roughly equal measure. Targets solid long-term growth while maintaining meaningful downside protection.',
    Opportunity: 'A higher equity weighting aiming for maximum long-term capital growth. Accepts greater short-term volatility in exchange for stronger return potential over a longer investment period.'
  },
  sosPortfolioRiskNumeric: 'Based on the weighted average of its funds\' published ESMA ratings, this portfolio has an indicative risk rating of about {portfolioSri} ({portfolioSriLabel}).',
  sosPortfolioRiskGlidepath: 'This strategy\'s target risk profile is {profile}. As a glidepath, its fund mix changes gradually as you approach retirement, so no single ESMA rating is published for it. Based on the weighted average of its funds\' ESMA ratings, its indicative risk is about {sriStart} at the start of your plan, reducing to about {sriEnd} by your retirement age.',
  disDescription: 'The Default Investment Strategy is a medium-risk glidepath that automatically reduces investment risk as you approach retirement.',
  diyDescription: 'You have chosen your own selection of funds.',
  lowSriNote: 'For clients with a risk rating of 1 or 2, a DIY portfolio of cash and fixed income funds may be closer to their attitude to risk than any of the glidepath strategies.',

  // ─── Portfolio step (card and popover copy lives in quote_content.js) ─────────
  // Mismatch warning (shown when the adviser tries to proceed)
  mismatchPrompt: 'The risk profile of your selection may not align with the client\'s assessed risk rating of {sri}. To proceed, please provide a reason.',
  mismatchDetailManaged: '{name} is suitable for risk ratings {range}.',
  mismatchDetailCustom: 'Indicative portfolio risk: {risk} (weighted average of the funds\' ESMA ratings).',
  replaceCustomConfirm: 'You have an existing custom fund allocation. Selecting a managed strategy will replace it. Continue?',

  // ─── Remuneration — from SRP/POI, initial vs trail split DRAFT ───────────────
  remunIntro: 'This statement sets out the remuneration we pay to your financial adviser, {brokerFirm}, in connection with this policy. This remuneration is paid for by us from the charges we make on your policy; it is not an additional charge.',
  remunInitial: 'Initial remuneration is a once-off payment made when your policy starts.',
  remunTrail: 'Trail (ongoing) remuneration is paid each year as a percentage of your fund value, so the amount depends on future investment returns.',
  prsaRpInitial: 'Initial remuneration on regular contributions is {rpPct} of your first year\'s regular contributions.',
  prsaClawback: 'Commission clawback applies on cool-off or surrender/transfer to another PRSA provider during the first 5 years.',
  arfClawback: 'Commission clawback applies on cool-off only (within 30 days of policy inception) — no clawback applies on surrender.',
  ibClawback: 'Commission clawback applies in full on cool-off (within 30 days of policy inception). An exit charge or clawback schedule may also apply on early encashment, as set out in the Charges section.',
  noClawback: 'No initial remuneration is payable on this policy, so no clawback applies.',
  overrideNote: 'The initial remuneration rate shown has been agreed between your adviser and Allianz Global Life and differs from the standard rate for this product.',
  remunTableNote: 'Projected remuneration figures assume the growth rate(s) shown in this quotation and are not guaranteed.',

  // ─── About the product — DRAFT (adapted from product literature) ─────────────
  prsaProduct: [
    'A Personal Retirement Savings Account (PRSA) is a flexible, portable long-term savings contract designed to help you save for your retirement.',
    'You can make regular and/or single contributions, and transfer in benefits from other pension arrangements. You can change, stop or restart contributions at any time.',
    'Benefits can usually be taken from age 60 and no later than age 75. In certain circumstances benefits can be taken from age 50.',
    'At retirement you can usually take part of your fund as a retirement lump sum, with the balance used to buy an annuity, invested in an Approved Retirement Fund (ARF) or, in some cases, taken as taxable cash.',
    'A Standard PRSA invests only in pooled funds and has capped charges. A Non-Standard PRSA offers a wider range of funds and investment strategies, including the optional rolling guarantee.',
    'If you die before retirement, the value of your PRSA is paid to your estate.'
  ],
  arfProduct: [
    'An Approved Retirement Fund (ARF) is a personal investment fund that you can use at retirement to hold your pension savings and draw an income from them, while your fund remains invested.',
    'You keep ownership and control of your fund. You choose how it is invested and how much income you take, subject to the Revenue deemed distribution rules.',
    'The value of your ARF is not guaranteed and will depend on investment performance and the amount of income you take. Your fund could run out during your lifetime.',
    'On death, the value of your ARF passes to your estate. Where it passes to a surviving spouse or civil partner it may be transferred into an ARF in their name.',
    'You can choose an optional rolling guarantee on certain funds, which protects part of your fund value in return for an additional charge.'
  ],
  ibProduct: [
    'An Investment Bond is a unit-linked investment product designed for medium to long term growth, allowing you to invest a single contribution (and, on some versions, regular contributions) across a range of funds.',
    'You can choose from non-guaranteed unit-linked funds and, on certain funds, an optional rolling guarantee (GMAB) that protects a percentage of your fund value against falls, for an additional charge.',
    'The value of your Investment Bond is not guaranteed and will depend on investment performance, the charges that apply and any income or withdrawals you take.',
    'A government levy applies to every contribution, and exit tax applies on chargeable events, including the Revenue "deemed disposal" rule every 8 years.',
    'On death, the value of the units in your policy, net of tax, is paid to your estate. Where you have chosen a guaranteed fund, the guaranteed minimum death benefit applies instead.',
    'You can make ad hoc or regular withdrawals from your policy, subject to minimum amounts and, in some cases, an exit charge.'
  ],

  // ─── Tax — DRAFT, based on current Revenue rules; Compliance to confirm ──────
  taxIntro: 'The information below is based on our understanding of current Irish tax law and Revenue practice, which may change. It is a general summary only; your adviser can explain how it applies to your circumstances.',
  prsaTax: [
    'Contributions qualify for income tax relief at your marginal rate, subject to age-related limits on the percentage of earnings: 15% under age 30, 20% from 30 to 39, 25% from 40 to 49, 30% from 50 to 54, 35% from 55 to 59 and 40% from age 60. A maximum earnings limit of €115,000 per year applies.',
    'Investment growth within your PRSA is free of income tax and capital gains tax.',
    'At retirement you can usually take up to 25% of your fund as a retirement lump sum. Lump sums up to €200,000 are tax-free over your lifetime; the next €300,000 is taxed at the standard rate of income tax.',
    'Pensions in payment and taxable withdrawals are subject to income tax, USC and, where applicable, PRSI.',
    'A lifetime limit (the Standard Fund Threshold) applies to the total value of your pension benefits. Values above this limit are subject to an additional tax charge.'
  ],
  arfTax: [
    'Investment growth within your ARF is free of income tax and capital gains tax while it remains invested.',
    'Withdrawals from your ARF are taxed as income under PAYE, and are subject to USC and, where applicable, PRSI.',
    'Revenue deemed distribution rules require tax to be paid on a minimum withdrawal each year from the year in which you turn 61: 4% of the fund value from age 61, increasing to 5% from age 71. Where the total value of your ARFs exceeds €2 million, the rate is 6%. Tax is due on this amount whether or not you actually withdraw it.',
    'On death, the tax treatment of your ARF depends on who inherits it. Transfers to a surviving spouse or civil partner\'s ARF are free of income tax; other beneficiaries may be liable to income tax and/or capital acquisitions tax.'
  ],
  ibTax: [
    'An Investment Bond is taxed under the "gross roll-up" basis: there is no annual tax on income or gains within the fund, but exit tax is deducted on a chargeable event.',
    'Exit tax applies at 38% for an individual policyholder, 25% for a corporate policyholder, or 0% for an exempt policyholder, on the gain since the policy began (or since the last chargeable event).',
    'A chargeable event includes maturity, full or partial surrender, assignment, and the Revenue "deemed disposal" rule, which taxes the gain on your policy every 8 years whether or not you make a withdrawal. Tax already paid at deemed disposal is credited against tax due at a later chargeable event, so the same gain is not taxed twice.',
    'A government levy of 1% applies to every contribution you make into this policy.',
    'On death, the tax treatment depends on the chargeable event rules in force at that time.'
  ],

  // ─── Important information — warnings from SRP + standard CPC warnings ───────
  warnings: [
    'Warning: The value of your investment may go down as well as up.',
    'Warning: If you invest in this product you may lose some or all of the money you invest.',
    'Warning: The income you get from this investment may go down as well as up.',
    'Warning: Past performance is not a reliable guide to future performance.',
    'Warning: This product may be affected by changes in currency exchange rates.'
  ],
  importantInfo: [
    'This quotation is based on the details provided by your adviser and the assumptions set out in this document. It does not form part of your contract. The terms and conditions of your policy will be set out in your policy documents.',
    'The figures in this quotation are illustrations only and are not guaranteed. The actual value of your policy will depend on the performance of the underlying funds, the contributions paid, the income taken and the charges applied.',
    'You will receive the regulatory disclosure documents required for this product (including a {regDoc}) before or when your policy starts. If there is any difference between this quotation and those documents, the regulatory documents apply.',
    'It is recommended that you seek independent financial advice before making any decision about your retirement savings.'
  ],
  regDocPrsa: 'Preliminary Disclosure Certificate and Statement of Reasonable Projection',
  regDocArf: 'Point of Sale and Point of Issue Disclosure',
  regDocIb: 'Point of Sale and Point of Issue Disclosure',
  coolingOff: 'You have the right to cancel your policy within 30 days of being informed that it has started. To cancel, write to us at Operations Department, Allianz Global Life, Maple House, Temple Road, Blackrock, Co. Dublin, A94 Y9E8, or email customersupport@allianzgloballife.ie. Any contributions paid will be refunded, less a deduction for any fall in value between the time the money was invested and the time your instruction to cancel is received.',
  quoteValidity: 'This quotation is based on charges, fund options and assumptions in place on {date}.',

  // ─── Glossary — DRAFT ────────────────────────────────────────────────────────
  glossary: [
    ['Annual Guarantee', 'An optional feature on certain funds, for an additional charge. It applies only to the part of your plan invested in the guaranteed fund. At each policy anniversary, a guaranteed value is set at a percentage of the value of your units in that fund; if your units are worth less than this at the next anniversary, we add units to top them back up to the guaranteed value. Please see the product brochure for further details.'],
    ['Annual Management Charge (AMC)', 'A yearly charge, expressed as a percentage of your fund value, for administering your policy.'],
    ['Annuity', 'A regular income for life bought with your pension fund at retirement.'],
    ['Approved Retirement Fund (ARF)', 'A personal investment fund used to hold pension savings after retirement and draw an income from them.'],
    ['Clawback', 'The return of remuneration by the adviser to the provider if the policy is cancelled or transferred within a set period.'],
    ['Deemed disposal', 'A Revenue rule that taxes the gain on an Investment Bond every 8 years, whether or not a withdrawal is made.'],
    ['Deemed distribution', 'A Revenue rule that treats a minimum percentage of your ARF as withdrawn each year for tax purposes from age 61.'],
    ['Exit charge', 'A charge that applies if the policy is fully encashed during the early years.'],
    ['Exit tax', 'The tax deducted from an Investment Bond on a chargeable event, at a rate depending on the policyholder type.'],
    ['Fund Management Charge (FMC)', 'A yearly charge made by the fund manager, reflected in the price of the fund.'],
    ['Glidepath', 'An investment strategy that automatically moves your fund into lower-risk funds as you approach retirement.'],
    ['Government levy', 'A 1% tax on life assurance premiums, including contributions to an Investment Bond, collected by the insurer on behalf of the State.'],
    ['Inflation', 'The general increase in prices over time, which reduces the buying power of money.'],
    ['Initial remuneration', 'A once-off payment to your adviser when your policy starts.'],
    ['Investment Bond', 'A unit-linked investment product for medium to long term growth, taxed under the gross roll-up basis.'],
    ['PRSA', 'Personal Retirement Savings Account — a flexible personal pension contract.'],
    ['Reduction in yield', 'A single figure showing the total effect of all charges on your projected investment return.'],
    ['Retirement lump sum', 'The part of your pension fund you can take as a lump sum at retirement, up to Revenue limits.'],
    ['ESMA risk rating', 'A rating from 1 (lower risk) to 7 (higher risk) showing the level of risk of a fund.'],
    ['Trail remuneration', 'An ongoing payment to your adviser, calculated as a percentage of your fund value each year.'],
    ['Transfer value', 'The value of benefits moved into your policy from another pension arrangement.']
  ],

  // ─── Quotation pack pages (design handoff, 9 Oct 2026) ───────────────────────
  // Short product name: cover title and the letter-spaced brand line in the page footer.
  productBrands: {
    prsa: 'Allianz Vantage PRSA',
    arf:  'Allianz Vantage ARF',
    ib:   'Allianz Vantage Investment Bond'
  },
  packCoverKicker: 'ALLIANZ GLOBAL LIFE',
  packCoverSub: 'Your quotation',
  // Brochure-style cover: kicker over a two-line headline, then the product name in orange
  packCoverKickers: { prsa: 'YOUR RETIREMENT, YOUR WAY', arf: 'YOUR RETIREMENT, YOUR WAY', ib: 'ALLIANZ GLOBAL LIFE' },
  packCoverLines: ['Your personal', 'quotation for'],
  packCoverFor: 'Prepared for {clientName}',
  // Contents page (after the cover)
  packContents: {
    title: ['In this', 'quotation'],
    intro: 'This quotation sets out the details of the {productBrand} plan it is based on. Read it together with the product brochure before you decide.',
    introKid: 'This quotation sets out the details of the {productBrand} plan it is based on. Read it together with the product brochure and the Key Information Document before you decide.',   // Investment Bond only: no PRSA / ARF KIDs exist
    pageWord: 'PAGE'
  },
  // Back page
  packBack: {
    contactHead: 'Contact',
    contactIntro: 'If you\'d like to get in touch, you can contact Allianz Global Life using the details below:',
    office: 'Registered office address:',
    emailNote: 'For any queries related to your policy',
    warningsHead: 'Warnings',
    notRiskFree: '{productBrand} is not a risk free product.'
  },
  // Lead line under each page title. Projection and remuneration vary by product.
  packLeads: {
    summary:    'A summary of the details this quotation is based on.',
    charges:    'The charges that apply to your plan. All are yearly and taken from the value of your fund.',
    fundsLite:  'The funds you have chosen, how your money is invested, the indicative risk of your portfolio, and what each fund does.',
    funds:      'The funds you have chosen, how your money is split, how its risk compares with your attitude to risk, and what each fund does.',
    remun:      'What {company} pays {brokerFirm} for arranging this plan. These payments are included in the charges.',
    important:  'Please read this page carefully before you decide.',
    glossary:   'The terms used in this quotation.'
  },
  packProjectionLead: {
    prsa: 'How your pension fund could grow to age {nra}, based on the assumptions below.',
    arf:  'How your fund could change while you draw an income, based on the assumptions below.',
    ib:   'How your investment could grow, based on the assumptions below.'
  },
  // CPC warnings. Shown boxed beside the figures they relate to, and in full on Important information.
  // DRAFT: wording needs Compliance sign-off against the brochure.
  packWarnings: {
    value:     'Warning: The value of your investment may go down as well as up.',
    lose:      'Warning: If you invest in this product, you may lose some or all of the money you invest.',
    estimates: 'Warning: These figures are estimates only. They are not a reliable guide to the future performance of your investment.',
    past:      'Warning: Past performance is not a reliable guide to future performance.',
    currency:  'Warning: This product may be affected by changes in currency exchange rates.',
    income:    'Warning: The income you get from this investment may go down as well as up.',
    access:    'Warning: If you invest in this product, you will not have access to your money until you retire.'
  },
  // Plain-English charge definitions on the Charges page. DRAFT, based on the brochure.
  chargeDefs: [
    ['Annual management charge (AMC)', 'A yearly charge for setting up, managing and servicing your plan. It depends on the product version and the value of your plan. It includes the trail commission paid to your adviser.'],
    ['Fund management charge', 'The yearly cost of each fund, set by the investment manager and shown on the fund\'s factsheet. It varies by fund.'],
    ['Guarantee charge', 'Applies only to the part of your plan invested in a fund where you have chosen the Annual Guarantee. It is a percentage of the value of your units in that fund and varies by fund.']
  ],
  // Important information page. DRAFT: wording, cooling-off and validity periods need Compliance sign-off.
  packImportant: [
    ['This is a quotation, not an offer', 'Figures are based on the details shown in this quotation and current Revenue rules. Your plan starts only when we accept your application.'],
    ['Cooling-off period', 'You can cancel within 30 days of receiving your policy documents. Single contributions may be returned adjusted for any fall in value.'],
    ['Tax', 'Revenue limits, terms and conditions apply. Tax treatment depends on your individual circumstances and is not guaranteed to continue.'],
    ['Policy conditions', 'This quotation is a summary. If there is any conflict, the policy conditions will prevail.'],
    ['Complaints', 'Contact us first. If you are not satisfied, you can refer your complaint to the Financial Services and Pensions Ombudsman.'],
    ['Not risk free', '{productBrand} is not a risk-free product. Only the Annual Guarantee, where chosen, provides any protection.']
  ],
  packValidity: 'Quotation produced {date} · valid for 30 days',
  // Glossary terms that only make sense for one product. Everything else appears in every pack.
  glossaryOnly: {
    'Approved Retirement Fund (ARF)': 'arf', 'Deemed distribution': 'arf',
    'Investment Bond': 'ib', 'Deemed disposal': 'ib', 'Exit tax': 'ib', 'Government levy': 'ib',
    'PRSA': 'prsa', 'Glidepath': 'prsa', 'Retirement lump sum': 'prsa'
  },
  // Footnote under the attitude-to-risk strip and the portfolio-risk figure.
  packRiskFootnote: '* Allocation-weighted average of the funds\' published ESMA ratings ({exact}), rounded to the nearest whole number. A guide only, not an official ESMA risk rating.',
  packRiskFootnoteGlide: '* This strategy moves between funds as you approach retirement, so it has no single published ESMA rating. The figure shown is its risk profile.',
  packGuaranteeHead: 'Annual Guarantee on {funds}',
  // Investment page sub-headings, in page order.
  packFundsHeads: { split: 'How your money is invested', assets: 'How your money is split', risk: 'Risk', funds: 'About your funds' },
  // Under the asset split when it includes a DMAS or Strategy Select fund (otherwise assetSplitNote): lead, then
  // the sentence for each basis used, then tail. {asOf} is the factsheet date. DRAFT: needs Compliance sign-off.
  packAssetNote: {
    lead:      'Indicative only.',
    factsheet: 'Dynamic Multi Asset Strategy funds are shown using their asset exposure from the fund factsheets ({asOf}). The published figures include derivatives and add up to more than 100%, so they have been rescaled to 100%.',
    target:    'Strategy Select funds are counted at the mix of shares and bonds whose return they aim to match, not at what they hold.',
    tail:      'Actual holdings change over time, for example as the fund manager responds to market volatility.'
  },
  // Short version under the split in the tool's "Portfolio at a glance" panel.
  assetNoteShort: {
    factsheet: 'DMAS: factsheet exposure ({asOf}), rescaled to 100%.',
    target:    'Strategy Select: the stock/bond mix it aims to match.',
    tail:      'Actual holdings vary.'
  },
  packFundsFactsheets: 'For each fund\'s opportunities, risks and full details, please see its fund factsheet at www.allianzgloballife.ie.',
  packFundsSourceNote: 'Fund descriptions are summarised from the Allianz Global Life fund guide. Risk ratings are as at 30/06/2026.',
  packTrailNote: 'Key years shown. Trail figures are estimates based on the projected values in this quotation and will change with the value of your fund.',
  packKeyYearsNote: 'Key years shown.',
  packChargesAllowed: 'All the charges shown in this quotation are allowed for.',
  resultsLead: 'Check the details below, then review the projection, charges and remuneration.',

  // ─── Cover letter template (adviser-editable in Step 7) — DRAFT ──────────────
  // {enclosedList} is built from the sections ticked in Step 7, one "- " bullet per line.
  coverLetter: [
    'Dear {salutation} {clientLast},',
    '',
    '{openingLine} As agreed, please find enclosed your personalised quotation for the {productName}. {sosSentence}',
    '',
    'Enclosed:',
    '{enclosedList}',
    '',
    '## Next steps',
    'Please read the enclosed documents carefully, in particular the projected benefits, the charges and the important information. If you would like to go ahead, let me know and I will arrange the application with you. The figures in this quotation may change if your circumstances or the contributions change, so please contact me before proceeding if anything is different.',
    '',
    'If you have any questions, please contact me on {brokerPhone} or at {brokerEmail}.',
    '',
    'Yours sincerely,'
  ].join('\n'),
  coverOpening: {
    prsa: 'Thank you for the opportunity to discuss your retirement savings.',
    arf:  'Thank you for the opportunity to discuss how to invest your retirement fund and draw an income from it.',
    ib:   'Thank you for the opportunity to discuss your investment plans.'
  },
  coverSosSentence: 'Our Statement of Suitability explains why we believe this recommendation is suitable for you.',
  // How each pack item is described in the cover letter's "Enclosed" list. The Allianz quotation's
  // sections (summary to glossary) are one item.
  coverEnclosed: {
    sos:       'Statement of Suitability, setting out our recommendation and the reasons for it',
    riskprofile:'A record of your risk profile questionnaire and the result',
    quotation: 'Your Allianz quotation: a summary, your investment and its risk, projected benefits, charges, the remuneration we receive, and important information',
    quotationNoRemun: 'Your Allianz quotation: a summary, your investment and its risk, projected benefits, charges and important information',
    product:   'Information about the product, tax and other important points'
  },

  // ─── Statement of Suitability templates (adviser-editable in Step 7) — DRAFT ─
  sosPrsa: [
    '## Your needs and objectives',
    'You have told us that you wish to save for your retirement and plan to retire at age {nra}.',
    '',
    '## Your personal and financial circumstances',
    '{circumstancesSentence}',
    '',
    '## Your attitude to risk',
    'Based on the risk profiling we carried out with you{profilerPhrase}, your attitude to investment risk corresponds to a risk rating of {clientSri} ({clientSriLabel}) on the 1 to 7 ESMA risk scale. {profilerSentence}',
    '',
    '## Your sustainability preferences',
    '{esgSentence}',
    '',
    '## Our recommendation',
    'We recommend the {productName}, with {contributionSummary}, invested in {strategyName}. {portfolioRiskSentence} {riskSentence}',
    '',
    '## Why we believe this is suitable for you',
    '- A PRSA allows you to save for retirement in a tax-efficient way, with tax relief on contributions within Revenue limits.',
    '',
    '{transferSection}',
    '## Charges and remuneration',
    'The total effect of the charges on your plan is equivalent to reducing the assumed growth rate by {riy} per annum. {remunSentence} Full details are set out in the Charges section{remunRef} in this pack.',
    '',
    '## Risks you should be aware of',
    'The value of your PRSA may go down as well as up and is not guaranteed. The benefits you receive will depend on the contributions paid, investment performance, charges and annuity rates at retirement.',
    '',
    '## Alternatives considered',
  ].join('\n'),
  // Added to the PRSA Statement of Suitability only when a transfer value is entered.
  sosPrsaTransfer: [
    '## Transfer of your existing pension',
    'You are transferring {transferValue} from your existing pension arrangement into this PRSA.',
    ''
  ].join('\n'),

  sosArf: [
    '## Your needs and objectives',
    'You have told us that you wish to invest your retirement savings in an Approved Retirement Fund and draw an income from it, starting from age {incomeAge}.',
    '',
    '## Your personal and financial circumstances',
    '{circumstancesSentence}',
    '',
    '## Your attitude to risk',
    'Based on the risk profiling we carried out with you{profilerPhrase}, your attitude to investment risk corresponds to a risk rating of {clientSri} ({clientSriLabel}) on the 1 to 7 ESMA risk scale. {profilerSentence}',
    '',
    '## Your sustainability preferences',
    '{esgSentence}',
    '',
    '## Our recommendation',
    'We recommend the {productName}, with a single contribution of {contribution}, invested in {strategyName}. {portfolioRiskSentence} {riskSentence}',
    '',
    '## Why we believe this is suitable for you',
    '- An ARF allows you to keep your retirement savings invested while drawing a flexible income, and to pass any remaining value to your estate.',
    '',
    '## Sustainability of your income',
    '{depletionSentence}',
    '',
    '## Charges and remuneration',
    'Allowing for all charges, the assumed growth rate of {rate} is reduced to {netRate} per annum. {remunSentence} Full details are set out in the Charges section{remunRef} in this pack.',
    '',
    '## Risks you should be aware of',
    'The value of your ARF may go down as well as up and is not guaranteed. Depending on the income you take and investment returns, your fund could run out during your lifetime.',
    '',
    '## Alternatives considered',
  ].join('\n'),

  sosIb: [
    '## Your needs and objectives',
    'You have told us that you wish to invest {contributionSummary} over the medium to long term.',
    '',
    '## Your personal and financial circumstances',
    '{circumstancesSentence}',
    '',
    '## Your attitude to risk',
    'Based on the risk profiling we carried out with you{profilerPhrase}, your attitude to investment risk corresponds to a risk rating of {clientSri} ({clientSriLabel}) on the 1 to 7 ESMA risk scale. {profilerSentence}',
    '',
    '## Your sustainability preferences',
    '{esgSentence}',
    '',
    '## Our recommendation',
    'We recommend the {productName}, with {contributionSummary}, invested in {strategyName}. {portfolioRiskSentence} {riskSentence}',
    '',
    '## Why we believe this is suitable for you',
    '- An Investment Bond allows you to invest a lump sum (and, where available, regular contributions) across a range of funds within a single policy.',
    '',
    '## Sustainability of your fund',
    '{depletionSentence}',
    '',
    '## Charges, tax and remuneration',
    'Allowing for all charges, the assumed growth rate of {rate} is reduced to {netRate} per annum. Exit tax of {exitTaxRate} applies, based on a {policyholderType} policyholder. {remunSentence} Full details are set out in the Charges section{remunRef} in this pack.',
    '',
    '## Risks you should be aware of',
    'The value of your Investment Bond may go down as well as up and is not guaranteed. Depending on any income or withdrawals you take and investment returns, your fund could run out.',
    '',
    '## Alternatives considered',
  ].join('\n'),

  // Risk profiler named in "Your attitude to risk" (from Step 3, optional). DRAFT.
  sosProfilerPhrase: ' ({profiler})',
  // "Your personal and financial circumstances": {circumstancesSentence} is the client's profiler answers and is
  // empty unless the risk profiler has been completed. The wording of the profiler sentences themselves is in
  // risk_profiler_data.js. DRAFT.
  // "Your sustainability preferences" — from the Step 3 answer and the SFDR classification of the
  // recommended funds. DRAFT: new wording, needs Compliance sign-off.
  sosEsgNo: 'You told us that you do not have sustainability preferences for this investment, so they were not a factor in our recommendation.',
  sosEsgAllArt8: 'You told us that you have sustainability preferences. All of the recommended funds are classified under Article 8 of the EU Sustainable Finance Disclosure Regulation (SFDR), which means they promote environmental or social characteristics.',
  sosEsgPartArt8: 'You told us that you have sustainability preferences. {art8} of your portfolio is invested in funds classified under Article 8 of the EU Sustainable Finance Disclosure Regulation (SFDR), which promote environmental or social characteristics. The rest is invested in funds classified under Article 6, which do not.',

  // Footnotes for fund asset splits, volatility and fund charges. DRAFT: wording follows the PDC / Point of Sale
  // disclosures ("may be more or less than illustrated", "may vary in the future"); needs Compliance sign-off.
  assetSplitNote: 'The asset split shown is approximate. It is the typical split for each fund. Actual holdings will vary with market conditions and the fund manager\'s decisions, and may be more or less than shown.',
  volatilityNote: 'Volatility ranges are targets set by the fund manager for the medium to long term. They are not guaranteed, and actual volatility may be higher or lower.',
  fmcNote: 'Fund management charges shown are the current charges quoted by the fund manager, which may vary in the future. Projections use the maximum charge for each fund.',

  sosRiskMatch: 'This is in line with your attitude to risk.',
  sosRiskHigher: 'This is higher than your assessed attitude to risk. We have recommended it because: {reason}',
  sosRiskLower: 'This is lower than your assessed attitude to risk. We have recommended it because: {reason}',
  // Note above the Statement of Suitability editor, and the confirmation when it is left unedited. DRAFT.
  sosNote: 'The Statement of Suitability text below is an example only. It must be tailored to suit your clients\' needs. It must include the reasons that the recommended product is considered suitable to your clients\' circumstances, and it should also explain why you are recommending the particular product from the range of products analysed.',
  sosUneditedConfirm: {
    title: 'Continue without editing?',
    body: 'You have not made any changes to the Statement of Suitability. The text is an example only and must be tailored to your client\'s circumstances before it is given to them. Are you sure you want to continue?',
    yes: 'Yes, continue', no: 'Go back and edit'
  },
  sosDeclaration: 'I confirm that this Statement of Suitability reflects the advice given to the client.',
  sosClientAck: 'I confirm that I have read and understood this Statement of Suitability.'
};

// Replaces {token} placeholders from ctx. Unknown tokens are left as-is so they are
// easy to spot when editing this file.
function qtFill(str, ctx) {
  return String(str).replace(/\{(\w+)\}/g, function(m, k) {
    return (ctx && ctx[k] != null) ? String(ctx[k]) : m;
  });
}

// Note under an asset split: the sentence for each basis the mix uses (see assetSplitBasis), or the
// general note when every fund is at its nominal split. short = the tool's panel version.
function qtAssetNote(mix, short) {
  var T = QT_TEXT, b = assetSplitBasis(mix), N = short ? T.assetNoteShort : T.packAssetNote;
  var asOf = typeof FUND_FACTSHEET !== 'undefined' ? FUND_FACTSHEET.asOf : '';
  if (!b.factsheet && !b.target) return short ? '' : T.assetSplitNote;
  return [N.lead, b.factsheet ? qtFill(N.factsheet, { asOf: asOf }) : '', b.target ? N.target : '', N.tail]
    .filter(Boolean).join(' ');
}

// Explains why the Reduction in Yield (effect of charges) differs from the total annual charge.
function qtRiyWhy(product, r) {
  return QT_TEXT.riyWhy;
}
