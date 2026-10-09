// arf_data.js — Allianz Vantage ARF data

// ── Regulatory constants ──────────────────────────────────────────────────────
var ARF_MAX_RATE   = 0.06;   // regulatory cap on gross growth rate
var ARF_RATE_2     = 0.032;  // lower scenario (Allianz Euro Cash rate) — adjust here if needed
var ARF_INCOME_ESC = 0.02;   // income escalation assumption pa

// Revenue deemed distribution rates
var ARF_DEEMED = { age61: 0.04, age71: 0.05, over2m: 0.06 };

// ── Product codes ─────────────────────────────────────────────────────────────
// admin:    annual admin charge
// spUp:     SP upfront commission rate
// ongoing:  fund-based ongoing commission rate pa
// surrender: rates by year [yr1, yr2, yr3, yr4, yr5, yr6, yr7, yr8]
var ARF_CODES = {
  'A1': { version:'A', admin:0.011,  spUp:0,    ongoing:0.0075, surrender:[0,    0,    0,    0,    0, 0, 0, 0] },
  'A2': { version:'A', admin:0.011,  spUp:0.01, ongoing:0.006,  surrender:[0.02, 0.01, 0.01, 0,    0, 0, 0, 0] },
  'A3': { version:'A', admin:0.011,  spUp:0.02, ongoing:0.005,  surrender:[0.03, 0.03, 0.02, 0.02, 0.01, 0, 0, 0] },
  'A4': { version:'A', admin:0.011,  spUp:0.03, ongoing:0.0035, surrender:[0.04, 0.03, 0.03, 0.02, 0.01, 0, 0, 0] },
  'A5': { version:'A', admin:0.011,  spUp:0.04, ongoing:0.0025, surrender:[0.05, 0.04, 0.03, 0.02, 0.01, 0, 0, 0] },
  'B1': { version:'B', admin:0.0085, spUp:0,    ongoing:0.005,  surrender:[0,    0,    0,    0,    0, 0, 0, 0] },
  'B2': { version:'B', admin:0.0085, spUp:0.01, ongoing:0.0035, surrender:[0.02, 0.01, 0.01, 0,    0, 0, 0, 0] },
  'B3': { version:'B', admin:0.0085, spUp:0.02, ongoing:0.0025, surrender:[0.03, 0.03, 0.02, 0.02, 0.01, 0, 0, 0] },
  'B4': { version:'B', admin:0.0085, spUp:0.03, ongoing:0.001,  surrender:[0.04, 0.03, 0.03, 0.02, 0.01, 0, 0, 0] },
  'B5': { version:'B', admin:0.0085, spUp:0.04, ongoing:0,      surrender:[0.05, 0.04, 0.03, 0.02, 0.01, 0, 0, 0] },
  'C1': { version:'C', admin:0.006,  spUp:0,    ongoing:0.0025, surrender:[0,    0,    0,    0,    0, 0, 0, 0] },
  'C2': { version:'C', admin:0.006,  spUp:0.01, ongoing:0.0012, surrender:[0.02, 0.01, 0.01, 0,    0, 0, 0, 0] },
  'C3': { version:'C', admin:0.006,  spUp:0.02, ongoing:0,      surrender:[0.03, 0.03, 0.02, 0.02, 0.01, 0, 0, 0] },
  'D1': { version:'D', admin:0.0035, spUp:0,    ongoing:0,      surrender:[0,    0,    0,    0,    0, 0, 0, 0] },
  'F1': { version:'F', admin:0.0135, spUp:0,    ongoing:0.01,   surrender:[0,    0,    0,    0,    0, 0, 0, 0] },
  'F2': { version:'F', admin:0.0135, spUp:0.01, ongoing:0.0085, surrender:[0.02, 0.01, 0.01, 0,    0, 0, 0, 0] },
  'F3': { version:'F', admin:0.0135, spUp:0.02, ongoing:0.0075, surrender:[0.03, 0.03, 0.02, 0.02, 0.01, 0, 0, 0] },
  'F4': { version:'F', admin:0.0135, spUp:0.03, ongoing:0.006,  surrender:[0.04, 0.03, 0.03, 0.02, 0.01, 0, 0, 0] },
  'F5': { version:'F', admin:0.0135, spUp:0.04, ongoing:0.005,  surrender:[0.05, 0.04, 0.03, 0.02, 0.01, 0, 0, 0] }
};

