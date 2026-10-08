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
// isin:       fund ISIN — not yet populated, placeholder for the Expense Summary table
var ARF_FUNDS = [
  { id:'cash', color:'#6b7280', name:'Allianz Euro Cash',                            shortName:'Euro Cash',                grossRate:0.032,    extFund:0.0016, gteeCharge:0,      gmab:false, esma:1, isin:'', desc:'A capital-preservation fund investing in short-term euro money market instruments. Aims to preserve capital and provide returns in line with prevailing short-term interest rates.' },
  { id:'afsd', color:'#1a9e5c', name:'Allianz Advanced Fixed Income Short Duration',shortName:'Fixed Income Short Dur.',  grossRate:0.0425,   extFund:0.0022, gteeCharge:0,      gmab:false, esma:2, isin:'', desc:'A fixed income fund investing in short-duration euro bonds and money market instruments. Focuses on capital preservation with a modest income return.' },
  { id:'afie', color:'#059669', name:'Allianz Advanced Fixed Income Euro',          shortName:'Fixed Income Euro',        grossRate:0.0425,   extFund:0.0027, gteeCharge:0,      gmab:false, esma:2, isin:'', desc:'A bond fund investing primarily in euro-denominated investment-grade fixed income securities across a range of maturities.' },
  { id:'ss30', color:'#003781', name:'Allianz Strategy Select 30',                  shortName:'Strategy Select 30',       grossRate:0.05135,  extFund:0.0025, gteeCharge:0.0065, gmab:true,  esma:3, isin:'', desc:'A multi-asset fund investing approximately 30% in global equities and 70% in bonds and cash. Designed for moderate capital growth with lower volatility. Optional rolling guarantee available.' },
  { id:'dm15', color:'#c4b5fd', name:'Allianz Dynamic Multi Asset Strategy SRI 15', shortName:'Dynamic Multi Asset 15',  grossRate:0.046925, extFund:0.0049, gteeCharge:0,      gmab:false, esma:3, isin:'', desc:'A defensively positioned dynamic multi-asset fund with up to 15% in equities, actively managed with an SRI screen. Emphasises capital preservation.' },
  { id:'ss50', color:'#005ec5', name:'Allianz Strategy Select 50',                  shortName:'Strategy Select 50',       grossRate:0.05725,  extFund:0.0025, gteeCharge:0.0075, gmab:true,  esma:4, isin:'', desc:'A balanced multi-asset fund with approximately equal allocations to global equities and fixed income. Aims to deliver medium-term capital growth. Optional rolling guarantee available.' },
  { id:'ss75', color:'#13a0d3', name:'Allianz Strategy Select 75',                  shortName:'Strategy Select 75',       grossRate:0.064625, extFund:0.0025, gteeCharge:0.0085, gmab:true,  esma:4, isin:'', desc:'A growth-oriented multi-asset fund with approximately 75% invested in global equities. Suitable for investors with a medium to long-term investment horizon. Optional rolling guarantee available.' },
  { id:'dm50', color:'#9d74e5', name:'Allianz Dynamic Multi Asset Strategy SRI 50', shortName:'Dynamic Multi Asset 50',  grossRate:0.05725,  extFund:0.0059, gteeCharge:0,      gmab:false, esma:4, isin:'', desc:'A dynamic multi-asset fund with up to 50% in equities, actively managed with an SRI screen. Balances growth potential against downside risk.' },
  { id:'dm75', color:'#7c3aed', name:'Allianz Dynamic Multi Asset Strategy SRI 75', shortName:'Dynamic Multi Asset 75',  grossRate:0.064625, extFund:0.0065, gteeCharge:0,      gmab:false, esma:5, isin:'', desc:'A growth-focused dynamic multi-asset fund with up to 75% in global equities, actively managed with an SRI screen. Targets long-term capital growth.' },
  { id:'bsge', color:'#f59e0b', name:'Allianz Best Styles Global Equity SRI',       shortName:'Best Styles Equity SRI',   grossRate:0.072,    extFund:0.0045, gteeCharge:0,      gmab:false, esma:5, isin:'', desc:'An actively managed global equity fund combining multiple systematic investment styles (value, quality, momentum) with a responsible investment screen.' },
  { id:'hesc', color:'#ef4444', name:'HSBC EURO STOXX 50 UCITS ETF',                shortName:'HSBC Euro STOXX 50',       grossRate:0.072,    extFund:0.0005, gteeCharge:0,      gmab:false, esma:6, isin:'', desc:'A passively managed ETF tracking the Euro STOXX 50 Index, comprising the 50 largest eurozone companies by free-float market capitalisation.' },
  { id:'hmw',  color:'#f97316', name:'HSBC MSCI World UCITS ETF',                   shortName:'HSBC MSCI World',          grossRate:0.072,    extFund:0.0015, gteeCharge:0,      gmab:false, esma:6, isin:'', desc:'A passively managed ETF providing broad exposure to large and mid-cap equities across 23 developed markets globally.' },
  { id:'hsp',  color:'#ea580c', name:'HSBC S&P 500 UCITS ETF',                      shortName:'HSBC S&P 500',             grossRate:0.072,    extFund:0.0009, gteeCharge:0,      gmab:false, esma:6, isin:'', desc:'A passively managed ETF tracking the S&P 500 Index of the 500 largest US-listed companies.' },
];

var ARF_FUNDS_MAP = {};
ARF_FUNDS.forEach(function(f){ ARF_FUNDS_MAP[f.id] = f; });
