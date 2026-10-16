// engine_arf.js — pure ARF projection engine for the Quotation Tool.
//
// The maths is a line-by-line extraction of runProjection()/recomputeResults() in
// arf_tool.html, turned into pure functions of their inputs so the numbers stay
// identical to the POI produced by the existing tool. Do not change the projection
// logic here without making the same change in arf_tool.html.
//
// Depends on arf_data.js (ARF_CODES, ARF_FUNDS, ARF_FUNDS_MAP, ARF_* constants).

// inp = {
//   dobStr, startStr        'YYYY-MM-DD'
//   code                    key in ARF_CODES
//   contribution            single contribution (>= 20,000)
//   diyAllocs, diyGmab      { fundId: percent }, { fundId: bool }
//   incomeType              'default' | 'custom_amount' | 'custom_pct'
//   incomeValue             € p.a. (custom_amount) or % of fund p.a. (custom_pct)
//   incomeStartAge          integer age
//   incomeEscalationPct     percent p.a. (custom_amount only; others use ARF_INCOME_ESC)
//   spUpOverride            null or decimal
//   rate1Override, rate2Override   null or decimal
// }

var ARF_MILESTONES = {1:1,2:1,3:1,4:1,5:1,10:1,15:1,20:1,25:1,30:1,35:1,40:1};

function arfSpUpRate(inp) {
  return inp.spUpOverride != null ? inp.spUpOverride : ARF_CODES[inp.code].spUp;
}

function arfBlendedMetrics(inp) {
  var gross = 0, ext = 0, gtee = 0;
  Object.keys(inp.diyAllocs).forEach(function(id) {
    var pctVal = (inp.diyAllocs[id] || 0) / 100;
    var f = ARF_FUNDS_MAP[id];
    if (!f || pctVal <= 0) return;
    gross += pctVal * f.grossRate;
    ext   += pctVal * f.extFund;
    gtee  += pctVal * ((inp.diyGmab[id] && f.gmab) ? f.gteeCharge : 0);
  });
  return { gross: gross, ext: ext, gtee: gtee };
}

function arfMonthlyDecrementRate(annualRate) {
  return 1 - Math.pow(1 - annualRate, 1/12);
}

function arfSolveIRR(cashflows, guess) {
  function npv(r) {
    var s = 0, denom = 1;
    for (var t = 0; t < cashflows.length; t++) {
      if (t > 0) denom *= (1 + r);
      s += cashflows[t] / denom;
    }
    return s;
  }
  function dnpv(r) {
    var s = 0;
    for (var t = 1; t < cashflows.length; t++) {
      s += -t * cashflows[t] / Math.pow(1 + r, t + 1);
    }
    return s;
  }
  var r = (typeof guess === 'number' && isFinite(guess)) ? guess : 0.005;
  for (var i = 0; i < 60; i++) {
    var f = npv(r);
    if (Math.abs(f) < 1e-6) return r;
    var df = dnpv(r);
    if (Math.abs(df) < 1e-12) break;
    var next = r - f / df;
    if (next <= -0.99) next = (r - 0.99) / 2;
    r = next;
  }
  return r;
}