// ── Funds ─────────────────────────────────────────────────────────────────────
// grossRate:  annual gross growth rate (pre-cap)
// extFund:    external fund manager charge pa
// gteeCharge: GMAB guarantee charge pa (only meaningful when gmab:true and guarantee selected)
// gmab:       true if this fund supports the optional rolling guarantee
// isin:       fund ISIN (brochure pp.32–38)
// assets:     nominal equity / fixed income / cash split (PDC "typical equity content"; matches the brochure
//             lifecycle tables pp.24–26). Look-through exposure from the factsheets is in FUND_FACTSHEET (prsa_data.js).
// targetVol:  DMAS funds only — the brochure gives no target range for Strategy Select.
// NOTE (2026-10-09): esma ratings updated to the Aug-26 brochure p.31 (afie 3, ss30 4, dm15 4, ss75 5), matching prsa_data.js.
//   extFund remains the current quoted FMC: the ARF Point of Sale and IB Point of Issue documents illustrate at the current level.
var ARF_FUNDS = [
  { id:'cash', color:'#6b7280', name:'Allianz Euro Cash',                            shortName:'Euro Cash',                grossRate:0.032,    extFund:0.0016, gteeCharge:0,      gmab:false, esma:1, isin:'LU2575878199', assets:{eq:0,    fi:0,    cash:1}, desc:'Aims for a money market-related return, with security of capital, value stability and liquidity, by investing in assets with ecological or social characteristics under the sustainable and responsible investment (SRI) strategy.' },
  { id:'afsd', color:'#1a9e5c', name:'Allianz Advanced Fixed Income Short Duration',shortName:'Fixed Income Short Dur.',  grossRate:0.0425,   extFund:0.0022, gteeCharge:0,      gmab:false, esma:2, isin:'LU1328247389', assets:{eq:0,    fi:1,    cash:0}, desc:'Invests mainly in interest-bearing securities, aiming for an above-average long-term return compared with the European short duration bond market, and promotes environmental, social and governance criteria. Up to 25% may be held in high-yield bonds and up to 20% in emerging market bonds.' },
  { id:'afie', color:'#059669', name:'Allianz Advanced Fixed Income Euro',          shortName:'Fixed Income Euro',        grossRate:0.0425,   extFund:0.0027, gteeCharge:0,      gmab:false, esma:3, isin:'LU2190101332', assets:{eq:0,    fi:1,    cash:0}, desc:'Invests mainly in interest-bearing securities, aiming for an above-average long-term return measured against the eurozone government bond market, and promotes environmental, social and governance criteria. Up to 20% may be held in high-yield bonds, and emerging market bonds may also be held.' },
  { id:'ss30', color:'#003781', name:'Allianz Strategy Select 30',                  shortName:'Strategy Select 30',       grossRate:0.05135,  extFund:0.0025, gteeCharge:0.0065, gmab:true,  esma:4, isin:'LU1901058732', assets:{eq:0.30, fi:0.70, cash:0}, desc:'Invests to a variable extent in international equities and euro bonds, lowering equity exposure when market volatility is high and raising it when volatility is low. Aims for a return comparable to a mixed portfolio of 30% international stocks and 70% medium-term euro bonds. Optional rolling guarantee available.' },
  { id:'dm15', color:'#c4b5fd', name:'Allianz Dynamic Multi Asset Strategy SRI 15', shortName:'Dynamic Multi Asset 15',  grossRate:0.046925, extFund:0.0049, gteeCharge:0,      gmab:false, esma:4, isin:'LU3068734238', assets:{eq:0.15, fi:0.85, cash:0}, targetVol:'3–7%', desc:'Invests in a broad range of asset classes, focused on global equities and bonds, under the sustainable and responsible investment (SRI) strategy. Aims for a medium-term return comparable to 15% global stocks and 85% global bonds hedged to euro, with volatility managed within a pre-set range of 3–7% in the medium to long term.' },
  { id:'ss50', color:'#005ec5', name:'Allianz Strategy Select 50',                  shortName:'Strategy Select 50',       grossRate:0.05725,  extFund:0.0025, gteeCharge:0.0075, gmab:true,  esma:4, isin:'LU1462180164', assets:{eq:0.50, fi:0.50, cash:0}, desc:'Invests to a variable extent in international equities and euro bonds, lowering equity exposure when market volatility is high and raising it when volatility is low. Aims for a return comparable to a mixed portfolio of 50% international stocks and 50% medium-term euro bonds. Optional rolling guarantee available.' },
  { id:'ss75', color:'#13a0d3', name:'Allianz Strategy Select 75',                  shortName:'Strategy Select 75',       grossRate:0.064625, extFund:0.0025, gteeCharge:0.0085, gmab:true,  esma:5, isin:'LU1462191526', assets:{eq:0.75, fi:0.25, cash:0}, desc:'Invests to a variable extent in international equities and euro bonds, lowering equity exposure when market volatility is high and raising it when volatility is low. Aims for a return comparable to a mixed portfolio of 75% international stocks and 25% medium-term euro bonds. Optional rolling guarantee available.' },
  { id:'dm50', color:'#9d74e5', name:'Allianz Dynamic Multi Asset Strategy SRI 50', shortName:'Dynamic Multi Asset 50',  grossRate:0.05725,  extFund:0.0059, gteeCharge:0,      gmab:false, esma:4, isin:'LU3068734667', assets:{eq:0.50, fi:0.50, cash:0}, targetVol:'6–12%', desc:'Invests in a broad range of asset classes, focused on global equities and bonds, under the sustainable and responsible investment (SRI) strategy. Aims for a medium-term return comparable to 50% global stocks and 50% global bonds hedged to euro, with volatility managed within a pre-set range of 6–12% in the medium to long term.' },
  { id:'dm75', color:'#7c3aed', name:'Allianz Dynamic Multi Asset Strategy SRI 75', shortName:'Dynamic Multi Asset 75',  grossRate:0.064625, extFund:0.0065, gteeCharge:0,      gmab:false, esma:5, isin:'LU3068734824', assets:{eq:0.75, fi:0.25, cash:0}, targetVol:'10–16%', desc:'Invests in a broad range of asset classes, focused on global equities and bonds, under the sustainable and responsible investment (SRI) strategy. Aims for a medium-term return comparable to 75% global stocks and 25% global bonds hedged to euro, with volatility managed within a pre-set range of 10–16% in the medium to long term.' },
  { id:'bsge', color:'#f59e0b', name:'Allianz Best Styles Global Equity SRI',       shortName:'Best Styles Equity SRI',   grossRate:0.072,    extFund:0.0045, gteeCharge:0,      gmab:false, esma:5, isin:'LU2437558831', assets:{eq:1,    fi:0,    cash:0}, desc:'An actively managed global equity fund following the sustainable and responsible investment (SRI) strategy. It may use differing investment styles, or combinations of them, depending on management\'s view of the market, and up to 30% may be invested in emerging markets. Aims for capital growth over the long term.' },
  { id:'hesc', color:'#ef4444', name:'HSBC EURO STOXX 50 UCITS ETF',                shortName:'HSBC Euro STOXX 50',       grossRate:0.072,    extFund:0.0005, gteeCharge:0,      gmab:false, esma:6, isin:'IE000MWUQBJ0', assets:{eq:1,    fi:0,    cash:0}, desc:'A passively managed ETF that aims to track the EURO STOXX 50 Index as closely as possible. The index is made up of the 50 largest listed companies in the European Monetary Union.' },
  { id:'hmw',  color:'#f97316', name:'HSBC MSCI World UCITS ETF',                   shortName:'HSBC MSCI World',          grossRate:0.072,    extFund:0.0015, gteeCharge:0,      gmab:false, esma:6, isin:'IE000UQND7H4', assets:{eq:1,    fi:0,    cash:0}, desc:'A passively managed ETF that aims to track the MSCI World Index as closely as possible. The index is made up of large and mid-cap companies of the world\'s developed countries. The fund uses an optimisation technique to minimise the difference in return from the index.' },
  { id:'hsp',  color:'#ea580c', name:'HSBC S&P 500 UCITS ETF',                      shortName:'HSBC S&P 500',             grossRate:0.072,    extFund:0.0009, gteeCharge:0,      gmab:false, esma:6, isin:'IE000JZ473P7', assets:{eq:1,    fi:0,    cash:0}, desc:'A passively managed ETF that aims to track the S&P 500 Index as closely as possible. The index is made up of large listed companies in the US.' },
];

var ARF_FUNDS_MAP = {};
ARF_FUNDS.forEach(function(f){ ARF_FUNDS_MAP[f.id] = f; });
