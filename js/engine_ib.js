// engine_ib.js — pure Investment Bond (IB) projection engine for the Quotation Tool.
//
// Derived from "InvBond\IB Illustration Generator_v0.12.xlsx" (itself a fork of the
// ARF workbook — same funds, same 6% growth cap, same 50-year/milestone-year
// convention as engine_arf.js, which this file reuses directly: arfBlendedMetrics,
// arfMonthlyDecrementRate, arfSolveIRR, ARF_MILESTONES, ARF_FUNDS_MAP).
//
// Two things are genuinely new vs ARF/PRSA and are implemented from first principles
// below rather than ported line-for-line from the Excel's three-column SP/RP layout:
//
//  1. Irish exit tax with 8-year deemed disposal. The SP and RP sub-books in the
//     Excel always share the same growth/charge rates, so the COMBINED fund value
//     is provably independent of how tax is apportioned between the two books —
//     only the Excel's own internal SP-book/RP-book display columns depend on that
//     apportionment. This engine therefore tracks one combined fund for the real
//     maths, plus a lightweight derived SP/RP split (fundSP, with RP implied as
//     fund-fundSP) used only to drive the "value if fully encashed now" display
//     figure on the RP-enabled codes (where SP and RP get different exit treatment).
//  2. The government levy (1% of every premium) and the tiered large-case
//     allocation bonus, neither of which exist in ARF or PRSA.
//
// Depends on ib_data.js (IB_CODES, IB_* constants) and arf_data.js (ARF_FUNDS_MAP,
// via arfBlendedMetrics) having been loaded first, and on engine_arf.js for the
// shared helpers listed above.

// inp = {
//   dobStr, startStr        'YYYY-MM-DD'
//   code                    key in IB_CODES
//   policyholderType        'individual' | 'corporate' | 'exempt'
//   contribution            single contribution (0, or >= IB_MIN_SP)
//   rp, freq, esc           regular contribution per payment, 'monthly'|'quarterly'|'annual', escalation % pa
//   diyAllocs, diyGmab      { fundId: percent }, { fundId: bool }
//   incomeType              'none' | 'custom_amount' | 'custom_pct'
//   incomeValue             € p.a. (custom_amount) or % of fund p.a. (custom_pct)
//   incomeStartAge          integer age
//   incomeEscalationPct     percent p.a. (custom_amount only)
//   spUpOverride            null or decimal
//   rateOverride            null or decimal
// }

function ibSpUpRate(inp) {
  return inp.spUpOverride != null ? inp.spUpOverride : IB_CODES[inp.code].spUp;
}
function ibDefaultRate(inp) { return Math.min(arfBlendedMetrics(inp).gross, IB_MAX_RATE); }

// Allocation rate applied to the single contribution: 100% +/- any commission override
// (lower commission -> higher allocation, and vice versa) +/- the tiered large-case bonus.
function ibSpAllocationRate(inp) {
  var cc = IB_CODES[inp.code];
  return 1 + (cc.spUp - ibSpUpRate(inp)) + ibTieredBonus(inp.contribution || 0);
}
function ibRpAllocationRate(inp) {
  var cc = IB_CODES[inp.code];
  return ibCodeAllowsRp(inp.code) ? cc.rpAllocBonus : 1;
}