function arfRunProjection(inp, annualGrossRate) {
  var cc = ARF_CODES[inp.code];
  var bm = arfBlendedMetrics(inp);
  var spUpRate = arfSpUpRate(inp);

  var adminM   = arfMonthlyDecrementRate(cc.admin);
  var extM     = arfMonthlyDecrementRate(bm.ext);
  var gteeM    = arfMonthlyDecrementRate(bm.gtee);
  var ongoingM = arfMonthlyDecrementRate(cc.ongoing);
  var totalMonthlyCharge = adminM + extM + gteeM;
  var monthlyGrowRate    = Math.pow(1 + annualGrossRate, 1/12) - 1;

  var dob       = new Date(inp.dobStr);
  var startDate = new Date(inp.startStr);
  var startAge  = (startDate - dob) / (365.25 * 24 * 3600 * 1000);
  var contrib   = inp.contribution;

  var deemedPct0 = contrib >= 2000000 ? ARF_DEEMED.over2m : (startAge < 71 ? ARF_DEEMED.age61 : ARF_DEEMED.age71);
  var initialPctUsed = 0;
  if (inp.incomeType === 'custom_pct') {
    initialPctUsed = Math.max((inp.incomeValue || 0) / 100, deemedPct0);
  } else if (inp.incomeType === 'default') {
    initialPctUsed = deemedPct0;
  }
  var regularIncomeAmount = (inp.incomeType === 'custom_amount')
    ? (inp.incomeValue || 0)
    : initialPctUsed * contrib;
  var customPctDecimal = inp.incomeType === 'custom_pct' ? (inp.incomeValue || 0) / 100 : 0;

  var escRate = (inp.incomeType === 'custom_amount')
    ? (inp.incomeEscalationPct != null ? inp.incomeEscalationPct / 100 : ARF_INCOME_ESC)
    : ARF_INCOME_ESC;

  var incomeStartMonth = inp.incomeStartAge ? Math.max(1, Math.round((inp.incomeStartAge - startAge) * 12) + 1) : 1;

  // Allocation: 1 + (standard commission - commission used), so an override changes the amount invested
  var allocation = 1 + (cc.spUp - spUpRate);
  var fund = contrib * allocation;
  var noChargeFund = contrib * allocation;
  var cumGrowth = 0, cumCharges = 0, cumIncome = 0, cumComm = 0;
  var rows = [], commRows = [], yearly = [];
  var month = 0, MAX_MONTHS = 50 * 12;
  var fundZeroYear = null, fundZeroMonth = null, noChargeAtDepletion = null;
  var yrGrowth = 0, yrComm = 0, yrIncome = 0, yrCharges = 0;
  var fundByYear = [contrib * allocation];
  var incomeHistory = [];

  while (month < MAX_MONTHS) {
    month++;
    var yr = Math.ceil(month / 12);
    var ageNow = startAge + (month - 1) / 12;   // workbook uses age at the start of the month

    var deemedRateM;
    // the workbook tests the premium (not the uplifted fund) in month 1
    var fundForTest = month === 1 ? contrib : fund;
    if (fundForTest >= 2000000) deemedRateM = ARF_DEEMED.over2m / 12;
    else if (ageNow < 71) deemedRateM = ARF_DEEMED.age61 / 12;
    else deemedRateM = ARF_DEEMED.age71 / 12;

    var noChargeOpen = noChargeFund;
    var growth   = fund * monthlyGrowRate;
    var chargesM = (fund + growth / 2) * totalMonthlyCharge;
    var fundAvail = Math.max(0, fund + growth - chargesM);

    // qTrack (the live deemed distribution minimum) must remain a term in the max().
    var incomeActive = month >= incomeStartMonth;
    var escF = Math.pow(1 + escRate, yr - 1);
    var oTrack   = incomeActive ? Math.min(regularIncomeAmount / 12 * escF, fundAvail) : 0;
    var pTrack   = (incomeActive && inp.incomeType === 'custom_pct') ? Math.min(customPctDecimal / 12 * fundAvail, fundAvail) : 0;
    var qTrack   = incomeActive ? Math.min(deemedRateM * fundAvail, fundAvail) : 0;
    var priorIdx = month - 13;
    var ratchet  = (priorIdx >= 0 && incomeHistory[priorIdx] != null) ? incomeHistory[priorIdx] * 1.02 : 0;

    var incomeM = Math.min(Math.max(oTrack, pTrack, qTrack, ratchet), fundAvail);
    incomeHistory[month - 1] = incomeM;

    var fundClosing = fundAvail - incomeM;

    // workbook month 1: commission base uses the premium, not the uplifted allocation
    var commBase = (fund + fundClosing) / 2 - (month === 1 ? contrib * (allocation - 1) : 0);
    var commM = commBase * ongoingM;
    if (month === 1) commM += spUpRate * contrib;

    var noChargeGrowth = noChargeFund * monthlyGrowRate;
    noChargeFund = Math.max(0, noChargeFund + noChargeGrowth - incomeM);
    // workbook roll-forward (U = premium + income + growth on the allocated premium) leaves out the uplift after month 1
    if (month === 1) noChargeFund = Math.max(0, noChargeFund - contrib * (allocation - 1));

    fund = Math.max(0, fundClosing);

    cumGrowth  += growth;
    cumCharges += chargesM;
    cumIncome  += incomeM;
    cumComm    += commM;
    yrGrowth   += growth;
    yrComm     += commM;
    yrIncome   += incomeM;
    yrCharges  += chargesM;

    var isDepletionMonth = fund <= 0.005;
    if (isDepletionMonth && fundZeroMonth == null) {
      fundZeroMonth = month;
      fundZeroYear = yr;
      noChargeAtDepletion = noChargeOpen;   // workbook windfall is the no-charge fund at the start of the last month
    }

    if (month % 12 === 0) {
      var spRate      = (yr <= cc.surrender.length) ? cc.surrender[yr - 1] : 0;
      var surPenalty  = spRate * fund;
      var displayFund = fund * (1 - spRate);

      if (yr <= 40) fundByYear.push(Math.round(displayFund));

      if (ARF_MILESTONES[yr]) {
        commRows.push({ year: yr, contrib: yr === 1 ? contrib : 0, comm: Math.round(yrComm) });
      }

      var alreadyDepleted = fundZeroYear != null && yr > fundZeroYear;
      var isDepletionRow  = fundZeroYear === yr;
      if (!alreadyDepleted && (ARF_MILESTONES[yr] || isDepletionRow)) {
        rows.push({
          year: yr,
          age: Math.floor(startAge + yr + 1e-9),
          A: contrib,
          B: Math.round(cumGrowth),
          C: Math.round(cumCharges + surPenalty - contrib * (allocation - 1)),   // workbook nets the allocation uplift off charges
          D: Math.round(cumIncome),
          E: Math.round(displayFund),
          yrIncome: Math.round(yrIncome)
        });
      }
      if (yr <= 40) {
        yearly.push({ year: yr, income: yrIncome, comm: yrComm, charges: yrCharges, fund: fund, displayFund: displayFund });
      }

      yrGrowth = 0; yrComm = 0; yrIncome = 0; yrCharges = 0;
    }
  }

  var cfNoCharge = [], cfCharge = [];
  for (var t = 0; t < month; t++) {
    var premium = (t === 0) ? contrib : 0;
    var inc = incomeHistory[t] || 0;
    var windfall = (fundZeroMonth && t === fundZeroMonth - 1) ? noChargeAtDepletion : 0;
    cfNoCharge.push(premium - inc - windfall);
    cfCharge.push(premium - inc);
  }
  var irrNoChargeM = arfSolveIRR(cfNoCharge, monthlyGrowRate);
  var irrChargeM   = arfSolveIRR(cfCharge, monthlyGrowRate - totalMonthlyCharge);
  var irrNoChargeA = Math.pow(1 + irrNoChargeM, 12) - 1;
  var irrChargeA   = Math.pow(1 + irrChargeM, 12) - 1;

  // Year-1 income (first full year of income), for headline display
  var firstIncomeYear = null;
  for (var k = 0; k < yearly.length; k++) { if (yearly[k].income > 0) { firstIncomeYear = yearly[k]; break; } }

  return {
    rows: rows, commRows: commRows, yearly: yearly, fundZeroYear: fundZeroYear,
    fundZeroMonth: fundZeroMonth,
    depletionAge: fundZeroMonth != null ? Math.floor(startAge + fundZeroMonth / 12) : null,
    effectiveGross: annualGrossRate, netRate: irrChargeA, riy: irrNoChargeA - irrChargeA,
    chargeRate: cc.admin + bm.ext + bm.gtee, fundByYear: fundByYear,
    spUpRate: spUpRate, spUpOverridden: inp.spUpOverride != null,
    initialComm: spUpRate * contrib,
    firstIncome: firstIncomeYear ? firstIncomeYear.income : 0,
    firstIncomeYear: firstIncomeYear ? firstIncomeYear.year : null,
    startAge: startAge
  };
}

