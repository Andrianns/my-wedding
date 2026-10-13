# Undangan Pernikahan 3D

Undangan pernikahan berbentuk game 3D low poly ala Harvest Moon. Tamu mulai di luar **Central Park 2–SOHO**, mengikuti papan nama **Aji & Vania** menuju entrance di samping logo SOHO, lalu masuk ke lobby. Resepsionis mengarahkan tamu **belok kiri** menuju koridor lift. Panggil lift, masuk kabin, dan tekan **9 · Ballroom** untuk naik ke **lantai 9**. Setelah keluar lift, meja penerimaan tamu berada di kanan dan menghadap pintu ballroom di kiri. Belok kiri untuk masuk ballroom; lanjut lurus untuk keluar ke Sky Terrace, kemudian belok kiri menyusuri outdoor. Lift menyediakan perjalanan **Turun ke Lobby**.

Begitu pertama kali masuk Grand Ballroom, popup **Undangan** terbuka otomatis: satu popup yang bisa di-scroll dengan segmen berurutan **Acara → Cerita Kami → Lokasi → Galeri → RSVP → Ucapan** (navigasi segmen menempel di atas, segmen yang sudah terlihat ditandai ✓). Setelah popup ditutup, tombol **HP** membuka app tiap segmen, app "Undangan" (popup lengkap), dan "Musik". Tombol aksi tetap tersedia di samping HP untuk menyapa resepsionis atau menggunakan lift. Membuka HP dan app memakai animasi; menutup app kembali ke layar HP. Kopi (anjing) mengikuti tamu di luar mall dan menunggu dekat entrance SOHO.

Ballroom memakai lantai motif wajik diagonal abu-abu/lavender yang lebih redup dan chandelier. Pelaminan berada di kiri-bawah dan menghadap depan (arah -Z), dengan dinding belakang penuh selebar ruangan. Panggung pelaminan lebih lebar dan bertepi melengkung, dengan latar pahatan gading, kanopi bunga putih-merah muda, serta tiga kursi pelaminan terpisah. Mempelai berdiri tepat di depan kursi tengah dan karpet gading yang kini segaris, bertepi emas dan bertabur kelopak bunga. Empat lengkung daun dan bunga kecil membingkai jalan lurus setelah belokan; hamparan bunga juga menutup belokan karpet. Tiga meja bundar bergeser ke kanan. Kamera berputar halus ke depan pelaminan sekaligus menghindari dinding belakang ketika tamu mendekati meja; joystick/WASD mengikuti arah layar. Karakter tamu memakai jas navy tanpa topi dan tas. Dinding sisi outdoor dibagi di tengah: kiri tembok biasa dengan buffet dan **TV LED** ucapan, kanan kaca panorama.

Area tiga meja menjadi sudut VIP: buffet panjang berada di sisi kanan, dinding partisi abu-abu bertekstur dengan panel geometris memisahkan area, dengan akses terbuka di tengah. Tepi karpet tidak lagi memakai pot kecil; hamparan bunga rendah bernuansa hijau, plum, dan merah muda mengikuti belokan dan ditemani gantungan bunga berbingkai emas. Meja penerimaan di foyer lantai 9 memakai kain gading dan rangkaian bunga kecil senada dengan pelaminan, tanpa gumpalan bunga bulat. Kamera dan pintu kaca melambat secara halus saat masuk/keluar ballroom serta menuju Sky Terrace.

Food stall indoor digantikan **panggung live music** di sisi kiri, agak ke tengah di samping jalan menuju pelaminan. Buffet utama memanjang sepanjang tembok padat; sambungan buffet di dinding samping mencapai tepi live music, dengan kain putih berlipit, tutup saji berbentuk kubah, kartu menu, serta rangkaian bunga. Dialog menunya berasal dari `W.food.buffet`. Tiga stall makanan tetap tersedia di outdoor, dengan nama dan dialog dari `W.food.stalls`; band mengikuti `W.band`. Meja penerimaan tamu di foyer dihias lengkung floral putih, rangka emas, kain berlipit, serta standing flower, tanpa mewajibkan RSVP untuk lewat. Saat popup undangan terbuka, papan nama kecil di pojok kiri atas disembunyikan. Label lantai 9 disembunyikan setelah masuk ballroom dan papan di pintu outdoor ditiadakan.