function ibRunProjection(inp, annualGrossRate) {
  var cc = IB_CODES[inp.code];
  var bm = arfBlendedMetrics(inp);
  var spUpRate = ibSpUpRate(inp);
  var spAllocRate = ibSpAllocationRate(inp);
  var rpAllowed = ibCodeAllowsRp(inp.code) && (inp.rp || 0) > 0;
  var rpAllocRate = ibRpAllocationRate(inp);
  var taxRate = IB_TAX_RATES[inp.policyholderType] || 0;

  var adminM   = arfMonthlyDecrementRate(cc.admin);
  var extM     = arfMonthlyDecrementRate(bm.ext);
  var gteeM    = arfMonthlyDecrementRate(bm.gtee);
  var ongoingM = arfMonthlyDecrementRate(cc.ongoing);
  var totalMonthlyCharge = adminM + extM + gteeM;
  var monthlyGrowRate = Math.pow(1 + annualGrossRate, 1 / 12) - 1;

  var dob = new Date(inp.dobStr), startDate = new Date(inp.startStr);
  var startAge = (startDate - dob) / (365.25 * 24 * 3600 * 1000);
  var contrib = inp.contribution || 0;
  var rpAmt = rpAllowed ? inp.rp : 0;
  var esc = (inp.esc || 0) / 100;

  // Precompute the regular-premium schedule once so the first policy year's total
  // (needed for the month-1 RP initial commission lump) is known up front.
  var MAX_MONTHS = 50 * 12;
  var rpSchedule = [];
  if (rpAllowed) {
    var escFactor = 1;
    for (var m = 1; m <= MAX_MONTHS; m++) {
      if (m % 12 === 1 && m > 1) escFactor *= (1 + esc);
      var due = inp.freq === 'monthly' ? true : inp.freq === 'quarterly' ? (m % 3 === 1) : (m % 12 === 1);
      rpSchedule.push(due ? rpAmt * escFactor : 0);
    }
  } else {
    for (var mi = 0; mi < MAX_MONTHS; mi++) rpSchedule.push(0);
  }
  var firstYearRpTotal = rpSchedule.slice(0, 12).reduce(function(a, b) { return a + b; }, 0);
  var rpInitialComm = rpAllowed ? cc.rpUp * firstYearRpTotal : 0;
  var clawbackYears = cc.surrender.filter(function(x) { return x > 0; }).length;

  var incomeType = inp.incomeType || 'none';
  var incomeStartMonth = (incomeType !== 'none' && inp.incomeStartAge != null)
    ? Math.max(1, Math.round((inp.incomeStartAge - startAge) * 12) + 1) : null;
  var fixedAnnual = incomeType === 'custom_amount' ? (inp.incomeValue || 0) : 0;
  var pctAnnual = incomeType === 'custom_pct' ? (inp.incomeValue || 0) / 100 : 0;
  var incEsc = incomeType === 'custom_amount' ? Math.max(0, (inp.incomeEscalationPct || 0) / 100) : 0;

  var fund = 0, fundSP = 0, fundNoTax = 0, noChargeFund = 0;
  var Y = 0, AB = 0, prevAA = 0, prevIsDisposal = false, prevTaxDue = 0;
  var cumPremium = 0, cumGrowth = 0, cumCharges = 0, cumAllocBonus = 0, cumRealizedTax = 0, cumIncome = 0, cumNetIncome = 0;
  var yrPremium = 0, yrGrowth = 0, yrCharges = 0, yrIncome = 0, yrComm = 0, yrRealizedTax = 0;
  var rows = [], commRows = [], yearly = [], fundByYear = [0];
  var fundZeroYear = null, fundZeroMonth = null;
  var cfNoCharge = [], cfChargeNoTax = [];
  var riyHorizonMonths = null; // resolved once the fund either depletes or we pass the RIY window

  for (var month = 1; month <= MAX_MONTHS; month++) {
    var yr = Math.ceil(month / 12);
    var ageNow = startAge + month / 12;

    var premiumSP = (month === 1) ? contrib : 0;
    var premiumRP = rpSchedule[month - 1] || 0;
    var premiumRaw = premiumSP + premiumRP;
    var allocatedSP = premiumSP * spAllocRate;
    var allocatedRP = premiumRP * rpAllocRate;
    var allocated = allocatedSP + allocatedRP;

    var growth = (fund + allocated) * monthlyGrowRate;
    var charges = (fund + allocated + growth / 2) * totalMonthlyCharge + premiumRaw * IB_GOVT_LEVY;
    var fundAvail = Math.max(0, fund + allocated + growth - charges);

    // SP-only shadow pool, used only for the surrender-penalty display split below.
    var growthSP = (fundSP + allocatedSP) * monthlyGrowRate;
    var chargesSP = (fundSP + allocatedSP + growthSP / 2) * totalMonthlyCharge + premiumSP * IB_GOVT_LEVY;
    var fundSPAvail = fundSP + allocatedSP + growthSP - chargesSP;

    var incomeActive = incomeStartMonth != null && month >= incomeStartMonth;
    var escF = Math.pow(1 + incEsc, yr - 1);
    var desired = incomeType === 'custom_amount' ? (fixedAnnual / 12 * escF)
                : incomeType === 'custom_pct' ? (pctAnnual / 12 * fundAvail) : 0;
    var income = incomeActive ? Math.min(desired, fundAvail) : 0;
    var AA = fundAvail > 0 ? income / fundAvail : 0;

    // Exit cost if fully encashed this month, after this month's income (which the mutually
    // exclusive RP/income rule means always comes from the SP share): surrender penalty on
    // the SP-sourced share, clawback of the RP initial commission on the RP-sourced share.
    var spRate = (yr <= cc.surrender.length) ? cc.surrender[yr - 1] : 0;
    var clawbackRemaining = (rpInitialComm > 0 && yr < clawbackYears) ? rpInitialComm * (clawbackYears - yr) / clawbackYears : 0;
    var fundRPAvail = fundAvail - fundSPAvail;
    var exitCost = Math.max(0, fundSPAvail - income) * spRate + Math.min(fundRPAvail, clawbackRemaining);

    Y = premiumRaw + Y * (1 - prevAA);
    var isDisposal = (month % IB_DEEMED_DISPOSAL_MONTHS === 0);
    // AB is the running credit for tax already paid at the last deemed disposal (or on an
    // actual encashment), carried forward so the next chargeable event only taxes the gain
    // accrued since then, not the whole policy's gain again.
    AB = AB * (1 - prevAA) + (prevIsDisposal ? prevTaxDue * (1 - prevAA) : 0);
    var gain = Math.max(fundAvail + AB - Y, 0);
    var trigger = isDisposal ? 1 : AA;
    // Tax actually realised this month (deducted from the policy at a deemed disposal, or
    // netted against an actual withdrawal) — this is what really leaves the fund/the client.
    // A real deemed disposal taxes the fund's own gain and is unaffected by any surrender
    // penalty, since the policy isn't actually being encashed.
    var taxDue = (Y === 0) ? 0 : Math.max(0, trigger * (gain * taxRate - AB));
    // The unrealised/"if you encashed today" tax liability, shown to the client as a
    // disclosure figure between chargeable events (zero exactly on a disposal month, since
    // the real liability was just realised via taxDue instead). Matches the Excel's "Exit
    // Tax (Maturity Value)" column — it is never actually deducted from the real fund. Unlike
    // the real deemed-disposal tax, this IS computed net of the surrender penalty, since an
    // actual encashment would incur that cost before any tax is calculated on the proceeds.
    var gainNetOfExit = Math.max(fundAvail - income - exitCost + AB - Y, 0);
    var hypotheticalTax = isDisposal ? 0 : (Y === 0 ? 0 : Math.max(0, gainNetOfExit * taxRate - AB));
    var netCash = income - (isDisposal ? AA : 1) * taxDue;
    var fundReductionFromTax = isDisposal ? (1 - AA) * taxDue : 0;

    var fundClose = Math.max(0, fundAvail - income - fundReductionFromTax);
    var zSP = fundAvail > 0 ? fundSPAvail / fundAvail : 1;
    fundSP = Math.max(0, fundSPAvail - income - fundReductionFromTax * zSP);

    // Shadow pools for the reduction-in-yield calculation (charges-only and no-charge-at-all).
    var growthNT = (fundNoTax + allocated) * monthlyGrowRate;
    var chargesNT = (fundNoTax + allocated + growthNT / 2) * totalMonthlyCharge + premiumRaw * IB_GOVT_LEVY;
    var fundNoTaxAvail = Math.max(0, fundNoTax + allocated + growthNT - chargesNT);
    fundNoTax = Math.max(0, fundNoTaxAvail - income);

    var growthNC = (noChargeFund + premiumRaw) * monthlyGrowRate;
    noChargeFund = Math.max(0, noChargeFund + premiumRaw + growthNC - income);

    var commBase = fund + premiumRaw + growth / 2 - charges / 2 - income / 2;
    var commM = commBase * ongoingM;
    if (month === 1) commM += spUpRate * contrib + rpInitialComm;

    fund = fundClose;
    prevAA = AA; prevIsDisposal = isDisposal; prevTaxDue = taxDue;

    cumPremium += premiumRaw; cumGrowth += growth; cumCharges += charges;
    cumAllocBonus += (allocatedSP - premiumSP) + (allocatedRP - premiumRP);
    cumRealizedTax += taxDue; cumIncome += income; cumNetIncome += netCash;
    yrPremium += premiumRaw; yrGrowth += growth; yrCharges += charges; yrIncome += income; yrComm += commM; yrRealizedTax += taxDue;

    var isDepletionMonth = fund <= 0.005 && cumPremium > 0;
    if (isDepletionMonth && fundZeroMonth == null) { fundZeroMonth = month; fundZeroYear = yr; }

    // RIY cashflow horizon: depletion, or IB_RIY_YEARS if the fund never depletes. At the
    // terminal month, add a redemption inflow of whatever the shadow pool is still worth,
    // so the IRR comparison isolates the effect of charges (and separately tax) on the
    // terminal outcome rather than just on withdrawals taken so far — same convention as
    // the "windfall" term in arfRunProjection.
    if (riyHorizonMonths == null) {
      if (fundZeroMonth != null) riyHorizonMonths = fundZeroMonth;
      else if (month === IB_RIY_YEARS * 12) riyHorizonMonths = month;
    }
    if (riyHorizonMonths == null || month <= riyHorizonMonths) {
      var isTerminal = (month === riyHorizonMonths);
      cfNoCharge.push(premiumRaw - income - (isTerminal ? noChargeFund : 0));
      cfChargeNoTax.push(premiumRaw - income - (isTerminal ? fundNoTax : 0));
    }

    if (month % 12 === 0) {
      // "Taxation to date" is the full effective tax picture: tax already actually deducted
      // from the policy at past deemed-disposal events, plus the unrealised liability that
      // would additionally be due if the policy were encashed today. The displayed projected
      // value is then built the same way the Excel's own disclosure table does it — as a
      // reconciliation of contributions + growth - charges - tax - income — rather than by
      // reading the internal `fund` variable directly, so the two can never drift apart.
      var taxToDate = cumRealizedTax + hypotheticalTax;
      var chargesToDate = cumCharges + exitCost - cumAllocBonus;
      var displayFund = Math.max(0, cumPremium + cumGrowth - chargesToDate - taxToDate - cumIncome);

      if (yr <= 40) fundByYear.push(Math.round(fund));

      var alreadyDepleted = fundZeroYear != null && yr > fundZeroYear;
      var isDepletionRow = fundZeroYear === yr;
      if (!alreadyDepleted && (ARF_MILESTONES[yr] || isDepletionRow)) {
        rows.push({
          year: yr, age: Math.floor(startAge + yr + 1e-9),
          A: Math.round(cumPremium), B: Math.round(cumGrowth), C: Math.round(chargesToDate),
          D: Math.round(taxToDate), E: Math.round(cumIncome), F: Math.round(displayFund)
        });
      }
      if (ARF_MILESTONES[yr]) commRows.push({ year: yr, contrib: yr === 1 ? contrib + firstYearRpTotal : (rpAllowed ? rpSchedule[month - 1] * 12 : 0), comm: Math.round(yrComm) });
      if (yr <= 40) yearly.push({ year: yr, income: yrIncome, comm: yrComm, charges: yrCharges, tax: yrRealizedTax, fund: fund, displayFund: displayFund });

      yrPremium = 0; yrGrowth = 0; yrCharges = 0; yrIncome = 0; yrComm = 0; yrRealizedTax = 0;
    }
  }

  var irrNoChargeM = arfSolveIRR(cfNoCharge, monthlyGrowRate);
  var irrChargeM = arfSolveIRR(cfChargeNoTax, monthlyGrowRate - totalMonthlyCharge);
  var irrNoChargeA = Math.pow(1 + irrNoChargeM, 12) - 1;
  var irrChargeA = Math.pow(1 + irrChargeM, 12) - 1;

  var firstIncomeYear = null;
  for (var k = 0; k < yearly.length; k++) { if (yearly[k].income > 0) { firstIncomeYear = yearly[k]; break; } }

  return {
    rows: rows, commRows: commRows, yearly: yearly, fundByYear: fundByYear,
    fundZeroYear: fundZeroYear, fundZeroMonth: fundZeroMonth,
    depletionAge: fundZeroMonth != null ? Math.floor(startAge + fundZeroMonth / 12) : null,
    effectiveGross: annualGrossRate, netRate: irrChargeA, riy: irrNoChargeA - irrChargeA,
    chargeRate: cc.admin + bm.ext + bm.gtee,
    spUpRate: spUpRate, spUpOverridden: inp.spUpOverride != null,
    rpInitialComm: rpInitialComm, firstYearRpTotal: firstYearRpTotal,
    initialComm: spUpRate * contrib + rpInitialComm,
    cumRealizedTax: cumRealizedTax, cumIncome: cumIncome, cumNetIncome: cumNetIncome,
    firstIncome: firstIncomeYear ? firstIncomeYear.income : 0,
    firstIncomeYear: firstIncomeYear ? firstIncomeYear.year : null,
    startAge: startAge
  };
}

