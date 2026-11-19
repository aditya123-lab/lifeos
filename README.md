# LIFE OS
**Build Discipline. Track Progress. Master Your Life.**

Sistem operasi pribadi berbasis web (PWA): habit tracker, planner akademik kedokteran, copywriting tracker, gym & nutrisi, suplemen, ruang privat, kalender, analytics, dan sistem XP/level 1–100.

Tanpa backend, tanpa API key, tanpa layanan berbayar. Semua data tersimpan di browser perangkatmu.

---

## 1. Struktur proyek

```
lifeos/
├── index.html              # app shell
├── manifest.webmanifest    # konfigurasi PWA (ikon, nama, shortcut)
├── sw.js                   # service worker: offline, klik notifikasi, Web Push
├── css/styles.css          # desain (dark + light, mobile-first)
├── icons/                  # ikon PWA (192, 512, maskable, badge, svg)
├── js/
│   ├── core.js             # LOGIKA MURNI: tanggal, XP, level, streak, achievement, nutrisi, kalender, pengingat, .ics
│   ├── store.js            # penyimpanan localStorage, snapshot harian, ekspor/impor
│   ├── ui.js               # komponen: ikon, modal, form, toast, chart SVG, badge, animasi
│   ├── app.js              # router, navigasi, commit state, feedback XP/level-up, timer Pomodoro
│   ├── notify.js           # service worker, notifikasi, pengingat, Web Push (opsional)
│   └── pages/              # dashboard, habits, study, copywriting, fitness, nutrition,
│                           # supplements, private, calendar, progress (+achievements, rewards), settings
├── tests/core.test.js      # 17 unit test logika inti (node tests/core.test.js)
└── push-server/            # OPSIONAL: server Web Push self-hosted (Node.js)
```

Arsitektur: vanilla HTML/CSS/JS tanpa build step dan tanpa library eksternal (chart dibuat dengan SVG sendiri), jadi seluruh aplikasi bisa jalan offline.

---

## 2. Menjalankan secara lokal

Butuh server lokal (service worker & notifikasi tidak jalan dari `file://`). Pilih salah satu:

```bash
cd lifeos
python3 -m http.server 8080        # lalu buka http://localhost:8080
# atau
npx serve .
```

Membuka `index.html` langsung (double-click) tetap bisa dipakai, tetapi tanpa service worker, offline mode, dan notifikasi sistem.

Menjalankan unit test:
```bash
node tests/core.test.js
```

---

## 3. Memasang sebagai aplikasi di Android (PWA)

PWA harus disajikan lewat **HTTPS**. Cara gratis paling mudah:

**Opsi A — Netlify Drop (paling cepat, dari laptop)**
1. Buka https://app.netlify.com/drop
2. Seret folder `lifeos` ke halaman itu → kamu dapat URL `https://nama-acak.netlify.app`

**Opsi B — GitHub Pages**
1. Buat repo baru, upload isi folder `lifeos` (pastikan `index.html` ada di root).
2. Settings → Pages → Source: `main` / root → simpan. URL: `https://username.github.io/nama-repo/`

**Lalu di HP Android (Chrome):**
1. Buka URL tadi di Chrome.
2. Pengaturan LIFE OS → Notifikasi → **Pasang aplikasi**, *atau* menu ⋮ Chrome → **Instal aplikasi / Tambahkan ke layar utama**.
3. Buka LIFE OS dari ikon di layar utama → berjalan full-screen seperti aplikasi native.
4. Pengaturan → Notifikasi → **Izinkan notifikasi** → tekan **Kirim notifikasi uji**.

> Data tersimpan per-browser per-domain. Kalau ganti URL hosting atau ganti HP, pindahkan data dengan **Pengaturan → Data & Backup → Ekspor** lalu **Impor** di tempat baru.

---

## 4. Notifikasi — penjelasan jujur

| Situasi | Apakah notifikasi muncul? | Mekanisme |
|---|---|---|
| LIFE OS terbuka / di background dan belum dibekukan browser | ✅ Ya, notifikasi sistem asli | `ServiceWorkerRegistration.showNotification()` dicek tiap 20 detik + timer presisi ke pengingat berikutnya |
| Timer Pomodoro selesai saat app terbuka | ✅ Ya | sama |
| App/browser **ditutup penuh** | ❌ Tidak (tanpa server) | Web page tidak bisa menjalankan timer saat ditutup — ini batasan platform, bukan bug |
| App ditutup + kamu **ekspor pengingat ke kalender (.ics)** | ✅ Ya, alarm dari Google Calendar/Kalender Android | **Disarankan.** Tanpa server, sangat andal |
| App ditutup + **Web Push server** dijalankan | ✅ Ya | Opsional, lihat `push-server/` |
| Izin notifikasi ditolak / tidak didukung | Fallback dalam aplikasi | Toast + banner "Pengingat terlewat" di Dashboard |

