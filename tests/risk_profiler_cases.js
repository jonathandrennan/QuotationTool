// The ten worked test cases for the Risk Profiler: one client each, the answers they give, the result the
// engine must produce, and why that result suits the client. Cases 1–8 are the edge clients of
// tests/compare_profilers.py (same answers), so their Aviva and Zurich results can be quoted; 9 and 10 are new.
//
// Used by:  tests/risk_profiler_test.js           (checks every case's expected result)
//           tests/build_risk_profiler_cases.js    (writes docs/risk-profiler-test-cases.md and the Word copy)
//
// The `why` text is written against `expect`. If a rule changes and a case's result moves, both scripts fail
// until the expectation and the reasoning are brought back into line.
const AT = '2026-10-28';
const RIGHT = { order: ['deposit', 'govbonds', 'fund', 'share'] };
const WRONG = { order: ['deposit', 'fund', 'govbonds', 'share'] };
const DONTKNOW = { dontKnow: true };

// Date of birth for an age on AT, birthday already passed (as in compare_profilers.py)
function dobFor(age) {
  const d = new Date(Date.UTC(2026 - age, 9, 28) - 100 * 864e5);
  return d.toISOString().slice(0, 10);
}

function c(id, name, age, a, check, expect, story, why, shows) {
  return { id, name, age, dob: dobFor(age), answers: Object.assign({}, a, { check }), expect, story, why, shows };
}