Ballroom kini **34 × 36 unit**: lebih ramping dan lebih panjang. Hanya ada **tiga meja bundar** di bagian kanan-bawah denah (sebelah kiri tamu setelah masuk dari pintu timur), bergeser sedikit ke kanan, masing-masing lima kursi; depan altar dikosongkan. **Sky Terrace** sejajar fasad ballroom dan foyer; lantai serta kanopi utamanya membentang utuh dari ujung kiri ballroom sampai ujung kanan foyer (x −12 sampai 34). Bagian kiri yang sebelumnya melewati ujung tembok telah dipangkas, sementara lantai di depan pintu outdoor tetap tersambung. Pintu kaca geser terbuka otomatis saat didekati; kamera tetap rendah dan berputar halus ke sisi outdoor setelah belok kiri sehingga tembok padat tidak menutup pemain. Teras memiliki paving abu-abu, planter palem, parapet hijau, kanopi melengkung transparan sebagian, serta tiga stall di kanan arah berjalan. Tidak ada meja bundar atau kursi biru di outdoor.

Denah lantai 9 (atas = arah lurus ketika keluar lift):

```text
  planter/palem + stall makanan (kanan saat berjalan ke kiri)
  ←──────────── SKY TERRACE ─────────────┐
  ┌──────────────────────────┐         ↑
  │                          │    pintu outdoor
  │         BALLROOM         │         ↑
  │                          pintu ← foyer → penerimaan tamu
  └──────────────────────────┘         ↑
                                      LIFT
```

Halaman statis (`index.html`, Three.js r128 dan GLTFLoader versi yang sama dari CDN) dengan modul perjalanan di `assets/`, plus satu Vercel function (`api/rsvp.js`). Tanpa build step. Mobile-first. Integrasi perjalanan tidak mengubah API RSVP.

## Model dan perjalanan

- `assets/central_park_2_soho_full.glb` menjadi eksterior mall; `assets/wedding-mall.js` memuat model, papan petunjuk, pintu entrance, dan jalur pedestrian.
- `assets/wedding-lobby.js` membangun lobby resepsionis, koridor belok kiri, kabin lift, dan foyer lantai 9. `assets/wedding-journey.js` mengatur zona aktif, perpindahan, perjalanan lift, kamera, dan tap-to-walk melalui waypoint.
- Layar pembuka menampilkan progres pemuatan model; tombol mulai tersedia setelah model siap. Jika pemuatan gagal, tombol **Coba lagi** mengulang pemuatan.
- Posisi disimpan secara lokal pada key `journeyPos3`, dengan versi layout `8` dan zona. Posisi lantai 9 dari versi `3`/`4`/`5` dipindahkan ke titik aman lift baru; posisi versi `6`/`7` yang berada di area teras lama di luar batas baru juga kembali ke titik aman lift. Posisi mall/lobby tetap dipulihkan. RSVP dan progres undangan tidak dihapus. Posisi di kabin lift maupun ambang pintu outdoor disimpan ke titik aman agar reload tidak menjebak tamu di pintu tertutup.
- Satu renderer digunakan untuk zona eksterior mall, lobby, serta ballroom–Sky Terrace. Hanya zona aktif yang dirender dan menjalankan pembaruannya.

## Tampilan mall dan pengujian

Warna palet GLB dikonversi dari sRGB ke linear sekali saat dimuat. Eksterior dan lobby menggunakan tone mapping ACES; ballroom mempertahankan pipeline warna lamanya. Cahaya zona tidak diduplikasi, refleksi kaca memakai environment prosedural, dan bayangan matahari dibatasi di sekitar pemain. Ini menghindari lantai, fasad, dan karakter yang sebelumnya terlihat putih berlebihan.

