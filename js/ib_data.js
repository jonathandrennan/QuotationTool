// ib_data.js — Allianz Vantage Investment Bond data
//
// Figures are a line-by-line extraction of the Parameters sheet in
// "InvBond\IB Illustration Generator_v0.12.xlsx" (named ranges Product_Parameters,
// Fund_Rates_Table), cross-checked against the appendix tables in
// "InvBond\AGL Retirement Income Foundation Product Spec - Allianz Vantage
// Investment Bond v0.3.docx" (SP-only codes A-J and RP-enabled codes K/L/M match
// exactly on admin charge, commission base and allocation range across both sources).
//
// The Investment Bond reuses the fund universe from arf_data.js (ARF_FUNDS /
// ARF_FUNDS_MAP) unchanged — same 13 funds, same growth rates, same ESMA ratings,
// same GMAB charges, confirmed identical fund-for-fund against the IB workbook's
// Fund_Rates_Table.

// ── Regulatory / product constants ────────────────────────────────────────────
var IB_MAX_RATE = 0.06;              // ASP LA-8 cap on gross growth rate (same basis as ARF_MAX_RATE)
var IB_GOVT_LEVY = 0.01;             // 1% government levy on every premium in (SP and RP)
var IB_DEEMED_DISPOSAL_MONTHS = 96;  // Irish life-assurance deemed disposal: every 8 years
var IB_RIY_YEARS = 20;               // RIY cashflow window used when the fund never depletes

// Exit tax rate by policyholder type
var IB_TAX_RATES = { individual: 0.38, corporate: 0.25, exempt: 0 };
var IB_POLICYHOLDER_TYPES = [
  { id: 'individual', label: 'Individual' },
  { id: 'corporate',  label: 'Corporate' },
  { id: 'exempt',     label: 'Exempt' }
];

// Large-case tiered bonus allocation on the single contribution amount. Off, as in the IB workbook
// (Projections!C65 = "No") and the product spec (s1.4.6: "Charges and commissions will not be tiered").
var IB_TIERED_BONUS_ON = false;
var IB_TIERED_BONUS = [ { min: 0, bonus: 0 }, { min: 100000, bonus: 0.005 }, { min: 500000, bonus: 0.01 } ];
function ibTieredBonus(singleContribution) {
  var b = 0;
  if (!IB_TIERED_BONUS_ON) return b;
  IB_TIERED_BONUS.forEach(function(t) { if (singleContribution >= t.min) b = t.bonus; });
  return b;
}

// Product limits (from the product spec — not defined in the Excel engine)
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

// Codes on which a regular premium is permitted at all
var IB_RP_CODES = Object.keys(IB_CODES).filter(function(c) { return IB_CODES[c].rpAllocBonus > 0; });
function ibCodeAllowsRp(code) { return IB_RP_CODES.indexOf(code) >= 0; }
