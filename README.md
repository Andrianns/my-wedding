# Kebun Restu

Undangan pernikahan berbentuk game 3D low poly ala Harvest Moon. Tamu menggerakkan karakter di sebuah kebun dan mengunjungi pilar-pilar info: **Acara**, **Lokasi**, **Galeri**, **Cerita Kami**, dan **RSVP**.

Satu file statis (`index.html`), Three.js r128 dari CDN, tanpa build step. Mobile-first.

## Kontrol
- HP: joystick kiri bawah, tombol **A** kanan bawah, tap tanah/pilar untuk jalan otomatis, pinch untuk zoom.
- Laptop: WASD / panah, Space / Enter / E untuk aksi, scroll untuk zoom.

## Ganti data undangan
Edit objek `W` di bagian atas `<script>` dalam `index.html` (nama, orang tua, tanggal, jam acara, venue, nomor WhatsApp RSVP, cerita, caption galeri). Semua data saat ini masih **contoh**.

## Nama tamu di link
Tambahkan `#Nama_Tamu` di akhir URL, misalnya `https://<domain>/#Budi_Santoso`. Cover akan menampilkan "Kepada Yth. Budi Santoso".

## Deploy
Deploy jalan lewat GitHub Actions (`.github/workflows/deploy.yml`), bukan auto-deploy bawaan Vercel. Alasannya: di plan Hobby, repo private hanya bisa di-deploy dari commit milik pemilik akun Vercel, jadi commit kolaborator lain akan "Deployment Blocked".

- Setiap push ke `main` menjalankan workflow yang deploy ke production memakai token pemilik akun Vercel.
- Auto-deploy Git di Vercel dimatikan lewat `vercel.json` (`git.deploymentEnabled: false`).
- Deploy manual: tab **Actions** → **Deploy ke Vercel** → **Run workflow**.

Setup sekali: buat token di Vercel (Account Settings → Tokens), lalu simpan sebagai secret `VERCEL_TOKEN` di repo ini (Settings → Secrets and variables → Actions).