Catatan lain:
- **Notification Triggers** (notifikasi terjadwal lokal) dipakai otomatis *hanya jika* browser menyediakannya. API ini eksperimental dan umumnya tidak ada di Chrome stabil — halaman Pengaturan → Notifikasi menampilkan status sebenarnya.
- **Jam tenang** (default 22:30–04:45) menahan pengingat.
- **Privasi**: pengingat Ruang Privat selalu berteks generik ("Waktunya check-in harian singkat."), termasuk di file .ics dan Web Push.
- Android bisa menunda/membekukan tab background untuk hemat baterai. Untuk pengingat penting, pakai ekspor .ics.

### Web Push (opsional, lanjutan)
```bash
cd push-server
npm install
npx web-push generate-vapid-keys      # salin ke .env (lihat .env.example)
npm start                              # Node.js ≥ 20.6
```
Di LIFE OS (harus di HTTPS): Pengaturan → Notifikasi → Setup Web Push → tempel **public key** → Subscribe → salin JSON yang muncul ke `push-server/subscription.json` (atau POST ke `/subscribe`). Server harus selalu menyala (VPS, Raspberry Pi, Fly.io, Render, dsb.). VAPID **private key** hanya di server, tidak pernah di frontend.

---

## 5. Fitur yang sudah diimplementasikan

**Dashboard** — sapaan sesuai waktu, tanggal, profil, level & rank, % penyelesaian harian, tugas selesai/total, XP hari ini, streak, 3 misi prioritas (bisa di-pin manual), misi per waktu (Pagi/Kuliah/Siang-Sore/Malam/Sebelum Tidur, waktu saat ini disorot), akses cepat, ringkasan belajar/copywriting/gym/kalori, agenda hari ini, countdown ujian, achievement berikutnya, hari istirahat (streak aman, kuota per minggu).

**Habit & checklist** — 28 habit awal sesuai profil; tambah/edit/arsip, kategori, jadwal hari, jam, kesulitan, XP, wajib vs opsional, pengingat per habit, urutan; lewati dengan alasan; riwayat 30 hari + heatmap konsistensi per habit; riwayat permanen (hari lalu hanya-baca, habit yang dihapus diarsipkan, bukan dihilangkan). Habit terintegrasi modul selesai **otomatis**: belajar (target menit), copywriting, gym (workout dicatat), air minum, tracking makan, suplemen.

**XP & level** — XP hanya saat selesai; satu klaim per habit per hari (kunci unik); membatalkan = transaksi negatif (riwayat utuh, tidak bisa di-farm); bonus rutinitas pagi/malam lengkap; 100 level, 7 rank (Bronze→Immortal), kurva progresif `basis × L^eksponen` (default 100 × L^1.3, bisa diubah); animasi level-up; riwayat transaksi XP lengkap.

**Achievement** — 15 badge (First Step, Consistent, Unstoppable, Iron Discipline, Knowledge Seeker, Future Professional, Nutrition Master, Perfect Week, Early Bird, Clean Environment, dll.), artwork SVG, syarat, progres, XP reward, tanggal buka, galeri terkunci/terbuka.

**Reward Shop** — opsional; reward & harga XP kustom, konfirmasi, riwayat; saldo terpisah dari level (menukar tidak menurunkan level).

**Belajar kedokteran** — Pomodoro 25/5, 50/10, kustom, stopwatch (akurat walau layar dikunci, berlanjut setelah reload, blok fokus otomatis dicatat); catat manual; mata kuliah berwarna; tugas & deadline; checklist belajar; countdown ujian; mode ujian (target berbeda); statistik harian/mingguan/bulanan/per mata kuliah.

**Copywriting** — timer, target harian, jenis latihan, materi belajar, portfolio (ide→draft→revisi→selesai), swipe file, goal/milestone kustom, statistik mingguan & bulanan.

**Fitness** — kalender mingguan, target sesi, log workout (latihan × beban × repetisi, isi dari sesi sebelumnya), database latihan, personal record + estimasi 1RM, riwayat, statistik mingguan & volume, program/split kustom (divalidasi tidak bentrok jam kuliah), berat badan + grafik.

