# Central Park 2 + SOHO Podomoro City — 3D Wedding World (GLB)

Model lingkungan **rekonstruksi artistik** dalam format GLB untuk Three.js. Dibuat secara prosedural dari beberapa referensi umum serta foto entrance SOHO yang diberikan pengguna. **Bukan model bangunan presisi, survei lapangan, atau data 3D Google Maps.** Susunan entrance dan orientasi relatif adalah asumsi untuk prototipe navigasi wedding invitation.

## Isi file

- `central_park_2_soho_full.glb` — Central Park Mall 2 (dulu Neo Soho) + tower + tambahan entrance SOHO + halaman dan kanopi kaca.
- `soho_podomoro_entrance.glb` — pintu masuk SOHO dan halaman saja, tetap mempertahankan posisi koordinat *world-space* yang sama dengan model gabungan agar mudah digabung.
- `central_park_2_soho_demo.html` — viewer Three.js interaktif dengan kontrol WASD, kamera orbit, dan tombol `Ke Mall` / `Ke SOHO`.
- `central_park_2_soho_extension.py` — skrip modifikasi procedural untuk SOHO; import `central_park_2_generator.py` (dibundel).
- `central_park_2_soho_full_preview.png`, `soho_podomoro_closeup_preview.png` — preview yang di-render dari GLB.

## Cara buka preview

Ekstrak zip, buka terminal di folder hasil ekstraksi lalu jalankan:

```bash
python3 -m http.server 8000
```

Buka `http://localhost:8000/central_park_2_soho_demo.html` (mal) atau `http://localhost:8000/central_park_2_soho_demo.html?soho=1` (langsung SOHO).

Viewer mengambil library Three.js dari CDN, sehingga koneksi internet diperlukan untuk memuat demo, tetapi semua tekstur sudah tertanam dalam GLB. Model GLB tetap bisa dimuat secara offline oleh aplikasi yang mempunyai GLTF viewer.

## Contoh di React Three Fiber / Three.js

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('/models/central_park_2_soho_full.glb', ({ scene: complex }) => {
  complex.position.set(0, 0, 0); // jangan di-offset kalau menggunakan koordinat di bawah
  complex.traverse(obj => {
    if (obj.name.includes('SpawnMarker_HIDE_AFTER_SETUP')) obj.visible = false;
    if (obj.isMesh) {obj.castShadow = true; obj.receiveShadow = true;}
  });
  yourScene.add(complex);
});
```

GLB adalah sistem koordinat Y-up; satu unit diperlakukan sebagai satu meter secara **perkiraan artistik**, bukan ukuran hasil pengukuran.

| Lokasi | Posisi karakter `[x,y,z]` | Keterangan |
|---|---|---|
| Spawn area mal | `[0,0,68]` | Di seberang depan mal |
| Zebra crossing mal | `[0,0,51]` | Checkpoint A1 |
| Drop-off mal | `[-7,0,40]` | Checkpoint A2 |
| Pintu mal | `[-7,0,35.9]` | Checkpoint A3 |
| Spawn entrance SOHO | `[107,0,71]` | Area paving depan pintu SOHO |
| Area halaman SOHO | `[107,0,59]` | Checkpoint B1 |
| Bawah kanopi kaca | `[107,0,49.5]` | Checkpoint B2 |
| Mendekati pintu | `[101,0,38]` | Checkpoint B3 |
| Entrance SOHO | `[101,0,33.8]` | Checkpoint B4 |

Arah depan model adalah +Z, karakter berjalan menuju gedung dengan **mengurangi Z**. SOHO ditempatkan di **sisi kanan model pada +X** agar kedua area dapat dijelajahi dari permukaan pedestrian. **Letak kanan/kiri ini adalah asumsi untuk mockup, bukan klaim orientasi geografis di lokasi asli.**

## Detail yang diprocedural di entrance SOHO

- 2 living green walls dengan garis tanaman burgundy
- Logo biru terang SOHO
- Motif segitiga hitam di panel putih
- Pintu kaca berbingkai aluminium, ambang pintu, mat merah
- Kanopi atap kaca dengan kisi baja
- Lampu soffit dan bollard putih
- Jalan setapak cobblestone dan lantai granit

## Batasan teknis

GLB tidak menyediakan collider/navmesh ataupun ruangan interior yang detail. Untuk permainan, siapkan collider sederhana untuk bangunan, ground, atap, dan pintu jika diperlukan. Panel kaca memiliki material GLTF PBR; tampilan transparansinya bervariasi menurut renderer dan lighting. Nama grup dapat digunakan untuk hide/show elemen seperti `SOHO_SpawnMarker_HIDE_AFTER_SETUP`.

## Referensi publik

- [Agung Podomoro Land — SOHO Podomoro City](https://www.agungpodomoroland.com/id/projects/detail/116)
- [SOHO Podomoro City — SOHO](https://www.sohopodomorocity.com/soho/)
- [SOHO Podomoro City — Neo Soho](https://www.sohopodomorocity.com/neosoho/)

Fotografi detail SOHO berasal dari lampiran pengguna dan **tidak** dibenamkan utuh sebagai tekstur datar di GLB; tekstur tanaman/panel dikembangkan secara terpisah dan prosedural dari ciri visualnya.
