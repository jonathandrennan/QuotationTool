// ib_data.js — Allianz Vantage Investment Bond data: product codes and product constants.
//
// Figures come from the Parameters sheet of the IB Illustration Generator workbook (v0.12; named ranges
// Product_Parameters and Fund_Rates_Table) and agree with the appendix tables of the product specification
// (v0.3) on admin charge, commission and allocation for every code.
//
// The Investment Bond uses the ARF fund range (ARF_FUNDS / ARF_FUNDS_MAP in arf_data.js) unchanged: the
// same 13 funds, growth rates, ESMA ratings and guarantee charges as the workbook's Fund_Rates_Table.

// ── Regulatory / product constants ────────────────────────────────────────────
var IB_MAX_RATE = 0.06;              // ASP LA-8 cap on gross growth rate (same basis as ARF_MAX_RATE)
var IB_GOVT_LEVY = 0.01;             // 1% government levy on every premium in (SP and RP)
var IB_DEEMED_DISPOSAL_MONTHS = 96;  // Irish life-assurance deemed disposal: every 8 years
var IB_RIY_YEARS = 20;               // RIY cashflow window used when the fund never depletes
var IB_PROJECTION_YEARS = 20;        // years shown in quotes (table, chart, remuneration); the engine still runs 40

// Exit tax rate by policyholder type
var IB_TAX_RATES = { individual: 0.38, corporate: 0.25, exempt: 0 };
var IB_POLICYHOLDER_TYPES = [
  { id: 'individual', label: 'Individual' },
  { id: 'corporate',  label: 'Corporate' },
  { id: 'exempt',     label: 'Exempt' }
];

// Tiered bonus commission on large single contributions (IB workbook "Tiered Bonus Commission",
// Parameters C112:D114, used in Projections!C67). As in the workbook it is added to the allocation of the
// single contribution, not to the commission paid. The rate for the highest tier reached applies to the
// whole single contribution: from €100,000 +0.5%, from €500,000 +1%. Stacks with the special deal.
var IB_TIERED_BONUS_ON = true;
var IB_TIERED_BONUS = [
  { min: 0,      bonus: 0 },
  { min: 100000, bonus: 0.005 },
  { min: 500000, bonus: 0.01 }
];
// The tier a single contribution falls in: { min, bonus }
function ibTier(singleContribution) {
  var tier = IB_TIERED_BONUS[0];
  if (IB_TIERED_BONUS_ON) IB_TIERED_BONUS.forEach(function(t) { if (singleContribution >= t.min) tier = t; });
  return tier;
}
function ibTieredBonus(singleContribution) { return ibTier(singleContribution).bonus; }

// Product limits (from the product spec; the workbook does not hold them)
var IB_MIN_SP = 10000;
var IB_MIN_AGE = 18;
var IB_MAX_AGE = 80; // exclusive — "maximum age at entry is 79, defined as 80th birthday"