const CASES = [
  c(1, 'Most cautious', 80,
    { cushion: 'under3', impact: 'big', horizon: 1, loss: 0, reaction: 'sellall', objective: 'safe', experience: 'none' }, DONTKNOW,
    { sri: 1, attitude: 1, capacity: 'LOW', knowledge: 'LOW', flags: ['F4'] },
    'Aged 80. Needs the money within a year. Has less than 3 months of savings and would struggle if this investment fell. Has only ever used deposit accounts.',
    [
      ['Why 1 is suitable', 'Every attitude answer says the client wants to avoid any loss: no fall accepted (1), would sell everything after a fall (2), wants their money back (1). A rating of 1 means funds whose value barely moves (volatility under 0.5%). That is the only level that matches.'],
      ['The limits agree', 'The 1-year horizon (limit 3) and low capacity for loss (limit 4) would both hold the rating down, but the attitude is already below them. Every part of the profile points the same way.'],
      ['What the adviser sees', 'F4 Short horizon is still raised. At 1 year, even a rating-1 fund may be the wrong product, so the adviser should consider whether a deposit fits better. Knowledge is Low, but at rating 1 there is nothing to flag.']
    ],
    'All answers cautious: the lowest rating, and a horizon warning'),

  c(2, 'Most adventurous', 25,
    { cushion: '12plus', impact: 'little', horizon: 12, loss: 40, reaction: 'investmore', objective: 'highest', experience: 'professional' }, RIGHT,
    { sri: 6, attitude: 6, capacity: 'HIGH', knowledge: 'HIGH', flags: [] },
    'Aged 25. Plans to invest for 12 years or more. Would accept a fall of €4,000 or more on €10,000, and would invest more after a fall. Wants the highest return. Has 12 months or more of savings, a loss would hardly matter, and works in financial services.',
    [
      ['Why 6 is suitable', 'All three attitude answers are at the top (6, 6, 6). Capacity for loss is High (6 points), the horizon is well beyond the 5 years the ESMA scale assumes, and the client ranked the four investments correctly. Nothing in the profile argues for less.'],
      ['Why not 7', 'The tool stops at 6, as Aviva does. Even the most adventurous client is not put into the most volatile funds (volatility over 25%) by the tool alone. The adviser can still discuss them.']
    ],
    'All answers adventurous: the highest rating the tool gives, no flags'),

  c(3, 'Mid-range', 40,
    { cushion: '3to11', impact: 'some', horizon: 10, loss: 15, reaction: 'wait', objective: 'steady', experience: 'recent' }, RIGHT,
    { sri: 4, attitude: 4, capacity: 'MEDIUM', knowledge: 'HIGH', flags: [] },
    'Aged 40. Investing for 10 years. Would accept a fall of €1,500 on €10,000, and would keep the investment and wait for a recovery. Wants steady growth. Has 3 to 11 months of savings and would need to adjust their plans after a large loss. Has held funds in the last 5 years.',
    [
      ['Why 4 is suitable', 'The three attitude answers agree to within one level (4, 5, 4) and the middle is 4. A €1,500 fall on €10,000 (15%) is a bad year for a rating-4 fund: twice the middle of its 5–10% volatility band. So the fall the client says they can accept is the fall a rating-4 fund can deliver.'],
      ['Why the rating is not 5', 'The "wait for a recovery" answer (5) is outvoted by the loss and objective answers. One brave answer does not lift the rating.'],
      ['No limits', 'Medium capacity and a 10-year horizon do not limit the rating. All three tools give 4.']
    ],
    'Typical client: consistent answers give the matching rating'),

  c(4, 'Keen but no cushion', 30,
    { cushion: 'under3', impact: 'big', horizon: 10, loss: 40, reaction: 'investmore', objective: 'highest', experience: 'regular' }, RIGHT,
    { sri: 4, attitude: 6, capacity: 'LOW', knowledge: 'HIGH', flags: ['F3'] },
    'Aged 30. Investing for 10 years, and as keen as client 2: would accept a 40% fall, would invest more after a fall, wants the highest return. But has less than 3 months of savings and would struggle to meet living costs if this investment lost a large part of its value.',
    [
      ['Why 4 is suitable', 'On attitude alone the client is a 6. But a bad year for a rating-6 fund is a fall of about 40% (€4,000 on €10,000), and this client says that would leave them struggling. Being willing to take a loss is not the same as being able to bear it. The rules require both (IDD Art 30; ESMA 80). Low capacity limits the rating to 4, which still gives long-term growth over 10 years.'],
      ['What the client and adviser see', 'The client is told on the result screen that their rating is limited because a large fall would be hard to bear. F3 tells the adviser that the attitude alone gave 6. If the fact find shows wealth the client left out, the adviser can raise the rating, and the reason is recorded in the Statement of Suitability.'],
      ['Against competitors', 'Aviva and Zurich both give 6: neither lets capacity for loss change the rating. This is where the proposal is deliberately stricter.']
    ],
    'Capacity for loss overrides an adventurous attitude'),

  c(5, 'Cautious but wealthy', 60,
    { cushion: '12plus', impact: 'little', horizon: 12, loss: 2, reaction: 'sellall', objective: 'safe', experience: 'regular' }, RIGHT,
    { sri: 1, attitude: 1, capacity: 'HIGH', knowledge: 'HIGH', flags: [] },
    'Aged 60. Investing for 12 years or more. Has 12 months or more of savings and a loss would hardly matter. But would accept only a €200 fall, would sell everything after a fall, and wants their money back.',
    [
      ['Why 1 is suitable', 'The client could afford a loss but does not want one. Capacity for loss can only lower the rating, never raise it. Putting a client into higher-risk funds because they can bear losses they have said they will not accept would ignore their risk tolerance (IDD Art 30; ESMA 46).'],
      ['The mirror of case 4', 'Case 4 has the attitude but not the capacity; this client has the capacity but not the attitude. Both are held to the lower of the two. The tool takes the safer reading either way.']
    ],
    'High capacity does not push a cautious client up'),

  c(6, 'Adventurous, short horizon', 50,
    { cushion: '12plus', impact: 'little', horizon: 2, loss: 40, reaction: 'investmore', objective: 'highest', experience: 'regular' }, RIGHT,
    { sri: 3, attitude: 6, capacity: 'HIGH', knowledge: 'HIGH', flags: ['F4'] },
    'Aged 50. As adventurous as client 2, with high capacity for loss and regular investing experience. But needs the money in 2 years.',
    [
      ['Why 3 is suitable', 'A rating-6 fund can fall about 40% in a bad year and may need several years to recover. With 2 years there may be no time to wait. Higher-risk funds are built for holding periods of 5 years or more, as the ESMA scale assumes. Under 3 years the rating is limited to 3 (volatility 2–5%), where a bad year is a fall of about 7%, which can be made back within the horizon.'],
      ['What the client and adviser see', 'The client is told that the horizon limits the rating. F4 tells the adviser that the attitude alone gave 6.'],
      ['Against competitors', 'Zurich lowers for the term but gives 5, and Aviva ignores the term and gives 6. Ours is the only result that respects the holding period (ESMA 80).']
    ],
    'A short horizon overrides an adventurous attitude'),

  c(7, 'Adventurous in retirement', 70,
    { cushion: '12plus', impact: 'little', horizon: 10, loss: 30, reaction: 'investmore', objective: 'strong', experience: 'regular' }, RIGHT,
    { sri: 5, attitude: 5, capacity: 'HIGH', knowledge: 'HIGH', flags: ['F5'] },
    'Aged 70. Plans to hold for 10 years, for example an ARF they will draw from slowly or leave to family. Would accept a €3,000 fall on €10,000, would invest more after a fall, and wants strong growth. Has good savings, a loss would hardly matter, and invests regularly.',
    [
      ['Why 5 is suitable', 'The attitude answers agree (5, 6, 5) and the middle is 5. Capacity is High, the horizon is 10 years, and the knowledge check is right. On these answers the client can take, and wants, a rating of 5.'],
      ['Why age does not lower it', 'Age is not a reason to cut risk on its own. What matters is how long the money is invested and whether the client can bear losses, and both are already measured. A 70-year-old investing for 10 years is in the same position as a 50-year-old investing for 10 years. Zurich deducts for age; we do not.'],
      ['What the adviser sees', 'F5 Age asks the adviser to check that a rating of 5 suits the client\'s wider circumstances (health, income needs, possible vulnerability: ESMA 24, 40). The adviser makes that call, with the facts in front of them.']
    ],
    'Age raises a flag for the adviser, not an automatic cut'),

  c(8, 'Accepts only 2.5% but wants the highest return', 45,
    { cushion: '3to11', impact: 'some', horizon: 10, loss: 2.5, reaction: 'investmore', objective: 'highest', experience: 'recent' }, RIGHT,
    { sri: 3, attitude: 3, capacity: 'MEDIUM', knowledge: 'HIGH', flags: ['F1'] },
    'Aged 45. Investing for 10 years. Says they want the highest return and would invest more after a fall. But the largest fall they would accept is €250 on €10,000.',
    [
      ['Why 3 is suitable', 'Two answers say 6 and the loss answer says 2. Taking the middle would give 6. But the loss answer is the only one with a concrete figure, and a rating-6 fund can fall about €4,000 in a bad year. A client who acts at €250 would very likely sell near the bottom. So the attitude can be at most one level above the loss answer, giving 3. This is what ESMA asks for: base the assessment on concrete figures, not on wishes (ESMA 31, 46, 48).'],
      ['Why not 2', 'The other two answers show some appetite for growth, so the tool allows one level above the loss answer rather than holding the client at it.'],
      ['What the adviser sees', 'F1 Mixed attitude shows the three answers (2, 6, 6) and asks the adviser to talk through how much risk the client really wants. If the client then moves the Q4 slider, F6 records that the answers changed after the result was shown. Aviva also gives 3; Zurich adds up points and gives 5.']
    ],
    'Contradictory answers: the loss figure anchors the rating'),

  c(9, 'First-time investor with a growth attitude', 35,
    { cushion: '3to11', impact: 'little', horizon: 12, loss: 30, reaction: 'wait', objective: 'strong', experience: 'none' }, DONTKNOW,
    { sri: 5, attitude: 5, capacity: 'HIGH', knowledge: 'LOW', flags: ['F2'] },
    'Aged 35. Investing a lump sum for 12 years or more. Would accept a €3,000 fall on €10,000, would keep the investment and wait for a recovery, and wants strong growth. Has 3 to 11 months of savings and a partner\'s income, so a loss would have little impact. Has never invested beyond deposit accounts, and ticked "I don\'t know" on the knowledge check.',
    [
      ['Why 5 is suitable', 'Attitude (5, 5, 5), capacity (High) and horizon (12 years) all support 5. The client has given a clear, consistent answer about the risk they want and can bear.'],
      ['Why low knowledge does not lower it', 'Knowledge is about whether the client understands what they are buying. The adviser can fix that by explaining it. Cutting the rating would steer every new investor into low-growth funds for 12 years, whatever their attitude and capacity. So the tool keeps the rating and raises a flag.'],
      ['What the adviser sees', 'F2 Low knowledge, high rating asks the adviser to check that the client understands how the recommended funds can rise and fall, and that 5 still suits them once they do (ESMA 51–52). The Q8 explanation is also shown to the client with the result.']
    ],
    'Low knowledge raises a flag; it does not cut the rating'),

  c(10, 'Cautious retiree', 67,
    { cushion: '12plus', impact: 'some', horizon: 6, loss: 5, reaction: 'sellpart', objective: 'deposit', experience: 'passive' }, RIGHT,
    { sri: 2, attitude: 2, capacity: 'HIGH', knowledge: 'MEDIUM', flags: [] },
    'Aged 67 and retired. Investing for 6 years. Would accept a €500 fall on €10,000, would sell part after a fall, and wants a little more than a deposit account. Has 12 months or more of savings but would need to adjust their plans after a large loss. Has a pension they never followed, but ranked the four investments correctly.',
    [
      ['Why 2 is suitable', 'The attitude answers agree (2, 3, 2) and the middle is 2. A bad year for a rating-2 fund (volatility 0.5–2%) is a fall of about €250, inside the €500 the client would accept. A rating-3 fund could fall about €700, which is more than they would accept.'],
      ['Room to take more, not used', 'With High capacity and 6 years, the limits would allow any rating. The tool still follows the client\'s own attitude, as in case 5.'],
      ['Knowledge check at work', 'The client describes themselves modestly (Low), but the right answer on Q8 lifts them to Medium: the check rewards real understanding as well as catching over-confidence. No age flag: F5 is aimed at older clients taking high risk (5 or more), not at everyone over 65.']
    ],
    'Rating 2: a cautious attitude respected; the knowledge check lifts the level')
];

module.exports = { CASES, AT };
