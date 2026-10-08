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
  strategyCards: {
    diy:          { name: 'Build Your Own Portfolio', sub: 'Select individual funds tailored to your client\'s needs and risk profile' },
    dis:          { name: 'Default Investment Strategy', sub: '' },
    'Autopilot':  { name: 'Autopilot', sub: 'Glidepath with fund guarantee' },
    'Life Cycle': { name: 'Life Cycle', sub: 'Glidepath' }
  },

  // ─── Strategy info popovers ─────────────────────────────────────────────────
  // Family copy (desc / approach / sfdr) is shared by its Balanced, Dynamic and Opportunity
  // options; each option adds its own name and risk profile. DIS differs by PRSA type.
  strategies: {
    diy: {
      name: 'Build Your Own Portfolio',
      desc: 'Select from the full Allianz Vantage fund range to build a portfolio tailored to your client\'s specific needs and risk profile. Choose from fixed income, multi-asset, and equity funds with optional annual guarantee protection on eligible funds.'
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

  // ─── Fund info popovers (brochure pp.31–38) ──────────────────────────────────
  // availability: 'all' (every PRSA) or 'nonstandard' (greyed out on a Standard PRSA — brochure p.31).
  // sfdr: 6 or 8 (SFDR article). volatility: target range, where the fund has one.
  // opportunities / risks: brochure wording; the three HSBC ETFs have none in the brochure.
  funds: {
    ss75: {
      category: 'Protected Growth — Actively Managed', volatility: '10–16%', sfdr: 8, availability: 'all',
      desc: 'Invests to a variable extent in international equity markets and euro bonds. Applies a quantitative approach — lowering stock investment in phases of high market volatility and raising it in phases of low volatility. Targets a return comparable to 75% international stocks and 25% medium-term EUR bonds.',
      opportunities: ['High return potential of stocks in the long run', 'Steady interest income on bonds, capital gains opportunities on declining interest rates', 'Broad diversification across numerous securities'],
      risks: ['High volatility of stocks, losses possible. The fund unit price may be subject to increased volatility', 'Interest rates vary, bonds suffer price declines on rising interest rates', 'Limited participation in the yield potential of single securities']
    },
    ss50: {
      category: 'Protected Growth — Actively Managed', volatility: '6–12%', sfdr: 8, availability: 'all',
      desc: 'Targets a return comparable to 50% international stocks and 50% medium-term EUR bonds. Same quantitative approach adjusting equity exposure based on volatility.',
      opportunities: ['Steady interest income on bonds, capital gains opportunities on declining interest rates', 'High return potential of stocks in the long run', 'Broad diversification across numerous securities'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates. The fund unit price may be subject to increased volatility', 'High volatility of stocks, losses possible', 'Limited participation in the yield potential of single securities']
    },
    ss30: {
      category: 'Protected Growth — Actively Managed', volatility: '3–8%', sfdr: 8, availability: 'all',
      desc: 'Targets a return comparable to 30% international stocks and 70% medium-term EUR bonds. Same quantitative approach adjusting equity exposure based on volatility.',
      opportunities: ['Steady interest income on bonds, capital gains opportunities on declining interest rates', 'High return potential of stocks in the long run', 'Broad diversification across numerous securities'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates. The fund unit price may be subject to increased volatility', 'High volatility of stocks, losses possible', 'Limited participation in the yield potential of single securities']
    },
    dm75: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '10–16%', sfdr: 8, availability: 'nonstandard',
      desc: 'Invests in a broad range of asset classes with a particular focus on global equities and bonds. Targets a return comparable to 75% global stocks and 25% global bonds hedged to Euro. Integrated risk and volatility management limits volatility to 10–16%. Pursues a Sustainable and Responsible Investment strategy.',
      opportunities: ['Above-average yield potential of stocks over the long term', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of emerging markets assets and high-yield bonds', 'Comparably high stability of bonds with good credit quality', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['The volatility of fund unit prices may be increased', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations and losses with stocks, emerging markets assets, and high-yield bonds', 'Limited yield potential of bonds with good credit quality', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    dm50: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '6–12%', sfdr: 8, availability: 'nonstandard',
      desc: 'Targets a return comparable to 50% global stocks and 50% global bonds hedged to Euro. Volatility managed to 6–12%. Pursues an SRI strategy.',
      opportunities: ['Above-average yield potential of stocks over the long term', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of emerging markets assets and high-yield bonds', 'Comparably high stability of bonds with good credit quality', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['The volatility of fund unit prices may be increased', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations and losses with stocks, emerging markets assets, and high-yield bonds', 'Limited yield potential of bonds with good credit quality', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    dm15: {
      category: 'Multi-Asset Solutions — Actively Managed', volatility: '3–7%', sfdr: 8, availability: 'nonstandard',
      desc: 'Targets a return comparable to 15% global stocks and 85% global bonds hedged to Euro. Volatility managed to 3–7%. Pursues an SRI strategy.',
      opportunities: ['Comparably high stability of bonds with good credit quality', 'Focus on companies and institutions striving for sustainability', 'Enhanced return potential through addition of stocks, emerging markets assets, and high-yield bonds', 'Risk and stability management using volatility bandwidths and the value-at-risk method', 'Currency gains against investor currency possible'],
      risks: ['Limited yield potential of bonds with good credit quality', 'Sustainability approach narrows the universe to eligible issuers', 'Increased risk of price fluctuations through addition of stocks, emerging markets assets, and high-yield bonds', 'Risk and volatility management do not exclude potential losses', 'Currency losses against investor currency possible']
    },
    bsri: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'nonstandard',
      desc: 'Concentrates on global equity markets using an SRI strategy. Up to 30% in Emerging Markets. Objective is capital growth over the long term using differing investment styles based on market assessment.',
      opportunities: ['High return potential of stocks in the long run', 'Investments specifically in the global equity markets and issuers with sustainable practices (SRI)', 'Particular opportunities through the "Best Styles" approach', 'Broad diversification across numerous securities', 'Possible extra returns through single security analysis and active management'],
      risks: ['High volatility of stocks, losses possible. The volatility of fund unit prices may be strongly increased', 'Underperformance of the global equity markets and from issuers with sustainable practices (SRI) possible', 'Underperformance of the "Best Styles" approach possible at times', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed']
    },
    afie: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'nonstandard',
      desc: 'Invests in interest-bearing securities targeting above-average long-term return vs. government bond market in eurozone. Up to 20% in high-yield bonds. Up to 20% ABS/MBS.',
      opportunities: ['Interest income on bonds, capital gains opportunities on declining interest rates', 'Additional return potential of bonds from non-governmental issuers', 'Broad diversification across numerous securities', 'Focus on sustainable investments', 'Possible extra returns through single security analysis and active management', 'Hedging of most foreign-currency exposure'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates', 'Bonds from non-governmental issuers entail higher risk of volatility and capital loss than public bonds', 'Sustainability approach narrows the investment universe', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed', 'Limited currency influence possible']
    },
    afisd: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'all',
      desc: 'Invests in interest-bearing securities targeting above-average long-term return vs. European short duration bond market. Up to 25% in high-yield bonds. Up to 20% emerging market bonds.',
      opportunities: ['Interest income on bonds, capital gains opportunities on declining interest rates', 'Particular price stability of short-term bonds', 'Above-average yield potential of corporate, emerging market, and collateralized bonds', 'Focus on sustainable investments', 'Broad diversification across numerous securities', 'Potential additional returns from single security analysis and active management'],
      risks: ['Interest rates vary, bonds suffer price declines on rising interest rates', 'Relatively low return potential of short-term bonds', 'Addition of corporate, emerging market, and collateralized bonds increases risk of volatility', 'Sustainability approach narrows the investment universe', 'Limited participation in the potential of individual securities', 'Success of single security analysis and active management not guaranteed']
    },
    cash: {
      category: 'Complementary Building Blocks — Actively Managed', sfdr: 8, availability: 'all',
      desc: 'Targets money market-related return with capital security, value stability and liquidity. Invests in assets with ecological or social characteristics in line with SRI strategy.',
      opportunities: ['Money market-related yields', 'Relatively high degree of price stability', 'Above-average yield potential of non-governmental bonds', 'Sustainability aspects are taken into account by the fund management', 'Broad diversification across numerous securities', 'Possible extra returns through single security analysis and active management'],
      risks: ['Money market rates vary', 'Price declines cannot be ruled out', 'Above-average price fluctuations of non-governmental bonds', 'Sustainability approach narrows the investment universe', 'Limited participation in the yield potential of single securities', 'Success of single security analysis and active management not guaranteed']
    },
    etfw: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all',
      desc: 'Tracks MSCI World Index — large and mid-cap companies from world\'s developed countries. Passively managed using optimisation technique to minimise tracking error.'
    },
    etfs: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all',
      desc: 'Tracks S&P 500 Index — large-sized US listed companies. Passively managed, invests in same proportion as the index.'
    },
    etfe: {
      category: 'Index-Tracking — Passively Managed', sfdr: 6, availability: 'all',
      desc: 'Tracks EURO STOXX 50 Index — 50 largest listed companies in the European Monetary Union. Passively managed.'
    }
  }
};
