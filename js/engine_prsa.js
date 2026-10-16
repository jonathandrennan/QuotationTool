// engine_prsa.js — pure PRSA projection engine for the Quotation Tool.
//
// The maths is a line-by-line extraction of runQuotation() in prsa_tool.html (itself a
// duplicate of runIllustration()), turned into a pure function of its inputs so the
// numbers stay identical to the SRP/Quotation outputs of the existing tool. Do not
// change the projection logic here without making the same change in prsa_tool.html.
//
// Depends on prsa_data.js (FUNDS, FUNDS_MAP, CODES, GP_DATA, getGP, STRATS_*, constants).

// inp = {
//   dobStr, startStr        'YYYY-MM-DD'
//   nra                     retirement age (60–75)
//   gender                  'M' | 'F'
//   prsaType                'standard' | 'nonstandard'
//   code                    product code key in CODES
//   strat                   strategy id ('dis', 'lc_ba', 'ap_dy', 'diy', ...)
//   diyAllocs               { fundId: percent }   (DIY only)
//   diyGmab                 { fundId: bool }      (DIY only)
//   sp, ofv, rp             single premium, opening fund value (transfer), regular premium per payment
//   freq                    'monthly' | 'quarterly' | 'annual'
//   esc                     regular premium escalation, percent p.a.
//   spUpOverride, rpUpOverride   null or decimal rate
// }

function prsaStrategies(prsaType) {
  return prsaType === 'standard' ? STRATS_STD : STRATS_NS;
}
function prsaFundIds(prsaType) {
  return prsaType === 'standard' ? STD_FUND_IDS : NONSTD_FUND_IDS;
}
// Whether a glidepath strategy charges its guarantee at mtr months to retirement (see gmabMaxMtr in prsa_data.js)
function prsaGmabOn(s, mtr) {
  return !!s.gmab && (s.gmabMaxMtr == null || mtr <= s.gmabMaxMtr);
}

function prsaSpUpRate(inp) {
  return inp.spUpOverride != null ? inp.spUpOverride : CODES[inp.code].spUp;
}
function prsaRpUpRate(inp) {
  return inp.rpUpOverride != null ? inp.rpUpOverride : CODES[inp.code].rpPct;
}

// Term to retirement as the workbook defines it (SRP!A91, D85): age = (start - DoB)/365.25, term in months
// = ROUNDUP((NRA - age) x 12), and the final month is scaled by fmf = (NRA - age) x 12 + 1 - term.
function prsaTerm(dobStr, startStr, nra) {
  var dob   = new Date(dobStr);
  var start = new Date(startStr);
  var retDate = new Date(dob.getFullYear() + nra, dob.getMonth(), dob.getDate());
  var ageAtStart = (start - dob) / (365.25 * 24 * 3600 * 1000);
  var exactMonths = (nra - ageAtStart) * 12;
  var termMonths = Math.ceil(exactMonths - 1e-9);
  var fmf = exactMonths + 1 - termMonths;
  return { termMonths: termMonths, fmf: fmf, retDate: retDate, ageAtStart: ageAtStart };
}

// Fund mix at policy start: [{ fund, weight (0–1), gmab (bool) }]. For glidepath
// strategies this is the glidepath's starting allocation for the actual term.
function prsaInitialMix(inp, termMonths) {
  var mix = [];
  if (inp.strat === 'diy') {
    prsaFundIds(inp.prsaType).forEach(function(id) {
      var a = (inp.diyAllocs[id] || 0) / 100;
      if (a > 0) mix.push({ fund: FUNDS_MAP[id], weight: a, gmab: !!(inp.diyGmab[id] && FUNDS_MAP[id].gmab > 0) });
    });
    return mix;
  }
  var s = prsaStrategies(inp.prsaType).find(function(x){ return x.id === inp.strat; });
  if (!s || !s.gpKey) return mix;
  var gOn = prsaGmabOn(s, termMonths);
  var gp = GP_DATA[s.gpKey];
  var w = gp.weights[Math.max(0, Math.min(termMonths, 540))];
  gp.funds.forEach(function(id, i) {
    if (w[i] > 0) mix.push({ fund: FUNDS_MAP[id], weight: w[i], gmab: !!(gOn && FUNDS_MAP[id].gmab > 0) });
  });
  return mix;
}

