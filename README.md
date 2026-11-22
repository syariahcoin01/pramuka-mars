# Pramuka Mars – PWA Latihan Orientasi Pramuka di Planet Mars

**Pembuat:** Dr. R. A. E. Virgana Targa Sapanji, S.Kom., M.T.  
**Afiliasi:** Program Studi Sistem Informasi, Fakultas Teknik, Universitas Widyatama  
**Konteks:** Prototipe latihan untuk NASA Space Apps Challenge 2026, challenge *Interplanetary Survival Guide: Martian Map*

**Demo:** https://syariahcoin01.github.io/pramuka-mars/

## Fitur
- Peta Mars dari NASA Mars Trek (mozaik Viking MDIM2.1 dan relief MOLA)
- Grid koordinat dan skala peta khusus Mars
- 7 misi orientasi: Baca Koordinat, Kenali Medan, Arah Kompas, Ukur Jarak, Sandi Morse, Jejak Rover Tangguh, Ngarai Raksasa
- Penilaian 1–3 bintang
- Jelajah Bebas 8 situs bersejarah dengan tautan foto HiRISE
- Alat ukur jarak dan arah
- Lencana kecakapan
- PWA: bisa dipasang di layar utama dan berjalan offline

> **Catatan:** Koordinat situs bersifat perkiraan untuk keperluan latihan. Aplikasi ini **bukan** aplikasi resmi NASA maupun Gerakan Pramuka.

## Kredit data
- NASA/JPL-Caltech – Mars Trek
- NASA/USGS – Viking (MDIM2.1)
- NASA MGS MOLA
- HiRISE – NASA/JPL-Caltech/UArizona

## Menjalankan secara lokal
```bash
python3 -m http.server 8000
```
Lalu buka http://localhost:8000

---

# Pramuka Mars (PWA)

Latihan orientasi Pramuka di planet Mars: membaca koordinat, kompas, skala peta, dan sandi Morse,
memakai peta NASA Mars Trek (mozaik Viking MDIM2.1 dan relief MOLA) serta foto HiRISE.

- Pengguna: anggota Pramuka dan siswa SMP
- Challenge NASA Space Apps 2026: *Interplanetary Survival Guide: Martian Map*
- Stack: HTML + JavaScript (tanpa build), Leaflet 1.9.4, Service Worker, Web App Manifest

## Isi
| File | Fungsi |
|---|---|
| `index.html`, `style.css` | Tampilan (mobile-first, panel bawah + peta) |
| `app.js` | Peta Mars (EPSG:4326), grid koordinat, skala khusus Mars, misi, penilaian bintang, alat ukur, lencana |
| `misi.js` | Data 8 situs dan 7 misi (ubah di sini untuk menambah misi) |
| `sw.js` | Offline: app shell + ubin Mars Trek yang pernah dilihat (maks. 1.500 ubin) |
| `manifest.webmanifest`, `icons/` | Bisa dipasang di layar utama ponsel |

## Menjalankan
```bash
python -m http.server 8000   # buka http://localhost:8000
```
Deploy gratis: Vercel (Add New Project → root folder ini → Deploy) atau GitHub Pages. PWA butuh HTTPS.

## Sumber data & kredit
- Ubin: `https://trek.nasa.gov/tiles/Mars/EQ/{layer}/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`
  - `Viking_MDIM21_ClrMosaic_global_232m` (NASA/USGS)
  - `Mars_MGS_MOLA_ClrShade_merge_global_463m` (NASA/MGS)
- HiRISE: NASA/JPL-Caltech/UArizona (domain publik)
- Koordinat situs pendaratan: perkiraan dari publikasi misi NASA

## Catatan
- Jarak dihitung di bola Mars (R = 3.389,5 km); arah kompas = arah awal lintasan lingkaran besar.
- Skor & lencana disimpan di `localStorage` perangkat.
- Aturan Space Apps: proyek lomba harus dikerjakan mulai 14 November 2026. Paket ini untuk latihan;
  cantumkan sumber dan penggunaan AI bila dipakai sebagai acuan.
