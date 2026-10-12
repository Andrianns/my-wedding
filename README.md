# Undangan Pernikahan 3D

Undangan pernikahan berbentuk game 3D low poly ala Harvest Moon, berlatar hotel mewah. Tamu mulai di forecourt hotel (blok kamar dengan jendela menyala, nama hotel di mahkota atap, kanopi lobby, kolam refleksi, palem, doorman), lalu masuk lewat pintu kaca geser otomatis. Saat masuk, fasad dan atap memudar sambil naik sehingga seluruh Grand Ballroom kelihatan: karpet navy damask, pelaminan dinding bunga, meja bundar tamu, chandelier, dan **TV LED** di dinding belakang kanan yang menampilkan ucapan tamu secara bergulir (tap TV untuk membuka semua ucapan).

Begitu pertama kali masuk Grand Ballroom, popup **Undangan** terbuka otomatis: satu popup yang bisa di-scroll dengan segmen berurutan **Acara → Cerita Kami → Lokasi → Galeri → RSVP → Ucapan** (navigasi segmen menempel di atas, segmen yang sudah terlihat ditandai ✓). Setelah popup ditutup, tombol kanan bawah berubah menjadi **HP**. HP berisi app untuk tiap segmen, app "Undangan" (popup lengkap), dan "Musik". Membuka HP dan app memakai animasi; menutup app kembali ke layar HP. Kopi (anjing) tidak ikut masuk ballroom, ia menunggu di depan pintu lobby.

Di dalam ballroom juga ada **food stall** (Sate Ayam, Bakso, Es Puter) dan **meja buffet** di sisi kiri, serta **panggung band** live music di sisi kanan. Penjual, menu buffet, dan nama band diatur di `W.food` dan `W.band`. Tap stall untuk ambil makanan, tap buffet untuk lihat menu, tap band untuk menyalakan musik.

Satu file statis (`index.html`, Three.js r128 dari CDN) plus satu Vercel function (`api/rsvp.js`). Tanpa build step. Mobile-first.

## Kontrol
- HP: joystick kiri bawah, tombol **A** kanan bawah (berubah jadi tombol HP setelah popup undangan dibaca), tap lantai untuk jalan otomatis, pinch untuk zoom.
- Laptop: WASD / panah, Space / Enter / E untuk aksi, P untuk buka/tutup HP, Esc untuk menutup, scroll untuk zoom.

## Ganti data undangan
Edit objek `W` di bagian atas `<script>` dalam `index.html` (nama, orang tua, tanggal, jam acara, venue, nomor WhatsApp RSVP, cerita, caption galeri). Nama venue otomatis tampil di papan nama gedung, nama mempelai di papan selamat datang dan monogram pelaminan.

## RSVP, kursi tamu, dan Ucapan
- Tamu mengisi RSVP di segmen **RSVP** (popup undangan atau app RSVP di HP). Datanya disimpan di Upstash Redis lewat `api/rsvp.js`.
- Setiap RSVP "Hadir" muncul sebagai tamu yang duduk di meja bundar ballroom (10 meja x 5 kursi = 50 kursi, yang paling dekat pelaminan diisi duluan). Kalau lebih dari 50, yang tampil 50 RSVP "Hadir" terbaru. Tap tamu yang duduk untuk lihat namanya.
- Daftar lengkap tamu yang sudah konfirmasi ada di bawah form RSVP (bisa "Muat lebih banyak").
- Segmen **Ucapan** dan TV LED di ballroom menampilkan semua ucapan untuk semua tamu.
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
