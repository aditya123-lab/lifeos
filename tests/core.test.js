// Run: node tests/core.test.js
const assert = require('assert');
const C = require('../js/core.js');

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; } };
const at = (k, hh = 9, mm = 0) => { const d = C.parseKey(k); d.setHours(hh, mm, 0, 0); return d; };

console.log('LIFE OS core tests');

t('date helpers', () => {
  assert.strictEqual(C.addDays('2026-02-28', 1), '2026-03-01');
  assert.strictEqual(C.addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(C.startOfWeek('2026-11-15'), '2026-11-09'); // Sunday -> Monday before
  assert.strictEqual(C.startOfWeek('2026-11-09'), '2026-11-09');
  assert.strictEqual(C.daysBetween('2026-11-01', '2026-11-13'), 12);
});

t('level curve is progressive and ranks map correctly', () => {
  for (let l = 1; l < 99; l++) assert.ok(C.xpRequired(l + 1) > C.xpRequired(l));
  assert.strictEqual(C.levelInfo(0).level, 1);
  assert.strictEqual(C.levelInfo(C.cumulativeXP(11, 100, 1.3)).level, 11);
  assert.strictEqual(C.levelInfo(C.cumulativeXP(11, 100, 1.3) - 1).level, 10);
  assert.strictEqual(C.levelInfo(1e12).level, 100);
  assert.strictEqual(C.rankFor(5).name, 'Bronze'); assert.strictEqual(C.rankFor(6).name, 'Silver');
  assert.strictEqual(C.rankFor(20).name, 'Gold'); assert.strictEqual(C.rankFor(35).name, 'Platinum');
  assert.strictEqual(C.rankFor(50).name, 'Diamond'); assert.strictEqual(C.rankFor(75).name, 'Mythic');
  assert.strictEqual(C.rankFor(100).name, 'Immortal');
  const li = C.levelInfo(150); assert.strictEqual(li.level, 2); assert.strictEqual(li.into, 50);
});

t('XP awarded once per key; revoke keeps history', () => {
  const s = C.defaultState(at('2026-11-13'));
  const now = at('2026-11-13', 6);
  const r1 = C.completeHabit(s, 'h_makebed', '2026-11-13', {}, now);
  assert.ok(r1.ok); assert.strictEqual(C.totalXP(s), 20);
  const r2 = C.completeHabit(s, 'h_makebed', '2026-11-13', {}, now);
  assert.ok(!r2.ok); assert.strictEqual(C.totalXP(s), 20, 'duplicate prevented');
  assert.strictEqual(C.awardXP(s, { key: 'habit:h_makebed:2026-11-13', amount: 20 }), null);
  C.uncompleteHabit(s, 'h_makebed', '2026-11-13', now);
  assert.strictEqual(C.totalXP(s), 0);
  assert.strictEqual(s.xpTx.length, 2, 'original + reversal kept');
  // toggling repeatedly never nets more than the task value
  for (let i = 0; i < 5; i++) { C.completeHabit(s, 'h_makebed', '2026-11-13', {}, now); C.uncompleteHabit(s, 'h_makebed', '2026-11-13', now); }
  C.completeHabit(s, 'h_makebed', '2026-11-13', {}, now);
  assert.strictEqual(C.totalXP(s), 20);
});

t('skip gives no XP and past days are read-only', () => {
  const s = C.defaultState(at('2026-11-13'));
  const now = at('2026-11-13', 6);
  C.skipHabit(s, 'h_skincare', '2026-11-13', 'Habis', now);
  assert.strictEqual(C.totalXP(s), 0);
  assert.strictEqual(s.logs['2026-11-13'].h_skincare.reason, 'Habis');
  assert.ok(!C.completeHabit(s, 'h_makebed', '2026-11-12', {}, now).ok);
  assert.ok(!C.completeHabit(s, 'h_makebed', '2026-11-14', {}, now).ok);
});

t('daily reset: new date starts empty, history preserved', () => {
  const s = C.defaultState(at('2026-11-13'));
  C.completeHabit(s, 'h_makebed', '2026-11-13', {}, at('2026-11-13', 6));
  assert.strictEqual(C.dayStats(s, '2026-11-14').done, 0);
  assert.strictEqual(C.dayStats(s, '2026-11-13').done, 1);
  assert.strictEqual(C.statusOf(s, '2026-11-13', 'h_makebed').s, 'done');
});

t('routine bonus awarded once and revoked if routine becomes incomplete', () => {
  const s = C.defaultState(at('2026-11-13'));
  const k = '2026-11-13', now = at(k, 6);
  const morning = C.habitsFor(s, k).filter(h => h.period === 'morning' && h.mandatory);
  morning.forEach(h => C.completeHabit(s, h.id, k, {}, now));
  assert.ok(C.hasActiveTx(s, 'bonus:morning:' + k));
  const sum = morning.reduce((a, h) => a + h.xp, 0) + s.settings.bonusMorning;
  assert.strictEqual(C.totalXP(s), sum);
  C.uncompleteHabit(s, morning[0].id, k, now);
  assert.ok(!C.hasActiveTx(s, 'bonus:morning:' + k));
  C.completeHabit(s, morning[0].id, k, {}, now);
  assert.strictEqual(C.totalXP(s), sum);
});

t('streak counts consecutive successful days, rest days pause', () => {
  const s = C.defaultState(at('2026-11-01'));
  const completeAll = (k) => C.habitsFor(s, k).filter(h => h.mandatory).forEach(h => C.completeHabit(s, h.id, k, {}, at(k, 20)));
  ['2026-11-01', '2026-11-02', '2026-11-03'].forEach(completeAll);
  s.restDays['2026-11-04'] = true;
  completeAll('2026-11-05');
  assert.strictEqual(C.currentStreak(s, '2026-11-05'), 4);
  assert.strictEqual(C.currentStreak(s, '2026-11-06'), 4, 'today pending does not break');
  assert.strictEqual(C.currentStreak(s, '2026-11-07'), 0, 'missed day breaks');
  assert.strictEqual(C.longestStreak(s, '2026-11-07'), 4);
});

t('weekly completion aggregates correctly', () => {
  const s = C.defaultState(at('2026-11-09'));
  const k = '2026-11-09';
  const mand = C.habitsFor(s, k).filter(h => h.mandatory);
  mand.slice(0, 5).forEach(h => C.completeHabit(s, h.id, k, {}, at(k, 20)));
  const r = C.rangeCompletion(s, '2026-11-09', '2026-11-09');
  assert.strictEqual(r.done, 5); assert.strictEqual(r.total, mand.length);
  const week = C.rangeCompletion(s, '2026-11-09', '2026-11-15');
  const totalWeek = C.rangeKeys('2026-11-09', '2026-11-15').reduce((a, d) => a + C.dayStats(s, d).total, 0);
  assert.strictEqual(week.total, totalWeek);
});

t('linked habits auto-complete & revoke (study, water, supplement)', () => {
  const k = '2026-11-13', now = at(k, 20);
  const s = C.defaultState(at(k));
  s.study.sessions.push({ id: 'x', subjectId: 'sub1', minutes: 30, date: k });
  C.syncLinked(s, now);
  assert.ok(!C.statusOf(s, k, 'h_study'));
  s.study.sessions.push({ id: 'y', subjectId: 'sub1', minutes: 30, date: k });
  C.syncLinked(s, now);
  assert.strictEqual(C.statusOf(s, k, 'h_study').s, 'done');
  assert.ok(C.hasActiveTx(s, 'habit:h_study:' + k));
  s.study.sessions.pop(); C.syncLinked(s, now);
  assert.ok(!C.statusOf(s, k, 'h_study'));
  s.suppLogs[k] = { s_creatine: 'x' }; C.syncLinked(s, now);
  assert.strictEqual(C.statusOf(s, k, 'h_creatine').s, 'done');
  s.nutrition.days[k] = { meals: {}, water: 3000 }; C.syncLinked(s, now);
  assert.strictEqual(C.statusOf(s, k, 'h_water').s, 'done');
});

t('meal calculations', () => {
  const rice = C.FOOD_DB.find(f => f.id === 'f_rice');
  const n = C.nutrientsFor(rice, 200);
  assert.deepStrictEqual(n, { kcal: 260, p: 5.4, c: 56.4, f: 0.6 });
  const sum = C.sumNutrients([n, C.nutrientsFor(C.FOOD_DB.find(f => f.id === 'f_egg_boiled'), 50)]);
  assert.strictEqual(sum.kcal, 260 + 78); assert.strictEqual(sum.p, 5.4 + 6.3);
  const sug = C.suggestTargets({ weight: 60, height: 170, age: 21, activity: 1.55, goal: 'bulking' });
  assert.ok(sug.kcal > sug.tdee);
});

t('achievements unlock once and award XP once', () => {
  const k = '2026-11-13';
  const s = C.defaultState(at(k));
  C.completeHabit(s, 'h_makebed', k, {}, at(k, 6));
  const u1 = C.checkAchievements(s, at(k, 6));
  assert.ok(u1.some(a => a.id === 'first_step'));
  const xp = C.totalXP(s);
  assert.strictEqual(C.checkAchievements(s, at(k, 7)).length, 0);
  assert.strictEqual(C.totalXP(s), xp);
});

t('private milestones: claimed once per run, setback resets without deleting history', () => {
  const s = C.defaultState(at('2026-11-01'));
  s.selfControl.active = true; s.selfControl.streakStart = '2026-11-01';
  const got = C.privateClaimMilestones(s, at('2026-11-08'));
  assert.deepStrictEqual(got, [1, 3, 7]);
  assert.deepStrictEqual(C.privateClaimMilestones(s, at('2026-11-08')), []);
  C.privateSetback(s, 'catatan', at('2026-11-09'));
  assert.strictEqual(C.privateStreak(s, '2026-11-09'), 0);
  assert.strictEqual(s.selfControl.longest, 8);
  assert.strictEqual(s.selfControl.setbacks.length, 1);
});

t('recurrence & calendar', () => {
  const ev = { id: 'e', title: 'Tutor', date: '2026-11-02', recur: 'weekly', days: [1, 3], exceptions: ['2026-11-09'] };
  assert.ok(C.occursOn(ev, '2026-11-04'));
  assert.ok(!C.occursOn(ev, '2026-11-09'));
  assert.ok(!C.occursOn(ev, '2026-11-01'));
  assert.ok(C.occursOn({ date: '2026-01-15', recur: 'monthly' }, '2026-03-15'));
  const s = C.defaultState(at('2026-11-01'));
  const items = C.calendarItems(s, '2026-11-09'); // Monday
  assert.ok(items.some(i => i.kind === 'university'));
  assert.ok(items.some(i => i.kind === 'gym'));
});

t('gym never overlaps university by default; overlap detection works', () => {
  const s = C.defaultState();
  for (const d of s.settings.gymDays) assert.ok(!C.overlapsUniversity(s, d, s.settings.gymTime, s.settings.gymDuration));
  assert.ok(C.overlapsUniversity(s, 1, '14:30', 60));
  assert.ok(!C.overlapsUniversity(s, 6, '10:00', 60));
});

t('reminders: due window, quiet hours, no double firing', () => {
  const s = C.defaultState();
  const now = new Date(2026, 10, 13, 19, 3); // Friday 19:03
  const due = C.dueReminders(s, now).map(r => r.id);
  assert.ok(due.includes('r_study'));
  s.reminderLog[C.dateKey(now) + '|r_study'] = 'x';
  assert.ok(!C.dueReminders(s, now).some(r => r.id === 'r_study'));
  s.settings.notif.quietStart = '18:00'; s.settings.notif.quietEnd = '20:00';
  s.reminderLog = {};
  assert.ok(!C.dueReminders(s, now).some(r => r.id === 'r_study'));
  assert.ok(C.inQuietHours({ settings: { notif: { quietStart: '22:30', quietEnd: '04:45' } } }, 60));
});

t('ICS export keeps private reminder generic', () => {
  const s = C.defaultState();
  s.reminders.find(r => r.id === 'r_private').enabled = true;
  const ics = C.buildICS(s);
  assert.ok(ics.includes('BEGIN:VCALENDAR') && ics.includes('RRULE:FREQ=WEEKLY'));
  assert.ok(ics.includes('SUMMARY:Check-in harian'));
});

t('migrate fills missing fields and keeps user data', () => {
  const s = C.defaultState();
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.settings.pomodoro; delete raw.copy;
  raw.logs = { '2026-11-01': { h_wake: { s: 'done' } } };
  const m = C.migrate(raw);
  assert.ok(m.settings.pomodoro.focus === 25);
  assert.ok(Array.isArray(m.copy.sessions));
  assert.strictEqual(m.logs['2026-11-01'].h_wake.s, 'done');
  assert.throws(() => C.migrate(null));
});

t('optional habit mandatory on specific days (English Fri/Sat/Sun)', () => {
  const s = C.defaultState(at('2026-11-16'));
  const e = s.habits.find(h => h.id === 'h_english');
  assert.ok(!e.mandatory);
  assert.ok(!C.isMandatoryOn(e, '2026-11-19')); // Thursday
  assert.ok(C.isMandatoryOn(e, '2026-11-20') && C.isMandatoryOn(e, '2026-11-21') && C.isMandatoryOn(e, '2026-11-22'));
  const thu = C.dayStats(s, '2026-11-19').total, fri = C.dayStats(s, '2026-11-20').total;
  assert.strictEqual(fri - thu, 1 - 0 + (C.habitsFor(s, '2026-11-20').filter(h => h.mandatory).length - C.habitsFor(s, '2026-11-19').filter(h => h.mandatory).length));
  // old saved data without the field gets migrated once
  const raw = JSON.parse(JSON.stringify(s)); delete raw.migrations; delete raw.habits.find(h => h.id === 'h_english').mandatoryDays;
  assert.deepStrictEqual(C.migrate(raw).habits.find(h => h.id === 'h_english').mandatoryDays, [5, 6, 0]);
  // user later clears it -> migration must not re-add
  const m = C.migrate(raw); m.habits.find(h => h.id === 'h_english').mandatoryDays = [];
  assert.deepStrictEqual(C.migrate(JSON.parse(JSON.stringify(m))).habits.find(h => h.id === 'h_english').mandatoryDays, []);
});

console.log(`\n${passed} tests passed${process.exitCode ? ' (with failures)' : ''}`);