function arfDefaultRate1(inp) { return Math.min(arfBlendedMetrics(inp).gross, ARF_MAX_RATE); }
function arfDefaultRate2()    { return ARF_RATE_2; }

function arfValidate(inp) {
  var errs = [];
  if (!inp.dobStr) errs.push('Date of birth is required.');
  if (!inp.startStr) errs.push('Policy start date is required.');
  if (inp.dobStr && inp.startStr) {
    var age = ageBetween(inp.dobStr, inp.startStr);
    if (age < 50 || age > 84) errs.push('Age at policy start must be between 50 and 84.');
    if (inp.incomeStartAge == null || isNaN(inp.incomeStartAge) || inp.incomeStartAge < Math.floor(age) || inp.incomeStartAge > 84)
      errs.push('Income start age must be between entry age (' + Math.floor(age) + ') and 84.');
  }
  if (!(inp.contribution >= 20000)) errs.push('Minimum single contribution is €20,000.');
  if (inp.incomeType === 'custom_amount' && !(inp.incomeValue > 0)) errs.push('Enter an annual income amount greater than zero.');
  if (inp.incomeType === 'custom_pct' && !(inp.incomeValue > 0 && inp.incomeValue <= 100)) errs.push('Enter an income percentage between 0 and 100.');
  var total = 0;
  Object.keys(inp.diyAllocs).forEach(function(id){ total += inp.diyAllocs[id] || 0; });
  if (Math.abs(total - 100) > 0.05) errs.push('Fund allocations must total 100%.');
  return errs;
}