function prsaProjectAtFlatRate(annualRate, ofv, sp, rpMonthly, freq, esc, termMonths) {
  var g = Math.pow(1 + annualRate, 1/12) - 1;
  var fv = ofv + sp;
  var escFactor = 1;
  for (var m = 1; m <= termMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      if (esc > 0) escFactor *= (1 + esc / 100);
    }
    var rpGross = 0;
    if (rpMonthly > 0) {
      var due = false;
      if (freq === 'monthly')   due = true;
      if (freq === 'quarterly') due = (m % 3 === 1);
      if (freq === 'annual')    due = (m % 12 === 1);
      if (due) rpGross = rpMonthly * escFactor;
    }
    fv = (fv + rpGross) * (1 + g);
  }
  return fv;
}
function prsaSolveIrr(targetFV, ofv, sp, rpMonthly, freq, esc, termMonths) {
  var lo = -0.5, hi = 0.5;
  for (var i = 0; i < 50; i++) {
    var mid = (lo + hi) / 2;
    if (prsaProjectAtFlatRate(mid, ofv, sp, rpMonthly, freq, esc, termMonths) < targetFV) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Monthly annuity factor (ILT15 mortality), matching Excel SRP rows 697-1357.
function prsaAnnuityFactor(retAge, gender, intRate, escRate, guaranteeYrs) {
  var qx    = gender === 'F' ? ILT15_QX_F : ILT15_QX_M;
  var qxAdj = gender === 'F' ? ANN_QX_ADJ_F : ANN_QX_ADJ_M;
  var factor = 0;
  var px = 1;
  var escMonth = 1/12;
  var age = retAge;
  var gteeMths = guaranteeYrs * 12;
  for (var t = 1; t <= 661; t++) {
    var qxA = age >= 120 ? 1 : (qx[age] || 0) * qxAdj;   // workbook: adjusted qx = 1 from age 120
    var qxM = 1 - Math.pow(1 - qxA, 1/12);
    var amount = (t <= gteeMths) ? escMonth : escMonth * px;
    factor += amount * Math.pow(1 + intRate, -t / 12);
    px *= (1 - qxM);
    if (px < 1e-9) break;
    if (t % 12 === 0) { escMonth *= (1 + escRate); age++; }
  }
  return factor;
}

// Returns { errors:[...] } on invalid input, otherwise the full result object.
function runPrsaQuote(inp) {
  var errs = [];
  if (!inp.dobStr) errs.push('Date of birth is required.');
  if (!inp.startStr) errs.push('Policy start date is required.');
  if (isNaN(inp.nra) || inp.nra < 60 || inp.nra > 75) errs.push('Retirement age must be between 60 and 75.');
  if (!inp.sp && !inp.rp && !inp.ofv) errs.push('Enter at least one of single contribution, regular contribution or transfer value.');
  if (inp.strat === 'diy') {
    var tot = prsaFundIds(inp.prsaType).reduce(function(s, id){ return s + (inp.diyAllocs[id] || 0); }, 0);
    if (Math.abs(tot - 100) > 0.5) errs.push('Fund allocation must total 100% (currently ' + tot + '%).');
  }
  if (errs.length) return { errors: errs };

  var spRaw = inp.sp || 0, ofvRaw = inp.ofv || 0, rpRaw = inp.rp || 0;
  var freq = inp.freq, esc = inp.esc || 0;

  var dob   = new Date(inp.dobStr);
  var start = new Date(inp.startStr);
  var ageAtStart = (start - dob) / (365.25 * 24 * 3600 * 1000);
  var term = prsaTerm(inp.dobStr, inp.startStr, inp.nra);
  var fmf = term.fmf, termMonths = term.termMonths;
  if (termMonths <= 0) return { errors: ['Retirement date is in the past. Please check date of birth and retirement age.'] };

  var cc = CODES[inp.code];
  var s = prsaStrategies(inp.prsaType).find(function(x){ return x.id === inp.strat; });
  var isGlidepath = !!(s && s.gpKey);

  var blendedGross = 0, blendedFundCharge = 0, blendedGmab = 0;
  if (inp.strat === 'diy') {
    prsaFundIds(inp.prsaType).forEach(function(id) {
      var alloc = (inp.diyAllocs[id] || 0) / 100;
      var f = FUNDS_MAP[id];
      blendedGross      += alloc * f.gross;
      blendedFundCharge += alloc * f.charge;
      if (inp.diyGmab[id]) blendedGmab += alloc * f.gmab;
    });
    blendedGross = Math.min(blendedGross, MAX_INVESTMENT_RETURN);
  } else if (isGlidepath) {
    var initGP = getGP(s.gpKey, termMonths);
    blendedGross      = initGP.gross;
    blendedFundCharge = initGP.amc;
    blendedGmab       = prsaGmabOn(s, termMonths) ? initGP.gmab : 0;
  }

  var totalAnnualCharge = cc.admin + blendedFundCharge + blendedGmab;

  var grossMonthlyRate   = Math.pow(1 + blendedGross, 1/12) - 1;
  var fixedMonthlyCharge = (1 - Math.pow(1 - cc.admin, 1/12))
                         + (1 - Math.pow(1 - blendedFundCharge, 1/12))
                         + (blendedGmab > 0 ? (1 - Math.pow(1 - blendedGmab, 1/12)) : 0);

  var spContribCharge = (spRaw > 0 && spRaw < CONTRIB_SP_THRESHOLD) ? CONTRIB_SP_CHARGE : 0;
  var rpMonthly       = rpRaw;
  // The workbook tests the monthly equivalent of every payment, escalated amounts included (SRP!Z).
  var payPerYear = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : 1;
  function rpChargeFor(payment) { return (payment * payPerYear / 12 <= CONTRIB_RP_THRESHOLD - 0.01) ? CONTRIB_RP_CHARGE : 0; }
  var rpContribCharge = rpRaw > 0 ? rpChargeFor(rpRaw) : 0;   // first-year rate, for display

  var termYears = inp.nra - ageAtStart;                    // SRP!D75, fractional
  var rpUpRate = prsaRpUpRate(inp);
  var rpUpfrontPct = Math.min(rpUpRate * termYears, cc.rpMax);
  var annualRp = rpMonthly * payPerYear;
  // Initial commission is paid on the gross contribution (SRP!AD)
  var rpUpfrontComm = rpUpfrontPct * annualRp;

  var spNet = spRaw * (1 - spContribCharge);
  var spUpRate = prsaSpUpRate(inp);
  var spUpfrontComm = spUpRate * spRaw;

  var ofvNet = ofvRaw;
  var fundNC = ofvNet + spRaw;
  var fundWC = ofvNet;              // the single contribution joins in month 1
  var totalContribNC = ofvRaw + spRaw;
  var totalContribWC = ofvNet + spNet;
  var sp1Charge = spRaw * spContribCharge;

  var snapshots = [];
  var commInYear = 0, ongoingInYear = 0, rpInYear = 0, chargesInYear = 0, cumCharges = 0;
  var escalFactor = 1;
  var ongoingMonthly = 1 - Math.pow(1 - cc.ongoing, 1/12);   // SRP!E68

  for (var m = 1; m <= termMonths; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      if (esc > 0) escalFactor *= (1 + esc / 100);
    }
    var rpGross = 0;
    if (rpRaw > 0) {
      var due = false;
      if (freq === 'monthly')   due = true;
      if (freq === 'quarterly') due = (m % 3 === 1);
      if (freq === 'annual')    due = (m % 12 === 1);
      if (due) rpGross = rpMonthly * escalFactor;
    }
    var rpCharge = rpGross > 0 ? rpChargeFor(rpGross) : 0;
    var rpNet = rpGross * (1 - rpCharge);

    var mGrossRate = grossMonthlyRate;
    var mMonthlyCharge = fixedMonthlyCharge;
    if (isGlidepath) {
      var gp = getGP(s.gpKey, termMonths - m + 1);   // workbook looks up months-to-retirement T-m+1
      mGrossRate     = Math.pow(1 + gp.gross, 1/12) - 1;
      mMonthlyCharge = (1 - Math.pow(1 - cc.admin, 1/12))
                     + (1 - Math.pow(1 - gp.amc, 1/12))
                     + (prsaGmabOn(s, termMonths - m + 1) ? (1 - Math.pow(1 - gp.gmab, 1/12)) : 0);   // workbook's months-to-retirement index for month m
    }
    if (m === termMonths) {
      mGrossRate     = mGrossRate * fmf;
      mMonthlyCharge = mMonthlyCharge * fmf;
    }

    fundNC = (fundNC + rpGross) * (1 + mGrossRate);
    var openWC    = fundWC;
    var spIn      = (m === 1) ? spRaw : 0;
    var midWC     = fundWC + rpNet + (m === 1 ? spNet : 0);
    var growthWC  = midWC * mGrossRate;
    var chargesWC = (midWC + growthWC / 2) * mMonthlyCharge;
    fundWC        = midWC + growthWC - chargesWC;

    totalContribNC += rpGross;
    totalContribWC += rpNet;

    rpInYear      += rpGross;
    // Trail: opening fund plus half the month's growth, contributions at their gross value (SRP!AD)
    var ongM = (openWC + spIn + rpGross + growthWC / 2) * ongoingMonthly;
    var initM = (m === 1 ? spUpfrontComm : 0) + (m <= 12 ? rpGross * rpUpfrontPct : 0);
    commInYear    += ongM + initM;
    ongoingInYear += ongM;
    var chargeM = chargesWC + (rpGross - rpNet) + (m === 1 ? sp1Charge : 0);
    chargesInYear += chargeM;
    cumCharges    += chargeM;

    if (m % 12 === 0 || m === termMonths) {
      var yr = Math.ceil(m / 12);   // policy year of the month (SRP!C)
      snapshots.push({
        year:       yr,
        month:      m,
        age:        Math.floor(ageAtStart + m / 12 + 1e-9),
        contribNC:  totalContribNC,
        fundNC:     fundNC,
        growthNC:   fundNC - totalContribNC,
        fundWC:     fundWC,
        rpInYear:   rpInYear,
        commInYear: commInYear,
        ongoingInYear: ongoingInYear,
        chargesInYear: chargesInYear,
        cumCharges: cumCharges,
        isMat:      m === termMonths
      });
      rpInYear = 0; commInYear = 0; ongoingInYear = 0; chargesInYear = 0;
    }
  }

  // Annuity (continuous age-based term; Irish Life quote rate within 5 years)
  var termYearsExact = inp.nra - ageAtStart;
  var annFactor = (termYearsExact <= 5)
    ? (1 / ANN_IL_QUOTE_RATE)
    : prsaAnnuityFactor(inp.nra, inp.gender, ANN_INTEREST, ANN_ESC, ANN_GUARANTEE);
  var realMat = fundWC / Math.pow(1 + INFLATION, termYearsExact);
  var mortImproveRate   = inp.gender === 'F' ? ANN_MORT_IMPROVE_F : ANN_MORT_IMPROVE_M;
  var mortImproveFactor = Math.pow(1 + mortImproveRate, (start.getFullYear() - ANN_MORT_BASE_YEAR) + termYearsExact);
  var monthlyAnn = realMat / (annFactor * mortImproveFactor * 12);
  var annualIncomeReal    = realMat / (annFactor * mortImproveFactor);
  var annualIncomeNominal = fundWC  / (annFactor * mortImproveFactor);

  var grossIRR = prsaSolveIrr(fundNC, ofvRaw, spRaw, rpMonthly, freq, esc, termMonths);
  var netIRR   = prsaSolveIrr(fundWC, ofvRaw, spRaw, rpMonthly, freq, esc, termMonths);

  var totalOngoing = snapshots.reduce(function(a, sn){ return a + sn.ongoingInYear; }, 0);
  var mix = prsaInitialMix(inp, termMonths);
  var portfolioSri = weightedSri(mix.map(function(x){ return { esma: x.fund.esma, weight: x.weight }; }));

  return {
    product: 'prsa',
    inputs: inp,
    code: inp.code, prsaType: inp.prsaType, cc: cc,
    strat: inp.strat, stratObj: s || null,
    stratLabel: s ? s.label : inp.strat, stratSub: s ? s.sub : '',
    isGlidepath: isGlidepath,
    nra: inp.nra, ageAtStart: ageAtStart, termMonths: termMonths, termYears: termYears,
    spRaw: spRaw, ofvRaw: ofvRaw, rpRaw: rpRaw, freq: freq, esc: esc, annualRp: annualRp,
    spContribCharge: spContribCharge, rpContribCharge: rpContribCharge,
    blendedGross: blendedGross, blendedFundCharge: blendedFundCharge, blendedGmab: blendedGmab,
    totalAnnualCharge: totalAnnualCharge,
    grossRate: grossIRR, netRate: netIRR, totalCharge: grossIRR - netIRR,
    fundNC: fundNC, fundWC: fundWC, totalContrib: totalContribNC,
    realMat: realMat, monthlyAnn: monthlyAnn,
    annualIncomeReal: annualIncomeReal, annualIncomeNominal: annualIncomeNominal,
    snapshots: snapshots,
    spUpRate: spUpRate, rpUpRate: rpUpRate, rpUpfrontPct: rpUpfrontPct,
    spUpfrontComm: spUpfrontComm, rpUpfrontComm: rpUpfrontComm,
    spUpOverridden: inp.spUpOverride != null, rpUpOverridden: inp.rpUpOverride != null,
    totalInitialComm: spUpfrontComm + rpUpfrontComm, totalOngoingComm: totalOngoing,
    clawback: (spUpRate > 0 || rpUpRate > 0),
    mix: mix, portfolioSri: portfolioSri
  };
}
