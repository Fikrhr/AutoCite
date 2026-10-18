# AutoCite

Ekstensi Chrome untuk merekomendasikan sitasi ilmiah otomatis di Google Docs berbasis AI dan semantic search.

Blok teks yang butuh sumber, AutoCite mengekstrak klaim utamanya dengan LLM, mencari jurnal yang relevan lewat Semantic Scholar, lalu menyiapkan sitasi dan daftar pustaka siap tempel.

## Status pengembangan (target 30%)

| Use case | Status |
|---|---|
| UC-01 Login dengan Google | Selesai (perlu OAuth Client ID) |
| UC-02 Pilih teks di Google Docs | Sebagian (ambil seleksi otomatis jika tersedia, fallback tempel teks) |
| UC-03 Cari sumber referensi (LLM + Semantic Scholar) | Selesai |
| UC-04 Lihat rekomendasi referensi | Selesai |
| UC-05 Sisipkan sitasi ke dokumen | Selesai (insert via Google Docs API, cadangan: salin ke clipboard) |
| Kuota harian akun Free | Selesai (10 pencarian/hari) |
| UC-06 Pilih format sitasi (premium) | Belum |
| UC-07 Daftar pustaka otomatis | Sebagian (tombol Salin Daftar Pustaka per entri; belum ada daftar otomatis di dokumen) |
| UC-08 Riwayat pencarian | Belum |
| UC-09 Preferensi sitasi | Belum |
| UC-10 Upgrade premium + pembayaran | Belum |

## Teknologi
Chrome Extension Manifest V3 (JavaScript), Chrome Identity API (OAuth 2.0 Google), Semantic Scholar API, Gemini API (ekstraksi klaim), Chrome Storage API.

## Cara menjalankan
1. Clone repo ini.
2. Buka `chrome://extensions`, aktifkan Developer mode, klik Load unpacked, pilih folder `extension/`.
3. (Login Google) Buat OAuth Client ID tipe Chrome Extension di Google Cloud Console memakai ID ekstensi dari langkah 2, lalu isi `oauth2.client_id` di `extension/manifest.json`.
4. (Opsional) Buka Pengaturan ekstensi dan isi Gemini API key. Tanpa key, teks dipakai langsung sebagai kueri.
5. Buka dokumen Google Docs, klik ikon AutoCite, tulis atau tempel teks, lalu klik Cari Sitasi.

## Struktur
```
extension/   kode ekstensi (manifest, background, popup, lib)
docs/        SRS, SDD, diagram, daftar issue
```

## Batasan saat ini
Google Docs merender teks di canvas sehingga seleksi tidak selalu terbaca; sementara itu tersedia kolom tempel teks. Penyisipan langsung ke dokumen direncanakan lewat Google Docs API.

## Lisensi
MIT
