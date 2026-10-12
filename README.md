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
Repo ini terhubung ke Vercel. Setiap push ke `main` otomatis di-deploy. Tidak perlu build command; Vercel menyajikan `index.html` apa adanya.