function ibValidate(inp) {
  var errs = [];
  if (!inp.dobStr) errs.push('Date of birth is required.');
  if (!inp.startStr) errs.push('Policy start date is required.');
  if (inp.dobStr && inp.startStr) {
    var age = ageBetween(inp.dobStr, inp.startStr);
    if (age < IB_MIN_AGE || age >= IB_MAX_AGE) errs.push('Age at policy start must be between ' + IB_MIN_AGE + ' and ' + (IB_MAX_AGE - 1) + '.');
  }
  var sp = inp.contribution || 0, rp = inp.rp || 0;
  if (sp <= 0 && rp <= 0) errs.push('Enter a single contribution, a regular contribution, or both.');
  if (sp > 0 && sp < IB_MIN_SP) errs.push('Minimum single contribution is ' + fEUR(IB_MIN_SP) + '.');
  if (rp > 0 && !ibCodeAllowsRp(inp.code)) errs.push('The selected version does not support regular contributions — choose a K, L or M version.');
  if (rp > 0 && inp.incomeType !== 'none') errs.push('Regular contributions and income cannot both be selected — the product assumes a client taking income is not also contributing.');
  if (inp.incomeType === 'custom_amount' && !(inp.incomeValue > 0)) errs.push('Enter an annual income amount greater than zero.');
  if (inp.incomeType === 'custom_pct' && !(inp.incomeValue > 0 && inp.incomeValue <= 100)) errs.push('Enter an income percentage between 0 and 100.');
  if (inp.incomeType !== 'none') {
    var age2 = inp.dobStr && inp.startStr ? ageBetween(inp.dobStr, inp.startStr) : 0;
    if (inp.incomeStartAge == null || isNaN(inp.incomeStartAge) || inp.incomeStartAge < Math.floor(age2) || inp.incomeStartAge > (IB_MAX_AGE - 1)) {
      errs.push('Income start age must be between ' + Math.floor(age2) + ' and ' + (IB_MAX_AGE - 1) + '.');
    }
  }
  var total = 0;
  Object.keys(inp.diyAllocs || {}).forEach(function(id) { total += inp.diyAllocs[id] || 0; });
  if (Math.abs(total - 100) > 0.05) errs.push('Fund allocations must total 100%.');
  return errs;
}

