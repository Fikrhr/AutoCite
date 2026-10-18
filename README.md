# AutoCite

Ekstensi Chrome untuk merekomendasikan sumber referensi ilmiah di Google Docs berbasis AI dan pencarian semantik.

Pengguna memblok teks, AutoCite meringkas klaim utamanya dengan LLM (Gemini), mencari jurnal yang relevan lewat Semantic Scholar (cadangan: OpenAlex), lalu menyiapkan sitasi dalam teks dan entri daftar pustaka format APA. Hasil adalah rekomendasi; pengguna tetap perlu memeriksa kecocokan isi paper dengan klaimnya.

## Teknologi
Chrome Extension Manifest V3 (JavaScript, UI panel samping), Chrome Identity API (OAuth 2.0 Google), Google Docs API, Semantic Scholar API, OpenAlex API, Gemini API, Chrome Storage API.

## Cara menjalankan
1. Clone repo ini.
2. Buka `chrome://extensions`, aktifkan Developer mode, klik Load unpacked, pilih folder `extension/`. ID ekstensi dibuat tetap lewat `key` di `manifest.json`.
3. Di Google Cloud Console: buat OAuth Client ID tipe Chrome Extension dengan Item ID sesuai ID ekstensi, aktifkan Google Docs API, tambahkan scope `https://www.googleapis.com/auth/documents` di Data Access, dan daftarkan akun penguji di Audience (Test users). Isi `oauth2.client_id` di `extension/manifest.json`.
4. Klik ikon AutoCite, lalu Masuk dengan Google.
5. Buka Pengaturan di dalam panel dan isi Gemini API key (disarankan) dan Semantic Scholar API key (opsional). Key hanya disimpan di browser, tidak di kode.
6. Di Google Docs: blok kalimat, klik Ambil teks terpilih, klik Cari Sumber Referensi, pilih kalimat tujuan, lalu klik Sisipkan Sitasi. Gunakan Salin Daftar Pustaka untuk entri daftar pustaka.

## Struktur
```
extension/   kode ekstensi (manifest, background, panel, lib)
docs/        SRS, SDD, diagram, daftar issue
```

## Batasan saat ini
- Google Docs merender teks di canvas, sehingga pembacaan seleksi memakai cara cadangan dan belum stabil di semua kondisi.
- Kecocokan paper dengan kalimat hanya perkiraan dari judul dan abstrak; pengguna perlu memverifikasi sumber sebelum mengutip.
- Penyisipan sitasi membutuhkan akun yang punya akses edit ke dokumen.

## Lisensi
MIT
