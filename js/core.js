/* LIFE OS — core.js
 * Pure logic: dates, defaults, XP/level, completion, streaks, achievements,
 * nutrition math, recurrence, reminders, ICS export.
 * No DOM access here, so it can be unit-tested with Node (see tests/core.test.js).
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- utils
  const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round1 = (v) => Math.round(v * 10) / 10;

  // ---------------------------------------------------------------- dates (always LOCAL time)
  function dateKey(d = new Date()) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseKey(k) {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function addDays(k, n) {
    const d = parseKey(k);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function weekday(k) { return parseKey(k).getDay(); } // 0 = Minggu
  function daysBetween(a, b) { // b - a in whole days
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function startOfWeek(k) { // Monday
    const wd = weekday(k);
    return addDays(k, wd === 0 ? -6 : 1 - wd);
  }
  function rangeKeys(from, to) {
    const out = [];
    for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
    return out;
  }
  function toMin(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }
  function fromMin(min) {
    min = ((min % 1440) + 1440) % 1440;
    return pad(Math.floor(min / 60)) + ':' + pad(min % 60);
  }
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function formatDate(k, opts = {}) {
    const d = parseKey(k);
    const s = d.getDate() + ' ' + (opts.short ? MONTHS[d.getMonth()].slice(0, 3) : MONTHS[d.getMonth()]);
    const y = opts.year === false ? '' : ' ' + d.getFullYear();
    return (opts.weekday ? DAY_NAMES[d.getDay()] + ', ' : '') + s + y;
  }

  // ---------------------------------------------------------------- constants
  const PERIODS = [
    { id: 'morning', label: 'Pagi', icon: 'sunrise' },
    { id: 'university', label: 'Kuliah', icon: 'school' },
    { id: 'afternoon', label: 'Siang/Sore', icon: 'sun' },
    { id: 'evening', label: 'Malam', icon: 'moon' },
    { id: 'night', label: 'Sebelum Tidur', icon: 'bed' }
  ];
  const CATEGORIES = {
    pagi: 'Rutinitas Pagi', akademik: 'Akademik', profesional: 'Pengembangan Profesional',
    fitness: 'Fitness', kebersihan: 'Kebersihan Diri', malam: 'Rutinitas Malam', lainnya: 'Lainnya'
  };
  const DIFFICULTY = { 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' };
  const RANKS = [
    { name: 'Bronze', from: 1, to: 5, color: '#c58b5a' },
    { name: 'Silver', from: 6, to: 10, color: '#b8c1cc' },
    { name: 'Gold', from: 11, to: 20, color: '#e6c15a' },
    { name: 'Platinum', from: 21, to: 35, color: '#7fd6d0' },
    { name: 'Diamond', from: 36, to: 50, color: '#78a6ff' },
    { name: 'Mythic', from: 51, to: 75, color: '#b07cff' },
    { name: 'Immortal', from: 76, to: 100, color: '#ff7a9c' }
  ];
  const MEALS = [
    { id: 'breakfast', label: 'Sarapan' }, { id: 'lunch', label: 'Makan Siang' },
    { id: 'dinner', label: 'Makan Malam' }, { id: 'snack', label: 'Camilan' }
  ];

  // ---------------------------------------------------------------- food database
  // Values per 100 g (edible portion). ALL are ESTIMATES.
  // src 'USDA' = approximated from USDA FoodData Central generic entries.
  // src 'Perkiraan' = rough estimate for a dish whose recipe varies a lot.
  // Verify against TKPI (Tabel Komposisi Pangan Indonesia) or product labels when precision matters.
  const FOOD_DB = [
    ['f_rice', 'Nasi putih (matang)', 130, 2.7, 28.2, 0.3, 'USDA', [['1 centong', 100], ['1 piring', 200]]],
    ['f_rice_brown', 'Nasi merah (matang)', 123, 2.7, 25.6, 1.0, 'USDA', [['1 centong', 100]]],
    ['f_friedrice', 'Nasi goreng', 170, 5.0, 25.0, 5.5, 'Perkiraan', [['1 piring', 300]]],
    ['f_chicken_breast', 'Dada ayam tanpa kulit (matang)', 165, 31.0, 0, 3.6, 'USDA', [['1 potong sedang', 120]]],
    ['f_fried_chicken', 'Ayam goreng tepung (dengan kulit)', 260, 25.0, 9.0, 13.5, 'Perkiraan', [['1 potong', 120]]],
    ['f_egg_boiled', 'Telur rebus', 155, 12.6, 1.1, 10.6, 'USDA', [['1 butir', 50]]],
    ['f_egg_fried', 'Telur ceplok/goreng', 196, 13.6, 0.8, 14.8, 'USDA', [['1 butir', 46]]],
    ['f_fish_tilapia', 'Ikan nila (kukus/bakar)', 128, 26.2, 0, 2.7, 'USDA', [['1 potong', 100]]],
    ['f_tuna_can', 'Tuna kaleng (dalam air)', 116, 25.5, 0, 0.8, 'USDA', [['1 kaleng (tiris)', 120]]],
    ['f_shrimp', 'Udang rebus', 99, 24.0, 0.2, 0.3, 'USDA', [['5 ekor sedang', 60]]],
    ['f_beef', 'Daging sapi giling 85% (matang)', 250, 25.9, 0, 15.4, 'USDA', [['1 porsi', 100]]],
    ['f_tempeh', 'Tempe (kukus/rebus)', 192, 20.3, 7.6, 10.8, 'USDA', [['1 potong', 50]]],
    ['f_tempeh_fried', 'Tempe goreng', 280, 20.0, 9.0, 19.0, 'Perkiraan', [['1 potong', 40]]],
    ['f_tofu', 'Tahu (kukus/rebus)', 76, 8.1, 1.9, 4.8, 'USDA', [['1 potong', 60]]],
    ['f_tofu_fried', 'Tahu goreng', 271, 17.3, 10.5, 20.2, 'USDA', [['1 potong', 40]]],
    ['f_oats_dry', 'Oatmeal (kering)', 379, 13.2, 67.7, 6.5, 'USDA', [['3 sdm', 30], ['1/2 cup', 40]]],
    ['f_milk', 'Susu sapi full cream', 61, 3.2, 4.8, 3.3, 'USDA', [['1 gelas (250 ml)', 250]]],
    ['f_milk_low', 'Susu low fat', 42, 3.4, 5.0, 1.0, 'USDA', [['1 gelas (250 ml)', 250]]],
    ['f_yogurt', 'Yogurt plain', 61, 3.5, 4.7, 3.3, 'USDA', [['1 cup kecil', 125]]],
    ['f_banana', 'Pisang', 89, 1.1, 22.8, 0.3, 'USDA', [['1 buah sedang', 118]]],
    ['f_apple', 'Apel', 52, 0.3, 13.8, 0.2, 'USDA', [['1 buah sedang', 180]]],
    ['f_avocado', 'Alpukat', 160, 2.0, 8.5, 14.7, 'USDA', [['1/2 buah', 100]]],
    ['f_bread', 'Roti tawar putih', 265, 9.0, 49.0, 3.2, 'USDA', [['1 lembar', 30]]],
    ['f_bread_ww', 'Roti gandum utuh', 247, 13.0, 41.0, 3.4, 'USDA', [['1 lembar', 32]]],
    ['f_potato', 'Kentang rebus', 87, 1.9, 20.1, 0.1, 'USDA', [['1 buah sedang', 150]]],
    ['f_sweetpotato', 'Ubi jalar rebus', 76, 1.4, 17.7, 0.1, 'USDA', [['1 buah sedang', 150]]],
    ['f_corn', 'Jagung rebus', 96, 3.4, 21.0, 1.5, 'USDA', [['1 tongkol', 100]]],
    ['f_mungbean', 'Kacang hijau rebus', 105, 7.0, 19.2, 0.4, 'USDA', [['1 mangkuk', 200]]],
    ['f_peanut', 'Kacang tanah', 567, 25.8, 16.1, 49.2, 'USDA', [['1 genggam', 30]]],
    ['f_pb', 'Selai kacang', 588, 25.1, 20.0, 50.4, 'USDA', [['1 sdm', 16]]],
    ['f_spinach', 'Bayam rebus', 23, 3.0, 3.8, 0.3, 'USDA', [['1 mangkuk', 100]]],
    ['f_broccoli', 'Brokoli rebus', 35, 2.4, 7.2, 0.4, 'USDA', [['1 mangkuk', 90]]],
    ['f_cheese', 'Keju cheddar', 403, 24.9, 1.3, 33.1, 'USDA', [['1 lembar', 20]]],
    ['f_olive_oil', 'Minyak goreng/zaitun', 884, 0, 0, 100, 'USDA', [['1 sdm', 14]]]
  ].map(([id, name, kcal, p, c, f, src, portions]) => ({
    id, name, kcal, p, c, f, src, builtin: true,
    portions: portions.map(([label, g]) => ({ label, g }))
  }));

  function nutrientsFor(food, grams) {
    const r = grams / 100;
    return { kcal: Math.round(food.kcal * r), p: round1(food.p * r), c: round1(food.c * r), f: round1(food.f * r) };
  }
  function sumNutrients(items) {
    return items.reduce((a, i) => ({
      kcal: a.kcal + (+i.kcal || 0), p: round1(a.p + (+i.p || 0)),
      c: round1(a.c + (+i.c || 0)), f: round1(a.f + (+i.f || 0))
    }), { kcal: 0, p: 0, c: 0, f: 0 });
  }
  // Mifflin-St Jeor BMR (suggestion only — never applied without user approval)
  function suggestTargets({ sex = 'm', weight, height, age, activity = 1.55, goal = 'bulking' }) {
    if (!weight || !height || !age) return null;
    const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
    const tdee = bmr * activity;
    const adj = goal === 'bulking' ? 300 : goal === 'cutting' ? -400 : 0;
    const kcal = Math.round((tdee + adj) / 10) * 10;
    const p = Math.round(weight * (goal === 'cutting' ? 2.0 : 1.8));
    const f = Math.round((kcal * 0.25) / 9);
    const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
    return { kcal, p, c, f, bmr: Math.round(bmr), tdee: Math.round(tdee) };
  }

  // ---------------------------------------------------------------- defaults
  const ALL = [0, 1, 2, 3, 4, 5, 6];
  const WEEKDAYS = [1, 2, 3, 4, 5];
  function defaultHabits(gymDays) {
    const H = (id, name, cat, period, xp, diff, mandatory, extra = {}) =>
      Object.assign({ id, name, cat, period, xp, difficulty: diff, mandatory, days: ALL, time: '', link: '', active: true }, extra);
    return [
      H('h_wake', 'Bangun tepat waktu', 'pagi', 'morning', 20, 2, true, { time: '05:00' }),
      H('h_makebed', 'Merapikan tempat tidur', 'pagi', 'morning', 20, 1, true),
      H('h_shower_am', 'Mandi pagi', 'kebersihan', 'morning', 15, 1, true),
      H('h_teeth_am', 'Sikat gigi pagi', 'kebersihan', 'morning', 10, 1, true),
      H('h_skincare', 'Skincare', 'kebersihan', 'morning', 10, 1, false),
      H('h_breakfast', 'Sarapan', 'pagi', 'morning', 20, 1, true),
      H('h_creatine', 'Minum creatine', 'fitness', 'morning', 20, 1, true, { link: 'supp:s_creatine' }),
      H('h_room', 'Membersihkan kamar', 'kebersihan', 'morning', 50, 2, false),
      H('h_review', 'Review jadwal hari ini', 'pagi', 'morning', 20, 1, true),
      H('h_uni', 'Kuliah', 'akademik', 'university', 50, 2, true, { days: WEEKDAYS, time: '07:00' }),
      H('h_lecture', 'Review materi kuliah', 'akademik', 'university', 50, 2, false, { days: WEEKDAYS }),
      H('h_assign', 'Kerjakan tugas (jika ada)', 'akademik', 'university', 50, 2, false, { days: WEEKDAYS }),
      H('h_shower_pm', 'Mandi sore', 'kebersihan', 'afternoon', 15, 1, true),
      H('h_gym', 'Sesi gym', 'fitness', 'afternoon', 200, 3, true, { days: gymDays, time: '16:30', link: 'gym' }),
      H('h_water', 'Minum air cukup', 'fitness', 'afternoon', 30, 1, true, { link: 'water' }),
      H('h_study', 'Belajar kedokteran (target harian)', 'akademik', 'evening', 150, 3, true, { time: '19:00', link: 'study' }),
      H('h_copy', 'Latihan copywriting (target harian)', 'profesional', 'evening', 100, 2, true, { time: '20:30', link: 'copy' }),
      H('h_english', 'Latihan bahasa Inggris 15 menit', 'profesional', 'evening', 50, 2, false, { mandatoryDays: [5, 6, 0] }),
      H('h_marketing', 'Belajar marketing / copywriting', 'profesional', 'evening', 30, 1, false),
      H('h_meals', 'Tracking nutrisi lengkap', 'fitness', 'evening', 50, 1, true, { link: 'meals' }),
      H('h_unfinished', 'Selesaikan tugas yang tertunda', 'malam', 'night', 20, 2, false),
      H('h_tomorrow', 'Siapkan jadwal besok', 'malam', 'night', 20, 1, true),
      H('h_reflect', 'Review pencapaian & jurnal', 'malam', 'night', 30, 1, true),
      H('h_teeth_pm', 'Sikat gigi malam', 'kebersihan', 'night', 10, 1, true),
      H('h_clothes', 'Ganti pakaian & pakaian dalam', 'kebersihan', 'night', 10, 1, true),
      H('h_grooming', 'Grooming (kuku, rambut, dll.)', 'kebersihan', 'night', 10, 1, false, { days: [0, 3] }),
      H('h_bathroom', 'Bersihkan kamar mandi', 'kebersihan', 'night', 30, 2, false, { days: [6] }),
      H('h_sleep', 'Tidur sesuai jadwal', 'malam', 'night', 30, 2, true, { time: '22:00' })
    ];
  }

  function defaultReminders(gymDays) {
    const R = (id, label, time, days, type, body, enabled = true) => ({ id, label, time, days, type, body, enabled });
    return [
      R('r_morning', 'Rutinitas pagi', '05:00', ALL, 'routine', 'Selamat pagi! Mulai rutinitas pagimu.'),
      R('r_creatine', 'Creatine', '06:30', ALL, 'supplement', 'Jangan lupa minum creatine hari ini.'),
      R('r_uni', 'Berangkat kuliah', '06:40', WEEKDAYS, 'university', 'Kuliah mulai 07:00. Siapkan perlengkapan.'),
      R('r_gym', 'Gym', '16:15', gymDays.slice(), 'gym', 'Sesi gym hari ini — waktunya latihan.'),
      R('r_study', 'Belajar kedokteran', '19:00', ALL, 'study', 'Waktunya sesi belajar. Mulai Pomodoro pertama.'),
      R('r_copy', 'Copywriting', '20:30', ALL, 'copy', 'Latihan copywriting 30 menit.'),
      R('r_meal', 'Tracking makan', '21:00', ALL, 'meal', 'Sudah catat semua makanan hari ini?'),
      R('r_night', 'Rutinitas malam', '21:30', ALL, 'routine', 'Review hari ini dan siapkan jadwal besok.'),
      // Private: deliberately generic body. No details in notification previews.
      R('r_private', 'Check-in harian', '21:45', ALL, 'private', 'Waktunya check-in harian singkat.', false)
    ];
  }

  function defaultState(now = new Date()) {
    const today = dateKey(now);
    const gymDays = [1, 3, 5];
    const habits = defaultHabits(gymDays).map((h, i) => Object.assign(h, { createdAt: today, order: i }));
    return {
      version: 1,
      createdAt: today,
      profile: { name: 'Aditya', role: 'Mahasiswa Kedokteran', avatar: '', wake: '05:00', bed: '22:00' },
      schedule: {
        uniDays: WEEKDAYS.slice(), uniStart: '07:00', uniEnd: '15:00',
        blocks: [
          { id: 'b1', label: 'Rutinitas pagi & persiapan', start: '05:00', end: '07:00', days: ALL },
          { id: 'b2', label: 'Kuliah', start: '07:00', end: '15:00', days: WEEKDAYS },
          { id: 'b3', label: 'Istirahat, makan & recovery', start: '15:00', end: '16:00', days: WEEKDAYS },
          { id: 'b4', label: 'Belajar, gym & pengembangan diri', start: '16:00', end: '21:00', days: WEEKDAYS },
          { id: 'b5', label: 'Pengembangan diri, catch-up akademik & recovery', start: '08:00', end: '17:00', days: [0, 6] },
          { id: 'b6', label: 'Review & persiapan besok', start: '21:00', end: '22:00', days: ALL }
        ]
      },
      settings: {
        theme: 'dark', lang: 'id',
        successThreshold: 70, maxRestPerWeek: 2,
        bonusMorning: 50, bonusNight: 50,
        levelBase: 100, levelExp: 1.3,
        studyTarget: 60, studyTargetExam: 120, examMode: false,
        copyTarget: 30, gymPerWeek: 3, gymDays, gymTime: '16:30', gymDuration: 75,
        mealsRequired: 3,
        pomodoro: { focus: 25, short: 5, long: 10, focus2: 50 },
        notif: { enabled: false, quietStart: '22:30', quietEnd: '04:45', inApp: true },
        achievementsEnabled: true, rewardsEnabled: true,
        private: { showInStats: false, xpEnabled: true, pinHash: '' }
      },
      habits,
      logs: {},           // { 'YYYY-MM-DD': { habitId: {s:'done'|'skipped', at, reason, auto} } }
      restDays: {},       // { 'YYYY-MM-DD': true }
      topPicks: {},       // { 'YYYY-MM-DD': [habitId, ...] } user-pinned priorities
      xpTx: [],           // { id, key, amount, source, label, date, at, reversed? , ref? }
      achievements: {},   // { id: { at, date } }
      rewards: [
        { id: 'rw1', name: 'Nonton film', cost: 500 },
        { id: 'rw2', name: 'Beli camilan favorit', cost: 700 },
        { id: 'rw3', name: 'Main game 1 jam', cost: 1000 },
        { id: 'rw4', name: 'Beli barang yang diinginkan', cost: 3000 },
        { id: 'rw5', name: 'Reward spesial bulanan', cost: 5000 }
      ],
      redemptions: [],
      study: {
        subjects: [
          { id: 'sub1', name: 'Bedah', color: '#8b7cf6' },
          { id: 'sub2', name: 'Ilmu Penyakit Dalam', color: '#5b8cff' },
          { id: 'sub3', name: 'Farmakologi', color: '#3ecf8e' },
          { id: 'sub4', name: 'Latihan Soal', color: '#f5a524' }
        ],
        sessions: [], assignments: [], exams: [], checklist: []
      },
      copy: {
        sessions: [],
        topics: ['Dasar copywriting & psikologi pembaca', 'Headline & hook', 'Formula AIDA', 'Formula PAS', 'Features vs benefits', 'Call to action (CTA)', 'Email copywriting', 'Sales page / landing page', 'Copy untuk media sosial', 'Editing & self-review']
          .map((t, i) => ({ id: 'ct' + i, name: t, done: false })),
        portfolio: [], swipes: [], goals: []
      },
      fitness: {
        split: { 1: 'Push (Dada, Bahu, Trisep)', 3: 'Pull (Punggung, Bisep)', 5: 'Legs (Kaki & Core)' },
        exercises: [
          ['Bench Press', 'Dada'], ['Incline Dumbbell Press', 'Dada'], ['Overhead Press', 'Bahu'], ['Lateral Raise', 'Bahu'],
          ['Triceps Pushdown', 'Trisep'], ['Deadlift', 'Punggung'], ['Barbell Row', 'Punggung'], ['Lat Pulldown', 'Punggung'],
          ['Pull Up', 'Punggung'], ['Biceps Curl', 'Bisep'], ['Squat', 'Kaki'], ['Leg Press', 'Kaki'],
          ['Romanian Deadlift', 'Kaki'], ['Leg Curl', 'Kaki'], ['Calf Raise', 'Kaki'], ['Plank', 'Core']
        ].map(([name, muscle], i) => ({ id: 'ex' + i, name, muscle })),
        workouts: [], bodyweight: []
      },
      nutrition: {
        goal: 'bulking',
        targets: { kcal: 2800, p: 140, c: 360, f: 85, water: 3000 },
        customFoods: [], favorites: [], days: {} // { date: { meals:{breakfast:[],...}, water: ml } }
      },
      supplements: [{ id: 's_creatine', name: 'Creatine', dose: '', time: '06:30', active: true }],
      suppLogs: {},       // { date: { suppId: at } }
      selfControl: { active: false, activatedAt: '', streakStart: '', longest: 0, checkins: {}, notes: [], setbacks: [] },
      events: [],         // { id, title, type, date, start, end, recur, until, exceptions:[], reminder, notes }
      reminders: defaultReminders(gymDays),
      reminderLog: {},    // { 'date|reminderId': at }  (prevents duplicate firing)
      timer: null,        // running timer persisted across reloads
      migrations: { englishWeekend: true }
    };
  }

  // ---------------------------------------------------------------- migration / validation
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Data tidak valid');
    const base = defaultState();
    const needEnglishWeekend = !(raw.migrations && raw.migrations.englishWeekend);
    const merge = (def, val) => {
      if (Array.isArray(def)) return Array.isArray(val) ? val : def;
      if (def && typeof def === 'object') {
        const out = {};
        const v = val && typeof val === 'object' && !Array.isArray(val) ? val : {};
        for (const k of Object.keys(def)) out[k] = merge(def[k], v[k]);
        for (const k of Object.keys(v)) if (!(k in out)) out[k] = v[k];
        return out;
      }
      return val === undefined ? def : val;
    };
    const s = merge(base, raw);
    // objects that are maps must keep only the raw content (not defaults merged in)
    for (const k of ['logs', 'restDays', 'topPicks', 'achievements', 'suppLogs', 'reminderLog']) s[k] = (raw[k] && typeof raw[k] === 'object') ? raw[k] : {};
    s.nutrition.days = (raw.nutrition && raw.nutrition.days) || {};
    s.selfControl.checkins = (raw.selfControl && raw.selfControl.checkins) || {};
    if (raw.fitness && raw.fitness.split) s.fitness.split = raw.fitness.split;
    if (needEnglishWeekend) { // English practice: optional, but mandatory on Fri/Sat/Sun
      const e = s.habits.find(h => h.id === 'h_english');
      if (e && !e.mandatory && !(e.mandatoryDays && e.mandatoryDays.length)) e.mandatoryDays = [5, 6, 0];
      s.migrations.englishWeekend = true;
    }
    s.version = 1;
    return s;
  }

  // ---------------------------------------------------------------- XP & levels
  function xpRequired(level, base = 100, exp = 1.3) { // XP needed to go from `level` to `level+1`
    return Math.round(base * Math.pow(level, exp));
  }
  function cumulativeXP(level, base, exp) { // total XP needed to REACH `level`
    let t = 0;
    for (let l = 1; l < level; l++) t += xpRequired(l, base, exp);
    return t;
  }
  function rankFor(level) {
    return RANKS.find(r => level >= r.from && level <= r.to) || RANKS[RANKS.length - 1];
  }
  function levelInfo(total, base = 100, exp = 1.3) {
    total = Math.max(0, total);
    let level = 1, acc = 0;
    while (level < 100) {
      const need = xpRequired(level, base, exp);
      if (total < acc + need) break;
      acc += need; level++;
    }
    const max = level >= 100;
    const need = max ? 0 : xpRequired(level, base, exp);
    const into = total - acc;
    return { level, rank: rankFor(level), into, need, toNext: max ? 0 : need - into, progress: max ? 1 : into / need, total, max };
  }
  function totalXP(state) { return state.xpTx.reduce((a, t) => a + t.amount, 0); }
  function spentXP(state) { return state.redemptions.reduce((a, r) => a + (r.refunded ? 0 : r.cost), 0); }
  function balanceXP(state) { return totalXP(state) - spentXP(state); }
  function hasActiveTx(state, key) { return state.xpTx.some(t => t.key === key && !t.reversed && t.amount > 0); }

  /** Award XP once per unique key. Returns the transaction or null if duplicate/invalid. */
  function awardXP(state, { key, amount, source, label, date }, now = new Date()) {
    amount = Math.round(+amount || 0);
    if (!key || amount <= 0) return null;
    if (hasActiveTx(state, key)) return null; // duplicate-claim protection
    const tx = { id: uid('tx'), key, amount, source, label, date: date || dateKey(now), at: now.toISOString() };
    state.xpTx.push(tx);
    return tx;
  }
  /** Reverse an active award (e.g. user un-checks a task). History is kept: a negative tx is appended. */
  function revokeXP(state, key, label = 'Dibatalkan', now = new Date()) {
    const tx = state.xpTx.find(t => t.key === key && !t.reversed && t.amount > 0);
    if (!tx) return null;
    tx.reversed = true;
    const rev = { id: uid('tx'), key: key + '#rev', ref: tx.id, amount: -tx.amount, source: tx.source, label: label + ': ' + tx.label, date: dateKey(now), at: now.toISOString() };
    state.xpTx.push(rev);
    return rev;
  }
  function xpOnDate(state, k) { return state.xpTx.filter(t => t.date === k).reduce((a, t) => a + t.amount, 0); }

  // ---------------------------------------------------------------- habits & completion
  function isScheduled(h, k) {
    if (!h.days || !h.days.includes(weekday(k))) return false;
    if (h.createdAt && k < h.createdAt) return false;
    if (h.archivedAt && k >= h.archivedAt) return false;
    return true;
  }
  /** Mandatory on date k: always-mandatory, or optional habit that is mandatory on specific weekdays. */
  function isMandatoryOn(h, k) { return !!h.mandatory || !!(h.mandatoryDays && h.mandatoryDays.includes(weekday(k))); }
  function habitsFor(state, k) {
    return state.habits.filter(h => (h.active || h.archivedAt) && isScheduled(h, k) && (h.active || k < h.archivedAt))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  function statusOf(state, k, id) { return (state.logs[k] && state.logs[k][id]) || null; }

  function dayStats(state, k) {
    const hs = habitsFor(state, k);
    const log = state.logs[k] || {};
    const mand = hs.filter(h => isMandatoryOn(h, k));
    const skipped = mand.filter(h => log[h.id] && log[h.id].s === 'skipped').length;
    const done = mand.filter(h => log[h.id] && log[h.id].s === 'done').length;
    const total = mand.length - skipped;
    const optional = hs.filter(h => !isMandatoryOn(h, k));
    const optDone = optional.filter(h => log[h.id] && log[h.id].s === 'done').length;
    const allDone = hs.filter(h => log[h.id] && log[h.id].s === 'done').length;
    return {
      total, done, skipped, pct: total > 0 ? done / total : (mand.length ? 1 : 0),
      optionalTotal: optional.length, optionalDone: optDone, allTotal: hs.length, allDone,
      xp: xpOnDate(state, k), rest: !!state.restDays[k]
    };
  }
  function isSuccessDay(state, k) {
    if (state.restDays[k]) return 'rest';
    const st = dayStats(state, k);
    if (st.total === 0 && st.skipped === 0) return false;
    return st.pct * 100 >= state.settings.successThreshold;
  }
  /** Current streak: consecutive successful days. Today counts if already successful; otherwise
   *  the streak is "pending" today and counted up to yesterday. Rest days pause (don't break). */
  function currentStreak(state, today = dateKey()) {
    let n = 0, k = today;
    if (!isSuccessDay(state, today)) k = addDays(today, -1);
    while (k >= state.createdAt) {
      const s = isSuccessDay(state, k);
      if (s === 'rest') { k = addDays(k, -1); continue; }
      if (!s) break;
      n++; k = addDays(k, -1);
    }
    return n;
  }
  function longestStreak(state, today = dateKey()) {
    let best = 0, run = 0;
    for (const k of rangeKeys(state.createdAt, today)) {
      const s = isSuccessDay(state, k);
      if (s === 'rest') continue;
      if (s) { run++; best = Math.max(best, run); } else if (k !== today) run = 0;
    }
    return best;
  }
  function rangeCompletion(state, from, to) {
    let done = 0, total = 0;
    for (const k of rangeKeys(from, to)) {
      if (k < state.createdAt || state.restDays[k]) continue;
      const st = dayStats(state, k); done += st.done; total += st.total;
    }
    return { done, total, pct: total ? done / total : 0 };
  }
  function restDaysInWeek(state, k) {
    const s = startOfWeek(k);
    return rangeKeys(s, addDays(s, 6)).filter(d => state.restDays[d]).length;
  }
  function habitConsistency(state, h, from, to) {
    let sched = 0, done = 0;
    for (const k of rangeKeys(from, to)) {
      if (!isScheduled(h, k) || state.restDays[k]) continue;
      const st = statusOf(state, k, h.id);
      if (st && st.s === 'skipped') continue;
      sched++; if (st && st.s === 'done') done++;
    }
    return { sched, done, pct: sched ? done / sched : null };
  }
  function countDone(state, habitId) {
    let n = 0;
    for (const k in state.logs) if (state.logs[k][habitId] && state.logs[k][habitId].s === 'done') n++;
    return n;
  }
  function maxRun(state, habitId, today = dateKey()) {
    let best = 0, run = 0;
    for (const k of rangeKeys(state.createdAt, today)) {
      const st = statusOf(state, k, habitId);
      if (st && st.s === 'done') { run++; best = Math.max(best, run); } else if (k !== today) run = 0;
    }
    return best;
  }

  /** Top-3 priority missions: user pins first, then mandatory high-XP unfinished tasks. */
  function priorityTasks(state, k) {
    const hs = habitsFor(state, k);
    const log = state.logs[k] || {};
    const pinned = (state.topPicks[k] || []).map(id => hs.find(h => h.id === id)).filter(Boolean);
    const rest = hs.filter(h => !pinned.includes(h) && isMandatoryOn(h, k) && !(log[h.id] && log[h.id].s === 'skipped'))
      .sort((a, b) => {
        const da = log[a.id] && log[a.id].s === 'done' ? 1 : 0, db = log[b.id] && log[b.id].s === 'done' ? 1 : 0;
        return da - db || b.xp - a.xp || b.difficulty - a.difficulty;
      });
    return pinned.concat(rest).slice(0, 3);
  }

  // ---------------------------------------------------------------- module-derived numbers
  const minutesOn = (sessions, k) => sessions.filter(s => s.date === k).reduce((a, s) => a + (+s.minutes || 0), 0);
  const minutesIn = (sessions, from, to) => sessions.filter(s => s.date >= from && s.date <= to).reduce((a, s) => a + (+s.minutes || 0), 0);
  function studyTarget(state) { return state.settings.examMode ? state.settings.studyTargetExam : state.settings.studyTarget; }
  function nutritionDay(state, k) {
    const d = state.nutrition.days[k] || { meals: {}, water: 0 };
    const items = MEALS.flatMap(m => (d.meals && d.meals[m.id]) || []);
    const totals = sumNutrients(items);
    const mealsLogged = MEALS.filter(m => m.id !== 'snack' && d.meals && d.meals[m.id] && d.meals[m.id].length).length;
    return { totals, water: d.water || 0, mealsLogged, items: items.length };
  }
  function workoutsIn(state, from, to) { return state.fitness.workouts.filter(w => w.date >= from && w.date <= to); }

  /** Evaluate whether a linked habit's condition is satisfied on date k. */
  function linkSatisfied(state, h, k) {
    const L = h.link || '';
    if (L === 'study') return minutesOn(state.study.sessions, k) >= studyTarget(state);
    if (L === 'copy') return minutesOn(state.copy.sessions, k) >= state.settings.copyTarget;
    if (L === 'gym') return state.fitness.workouts.some(w => w.date === k);
    if (L === 'water') return nutritionDay(state, k).water >= state.nutrition.targets.water;
    if (L === 'meals') return nutritionDay(state, k).mealsLogged >= state.settings.mealsRequired;
    if (L.startsWith('supp:')) { const id = L.slice(5); return !!(state.suppLogs[k] && state.suppLogs[k][id]); }
    return null;
  }

  // ---------------------------------------------------------------- task actions (pure, mutate state)
  const habitKey = (id, k) => 'habit:' + id + ':' + k;
  function completeHabit(state, id, k, { auto = false } = {}, now = new Date()) {
    const h = state.habits.find(x => x.id === id);
    if (!h) return { ok: false, err: 'Habit tidak ditemukan' };
    if (k !== dateKey(now)) return { ok: false, err: 'Hanya tugas hari ini yang bisa diselesaikan' };
    state.logs[k] = state.logs[k] || {};
    const cur = state.logs[k][id];
    if (cur && cur.s === 'done') return { ok: false, err: 'Sudah selesai' };
    state.logs[k][id] = { s: 'done', at: now.toISOString(), auto: auto || undefined };
    const tx = awardXP(state, { key: habitKey(id, k), amount: h.xp, source: 'habit', label: h.name, date: k }, now);
    const bonus = checkRoutineBonus(state, k, now);
    return { ok: true, tx, bonus };
  }
  function uncompleteHabit(state, id, k, now = new Date()) {
    if (k !== dateKey(now)) return { ok: false, err: 'Riwayat hari sebelumnya tidak dapat diubah' };
    const cur = state.logs[k] && state.logs[k][id];
    if (!cur || cur.s !== 'done') return { ok: false };
    delete state.logs[k][id];
    revokeXP(state, habitKey(id, k), 'Dibatalkan', now);
    checkRoutineBonus(state, k, now);
    return { ok: true };
  }
  function skipHabit(state, id, k, reason, now = new Date()) {
    if (k !== dateKey(now)) return { ok: false, err: 'Hanya tugas hari ini' };
    state.logs[k] = state.logs[k] || {};
    if (state.logs[k][id] && state.logs[k][id].s === 'done') revokeXP(state, habitKey(id, k), 'Dilewati', now);
    state.logs[k][id] = { s: 'skipped', at: now.toISOString(), reason: (reason || '').trim() || 'Tanpa alasan' };
    checkRoutineBonus(state, k, now);
    return { ok: true };
  }
  function unskipHabit(state, id, k, now = new Date()) {
    if (k !== dateKey(now)) return { ok: false };
    if (state.logs[k] && state.logs[k][id] && state.logs[k][id].s === 'skipped') delete state.logs[k][id];
    return { ok: true };
  }
  /** Routine bonus: all mandatory morning tasks / all mandatory night tasks done. */
  function checkRoutineBonus(state, k, now = new Date()) {
    const res = [];
    for (const [period, amt, label] of [['morning', state.settings.bonusMorning, 'Bonus: rutinitas pagi lengkap'], ['night', state.settings.bonusNight, 'Bonus: rutinitas malam lengkap']]) {
      const hs = habitsFor(state, k).filter(h => h.period === period && isMandatoryOn(h, k));
      if (!hs.length) continue;
      const log = state.logs[k] || {};
      const relevant = hs.filter(h => !(log[h.id] && log[h.id].s === 'skipped'));
      const complete = relevant.length > 0 && relevant.every(h => log[h.id] && log[h.id].s === 'done');
      const key = 'bonus:' + period + ':' + k;
      if (complete) { const t = awardXP(state, { key, amount: amt, source: 'bonus', label, date: k }, now); if (t) res.push(t); }
      else if (hasActiveTx(state, key)) revokeXP(state, key, 'Dibatalkan', now);
    }
    return res;
  }
  /** Sync habits linked to modules (study/copy/gym/meals/water/supplements) for today. */
  function syncLinked(state, now = new Date()) {
    const k = dateKey(now);
    const changes = [];
    for (const h of habitsFor(state, k)) {
      if (!h.link || !h.active) continue;
      const ok = linkSatisfied(state, h, k);
      if (ok === null) continue;
      const st = statusOf(state, k, h.id);
      if (ok && !(st && st.s === 'done') && !(st && st.s === 'skipped')) { const r = completeHabit(state, h.id, k, { auto: true }, now); if (r.ok) changes.push({ h, done: true, r }); }
      else if (!ok && st && st.s === 'done' && st.auto) { uncompleteHabit(state, h.id, k, now); changes.push({ h, done: false }); }
    }
    return changes;
  }

  // ---------------------------------------------------------------- achievements
  function studyMinutesTotal(state) { return state.study.sessions.reduce((a, s) => a + (+s.minutes || 0), 0); }
  function mealDays(state) { return Object.keys(state.nutrition.days).filter(k => nutritionDay(state, k).mealsLogged >= state.settings.mealsRequired).length; }
  function bestWeekPct(state, today = dateKey()) {
    let best = 0;
    let w = startOfWeek(state.createdAt);
    while (w <= today) {
      const end = addDays(w, 6);
      if (end <= today) { // only completed weeks
        const r = rangeCompletion(state, w < state.createdAt ? state.createdAt : w, end);
        if (r.total >= 10) best = Math.max(best, r.pct);
      }
      w = addDays(w, 7);
    }
    return best;
  }
  const ACHIEVEMENTS = [
    { id: 'first_step', name: 'First Step', desc: 'Selesaikan tugas pertama.', xp: 50, icon: 'spark', tier: 1, prog: s => [s.xpTx.some(t => t.source === 'habit' && !t.reversed && t.amount > 0) ? 1 : 0, 1] },
    { id: 'consistent', name: 'Consistent', desc: 'Capai streak 3 hari berturut-turut.', xp: 100, icon: 'flame', tier: 1, prog: s => [longestStreak(s), 3] },
    { id: 'unstoppable', name: 'Unstoppable', desc: 'Capai streak 7 hari berturut-turut.', xp: 250, icon: 'flame', tier: 2, prog: s => [longestStreak(s), 7] },
    { id: 'relentless', name: 'Relentless', desc: 'Capai streak 30 hari berturut-turut.', xp: 1000, icon: 'flame', tier: 3, prog: s => [longestStreak(s), 30] },
    { id: 'iron', name: 'Iron Discipline', desc: 'Selesaikan 12 sesi gym.', xp: 300, icon: 'dumbbell', tier: 2, prog: s => [s.fitness.workouts.length, 12] },
    { id: 'iron50', name: 'Iron Veteran', desc: 'Selesaikan 50 sesi gym.', xp: 1000, icon: 'dumbbell', tier: 3, prog: s => [s.fitness.workouts.length, 50] },
    { id: 'knowledge', name: 'Knowledge Seeker', desc: 'Total 30 jam belajar kedokteran.', xp: 400, icon: 'book', tier: 2, prog: s => [Math.floor(studyMinutesTotal(s) / 60), 30] },
    { id: 'scholar', name: 'Scholar', desc: 'Total 100 jam belajar kedokteran.', xp: 1200, icon: 'book', tier: 3, prog: s => [Math.floor(studyMinutesTotal(s) / 60), 100] },
    { id: 'future_pro', name: 'Future Professional', desc: 'Selesaikan 30 sesi copywriting.', xp: 400, icon: 'pen', tier: 2, prog: s => [s.copy.sessions.length, 30] },
    { id: 'nutrition', name: 'Nutrition Master', desc: 'Tracking makan lengkap selama 30 hari.', xp: 400, icon: 'leaf', tier: 2, prog: s => [mealDays(s), 30] },
    { id: 'perfect_week', name: 'Perfect Week', desc: 'Capai ≥90% penyelesaian dalam satu minggu penuh.', xp: 500, icon: 'crown', tier: 3, prog: s => [Math.round(bestWeekPct(s) * 100), 90] },
    { id: 'early_bird', name: 'Early Bird', desc: 'Bangun tepat waktu 7 hari berturut-turut.', xp: 200, icon: 'sunrise', tier: 2, prog: s => [maxRun(s, 'h_wake'), 7] },
    { id: 'clean_env', name: 'Clean Environment', desc: 'Bersihkan kamar selama 14 hari.', xp: 200, icon: 'home', tier: 2, prog: s => [countDone(s, 'h_room'), 14] },
    { id: 'hydrated', name: 'Hydrated', desc: 'Capai target air minum 14 hari.', xp: 150, icon: 'drop', tier: 1, prog: s => [Object.keys(s.nutrition.days).filter(k => (s.nutrition.days[k].water || 0) >= s.nutrition.targets.water).length, 14] },
    { id: 'gold', name: 'Golden Path', desc: 'Capai rank Gold (Level 11).', xp: 300, icon: 'medal', tier: 2, prog: s => [levelInfo(totalXP(s), s.settings.levelBase, s.settings.levelExp).level, 11] }
  ];
  /** Returns newly unlocked achievements (and awards their XP). Loops until stable because XP can unlock 'gold'. */
  function checkAchievements(state, now = new Date()) {
    if (!state.settings.achievementsEnabled) return [];
    const unlocked = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of ACHIEVEMENTS) {
        if (state.achievements[a.id]) continue;
        const [cur, tgt] = a.prog(state);
        if (cur >= tgt) {
          state.achievements[a.id] = { at: now.toISOString(), date: dateKey(now) };
          awardXP(state, { key: 'ach:' + a.id, amount: a.xp, source: 'achievement', label: 'Achievement: ' + a.name }, now);
          unlocked.push(a); changed = true;
        }
      }
    }
    return unlocked;
  }
  function nextAchievement(state) {
    let best = null;
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id]) continue;
      const [cur, tgt] = a.prog(state);
      const p = Math.min(1, cur / tgt);
      if (!best || p > best.p) best = { a, p, cur, tgt };
    }
    return best;
  }

  // ---------------------------------------------------------------- private challenge (no explicit wording here on purpose)
  const PRIVATE_MILESTONES = [1, 3, 7, 14, 30, 60, 90];
  const PRIVATE_XP = { 1: 20, 3: 50, 7: 150, 14: 300, 30: 600, 60: 1000, 90: 1500 };
  function privateStreak(state, today = dateKey()) {
    const sc = state.selfControl;
    if (!sc.active || !sc.streakStart) return 0;
    return Math.max(0, daysBetween(sc.streakStart, today));
  }
  function privateClaimMilestones(state, now = new Date()) {
    const sc = state.selfControl;
    const days = privateStreak(state, dateKey(now));
    sc.longest = Math.max(sc.longest || 0, days);
    const got = [];
    for (const m of PRIVATE_MILESTONES) {
      if (days < m) continue;
      const key = 'pv:' + sc.streakStart + ':' + m;
      if (state.settings.private.xpEnabled) {
        const t = awardXP(state, { key, amount: PRIVATE_XP[m], source: 'private', label: 'Milestone privat' }, now);
        if (t) got.push(m);
      }
    }
    return got;
  }
  function privateSetback(state, note, now = new Date()) {
    const sc = state.selfControl;
    const today = dateKey(now);
    const days = privateStreak(state, today);
    sc.longest = Math.max(sc.longest || 0, days);
    sc.setbacks.push({ date: today, at: now.toISOString(), streak: days, note: (note || '').trim() });
    sc.checkins[today] = { s: 'setback', at: now.toISOString() };
    sc.streakStart = today;
  }

  // ---------------------------------------------------------------- calendar recurrence
  function occursOn(ev, k) {
    if (!ev.date || k < ev.date) return false;
    if (ev.until && k > ev.until) return false;
    if (ev.exceptions && ev.exceptions.includes(k)) return false;
    switch (ev.recur) {
      case 'daily': return true;
      case 'weekly': return (ev.days && ev.days.length ? ev.days : [weekday(ev.date)]).includes(weekday(k));
      case 'monthly': return parseKey(k).getDate() === parseKey(ev.date).getDate();
      default: return k === ev.date;
    }
  }
  /** All calendar items for date k: user events + derived schedule (university, gym, exams, assignments, logs). */
  function calendarItems(state, k) {
    const out = [];
    const wd = weekday(k);
    if (state.schedule.uniDays.includes(wd)) out.push({ kind: 'university', title: 'Kuliah', start: state.schedule.uniStart, end: state.schedule.uniEnd, derived: true });
    if (state.settings.gymDays.includes(wd)) {
      const done = state.fitness.workouts.some(w => w.date === k);
      out.push({ kind: 'gym', title: 'Gym' + (state.fitness.split[wd] ? ' — ' + state.fitness.split[wd] : ''), start: state.settings.gymTime, end: fromMin(toMin(state.settings.gymTime) + (+state.settings.gymDuration || 60)), derived: true, done });
    }
    for (const e of state.study.exams) if (e.date === k) out.push({ kind: 'exam', title: 'Ujian: ' + e.title, start: e.time || '', derived: true });
    for (const a of state.study.assignments) if (a.due === k) out.push({ kind: 'deadline', title: 'Deadline: ' + a.title, derived: true, done: a.done });
    const sm = minutesOn(state.study.sessions, k);
    if (sm) out.push({ kind: 'study', title: 'Belajar ' + sm + ' menit', derived: true, done: true });
    const cm = minutesOn(state.copy.sessions, k);
    if (cm) out.push({ kind: 'copy', title: 'Copywriting ' + cm + ' menit', derived: true, done: true });
    for (const ev of state.events) if (occursOn(ev, k)) out.push(Object.assign({ kind: ev.type || 'personal' }, ev, { occurrence: k }));
    return out.sort((a, b) => (a.start || '99').localeCompare(b.start || '99'));
  }

  // ---------------------------------------------------------------- reminders
  function inQuietHours(state, min) {
    const q = state.settings.notif;
    const s = toMin(q.quietStart), e = toMin(q.quietEnd);
    if (s == null || e == null || s === e) return false;
    return s < e ? (min >= s && min < e) : (min >= s || min < e);
  }
  /** Reminders that are due now (within the last `windowMin` minutes) and not yet fired today. */
  function dueReminders(state, now = new Date(), windowMin = 10) {
    const k = dateKey(now), wd = now.getDay(), cur = now.getHours() * 60 + now.getMinutes();
    const list = [];
    const all = state.reminders.concat(eventReminders(state, k));
    for (const r of all) {
      if (!r.enabled || !r.days.includes(wd)) continue;
      const t = toMin(r.time);
      if (t == null || cur < t || cur - t > windowMin) continue;
      if (state.reminderLog[k + '|' + r.id]) continue;
      if (inQuietHours(state, t)) continue;
      list.push(r);
    }
    return list;
  }
  /** Reminders whose time passed today but were not shown (app was closed) — for the in-app fallback. */
  function missedReminders(state, now = new Date()) {
    const k = dateKey(now), wd = now.getDay(), cur = now.getHours() * 60 + now.getMinutes();
    return state.reminders.filter(r => r.enabled && r.days.includes(wd) && toMin(r.time) <= cur && !state.reminderLog[k + '|' + r.id] && r.type !== 'private');
  }
  function eventReminders(state, k) {
    const out = [];
    for (const ev of state.events) {
      if (ev.reminder == null || ev.reminder === '' || !ev.start || !occursOn(ev, k)) continue;
      out.push({ id: 'ev:' + ev.id, label: ev.title, time: fromMin(toMin(ev.start) - (+ev.reminder || 0)), days: ALL, type: 'event', body: ev.title + ' pukul ' + ev.start, enabled: true });
    }
    return out;
  }
  function nextReminderTime(state, now = new Date()) {
    let best = null;
    for (let d = 0; d < 8; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      const k = dateKey(day);
      for (const r of state.reminders.concat(eventReminders(state, k))) {
        if (!r.enabled || !r.days.includes(day.getDay())) continue;
        const t = toMin(r.time);
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(t / 60), t % 60);
        if (at <= now || inQuietHours(state, t)) continue;
        if (!best || at < best.at) best = { r, at };
      }
      if (best) return best;
    }
    return best;
  }

  // ---------------------------------------------------------------- ICS export (reliable OS-level alarms via calendar app)
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function buildICS(state, now = new Date()) {
    const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const k = dateKey(now).replace(/-/g, '');
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LIFE OS//Reminders//ID', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:LIFE OS'];
    for (const r of state.reminders) {
      if (!r.enabled || !r.days.length) continue;
      const t = r.time.replace(':', '') + '00';
      const end = fromMin(toMin(r.time) + 15).replace(':', '') + '00';
      lines.push('BEGIN:VEVENT', 'UID:' + r.id + '@lifeos', 'DTSTAMP:' + stamp,
        'DTSTART:' + k + 'T' + t, 'DTEND:' + k + 'T' + end,
        'RRULE:FREQ=WEEKLY;BYDAY=' + r.days.map(d => BYDAY[d]).join(','),
        'SUMMARY:' + icsEscape(r.type === 'private' ? 'Check-in harian' : r.label),
        'DESCRIPTION:' + icsEscape(r.type === 'private' ? '' : r.body),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(r.type === 'private' ? 'Check-in harian' : r.label), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  // ---------------------------------------------------------------- misc helpers
  function greeting(now = new Date()) {
    const h = now.getHours();
    if (h < 4) return 'Selamat malam';
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
  }
  function currentPeriod(state, now = new Date()) {
    const m = now.getHours() * 60 + now.getMinutes();
    const uni = state.schedule.uniDays.includes(now.getDay());
    if (m < toMin(state.schedule.uniStart)) return 'morning';
    if (uni && m < toMin(state.schedule.uniEnd)) return 'university';
    if (m < 18 * 60) return 'afternoon';
    if (m < 21 * 60) return 'evening';
    return 'night';
  }
  function epley1RM(w, r) { return r > 0 && w > 0 ? Math.round(w * (1 + r / 30) * 10) / 10 : 0; }
  function personalRecords(state) {
    const pr = {};
    for (const w of state.fitness.workouts) for (const s of w.sets || []) {
      const cur = pr[s.exerciseId] || { weight: 0, reps: 0, e1rm: 0, date: '' };
      const e = epley1RM(+s.weight, +s.reps);
      if (+s.weight > cur.weight || (+s.weight === cur.weight && +s.reps > cur.reps)) Object.assign(cur, { weight: +s.weight, reps: +s.reps, date: w.date });
      if (e > cur.e1rm) cur.e1rm = e;
      pr[s.exerciseId] = cur;
    }
    return pr;
  }
  function overlapsUniversity(state, wd, start, durationMin) {
    if (!state.schedule.uniDays.includes(wd)) return false;
    const s = toMin(start), e = s + (+durationMin || 0);
    return s < toMin(state.schedule.uniEnd) && e > toMin(state.schedule.uniStart);
  }

  const api = {
    uid, pad, clamp, round1, dateKey, parseKey, addDays, weekday, daysBetween, startOfWeek, rangeKeys, toMin, fromMin, formatDate,
    DAY_NAMES, DAY_SHORT, MONTHS, PERIODS, CATEGORIES, DIFFICULTY, RANKS, MEALS, FOOD_DB, ALL, WEEKDAYS,
    nutrientsFor, sumNutrients, suggestTargets, defaultState, defaultHabits, migrate,
    xpRequired, cumulativeXP, rankFor, levelInfo, totalXP, spentXP, balanceXP, awardXP, revokeXP, hasActiveTx, xpOnDate,
    isScheduled, isMandatoryOn, habitsFor, statusOf, dayStats, isSuccessDay, currentStreak, longestStreak, rangeCompletion, restDaysInWeek,
    habitConsistency, countDone, maxRun, priorityTasks, minutesOn, minutesIn, studyTarget, nutritionDay, workoutsIn, linkSatisfied,
    habitKey, completeHabit, uncompleteHabit, skipHabit, unskipHabit, checkRoutineBonus, syncLinked,
    ACHIEVEMENTS, checkAchievements, nextAchievement, studyMinutesTotal, mealDays, bestWeekPct,
    PRIVATE_MILESTONES, PRIVATE_XP, privateStreak, privateClaimMilestones, privateSetback,
    occursOn, calendarItems, inQuietHours, dueReminders, missedReminders, eventReminders, nextReminderTime, buildICS,
    greeting, currentPeriod, epley1RM, personalRecords, overlapsUniversity
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LifeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
