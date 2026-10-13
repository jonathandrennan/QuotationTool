// quote_content.js — adviser-facing content for the Portfolio step: strategy cards and the
// strategy, fund and guarantee info popovers. Edit copy here; no component code needs to change.
//
// Source: Allianz Vantage PRSA Intermediary Brochure (Aug 2026; fund data as at 30/06/26) and the
// compliance-reviewed strategy copy supplied for the redesign. Figures that drive calculations are
// deliberately NOT duplicated here, so a popover can never disagree with the numbers used elsewhere:
//   fund SRIs, fund charges, guarantee charges, PRSA fund lists → prsa_data.js
//   suitable risk ratings per strategy                            → STRATEGY_SUITABLE (quote_common.js)

var QT_CONTENT = {

  // ─── Strategy cards (Portfolio step, view 1) ────────────────────────────────
  // dis: one line per PRSA type. diy.subGuarantee is added on a Non-Standard PRSA only.
  strategyCards: {
    diy:          { name: 'Build Your Own Portfolio', sub: 'Select individual funds tailored to your client\'s needs and risk profile.', subGuarantee: 'Optional annual guarantee on eligible funds.' },
    managed:      { name: 'Managed strategies', sub: 'The Default Investment Strategy, Autopilot or Life Cycle: glidepaths that move into lower-risk funds as retirement approaches.' },
    dis:          { name: 'Default Investment Strategy',
                    nonstandard: 'Two-phase glidepath: Lifecycle, then Autopilot for the final 8 years.',
                    standard: 'Dynamic Lifecycle glidepath, moving from Strategy Select 75 towards Strategy Select 30 as retirement nears.' },
    'Autopilot':  { name: 'Autopilot', sub: 'Glidepath with rolling one-year fund guarantee.' },
    'Life Cycle': { name: 'Life Cycle', sub: 'Glidepath reducing equity as retirement approaches.' }
  },

  // ─── Strategy info popovers ─────────────────────────────────────────────────
  // Family copy (desc / approach / sfdr) is shared by its Balanced, Dynamic and Opportunity
  // options; each option adds its own name and risk profile. DIS differs by PRSA type.
  strategies: {
    diy: {
      name: 'Build Your Own Portfolio',
      desc: 'Select from the full Allianz Vantage fund range to build a portfolio tailored to your client\'s specific needs and risk profile. Choose from multi-asset, protected growth, building block and index-tracking funds, with the optional annual guarantee on eligible funds.'
    },
    dis: {
      name: 'Default Investment Strategy',
      riskProfile: 'Medium',
      sfdr: 'Article 8',
      nonstandard: {
        approach: 'Two-phase glidepath (Lifecycle → Autopilot)',
        desc: 'Has two periods based on the time remaining until retirement. The Default Investment Strategy consists of the medium-risk Lifecycle until 8 years before the chosen retirement age, followed by the medium risk AutoPilot until retirement, ensuring a balanced approach.'
      },
      standard: {
        approach: 'Dynamic Lifecycle glidepath',
        desc: 'Combines Allianz Strategy Select 30 and 75 funds, following a medium risk investment strategy called the Dynamic Lifecycle Strategy. It invests more heavily in Select 75 with higher equity content earlier in the Lifecycle, gradually moving to Select 30 as retirement nears.'
      }
    },
    families: {
      ap: {
        approach: 'Glidepath with fund guarantee',
        sfdr: 'Article 8',
        showGuaranteeLevels: true,
        desc: 'Combines the Allianz Strategy Select 30, 50, and 75 funds with fixed income and cash funds, offering a dynamic asset mix throughout the policy. Similar to Lifecycle, equity exposure reduces as retirement nears, but with varying risk levels. Includes rolling one-year guarantees on all Strategy Select funds.'
      },
      lc: {
        approach: 'Glidepath',
        sfdr: 'Article 8',
        desc: 'These strategies begin with a higher equity content earlier in the lifecycle, reducing it as retirement approaches. Designed to optimize returns while mitigating risk as your clients get closer to their retirement goals. Portfolios are consistently reviewed from a risk-return perspective — this approach requires minimal intervention from you or your clients, as all adjustments happen automatically. Driven by data and managed by experienced professionals, offering a stable, emotion-free investment path.'
      }
    },
    ap_ba: { name: 'Autopilot Balanced',     riskProfile: 'Lower–Medium' },
    ap_dy: { name: 'Autopilot Dynamic',      riskProfile: 'Medium' },
    ap_op: { name: 'Autopilot Opportunity',  riskProfile: 'Medium–Higher' },
    lc_ba: { name: 'Life Cycle Balanced',    riskProfile: 'Lower–Medium' },
    lc_dy: { name: 'Life Cycle Dynamic',     riskProfile: 'Medium' },
    lc_op: { name: 'Life Cycle Opportunity', riskProfile: 'Medium–Higher' }
  },

  // ─── Optional Annual Guarantee ──────────────────────────────────────────────
  // protected = share of policy value guaranteed. The extra charge comes from the fund data.
  guarantee: {
    label: 'Optional Annual Guarantee',
    levels: { ss30: { protected: 0.93 }, ss50: { protected: 0.90 }, ss75: { protected: 0.85 } },
    intro: 'A unique feature of the Allianz Vantage product. Applied individually within each policy, not within the fund itself.',
    marketsDown: 'If the policy value is below the protected percentage at a policy anniversary, additional units are added to bring it back up to that level.',
    marketsUp: 'The protected amount is reset each year, based on the policy value at the policy anniversary.',
    vsCppi: [
      'No cash lock risk — maintains return potential',
      'Applied at policy level, not fund level',
      'Asset allocation independent of guarantee'
    ],
    deathBenefit: 'When active, the death benefit is the maximum of guaranteed value or policy value.',
    // Brochure p.21 — conditions that matter when advising on the guarantee
    whileActive: [
      'Any surrender or transfer out is not guaranteed, unless taken exactly at the policy anniversary',
      'Switches out of a guaranteed fund must be 100% of the amount invested in that fund — no partial switches',
      'A top-up or regular contribution has the guarantee applied immediately and is consolidated at the policy anniversary'
    ]
  },

  // ─── What the 1–7 ratings mean (Step 3 info dialog) ─────────────────────────
  // Regulatory wording is quoted from Commission Delegated Regulation (EU) 2017/653 (the PRIIPs KID RTS):
  // `explain` is Annex III point 7 Element A; riskClass / losses / market fill Element B and its example
  // explanation; vev is the Annex II Part 1 point 2 market-risk band. Annex III gives no "poor market
  // conditions" wording for class 7, so none is shown for it. The rest is our own explanatory copy (DRAFT).
  riskScale: {
    explain: 'The ESMA risk rating is a guide to the level of risk of this product compared to other products. It shows how likely it is that the product will lose money because of movements in the markets or because we are not able to pay you.',
    howUsed: 'Every fund in the Allianz Vantage range has a published ESMA risk rating on this 1 to 7 scale, shown in its Key Information Document. The client\'s risk rating is recorded on the same scale, so it can be compared directly with the funds and with the indicative risk of the portfolio you build.',
    howSet: 'The ESMA risk rating combines a market risk class, set by the fund\'s volatility over the recommended holding period, with a credit risk class. The market risk class bands are shown below. Even the lowest class, 1, does not mean a risk-free investment.',
    levels: [
      null,
      { riskClass: 'the lowest',         losses: 'very low',    market: 'are very unlikely to', vev: 'Below 0.5%' },
      { riskClass: 'a low',              losses: 'low',         market: 'are very unlikely to', vev: '0.5% to 5%' },
      { riskClass: 'a medium-low',       losses: 'medium-low',  market: 'are unlikely to',      vev: '5% to 12%' },
      { riskClass: 'a medium',           losses: 'medium',      market: 'could',                vev: '12% to 20%' },
      { riskClass: 'a medium-high',      losses: 'medium-high', market: 'will likely',          vev: '20% to 30%' },
      { riskClass: 'the second-highest', losses: 'high',        market: 'are very likely to',   vev: '30% to 80%' },
      { riskClass: 'the highest',        losses: 'very high',   market: null,                   vev: 'Above 80%' }
    ],
    source: 'Source: Commission Delegated Regulation (EU) 2017/653 (PRIIPs key information documents), Annex II Part 1 and Annex III. Volatility is the VaR-equivalent volatility used to set the market risk class.'
  },

  // ─── Fund info popovers (brochure pp.31–38) ──────────────────────────────────
  // availability: 'all' (every PRSA) or 'nonstandard' (greyed out on a Standard PRSA — brochure p.31).
  // sfdr: 6 or 8 (SFDR article). volatility: pre-set volatility range — DMAS funds only (brochure pp.32–33);
  // the brochure gives no target range for Strategy Select, so none is shown.
  // opportunities / risks: brochure wording; the three HSBC ETFs have none in the brochure.
  // note: sub-line in the fund builder where a fund has no volatility range.
  // desc: plain-English summary of the brochure's fund objective, shown in the popover and the pack.
  funds: {
    ss75: {
      category: 'Protected Growth — Actively Managed', sfdr: 8, availability: 'all',
      desc: 'Invests in international equities and euro bonds, aiming for a return comparable to a mix of 75% international stocks and 25% medium-term euro bonds. A quantitative approach lowers the equity holding when markets are volatile and raises it when they are calmer.',
      opportunities: ['High return potential of stocks in the long run', 'Steady interest income on bonds, capital gains opportunities on declining interest rates', 'Broad diversification across numerous securities'],
      risks: ['High volatility of stocks, losses possible. The fund unit price may be subject to increased volatility', 'Interest rates vary, bonds suffer price declines on rising interest rates', 'Limited participation in the yield potential of single securities']
    },
    ss50: {
      category: 'Protected Growth — Actively Managed', sfdr: 8, availability: 'all',
      desc: 'Invests in international equities and euro bonds, aiming for a return comparable to a mix of 50% international stocks and 50% medium-term euro bonds. A quantitative approach lowers the equity holding when markets are volatile and raises it when they are calmer.',
      opportunities: ['Steady interest income on bonds, capital gains opportunities on declining interest rates', 'High return potential of stocks in the long run', 'Broad diversification across numerous securities'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates. The fund unit price may be subject to increased volatility', 'High volatility of stocks, losses possible', 'Limited participation in the yield potential of single securities']
    },
    ss30: {
      category: 'Protected Growth — Actively Managed', sfdr: 8, availability: 'all',
      desc: 'Invests in international equities and euro bonds, aiming for a return comparable to a mix of 30% international stocks and 70% medium-term euro bonds. A quantitative approach lowers the equity holding when markets are volatile and raises it when they are calmer.',
      opportunities: ['Steady interest income on bonds, capital gains opportunities on declining interest rates', 'High return potential of stocks in the long run', 'Broad diversification across numerous securities'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates. The fund unit price may be subject to increased volatility', 'High volatility of stocks, losses possible', 'Limited participation in the yield potential of single securities']
    },
    dm75: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '10–16%', sfdr: 8, availability: 'nonstandard',
      desc: 'Invests across a broad range of asset classes, mainly global equities and bonds, under a sustainable and responsible investment (SRI) strategy that takes environmental, social and governance criteria into account. Aims for a medium-term return comparable to a mix of 75% global stocks and 25% euro-hedged global bonds, with volatility managed within a pre-set range of 10–16%.',
      opportunities: ['Above-average yield potential of stocks over the long term', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of emerging markets assets and high-yield bonds', 'Comparably high stability of bonds with good credit quality', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['The volatility of fund unit prices may be increased', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations and losses with stocks, emerging markets assets, and high-yield bonds', 'Limited yield potential of bonds with good credit quality', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    dm50: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '6–12%', sfdr: 8, availability: 'nonstandard',
      desc: 'Invests across a broad range of asset classes, mainly global equities and bonds, under a sustainable and responsible investment (SRI) strategy that takes environmental, social and governance criteria into account. Aims for a medium-term return comparable to a mix of 50% global stocks and 50% euro-hedged global bonds, with volatility managed within a pre-set range of 6–12%.',
      opportunities: ['Above-average yield potential of stocks over the long term', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of emerging markets assets and high-yield bonds', 'Comparably high stability of bonds with good credit quality', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['The volatility of fund unit prices may be increased', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations and losses with stocks, emerging markets assets, and high-yield bonds', 'Limited yield potential of bonds with good credit quality', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    dm15: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '3–7%', sfdr: 8, availability: 'nonstandard',
      desc: 'Invests across a broad range of asset classes, mainly global bonds and equities, under a sustainable and responsible investment (SRI) strategy that takes environmental, social and governance criteria into account. Aims for a medium-term return comparable to a mix of 15% global stocks and 85% euro-hedged global bonds, with volatility managed within a pre-set range of 3–7%.',
      opportunities: ['Comparably high stability of bonds with good credit quality', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of stocks, emerging markets assets, and high-yield bonds', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['Limited yield potential of bonds with good credit quality', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations through addition of stocks, emerging markets assets, and high-yield bonds', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    bsri: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'nonstandard', note: 'Global equities, up to 30% emerging markets',
      desc: 'Invests in global equities under a sustainable and responsible investment (SRI) strategy, aiming for capital growth over the long term. The manager may use different investment styles, or a combination of them, depending on market conditions. Up to 30% may be invested in emerging markets.',
      opportunities: ['High return potential of stocks in the long run', 'Investments specifically in the global equity markets and issuers with sustainable practices (SRI)', 'Particular opportunities through the "Best Styles" approach', 'Broad diversification across numerous securities', 'Possible extra returns through single security analysis and active management'],
      risks: ['High volatility of stocks, losses possible. The volatility of fund unit prices may be strongly increased', 'Underperformance of the global equity markets and from issuers with sustainable practices (SRI) possible', 'Underperformance of the "Best Styles" approach possible at times', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed']
    },
    afie: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'nonstandard', note: 'Euro bonds',
      desc: 'Invests mainly in bonds, aiming for an above-average long-term return compared with the eurozone government bond market, and promotes environmental, social and governance criteria. Up to 20% may be held in high-yield bonds and up to 20% in asset- or mortgage-backed securities; emerging market bonds may also be held. Foreign currency exposure above 20% of the fund is hedged to euro.',
      opportunities: ['Interest income on bonds, capital gains opportunities on declining interest rates', 'Additional return potential of bonds from non-governmental issuers', 'Broad diversification across numerous securities', 'Focus on sustainable investments', 'Possible extra returns through single security analysis and active management', 'Hedging of most foreign-currency exposure'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates', 'Bonds from non-governmental issuers entail higher risk of volatility and capital loss than public bonds', 'Sustainability approach narrows the investment universe', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed', 'Limited currency influence possible']
    },
    afisd: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'all', note: 'Short-duration European bonds',
      desc: 'Invests mainly in bonds, aiming for an above-average long-term return compared with the European short-duration bond market, and promotes environmental, social and governance criteria. Up to 25% may be held in high-yield bonds (rated B- to BB+), up to 20% in emerging market bonds and up to 20% in investment-grade asset- or mortgage-backed securities. Foreign currency exposure above 10% of the fund is hedged to euro.',
      opportunities: ['Interest income on bonds, capital gains opportunities on declining interest rates', 'Particular price stability of short-term bonds', 'Above-average yield potential of corporate, emerging market, and collateralized bonds', 'Focus on sustainable investments', 'Broad diversification across numerous securities', 'Potential additional returns from single security analysis and active management'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates', 'Relatively low return potential of short-term bonds', 'Addition of corporate, emerging market, and collateralized bonds increases risk of volatility', 'Sustainability approach narrows the investment universe', 'Limited participation in the potential of individual securities', 'Success of single security analysis and active management not guaranteed']
    },
    cash: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'all', note: 'Money market',
      desc: 'Aims for a money market return in line with the market, while protecting capital, keeping its value stable and staying easy to sell. Invests in assets with environmental or social characteristics, under the sustainable and responsible investment (SRI) strategy.',
      opportunities: ['Money market-related yields', 'Relatively high degree of price stability', 'Above-average yield potential of non-governmental bonds', 'Sustainability aspects are taken into account by the fund management', 'Broad diversification across numerous securities', 'Possible extra returns through single security analysis and active management'],
      risks: ['Money market rates vary', 'Price declines cannot be ruled out', 'Above-average price fluctuations of non-governmental bonds', 'Sustainability approach narrows the investment universe', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed']
    },
    etfw: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all', note: 'Tracks the MSCI World Index',
      desc: 'A passively managed ETF that aims to track the MSCI World Index as closely as possible. The index is made up of large and mid-sized companies in the world\'s developed markets. The fund uses optimisation, which allows for tracking error and trading costs, to keep its return close to the index.'
    },
    etfs: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all', note: 'Tracks the S&P 500 Index',
      desc: 'A passively managed ETF that aims to track the S&P 500 Index as closely as possible, holding the shares of the companies in the index in broadly the same proportions. The index is made up of large listed US companies.'
    },
    etfe: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all', note: 'Tracks the EURO STOXX 50 Index',
      desc: 'A passively managed ETF that aims to track the EURO STOXX 50 Index as closely as possible, holding the shares of the companies in the index in broadly the same proportions. The index is made up of the 50 largest listed companies in the eurozone.'
    }
  }
};

// Brochure content for a fund. ARF / Investment Bond funds use their own ids for the same
// funds, so they are mapped to the PRSA entries above.
var QT_FUND_ALIAS = { afsd: 'afisd', bsge: 'bsri', hesc: 'etfe', hmw: 'etfw', hsp: 'etfs' };
function qtFundInfo(id) { return QT_CONTENT.funds[QT_FUND_ALIAS[id] || id] || null; }

// Share of a fund mix ([{ fund, weight }]) by SFDR article: { art8, art6, unknown }, as fractions.
function qtSfdrSplit(mix) {
  var out = { art8: 0, art6: 0, unknown: 0 }, tot = 0;
  (mix || []).forEach(function(m) { tot += m.weight; });
  (mix || []).forEach(function(m) {
    var a = (qtFundInfo(m.fund.id) || {}).sfdr, w = tot ? m.weight / tot : 0;
    if (a === 8) out.art8 += w; else if (a === 6) out.art6 += w; else out.unknown += w;
  });
  return out;
}
