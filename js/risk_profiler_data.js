// risk_profiler_data.js — questionnaire, scores, limits, flags and wording for the Risk Profiler.
//
// Part of the self-contained Risk Profiler module (risk_profiler_data.js, risk_profiler.js,
// risk_profiler_ui.js). Nothing here depends on the Quotation Tool, so the module can be reused
// on a website.
//
// Source: docs/risk-profiler-design-draft.md ("Risk profiler – proposed questions and scoring", draft for
// Compliance review, 22/10/2026). The questions, answers, scores, limits and flags are the draft's. Every
// cut-off is a proposal: change the numbers only with Compliance. "num" is the question's number in the draft.
//
// What each option's number means depends on the question:
//   points  (Q1, Q2)  capacity for loss points, added together
//   cap     (Q3)      the highest rating allowed for a band of years (null = no limit)
//   rating  (Q4–Q6)   an attitude rating from 1 to 6
//   level   (Q7)      the knowledge level stated
// "phrase" is the wording used in the Statement of Suitability, addressed to the client. All wording is
// DRAFT and needs Compliance sign-off.

var RP_CONFIG = {
  version: '4.0 (draft 22/10/2026)',
  name: 'Allianz Global Life Risk Profiler',

  // ─── Part E (sustainability preferences, S1–S4) is left out for now. Set to true to ask it again. ──
  sustainability: false,

  // ─── Result: the risk rating on the ESMA scale. The profiler gives 1 to 6: level 7 is not offered. ──
  maxRating: 6,
  sriLabels: ['', 'Very Low', 'Low', 'Low to Medium', 'Medium', 'Medium to High', 'High', 'Very High'],
  sriColors: ['', '#1a9e5c', '#4ab566', '#a0c840', '#f5c400', '#f5820a', '#e03333', '#990000'],

  // ─── Capacity for loss = Q1 + Q2 points: Low (2–3), Medium (4), High (5–6). Low limits the rating to 4. ──
  capacity: { medium: 4, high: 5, lowCap: 4 },
  // ─── Attitude rating = the middle value of the Q4, Q5 and Q6 ratings, no more than `aboveLoss` above Q4 ──
  attitude: { aboveLoss: 1 },
  levels: {
    capacity:  { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' },
    knowledge: {
      LOW:    { label: 'Low',    desc: 'little or no knowledge or experience of investments' },
      MEDIUM: { label: 'Medium', desc: 'some knowledge and recent experience of investments' },
      HIGH:   { label: 'High',   desc: 'good knowledge and regular experience of investments' }
    },
    order: ['LOW', 'MEDIUM', 'HIGH']
  },

  // ─── Checks and flags (draft section 3). They do not block the client or change the rating. ──
  // {tokens} are filled from the result. F6 compares the answers with those held when the result was first shown.
  flags: {
    mixedSpread: 3,          // F1: the Q4, Q5 and Q6 ratings are this many levels apart, or more
    knowledgeRating: 5,      // F2: rating at or above this with knowledge Low
    horizonYears: 3,         // F4: horizon under this many years (also raised when the time limit lowers the rating)
    age: 65, ageRating: 5,   // F5: aged this or over with a rating at or above ageRating
    text: {
      F1: { title: 'Mixed attitude', text: 'The client\'s answers point to very different risk levels (largest fall {loss}, reaction {reaction}, objective {objective}). Talk through with them how much risk they really want to take.' },
      F2: { title: 'Low knowledge, high rating', text: 'The rating is {sri}, but the client\'s knowledge and experience is low. Check that they understand how the funds you recommend can rise and fall in value, and that the rating still suits them.' },
      F3: { title: 'Rating limited by capacity for loss', text: 'Capacity for loss is low, so the rating is capped at {capacityCap}. Their attitude alone gave {attitude}.' },
      F4: { title: 'Short horizon', text: 'Plans to hold for {horizon}. {horizonEffect}' },
      F5: { title: 'Age', text: 'Rating {sri} at age {age}. Check it suits their circumstances.' },
      F6: { title: 'Changed answers', text: 'Answers were changed after the result was shown: {changed}.' }
    },
    horizonLowered: 'The rating is capped at {timeCap}. Their attitude alone gave {attitude}.',
    horizonShort: 'A horizon under 3 years is short for investing. Higher-risk funds need time to recover from falls, so check that the funds you recommend suit it.'
  },

  // ─── "Important information": shown first. The client must accept it before the questions. DRAFT wording. ──
  disclaimer: {
    title: 'Important information',
    paragraphs: [
      'The Risk Profiler is a guide. It helps you and your adviser talk about how much risk you are comfortable with before you invest. It does not recommend a product or a fund.',
      'The questions cover only some of the things that matter when choosing an investment. Before anything is recommended, your adviser will go through your wider situation and needs with you.'
    ],
    confirmLead: 'By choosing "I accept", you confirm that:',
    points: [
      'you have not been given investment advice by Allianz through this tool; and',
      'you understand that the Risk Profiler supports, but does not replace, the advice of your financial adviser.'
    ],
    accept: 'I accept',
    decline: 'I do not accept',
    declinedTitle: 'You have not accepted',
    declinedText: 'The Risk Profiler cannot be used unless you accept the important information. Please talk to your adviser, who can explain it and help you decide how to go on.',
    back: '← Go back'
  },

  // ─── Sections and questions ─────────────────────────────────────────────────────────
  // "short" is the label in the questionnaire's step strip. The introduction is shown before Q1.
  introTitle: 'Before you begin',
  intro: 'These questions help your adviser recommend investments that suit you. They take about 5 minutes.\nWe will ask about:\n- Your finances, and how long you plan to invest\n- How you feel about risk, and what you would do if your investment fell in value\n- Your knowledge and experience of investing\nPlease answer as honestly and fully as you can. If your answers are not accurate and complete, we cannot recommend an investment.\nYour answers give a risk rating from 1 (very low risk) to 6 (high risk). Your adviser will go through it with you. Your adviser will review your risk profile with you at least once a year, and sooner if your circumstances change. If they do, tell your adviser.',
  sections: [
    { id: 'finances',       title: 'Your finances',                  short: 'Finances',         lead: 'How well you could cope if this investment fell in value.' },
    { id: 'timing',         title: 'Your timing',                    short: 'Timing',           lead: 'How long you plan to invest for.' },
    { id: 'attitude',       title: 'Your attitude to risk',          short: 'Attitude to risk', lead: 'How you would feel and act if the value of your investment fell, and what you want from it.' },
    { id: 'knowledge',      title: 'Your knowledge and experience',  short: 'Knowledge',        lead: 'What you have done and what you know about investing.' },
    { id: 'about',          title: 'About you',                      short: 'About you',        lead: 'Your date of birth.' },
    { id: 'sustainability', title: 'Your sustainability preferences', short: 'Sustainability',  lead: 'These questions do not change your risk rating. They are used only to choose among the funds that suit it.', afterRating: true }
  ],

  // type: 'single' | 'slider' | 'rank' | 'multi' | 'shares' | 'date'. "cols" is a layout hint (1 or 2 options per row).
  // when: the question is asked only if { q, is } (that answer) or { q, any } (any of those ticked) holds.
  // scored: the answers that make up the rating and knowledge level (checked for changes, flag F6).
  questions: [
    // Part A – Your finances
    { id: 'cushion', num: '1', section: 'finances', type: 'single', cols: 1, scored: true, short: 'Financial cushion',
      text: 'If your income stopped, how long could you cover your normal spending from savings?',
      help: 'Include loan or mortgage repayments and family support. Leave out pensions and this investment.',
      options: [
        { id: '12plus', label: '12 months or more', points: 3, phrase: 'If your income stopped, you could cover your normal spending for 12 months or more from savings you can get at easily.' },
        { id: '3to11',  label: '3 to 11 months', points: 2, phrase: 'If your income stopped, you could cover your normal spending for 3 to 11 months from savings you can get at easily.' },
        { id: 'under3', label: 'Less than 3 months', points: 1, phrase: 'If your income stopped, you could cover your normal spending for less than 3 months from savings you can get at easily.' }
      ] },
    { id: 'impact', num: '2', section: 'finances', type: 'single', cols: 1, scored: true, short: 'Impact of a loss',
      text: 'If this investment lost a large part of its value, what impact would this have on your finances?',
      options: [
        { id: 'big',    label: 'A big impact: I would struggle to meet my living costs or commitments', points: 1, phrase: 'If this investment lost a large part of its value, it would have a big impact on your finances: you would struggle to meet your living costs or commitments.' },
        { id: 'some',   label: 'Some impact: I would need to make adjustments to my plans, but I could manage', points: 2, phrase: 'If this investment lost a large part of its value, you would need to make adjustments to your plans, but you could manage.' },
        { id: 'little', label: 'Little or no impact: I have other savings and income to rely on', points: 3, phrase: 'If this investment lost a large part of its value, it would have little or no impact on your finances, as you have other savings and income to rely on.' }
      ] },

    // Part B – Your timing
    // A slider in whole years, starting with no value. A value takes the band it reaches: under 3 years allows no more
    // than 3, 3 to under 7 years no more than 5, 7 years or more no limit. The top mark means "or more".
    { id: 'horizon', num: '3', section: 'timing', type: 'slider', unit: 'years', scored: true, short: 'Investment horizon',
      text: 'How long do you plan to hold this investment?',
      help: 'Move the slider to the number of years.',
      min: 0, max: 12, step: 1, marks: [0, 3, 6, 9, 12], minLabel: 'Less than 1 year', maxLabel: '12 years or more',
      bands: [
        { from: 0, cap: 3,    shown: 'Under 3 years' },
        { from: 3, cap: 5,    shown: '3 to under 7 years' },
        { from: 7, cap: null, shown: '7 years or more' }
      ] },

    // Part C – Your attitude to risk
    // A slider from "No fall" to "40% or more" in 0.5% steps, starting with no value. The € amount is shown as it
    // moves. A value between two marks scores the lower band: the band is the last one whose `from` it reaches.
    { id: 'loss', num: '4', section: 'attitude', type: 'slider', scored: true, short: 'Largest fall you could accept',
      text: 'If you invested €10,000 today and its value fell over the next 12 months, what is the maximum drop you would be willing to accept before considering a change to your investment?',
      help: 'Move the slider to the largest fall you could accept.',
      min: 0, max: 40, step: 0.5, marks: [0, 10, 20, 30, 40], amount: 10000, minLabel: 'No fall', maxLabel: '40% or more',
      bands: [
        { from: 0,   rating: 1, shown: 'No fall, or under €250' },
        { from: 2.5, rating: 2, shown: 'About €250 to €700' },
        { from: 7,   rating: 3, shown: 'About €700 to €1,500' },
        { from: 15,  rating: 4, shown: 'About €1,500 to €2,500' },
        { from: 25,  rating: 5, shown: 'About €2,500 to €4,000' },
        { from: 40,  rating: 6, shown: 'About €4,000 or more' }
      ] },
    { id: 'reaction', num: '5', section: 'attitude', type: 'single', cols: 1, scored: true, short: 'Reaction to a fall',
      text: 'Six months after you invest €10,000, markets fall and your investment is worth €8,000. What would you most likely do?',
      options: [
        { id: 'sellall',  label: 'Sell everything', rating: 2, phrase: 'sell everything' },
        { id: 'sellpart', label: 'Sell part, to limit further losses', rating: 3, phrase: 'sell part of it, to limit further losses' },
        { id: 'wait',     label: 'Keep it and wait for a recovery', rating: 5, phrase: 'keep it and wait for a recovery' },
        { id: 'investmore', label: 'Keep it and invest more', rating: 6, phrase: 'keep it and invest more' }
      ] },
    { id: 'objective', num: '6', section: 'attitude', type: 'single', cols: 1, scored: true, short: 'Objective',
      text: 'What is your investment objective?',
      options: [
        { id: 'safe',     label: 'To keep my money safe: I want to get back at least what I put in', rating: 1, phrase: 'to keep your money safe and get back at least what you put in' },
        { id: 'deposit',  label: 'A return a little better than a deposit account, with very little risk', rating: 2, phrase: 'a return a little better than a deposit account, with very little risk' },
        { id: 'inflation', label: 'Growth a little above inflation, accepting small rises and falls in value', rating: 3, phrase: 'growth a little above inflation, accepting small rises and falls in value' },
        { id: 'steady',   label: 'Steady growth over the long term, accepting that the value will go up and down', rating: 4, phrase: 'steady growth over the long term, accepting that the value will go up and down' },
        { id: 'strong',   label: 'Strong growth over the long term, accepting large rises and falls in value', rating: 5, phrase: 'strong growth over the long term, accepting large rises and falls in value' },
        { id: 'highest',  label: 'The highest return possible, accepting a high level of risk to get it', rating: 6, phrase: 'the highest return possible, accepting a high level of risk to get it' }
      ] },

    // Part D – Your knowledge and experience
    { id: 'experience', num: '7', section: 'knowledge', type: 'single', cols: 1, scored: true, short: 'Knowledge and experience',
      text: 'Which statement best describes your investment knowledge and experience?',
      options: [
        { id: 'none',     label: 'I have not invested before, other than in deposits or savings accounts', level: 'LOW' },
        { id: 'passive',  label: 'I have a pension or an investment, but I have not followed how its value changes or what it invests in', level: 'LOW' },
        { id: 'recent',   label: 'In the last 5 years I have held funds, shares or bonds. I have seen their value fall as well as rise, and I know that spreading money across many investments reduces risk but does not remove it', level: 'MEDIUM' },
        { id: 'regular',  label: 'I invest regularly in a range of funds, shares or bonds, and I understand how risk, return, time horizon and charges affect them', level: 'HIGH' },
        { id: 'professional', label: 'I work or have worked in investments or financial services, or hold a finance qualification, and I invest regularly', level: 'HIGH' }
      ] },
    // Four items put in order, shown first in `start` order (no item in its right place), with an "I don't know"
    // box. Right only if all four are in order. The right order and why are shown with the result.
    { id: 'check', num: '8', section: 'knowledge', type: 'rank', scored: true, short: 'Knowledge check',
      text: 'Put these four investments in order, from the one with the lowest risk of losing money to the one with the highest.',
      help: 'Drag the investments into order, or use the arrows. Lowest risk at the top.',
      items: [
        { id: 'deposit', label: 'A savings deposit' },
        { id: 'govbonds', label: 'Government bonds' },
        { id: 'fund', label: 'A fund holding shares in many different companies' },
        { id: 'share', label: 'Shares in a single company' }
      ],
      start: ['fund', 'share', 'deposit', 'govbonds'],
      dontKnow: 'I don\'t know',
      why: 'A savings deposit has the lowest risk of losing money. Government bonds can fall in value, but usually by less than shares. A fund holding shares in many companies spreads your money, so a problem at one company matters less. Shares in a single company carry the most risk: their value depends on one business, and you could lose most or all of it.' },

    // About you (not asked when the host already holds the date of birth)
    { id: 'dob', num: '', section: 'about', type: 'date', short: 'Date of birth', text: 'What is your date of birth?' },

    // Part E – Your sustainability preferences (not scored, asked after the risk rating)
    { id: 's1', num: 'S1', section: 'sustainability', type: 'single', cols: 2, short: 'Sustainability preferences',
      text: 'Some investments aim to support environmental or social goals, or to limit harm to them. Would you like your investment to include any of these?',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no',  label: 'No, or I have no preference' }
      ] },
    { id: 's2', num: 'S2', section: 'sustainability', type: 'multi', when: { q: 's1', is: 'yes' }, short: 'Type of investment',
      text: 'Which of these would you like your investment to include?', help: 'Tick any that apply.',
      options: [
        { id: 'taxonomy',   label: 'A. Investments in activities that count as environmentally sustainable under EU rules (the EU Taxonomy)', short: 'environmentally sustainable investments under the EU Taxonomy', share: true },
        { id: 'sustainable', label: 'B. Sustainable investments: companies or projects that contribute to an environmental or social goal without doing significant harm (as defined in EU rules)', short: 'sustainable investments as defined in EU rules', share: true },
        { id: 'pai',        label: 'C. Investments that take account of their main negative effects on the environment and society', short: 'investments that take account of their main negative effects on the environment and society' },
        { id: 'general',    label: 'I have a preference but not for any of these in particular', exclusive: true }
      ] },
    // One row for each of A and B ticked in S2
    { id: 's3', num: 'S3', section: 'sustainability', type: 'shares', when: { q: 's2', any: ['taxonomy', 'sustainable'] }, rowsFrom: 's2', short: 'Minimum share',
      text: 'For each of A and B that you ticked, what is the smallest share of your investment you would like it to make up?',
      options: [
        { id: '10', label: 'At least 10%' },
        { id: '20', label: 'At least 20%' },
        { id: '30', label: 'At least 30%' },
        { id: '50', label: 'At least 50%' }
      ] },
    { id: 's4', num: 'S4', section: 'sustainability', type: 'multi', when: { q: 's2', any: ['pai'] }, short: 'Negative effects',
      text: 'Which negative effects matter most to you?', help: 'Tick any that apply.',
      options: [
        { id: 'ghg',        label: 'Greenhouse gas emissions and energy use', short: 'greenhouse gas emissions and energy use' },
        { id: 'nature',     label: 'Biodiversity, water and waste', short: 'biodiversity, water and waste' },
        { id: 'social',     label: 'Social and employee matters, including human rights', short: 'social and employee matters, including human rights' },
        { id: 'corruption', label: 'Corruption and bribery', short: 'corruption and bribery' }
      ] }
  ],

  // ─── Wording for the written outputs (result screen, Statement of Suitability, record of answers). DRAFT. ──
  text: {
    // {profiler} = name, {date} = date completed
    usedPhrase: '{profiler}, {date}',
    riskSentence: 'In the risk profiler you told us that {loss}, that if your investment fell by 20% you would {reaction}, and that you want {objective}. Together these give an attitude to risk of {attitude} ({attitudeLabel}). Your capacity for loss was assessed as {capacity}.',
    lossSome: 'the largest fall in value over 12 months you could accept is {lossText}',
    lossNone: 'you could not accept any fall in value over 12 months',
    horizonPhrase: 'You plan to hold this investment for {term}.',
    timeCapSentence: 'Because you plan to hold this investment for {horizon}, your risk rating is limited to {cap}.',
    capacityCapSentence: 'Because your capacity for loss is low, your risk rating is limited to {cap}.',
    ratingSentence: 'This gives a risk rating of {sri} ({sriLabel}).',
    knowledgeSentence: 'Your investment knowledge and experience was assessed as {level}.',
    overrideSentence: 'The risk profiler gave a risk rating of {suggested}. Following our discussion, we have agreed a lower risk rating of {chosen} because: {reason}',
    sustainNo: 'You told us that you do not have sustainability preferences for this investment, so they were not a factor in our recommendation.',
    sustainGeneral: 'You told us that you have sustainability preferences, but not for any particular type of sustainable investment.',
    sustainTypes: 'You told us that you would like your investment to include {types}.',
    sustainEffects: 'The negative effects that matter most to you are {effects}.',
    // Shown to the client on the result screen when a limit lowers the rating
    limitTime: 'Because you plan to hold this investment for {horizon}, your rating is limited to {cap}. Higher-risk funds need time to recover from falls.',
    limitCapacity: 'Because a large fall in value would be hard for you to bear, your rating is limited to {cap}.',
    // Shown under "Capacity for loss" on the result screen
    capacitySummary: {
      LOW: 'You may find it hard to absorb a large fall in the value of this investment.',
      MEDIUM: 'You could absorb a fall in the value of this investment, but it would affect you.',
      HIGH: 'You are in a good position to absorb a fall in the value of this investment.'
    },
    capacityBasis: 'Based on your answers to Q1 (your financial cushion) and Q2 (the impact of a loss).',
    // Shown at the end of the result and in the Risk profile record
    resultNotice: {
      title: 'Important information',
      text: 'This result is a guide to help you and your adviser talk about risk. It is not advice, and it does not recommend a product or a fund. It is based only on the answers given, which cover just some of what matters when choosing an investment. Your adviser will look at your wider situation before recommending anything, and will review your risk profile with you at least once a year.'
    },
    recordNote: 'Your answers have been recorded as you gave them.',
    resultLead: 'Based on the answers given. Your adviser will go through the result with you.'
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = RP_CONFIG;
