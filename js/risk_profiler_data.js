// risk_profiler_data.js — questionnaire, scores, lookup tables and wording for the Risk Profiler.
//
// Part of the self-contained Risk Profiler module (risk_profiler_data.js, risk_profiler.js,
// risk_profiler_ui.js). Nothing here depends on the Quotation Tool, so the module can be reused
// on a website.
//
// Source: the Allianz Global Life risk profile website (riskprofile.allianzgloballife.ie, build
// main-MEMR5U7I.js, scoring in chunk-DEWIXWZV.js, read 12/10/2026). The questions, scores and tables
// are the site's, with the corrections listed in risk_profiler.js: the 6 and 7 market-fall scores are
// swapped, the income-side weights are the workbook's, the last two capacity steps work as in the
// workbook, and two experience quirks are fixed (see AdditionalInfo/RiskProfiler/Risk profiler -
// handoff.md, section 4). Where a value differs from the site, the site's is kept next to it
// (siteScore, siteWeights) so the engine can still reproduce the site for the tests.
// "src" on each question and option is the site's own id, for tracing.
//
// The wording of the questions and answers is tidied from the site's and may be edited freely,
// as long as each option keeps its score. Wording marked DRAFT is new and needs Compliance sign-off.
// "phrase" is the sentence used in the Statement of Suitability, addressed to the client
// ("You are ..."). A null phrase means nothing is said for that answer.