**Nutrisi** — sarapan/siang/malam/camilan; database 34 makanan umum Indonesia (estimasi, berlabel sumber); cari, porsi preset, gram; makanan kustom; template/favorit; input manual; edit porsi; kalori & makro dengan progress bar + sisa target; air minum; riwayat harian/14 hari/mingguan/bulanan; target bisa diubah; kalkulator saran (Mifflin-St Jeor) yang **hanya diterapkan setelah kamu setuju**. Default tujuan: bulking.

**Suplemen** — creatine harian; tambah suplemen lain manual; pengingat; streak; riwayat 30 hari; hari terlewat.

**Ruang Privat (Self-Control Challenge)** — check-in harian, streak & terpanjang, milestone 1/3/7/14/30/60/90 hari, XP opsional (tercatat sebagai "Milestone privat"), refleksi, setback tanpa menghakimi (riwayat & rekor tetap tersimpan), reset manual, PIN layar privasi, terkunci otomatis saat keluar. Tidak tampil di dashboard/achievement/notifikasi; di Progress hanya jika diaktifkan, dengan label netral.

**Kalender** — tampilan hari/minggu/bulan; event tambah/edit/hapus, berulang (harian/mingguan/bulanan, sampai tanggal), hapus satu kejadian, pengingat event; otomatis menampilkan kuliah, gym, sesi belajar & copywriting, ujian, deadline; status selesai/akan datang.

**Analytics** — penyelesaian harian/mingguan/bulanan, total XP, level, streak, jam belajar/copywriting per minggu, frekuensi gym, konsistensi nutrisi, heatmap 12 minggu, habit terkuat & perlu ditingkatkan, insight otomatis (hari terkuat/terlemah, alasan skip terbanyak), laporan mingguan & bulanan yang bisa dinavigasi.

**Pengaturan** — profil, jam bangun/tidur, jadwal kuliah, blok jadwal mingguan, semua target, Pomodoro, ambang hari sukses, kuota istirahat, kurva level, XP tiap habit, bonus, toggle achievement/reward, notifikasi & jam tenang, daftar pengingat, tema gelap/terang/sistem, backup.

**Data** — localStorage (persisten, minta `navigator.storage.persist()`), ekspor/impor JSON dengan validasi + salinan pengaman, snapshot otomatis harian (5 terakhir), ekspor CSV riwayat habit, reset data privat, reset total (dengan konfirmasi ganda). Reset harian otomatis berbasis tanggal lokal tanpa menghapus riwayat.

**PWA** — manifest, ikon (termasuk maskable), shortcut, service worker offline (stale-while-revalidate), tombol install, klik notifikasi membuka halaman terkait.

---

## 6. Yang membutuhkan infrastruktur eksternal / keterbatasan

1. **Notifikasi saat aplikasi tertutup penuh** → butuh Web Push server (`push-server/`, harus selalu menyala) **atau** gunakan ekspor `.ics` ke kalender (tanpa server).
2. **Sinkronisasi antar-perangkat** → belum ada (tidak ada backend). Gunakan ekspor/impor backup.
3. **Hosting HTTPS** untuk instalasi PWA di Android → gratis via Netlify/GitHub Pages/Cloudflare Pages.
4. **Bahasa Inggris** → pengaturan bahasa tersedia tapi terjemahan belum dibuat (tombol ditandai "segera").
5. **Data gizi** → semua estimasi; verifikasi dengan TKPI atau label kemasan bila butuh presisi.
6. **PIN Ruang Privat** → layar privasi, bukan enkripsi. Siapa pun dengan akses ke browser/devtools bisa membaca localStorage.

---

## 7. Hasil pengujian

- `node tests/core.test.js` → 17/17 lulus: kurva XP & rank, pencegahan XP ganda, toggle tidak bisa di-farm, skip tanpa XP, hari lalu read-only, reset harian, bonus rutinitas, streak + hari istirahat, agregasi mingguan, auto-complete modul, kalkulasi makro, achievement sekali, milestone privat, rekurensi kalender, validasi bentrok gym-kuliah, jendela pengingat + jam tenang + anti-duplikat, privasi .ics, migrasi data.
- Uji end-to-end di Chrome headless (mobile 390px & desktop 1366px): semua 41 rute/tab dirender tanpa error, XP bertambah & bertahan setelah reload, sesi belajar → habit otomatis selesai, tambah makanan (100 g telur = 155 kkal), air → habit selesai, suplemen → habit selesai, log workout, event berulang, ruang privat tidak bocor ke dashboard, PIN lock, timer Pomodoro (blok fokus tercatat, fase istirahat), ekspor → reset → impor identik, service worker aktif, tema terang.