function runIbQuote(inp) {
  var errs = ibValidate(inp);
  if (errs.length) return { errors: errs };
  var bm = arfBlendedMetrics(inp);
  var rate = inp.rateOverride != null ? inp.rateOverride : ibDefaultRate(inp);
  var p = ibRunProjection(inp, rate);
  var cc = IB_CODES[inp.code];
  var mix = [];
  ARF_FUNDS.forEach(function(f) {
    var a = (inp.diyAllocs[f.id] || 0) / 100;
    if (a > 0) mix.push({ fund: f, weight: a, gmab: !!(inp.diyGmab[f.id] && f.gmab) });
  });
  return {
    product: 'ib', inputs: inp, code: inp.code, cc: cc,
    p: p, rate: rate, rateOverridden: inp.rateOverride != null, bm: bm,
    startAge: p.startAge, contribution: inp.contribution, rp: inp.rp,
    spUpRate: p.spUpRate, spUpOverridden: p.spUpOverridden,
    initialComm: p.initialComm, rpInitialComm: p.rpInitialComm,
    clawback: p.spUpRate > 0 || p.rpInitialComm > 0,
    hasSurrender: cc.surrender.some(function(x) { return x > 0; }),
    hasGuarantee: mix.some(function(x) { return x.gmab; }),
    policyholderType: inp.policyholderType, taxRate: IB_TAX_RATES[inp.policyholderType] || 0,
    mix: mix,
    portfolioSri: weightedSri(mix.map(function(x) { return { esma: x.fund.esma, weight: x.weight }; }))
  };
}