var RP_CONFIG = {
  version: '2.0',
  name: 'Allianz Global Life Risk Profiler',
  source: 'riskprofile.allianzgloballife.ie (build main-MEMR5U7I)',

  // ─── Result: the risk profile on the 1–7 scale (the site's "Sustainable risk profile (ESMA)") ──
  // Same scale and colours as the ESMA risk rating used across the quotation tool.
  sriLabels: ['', 'Very Low', 'Low', 'Low to Medium', 'Medium', 'Medium to High', 'High', 'Very High'],
  sriColors: ['', '#1a9e5c', '#4ab566', '#a0c840', '#f5c400', '#f5820a', '#e03333', '#990000'],
  // H94: a result of `from` becomes `to` when the client's age in whole years is over `over`.
  ageCap: { over: 80, from: 7, to: 6 },

  // ─── Experience and knowledge (site: E5, E8, E9, C11, J11, H93, I93) ──────────────────
  // score = 0.2 × max(education, finance work) + 0.6 × products + 0.2 × asset view.
  // Below `medium` is LOW, below `high` is MEDIUM, otherwise HIGH (so a score of 0 is LOW).
  // "Na" is only used when reproducing the site's quirk: it calls a score of 0 "Na" and counts it as 3.
  experience: { weights: { edu: 0.2, products: 0.6, assets: 0.2 }, medium: 100, high: 200, number: { LOW: 1, MEDIUM: 2, HIGH: 3, Na: 3 } },
  levels: {
    experience: {
      LOW:    { label: 'Low',    desc: 'limited knowledge or experience of investment products' },
      MEDIUM: { label: 'Medium', desc: 'some knowledge or experience of investment products' },
      HIGH:   { label: 'High',   desc: 'good knowledge or experience of investment products' },
      Na:     { label: 'Not scored', desc: 'no scored knowledge or experience of investment products' }
    },
    capacity: { 1: 'Low', 2: 'Medium', 3: 'High' }
  },

  // ─── Personal information (site: E19–E21, C24, J24) ──────────────────────────────────
  // score = round(0.25 × employment + 0.10 × health + 0.65 × dependants). Below `medium` is 1, below
  // `high` is 2, otherwise 3. The site's weights are 25, 10 and 65 (siteWeights), 100 times the
  // workbook's, so on the site any complete set of answers scores at least 950 and the level is always 3.
  personal: { weights: { employment: 0.25, health: 0.10, dependants: 0.65 }, siteWeights: { employment: 25, health: 10, dependants: 65 }, medium: 35, high: 65 },

  // ─── Lookup tables (site: J33, J45, J57, J66, J82), copied exactly ───────────────────
  // Each is read as tables.x[row][column - 1], and gives 0 if either input is below 1.
  tables: {
    // J33: row = income (2 or 3), column = personal information level (1–3) -> earning capacity
    earningCapacity: { 2: [1, 2, 3], 3: [2, 2, 3] },
    // J45: row = commitments (1–3), column = earning capacity (1–3) -> adjusted earning capacity
    adjustedEarning: { 1: [1, 2, 2], 2: [1, 2, 3], 3: [1, 3, 3] },
    // J57: row = liquid assets (1–3), column = time horizon (1–3) -> total assets (wealth), as in the
    // workbook, where the column was property. The site reads it the other way round.
    totalAssets: { 1: [1, 1, 2], 2: [2, 2, 3], 3: [2, 3, 3] },
    // J66: row = adjusted earning capacity (1–3), column = total assets (1–3) -> financial capacity
    // (the site's "financialSustainability"), as in the workbook. The site's row is liquid assets.
    financialCapacity: { 1: [1, 2, 3], 2: [2, 2, 3], 3: [2, 3, 3] },
    // J82: row = financial capacity (1–3), column = risk tolerance (1–7) -> risk profile (1–7)
    profile: { 1: [1, 1, 2, 3, 4, 5, 6], 2: [1, 2, 3, 4, 5, 6, 6], 3: [1, 2, 3, 4, 5, 6, 7] }
  },

  // ─── Sections and questions ─────────────────────────────────────────────────────────
  // "short" is the label in the questionnaire's step strip
  sections: [
    { id: 'about',      title: 'About you',                short: 'About you',        lead: 'A few details about you and your household.' },
    { id: 'experience', title: 'Experience and knowledge', short: 'Experience',       lead: 'What you know about investing, and what you have invested in. Both questions are optional.' },
    { id: 'finances',   title: 'Your finances',            short: 'Finances',         lead: 'Your income, commitments and savings, and how long you plan to invest for.' },
    { id: 'tolerance',  title: 'Your attitude to risk',    short: 'Attitude to risk', lead: 'How you would act if the value of your investments fell.' },
    { id: 'needs',      title: 'Your investment needs',    short: 'Needs',            lead: 'What the investment is for. This decides which funds are listed with your result.' }
  ],

  // type: 'date' | 'single' | 'products' | 'matrix'. "cols" is a layout hint for the options (1, 2 or 4 per row).
  // optional: true for the questions the site does not require.
  questions: [
    { id: 'dob', src: 'sPI_1', section: 'about', type: 'date', text: 'What is your date of birth?',
      help: 'A client aged 81 or over cannot be given the highest risk profile (7).' },

    { id: 'education', src: 'sPI_2', section: 'about', type: 'single', cols: 2, text: 'What is your level of education?',
      options: [
        { id: 'secondary', src: 'I18', label: 'Secondary education (for example the Leaving Certificate)', score: 50 },
        { id: 'degree',    src: 'I20', label: 'Bachelor\'s or master\'s degree', score: 200 },
        { id: 'doctorate', src: 'I22', label: 'Doctorate', score: 300 },
        { id: 'other',     src: 'I24', label: 'Other', score: 0 }
      ] },

    { id: 'employment', src: 'sPI_3', section: 'about', type: 'single', cols: 2, text: 'What is your employment status?',
      options: [
        { id: 'employee',     src: 'I33', label: 'Employee', score: 80, phrase: 'You are an employee.' },
        { id: 'manager',      src: 'I35', label: 'Manager or senior management (for example a director or CEO)', score: 80, phrase: 'You are in a senior management position.' },
        { id: 'entrepreneur', src: 'I37', label: 'Business owner', score: 80, phrase: 'You run your own business.' },
        { id: 'farmer',       src: 'I39', label: 'Self-employed in agriculture', score: 70, phrase: 'You are self-employed in agriculture.' },
        { id: 'selfemployed', src: 'I41', label: 'Self-employed', score: 70, phrase: 'You are self-employed.' },
        { id: 'unemployed',   src: 'I43', label: 'Not currently employed', score: 0, phrase: 'You are not currently employed.' },
        { id: 'retired',      src: 'I45', label: 'Retired', score: 100, phrase: 'You are retired.' }
      ] },

    { id: 'financeWork', src: 'sPI_4', section: 'about', type: 'single', cols: 4, text: 'Do you work, or have you worked, in banking, insurance or finance?',
      options: [
        { id: 'yes', src: 'I55', label: 'Yes', score: 300, phrase: 'You work, or have worked, in banking, insurance or finance.' },
        { id: 'no',  src: 'I57', label: 'No',  score: 0,   phrase: null }
      ] },

    // The site asks this in place of the workbook's marital status and keeps the marital scores.
    // It carries only 10% of the personal information score.
    { id: 'health', src: 'sPI_5', section: 'about', type: 'single', cols: 2, text: 'How would you describe your current state of health?',
      options: [
        { id: 'average',  src: 'I66', label: 'Average', score: 70, phrase: null },
        { id: 'verygood', src: 'I68', label: 'Very good', score: 100, phrase: null },
        { id: 'notgood',  src: 'I70', label: 'Not that good, or I prefer not to say', score: 30, phrase: null },
        { id: 'exams',    src: 'I72', label: 'Good, but I need to have medical tests', score: 70, phrase: null }
      ] },

    { id: 'dependants', src: 'sPI_6', section: 'about', type: 'single', cols: 2, text: 'How many people depend on you financially?',
      options: [
        { id: 'none',  src: 'I80', label: 'None', score: 100, phrase: 'Nobody depends on you financially.' },
        { id: 'one',   src: 'I82', label: 'One', score: 50, phrase: 'One person depends on you financially.' },
        { id: 'two',   src: 'I84', label: 'Two', score: 30, phrase: 'Two people depend on you financially.' },
        { id: 'three', src: 'I86', label: 'Three or more', score: 10, phrase: 'Three or more people depend on you financially.' }
      ] },

    // E8: the score is the highest weight among the product rows ticked, in either column (corrected:
    // on the site, two or more rows give NaN, which scores as HIGH experience). "None of the above"
    // clears the matching column on the other rows.
    { id: 'products', src: 'eK_7', section: 'experience', type: 'products', optional: true,
      text: 'Which of these investment products do you understand, and which have you held in the last three years?',
      help: 'Tick all that apply. A product can be ticked in both columns.',
      columns: [ { id: 'known', src: 'eK_7-know', label: 'Understand' }, { id: 'held', src: 'eK_7-held', label: 'Hold or have held' } ],
      options: [
        { id: 'govbonds',   src: 'O11', label: 'Government bonds', score: 50 },
        { id: 'bonds',      src: 'O13', label: 'Corporate bonds', score: 100 },
        { id: 'unitlinked', src: 'O15', label: 'Unit-linked or index-linked policies', score: 300 },
        { id: 'guaranteed', src: 'O17', label: 'Traditional life policies with a guaranteed return', score: 200 },
        { id: 'funds',      src: 'O19', label: 'Mutual funds', score: 250 },
        { id: 'none',       src: 'O21', label: 'None of the above', score: 0, exclusive: true }
      ] },

    // E9: 100 points for each row answered as `correct`, 0 otherwise. Unanswered rows score 0.
    { id: 'assetView', src: 'eK_8', section: 'experience', type: 'matrix', optional: true,
      text: 'What level of risk and potential return do you associate with each of these?',
      options: [ { id: 'low', src: 'eK_8-know', label: 'Low' }, { id: 'high', src: 'eK_8-held', label: 'High' } ],
      rows: [
        { id: 'equity', src: 'O31', label: 'Shares (equities)', correct: 'high' },
        { id: 'cash',   src: 'O33', label: 'Cash', correct: 'low' },
        { id: 'bonds',  src: 'O35', label: 'Bonds', correct: 'low' }
      ],
      pointsEach: 100 },

    { id: 'income', src: 'fP_9', section: 'finances', type: 'single', cols: 2, text: 'What is your gross annual income?',
      options: [
        { id: 'low',  src: 'L10', label: 'Up to €100,000', score: 2, phrase: 'Your gross annual income is up to €100,000.' },
        { id: 'high', src: 'L12', label: 'Over €100,000',  score: 3, phrase: 'Your gross annual income is over €100,000.' }
      ] },

    { id: 'commitments', src: 'fP_10', section: 'finances', type: 'single', cols: 2, text: 'What proportion of your income goes on regular financial commitments, such as mortgage or loan repayments?',
      options: [
        { id: 'none',   src: 'L20', label: 'None, I have no regular financial commitments', score: 3, phrase: 'You have no regular financial commitments.' },
        { id: 'low',    src: 'L22', label: 'Low (less than 10%)', score: 3, phrase: 'Your regular financial commitments, such as mortgage or loan repayments, take up less than 10% of your income.' },
        { id: 'medium', src: 'L24', label: 'Medium (between 10% and 40%)', score: 2, phrase: 'Your regular financial commitments, such as mortgage or loan repayments, take up between 10% and 40% of your income.' },
        { id: 'high',   src: 'L26', label: 'High (over 40%)', score: 1, phrase: 'Your regular financial commitments, such as mortgage or loan repayments, take up over 40% of your income.' }
      ] },

    // The site asks this in the workbook's "Do you own property?" slot and keeps its scores.
    { id: 'horizon', src: 'fP_11', section: 'finances', type: 'single', cols: 1, text: 'How long do you plan to keep this investment?',
      options: [
        { id: 'short',  src: 'L34', label: 'Short term (less than 5 years)', score: 1, phrase: 'You plan to keep this investment for less than 5 years.' },
        { id: 'medium', src: 'L36', label: 'Medium term (6 to 10 years)', score: 2, phrase: 'You plan to keep this investment for between 6 and 10 years.' },
        { id: 'long',   src: 'L38', label: 'Long term (more than 10 years)', score: 3, phrase: 'You plan to keep this investment for more than 10 years.' }
      ] },

    { id: 'assets', src: 'fP_12', section: 'finances', type: 'single', cols: 1, text: 'Roughly how much do you hold in liquid assets in total (cash, shares, funds, policies and so on)?',
      options: [
        { id: 'low',  src: 'L48', label: 'Up to €50,000', score: 1, phrase: 'You hold up to €50,000 in liquid assets.' },
        { id: 'mid',  src: 'L50', label: '€50,000 to €150,000', score: 2, phrase: 'You hold between €50,000 and €150,000 in liquid assets.' },
        { id: 'high', src: 'L52', label: 'Over €150,000', score: 3, phrase: 'You hold over €150,000 in liquid assets.' }
      ] },

    // Shown in the site's order. The scores are not in display order. The last two scoring answers are
    // swapped from the site (siteScore): buying more on your own scores 7, with an adviser 6.
    { id: 'tolerance', src: 'rT_13', section: 'tolerance', type: 'single', cols: 1, text: 'If you managed your own investments and markets fell, which of these would be your reaction?',
      options: [
        { id: 'sell',       src: 'K10', label: 'Sell immediately, because I would not accept further losses', score: 1, phrase: 'sell immediately, because you would not accept further losses' },
        { id: 'wait',       src: 'K12', label: 'Keep the investment and wait for its value to recover before selling', score: 2, phrase: 'keep the investment and wait for its value to recover before selling' },
        { id: 'hold',       src: 'K14', label: 'Hold the investment and wait, because I want a positive long-term return', score: 5, phrase: 'hold the investment and wait, because you want a positive long-term return' },
        { id: 'buymore',    src: 'K16', label: 'Keep the investment and partly increase my position to take advantage of the fall', score: 7, siteScore: 6, phrase: 'keep the investment and partly increase your position to take advantage of the fall' },
        { id: 'calmadvice', src: 'K18', label: 'Markets go up and down: stay calm and wait, but look for professional advice', score: 4, phrase: 'stay calm and wait, but look for professional advice' },
        { id: 'advice',     src: 'K20', label: 'Look for professional advice only', score: 3, phrase: 'look for professional advice' },
        { id: 'buyadviser', src: 'K22', label: 'Keep the investment and partly increase my position to take advantage of the fall, with the help of an adviser', score: 6, siteScore: 7, phrase: 'keep the investment and partly increase your position to take advantage of the fall, with the help of an adviser' }
      ] },

    // pQ_14: decides which funds are listed (eligibleFunds below). Not asked when the host supplies
    // it (the Quotation Tool sets it from the product being quoted).
    { id: 'purpose', src: 'pQ_14', section: 'needs', type: 'single', cols: 1, text: 'What is the main purpose of your investment?',
      options: [
        { id: 'A', src: 'A', label: 'A Personal Retirement Savings Account (PRSA), saving for retirement over the medium to long term. Access to the money may be limited by law.' },
        { id: 'B', src: 'B', label: 'An investment that aims to grow over the medium to long term, with access to my money when I need it.' },
        { id: 'C', src: 'C', label: 'An Approved Retirement Fund (ARF), investing over the medium term to provide a regular income in retirement.' },
        { id: 'D', src: 'D', label: 'Life insurance protection for a mortgage.' },
        { id: 'E', src: 'E', label: 'A savings plan that guarantees 100% of the investment back after 3 or 5 years.' }
      ] }
  ],

  // ─── Eligible funds (site: ELIGIBLE_PRODUCT, ELIGIBLE_PRODUCT_FUNDS_COMBINATION) ─────
  // Listed when complexity ≤ the experience number, risk ≤ the risk profile (a null risk always
  // passes), and the fund is offered for the purpose answer. Copied from the site, in its order.
  // purposes = the purpose answers (Q_PROD_OK_A–E) the row is offered for.
  eligibleFunds: [
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Default investment strategy',     fund: 'Combination of Strategy Select 75 and Strategy Select 30 funds', complexity: 2, risk: 3,    purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Combination of available funds',  fund: 'Allianz Strategy Select 30', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Combination of available funds',  fund: 'Allianz Strategy Select 50', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Combination of available funds',  fund: 'Allianz Strategy Select 75', complexity: 2, risk: 5, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Combination of available funds',  fund: 'Allianz Advanced Fixed Income Short Duration', complexity: 2, risk: 2, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (standard)',     route: 'Combination of available funds',  fund: 'Allianz Euro Cash', complexity: 1, risk: 1, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Strategy Select 30', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Strategy Select 50', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Strategy Select 75', complexity: 2, risk: 5, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Best Styles Global Equity SRI', complexity: 2, risk: 6, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Advanced Fixed Income Short Duration', complexity: 2, risk: 2, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Advanced Fixed Income Euro', complexity: 2, risk: 3, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Dynamic Multi Asset Strategy SRI 75', complexity: 2, risk: 5, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Dynamic Multi Asset Strategy SRI 50', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Dynamic Multi Asset Strategy SRI 15', complexity: 2, risk: 3, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Combination of available funds',  fund: 'Allianz Euro Cash', complexity: 1, risk: 1, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Default investment strategy',     fund: 'Combination of Life Cycle and Autopilot', complexity: 2, risk: null, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Investment glidepaths designed by Allianz Global Investors', fund: 'Life Cycle Balanced', complexity: 2, risk: 2, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Investment glidepaths designed by Allianz Global Investors', fund: 'Life Cycle Dynamic', complexity: 2, risk: 3, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Investment glidepaths designed by Allianz Global Investors', fund: 'Life Cycle Opportunity', complexity: 2, risk: 5, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Managed by Allianz Global Life to mitigate the risk, with guarantee', fund: 'Autopilot low risk', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Managed by Allianz Global Life to mitigate the risk, with guarantee', fund: 'Autopilot medium risk', complexity: 2, risk: 4, purposes: ['A'] },
    { product: 'Allianz Vantage PRSA (non-standard)', route: 'Managed by Allianz Global Life to mitigate the risk, with guarantee', fund: 'Autopilot high risk', complexity: 2, risk: 5, purposes: ['A'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Strategy Select 30', complexity: 2, risk: 4, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Strategy Select 50', complexity: 2, risk: 4, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Strategy Select 75', complexity: 2, risk: 5, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Best Styles Global Equity SRI', complexity: 2, risk: 6, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Advanced Fixed Income Short Duration', complexity: 2, risk: 2, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Advanced Fixed Income Euro', complexity: 2, risk: 3, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Dynamic Multi Asset Strategy SRI 75', complexity: 2, risk: 5, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Dynamic Multi Asset Strategy SRI 50', complexity: 2, risk: 4, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Dynamic Multi Asset Strategy SRI 15', complexity: 2, risk: 3, purposes: ['C'] },
    { product: 'Allianz Vantage ARF', route: 'ARF combination of available funds', fund: 'Allianz Euro Cash', complexity: 1, risk: 1, purposes: ['C'] }
  ],

  // ─── Wording for the written outputs (Statement of Suitability, record of answers). DRAFT. ──
  text: {
    // {profiler} = name, {date} = date completed
    usedPhrase: '{profiler}, {date}',
    riskSentence: 'In the risk profiler you told us that, if your investments fell in value, you would {tolerance}. Your financial capacity to take on investment risk was assessed as {capacity}. Together these give a risk profile of {sri} ({sriLabel}) on the 1 to 7 scale.',
    ageCapSentence: 'Because of your age, your risk profile has been limited to {to}.',
    experienceSentence: 'Your experience and knowledge of investment products was assessed as {level}, which means you have {levelDesc}.',
    overrideSentence: 'The risk profiler indicated a risk rating of {suggested} on the 1 to 7 scale. Following our discussion, we have agreed a risk rating of {chosen} because: {reason}',
    // Shown on the record of answers
    howCalculated: 'Your answers were scored by the Allianz Global Life risk profiler. Your household, income and regular commitments show how much you can earn and set aside. Your savings and the time horizon for this investment show your wealth. Together these give your financial capacity to take on risk (low, medium or high). This is combined with your answer about market falls to give a risk profile from 1 (very low) to 7 (very high), the same scale as the ESMA risk rating. A client aged 81 or over cannot be given a risk profile of 7. Your adviser makes the final assessment of your attitude to risk.',
    disclaimer: 'The risk profiler is a guide to help your adviser assess your attitude to risk. It is not a recommendation. Your answers have been recorded as you gave them.'
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = RP_CONFIG;