// ── Product codes ───────────────────────────────────────────────────────────────
// admin:        annual admin/policy charge
// spUp:         SP upfront commission rate (paid to adviser; funded by the company, recouped via ongoing charge)
// ongoing:      fund-based ongoing (trail) commission rate pa
// surrender:    exit-charge rates by policy year [yr1..yr8], applied to the SP-sourced fund value
// rpUp:         RP upfront commission rate (K/L/M codes only; 0 elsewhere — RP not available on other codes)
// rpAllocBonus: RP allocation rate, e.g. 1.01 = 101% of RP premium invested (K/L/M codes only; 0 elsewhere)
var IB_CODES = {
  'A1': { version:'A', admin:0.0045, spUp:0,    ongoing:0,      surrender:[0,0,0,0,0,0,0,0], rpUp:0,    rpAllocBonus:0 },

  'B1': { version:'B', admin:0.007,  spUp:0,    ongoing:0.0025, surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'B2': { version:'B', admin:0.007,  spUp:0.01, ongoing:0.00125,surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'B3': { version:'B', admin:0.007,  spUp:0.02, ongoing:0,      surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },

  'C1': { version:'C', admin:0.0095, spUp:0,    ongoing:0.005,  surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'C2': { version:'C', admin:0.0095, spUp:0.01, ongoing:0.00375,surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'C3': { version:'C', admin:0.0095, spUp:0.02, ongoing:0.0025, surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'C4': { version:'C', admin:0.0095, spUp:0.03, ongoing:0.00125,surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },
  'C5': { version:'C', admin:0.0095, spUp:0.04, ongoing:0,      surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },

  'D1': { version:'D', admin:0.012,  spUp:0,    ongoing:0.0075, surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'D2': { version:'D', admin:0.012,  spUp:0.01, ongoing:0.00625,surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'D3': { version:'D', admin:0.012,  spUp:0.02, ongoing:0.005,  surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'D4': { version:'D', admin:0.012,  spUp:0.03, ongoing:0.00375,surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },
  'D5': { version:'D', admin:0.012,  spUp:0.04, ongoing:0.0025, surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },
  'D6': { version:'D', admin:0.012,  spUp:0.05, ongoing:0,      surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },

  'E1': { version:'E', admin:0.0145, spUp:0,    ongoing:0.01,   surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'E2': { version:'E', admin:0.0145, spUp:0.01, ongoing:0.00875,surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'E3': { version:'E', admin:0.0145, spUp:0.02, ongoing:0.0075, surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'E4': { version:'E', admin:0.0145, spUp:0.03, ongoing:0.00625,surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },
  'E5': { version:'E', admin:0.0145, spUp:0.04, ongoing:0.005,  surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },
  'E6': { version:'E', admin:0.0145, spUp:0.05, ongoing:0.0025, surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0, rpAllocBonus:0 },

  // F/G/H/J: exit cost is commission clawback (no fund-based exit charge — surrender arrays are all zero)
  'F1': { version:'F', admin:0.007,  spUp:0.01, ongoing:0.00125,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'F2': { version:'F', admin:0.007,  spUp:0.02, ongoing:0,      surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },

  'G1': { version:'G', admin:0.0095, spUp:0.01,  ongoing:0.00375,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'G2': { version:'G', admin:0.0095, spUp:0.02,  ongoing:0.0025, surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'G3': { version:'G', admin:0.0095, spUp:0.025, ongoing:0.00125,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'G4': { version:'G', admin:0.0095, spUp:0.03,  ongoing:0,      surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },

  'H1': { version:'H', admin:0.012,  spUp:0.01,  ongoing:0.00625,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'H2': { version:'H', admin:0.012,  spUp:0.02,  ongoing:0.005,  surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'H3': { version:'H', admin:0.012,  spUp:0.025, ongoing:0.00375,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'H4': { version:'H', admin:0.012,  spUp:0.03,  ongoing:0.0025, surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },

  'J1': { version:'J', admin:0.0145, spUp:0.01,  ongoing:0.00875,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'J2': { version:'J', admin:0.0145, spUp:0.02,  ongoing:0.0075, surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'J3': { version:'J', admin:0.0145, spUp:0.025, ongoing:0.00625,surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },
  'J4': { version:'J', admin:0.0145, spUp:0.03,  ongoing:0.005,  surrender:[0,0,0,0,0,0,0,0], rpUp:0, rpAllocBonus:0 },

  // K/L/M: regular-premium enabled. Surrender penalty applies to the SP-sourced share of the
  // fund; the RP-sourced share is instead subject to clawback of the RP upfront commission.
  'K1': { version:'K', admin:0.009,  spUp:0.025, ongoing:0,      surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0.10, rpAllocBonus:1.01 },
  'K2': { version:'K', admin:0.009,  spUp:0.035, ongoing:0,      surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0.15, rpAllocBonus:1.00 },

  'L1': { version:'L', admin:0.0115, spUp:0.025, ongoing:0.0025, surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0.10, rpAllocBonus:1.01 },
  'L2': { version:'L', admin:0.0115, spUp:0.035, ongoing:0.0025, surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0.15, rpAllocBonus:1.00 },

  'M1': { version:'M', admin:0.014,  spUp:0.025, ongoing:0.005,  surrender:[0.03,0.02,0.01,0,0,0,0,0], rpUp:0.10, rpAllocBonus:1.01 },
  'M2': { version:'M', admin:0.014,  spUp:0.035, ongoing:0.005,  surrender:[0.05,0.04,0.03,0.02,0.01,0,0,0], rpUp:0.15, rpAllocBonus:1.00 }
};

// ── SP initial commission limits ────────────────────────────────────────────────
// How far the adviser may move the single-contribution initial commission on each code: [min, max].
// From the "SP Init Comm Range" column of the product spec appendix. Moving commission away from the
// standard rate moves the allocation the other way (see ibSpAllocationRate). A special deal is added
// on top of both ends (see ibSpCommLimits in engine_ib.js).
var IB_SPECIAL_DEAL = 0.01;   // a special deal is either off or exactly this much extra initial commission
var IB_SP_COMM_RANGE = {
  'A1': [0, 0.04],

  'B1': [0, 0.04], 'B2': [0, 0.04], 'B3': [0, 0.04],

  'C1': [0, 0.04], 'C2': [0, 0.04], 'C3': [0, 0.04], 'C4': [0, 0.04], 'C5': [0, 0.04],

  'D1': [0, 0.04], 'D2': [0, 0.04], 'D3': [0, 0.04], 'D4': [0, 0.04], 'D5': [0, 0.04], 'D6': [0, 0.05],

  'E1': [0, 0.04], 'E2': [0, 0.04], 'E3': [0, 0.04], 'E4': [0, 0.04], 'E5': [0, 0.04], 'E6': [0, 0.05],

  'F1': [0,     0.04], 'F2': [0.01,  0.04],

  'G1': [0,     0.04], 'G2': [0.01,  0.04], 'G3': [0.015, 0.04], 'G4': [0.02,  0.04],

  'H1': [0,     0.04], 'H2': [0.01,  0.04], 'H3': [0.015, 0.04], 'H4': [0.02,  0.04],

  'J1': [0,     0.04], 'J2': [0.01,  0.04], 'J3': [0.015, 0.04], 'J4': [0.02,  0.04],

  'K1': [0, 0.04], 'K2': [0, 0.04],

  'L1': [0, 0.04], 'L2': [0, 0.04],

  'M1': [0, 0.04], 'M2': [0, 0.04]
};

// Codes on which a regular premium is permitted at all
var IB_RP_CODES = Object.keys(IB_CODES).filter(function(c) { return IB_CODES[c].rpAllocBonus > 0; });
function ibCodeAllowsRp(code) { return IB_RP_CODES.indexOf(code) >= 0; }
