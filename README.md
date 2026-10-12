# Undangan Pernikahan 3D

Undangan pernikahan berbentuk game 3D low poly ala Harvest Moon. Tamu mulai di halaman depan gedung resepsi (fasad, kubah, red carpet, air mancur), lalu masuk lewat pintu utama. Begitu di dalam, atap dan dinding depan disembunyikan sehingga seluruh ballroom kelihatan: pelaminan, meja bundar tamu, kue pengantin, dan 6 pilar info: **RSVP**, **Acara**, **Galeri**, **Lokasi**, **Cerita Kami**, dan **Ucapan**.

Satu file statis (`index.html`, Three.js r128 dari CDN) plus satu Vercel function (`api/rsvp.js`). Tanpa build step. Mobile-first.

## Kontrol
- HP: joystick kiri bawah, tombol **A** kanan bawah, tap tanah/pilar untuk jalan otomatis, pinch untuk zoom.
- Laptop: WASD / panah, Space / Enter / E untuk aksi, scroll untuk zoom.

## Ganti data undangan
Edit objek `W` di bagian atas `<script>` dalam `index.html` (nama, orang tua, tanggal, jam acara, venue, nomor WhatsApp RSVP, cerita, caption galeri). Nama venue otomatis tampil di papan nama gedung, nama mempelai di papan selamat datang dan monogram pelaminan.

## RSVP, kursi tamu, dan pilar Ucapan
- Tamu mengisi RSVP di pilar **RSVP**. Datanya disimpan di Upstash Redis lewat `api/rsvp.js`.
- Setiap RSVP "Hadir" muncul sebagai tamu yang duduk di meja bundar ballroom (10 meja x 5 kursi = 50 kursi, yang paling dekat pelaminan diisi duluan). Kalau lebih dari 50, yang tampil 50 RSVP "Hadir" terbaru. Tap tamu yang duduk untuk lihat namanya.
- Daftar lengkap tamu yang sudah konfirmasi ada di bawah form RSVP (bisa "Muat lebih banyak").
- Pilar **Ucapan** menampilkan semua ucapan untuk semua tamu.
- Satu perangkat = satu RSVP. Kirim ulang dari perangkat yang sama akan memperbarui, bukan menambah.
- Batas 8 kiriman per IP per 10 menit untuk mencegah spam.

Setup sekali: di Vercel buka project → **Storage** → sambungkan database **Upstash Redis** (yang sudah ada atau buat baru) ke environment Production, lalu jalankan ulang workflow deploy. API membaca `KV_REST_API_URL`/`KV_REST_API_TOKEN` atau `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Semua key diberi awalan `wedding-three:` (bisa diganti lewat env `RSVP_PREFIX`), jadi aman berbagi database dengan project lain.

Selama database belum tersambung, game tetap jalan: kursi kosong dan RSVP otomatis jatuh ke kirim lewat WhatsApp.

## Nama tamu di link
Tambahkan `#Nama_Tamu` di akhir URL, misalnya `https://<domain>/#Budi_Santoso`. Cover akan menampilkan "Kepada Yth. Budi Santoso".

## Deploy
Deploy jalan lewat GitHub Actions (`.github/workflows/deploy.yml`), bukan auto-deploy bawaan Vercel. Alasannya: di plan Hobby, repo private hanya bisa di-deploy dari commit milik pemilik akun Vercel, jadi commit kolaborator lain akan "Deployment Blocked".

- Setiap push ke `main` menjalankan workflow yang deploy ke production memakai token pemilik akun Vercel.
- Auto-deploy Git di Vercel dimatikan lewat `vercel.json` (`git.deploymentEnabled: false`).
- Deploy manual: tab **Actions** → **Deploy ke Vercel** → **Run workflow**.

Setup sekali: buat token di Vercel (Account Settings → Tokens), lalu simpan sebagai secret `VERCEL_TOKEN` di repo ini (Settings → Secrets and variables → Actions).