// Returns { errors } or { product:'arf', p1, p2, rate1, rate2, bm, ... }
function runArfQuote(inp) {
  var errs = arfValidate(inp);
  if (errs.length) return { errors: errs };
  var bm    = arfBlendedMetrics(inp);
  var rate1 = inp.rate1Override != null ? inp.rate1Override : arfDefaultRate1(inp);
  var rate2 = inp.rate2Override != null ? inp.rate2Override : arfDefaultRate2();
  var p1 = arfRunProjection(inp, rate1);
  var p2 = arfRunProjection(inp, rate2);
  var cc = ARF_CODES[inp.code];
  var mix = [];
  ARF_FUNDS.forEach(function(f) {
    var a = (inp.diyAllocs[f.id] || 0) / 100;
    if (a > 0) mix.push({ fund: f, weight: a, gmab: !!(inp.diyGmab[f.id] && f.gmab) });
  });
  return {
    product: 'arf', inputs: inp, code: inp.code, cc: cc,
    p1: p1, p2: p2, rate1: rate1, rate2: rate2, bm: bm,
    rate1Overridden: inp.rate1Override != null, rate2Overridden: inp.rate2Override != null,
    startAge: p1.startAge, contribution: inp.contribution,
    spUpRate: p1.spUpRate, spUpOverridden: p1.spUpOverridden,
    initialComm: p1.initialComm,
    clawback: p1.spUpRate > 0,
    hasSurrender: cc.surrender.some(function(x){ return x > 0; }),
    hasGuarantee: mix.some(function(x){ return x.gmab; }),
    mix: mix,
    portfolioSri: weightedSri(mix.map(function(x){ return { esma: x.fund.esma, weight: x.weight }; }))
  };
}
