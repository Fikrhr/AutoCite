# AutoCite

Ekstensi Chrome untuk merekomendasikan sumber referensi ilmiah di Google Docs berbasis AI dan pencarian semantik.

Pengguna memblok teks, AutoCite meringkas klaim utamanya dengan LLM (Gemini), mencari jurnal yang relevan lewat Semantic Scholar (cadangan: OpenAlex), lalu menyiapkan sitasi dalam teks dan entri daftar pustaka format APA. Hasilnya berupa rekomendasi; pengguna tetap perlu memeriksa kecocokan isi paper dengan klaimnya.

## Teknologi
Chrome Extension Manifest V3 (JavaScript, UI panel samping), Chrome Identity API (OAuth 2.0 Google), Google Docs API, Semantic Scholar API, OpenAlex API, Gemini API, Chrome Storage API.

## Cara menjalankan
1. Clone repo ini atau unduh ZIP, lalu ekstrak.
2. Buka `chrome://extensions`, aktifkan Developer mode, klik Load unpacked, lalu pilih folder `extension/`. ID ekstensi dibuat tetap lewat `key` di `manifest.json`.
3. Di Google Cloud Console (untuk pengembang):
   - buat OAuth Client ID tipe Chrome Extension dengan Item ID sesuai ID ekstensi, lalu isi `oauth2.client_id` di `extension/manifest.json`;
   - aktifkan Google Docs API;
   - tambahkan scope `https://www.googleapis.com/auth/documents` di Data Access;
   - daftarkan akun penguji di Audience (Test users).
4. Klik ikon AutoCite, lalu Masuk dengan Google.
5. (Opsional) Buka Pengaturan di dalam panel untuk mengisi API key demi hasil pencarian yang lebih baik. Key hanya disimpan di browser, tidak di kode:
   - Gemini API key: membantu meringkas klaim menjadi kueri pencarian yang lebih tepat;
   - Semantic Scholar API key: mengurangi pembatasan permintaan.

   Tanpa key, ekstensi tetap berjalan dengan hasil yang lebih sederhana.
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
- Aplikasi Google masih berstatus uji, sehingga hanya akun yang terdaftar sebagai Test users yang dapat login.

## Rencana pengembangan
- Server perantara (backend) yang menyimpan API key, serta menghitung kuota dan status Free/Premium di sisi server.
- Pilihan format sitasi (APA, MLA, Chicago, IEEE) untuk paket premium.
- Daftar pustaka otomatis di dokumen, riwayat pencarian, dan preferensi sitasi.
- Pembayaran paket premium melalui payment gateway.
- Penilaian kecocokan klaim dengan kutipan dari paper.

## Lisensi
MIT