Eksterior mall bernuansa senja dengan lampu jalur pedestrian. Lobby memakai palet batu hangat dan lampu kuning, dengan podium bangunan di bawah agar tidak tampak melayang. Foyer lantai 9 punya dinding dan kaca di sisi penerimaan tamu serta siluet gedung kota di luarnya. Atap lobby, foyer, lift, dan ballroom terlihat saat **FPP**; pada **TPP** atap disembunyikan agar denah mudah dilihat.

Eksterior dilengkapi etalase berwarna, billboard, planter dan bangku, serta pengunjung berjalan. Tanaman memakai instancing, billboard memakai shader LED ringan, dan jumlah pengunjung/detail geometri dikurangi pada mobile. Tidak ada efek bloom layar penuh yang memberatkan perangkat.

Jalankan server statis lokal, lalu Chrome **profil pengujian terpisah** dengan remote debugging port `9229`. Dengan Node.js 22+, jalankan `node tests/journey-smoke.mjs`. `TEST_URL` dan `CDP_URL` dapat disetel bila port berbeda. Skrip ini mengoperasikan tab pertama pada browser pengujian, bukan browser harian; jangan arahkan ke production.

Smoke test memeriksa perjalanan mall–lobby–lantai 9–mall, rute koridor, pintu lift tertutup, penguncian gerak, perpindahan FPP/TPP beserta atap dan panduan awal, tombol aksi bersama HP, penerimaan tamu, belok kiri ke ballroom, jalur lurus lalu kiri ke outdoor, tiga stall makanan, migrasi posisi layout lama, reload saat lift bergerak, viewport mobile, kegagalan GLB dan retry, serta exception JavaScript. Screenshot desktop/mobile disimpan di `/tmp/wedding-*.png`. Tes tidak mengirim RSVP; pemeriksaan sentuhan fisik dan performa GPU tetap perlu dilakukan pada perangkat target.

## Kontrol

- Layar sentuh: joystick kiri bawah, tombol **A** untuk aksi terdekat, tap lantai untuk jalan otomatis, pinch untuk zoom. Label aksi menunjukkan tujuan seperti **Panggil lift**, **9 · Ballroom**, atau **Turun ke Lobby**; tombol aksi tetap bisa digunakan setelah tombol **HP** terbuka.
- Setelah lift pertama kali tiba di lantai 9, kamera otomatis beralih ke **FPP**. Tamu berhenti sejenak hingga menekan tombol mode yang berdenyut di atas **HP**; sesudahnya FPP/TPP bebas ditukar kapan saja. Di FPP, seret layar untuk mengubah arah pandang.
- Laptop: WASD / panah, Space / Enter / E untuk aksi, P untuk buka/tutup HP, Esc untuk menutup, scroll untuk zoom.

## Ganti data undangan
Edit objek `W` di bagian atas `<script>` dalam `index.html` (nama, orang tua, tanggal, jam acara, venue, nomor WhatsApp RSVP, cerita, caption galeri). Nama mempelai dan tanggal dipakai papan wedding di mall; nama mempelai juga tampil di resepsionis, foyer, dan monogram pelaminan. Tujuan lift dan papan arah wedding menggunakan **lantai 9**.

## RSVP, kursi tamu, dan Ucapan
- Tamu mengisi RSVP di segmen **RSVP** (popup undangan atau app RSVP di HP). Datanya disimpan di Upstash Redis lewat `api/rsvp.js`.
- RSVP "Hadir" divisualisasikan pada tiga meja × lima kursi = **15 kursi**, mulai dari kursi terdekat pelaminan. Jika jumlah tamu melebihi 15, hanya 15 yang divisualisasikan; daftar RSVP lengkap dan API tidak dibatasi ulang. Tap tamu yang duduk untuk melihat namanya.
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
