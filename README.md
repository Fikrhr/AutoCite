# AutoCite

Ekstensi Chrome untuk merekomendasikan sumber referensi ilmiah di Google Docs berbasis AI dan pencarian semantik.

Pengguna memblok teks, AutoCite meringkas klaim utamanya dengan LLM (Gemini), mencari jurnal yang relevan lewat Semantic Scholar (cadangan: OpenAlex), lalu menyiapkan sitasi dalam teks dan entri daftar pustaka format APA. Hasil adalah rekomendasi; pengguna tetap perlu memeriksa kecocokan isi paper dengan klaimnya.

## Status pengembangan (target 30%)

| Use case | Status |
|---|---|
| UC-01 Login dengan Google | Selesai |
| UC-02 Pilih teks di Google Docs | Selesai dengan cara cadangan (Docs merender teks di canvas, sehingga seleksi dibaca lewat perintah salin atau clipboard; bisa juga tempel manual) |
| UC-03 Cari sumber referensi (LLM + Semantic Scholar / OpenAlex) | Selesai |
| UC-04 Lihat rekomendasi referensi | Selesai |
| UC-05 Sisipkan sitasi ke dokumen | Sebagian: penyisipan lewat Google Docs API setelah kalimat yang dipilih sudah diimplementasikan, masih dalam pengujian; cadangan: salin ke clipboard |
| UC-07 Daftar pustaka | Sebagian: salin entri APA per referensi; belum ada daftar otomatis di dokumen |
| Kuota harian akun Free | Selesai (10 pencarian/hari) |
| UC-06 Pilih format sitasi (premium) | Belum |
| UC-08 Riwayat pencarian | Belum (baru menyimpan hasil terakhir) |
| UC-09 Preferensi sitasi | Belum |
| UC-10 Upgrade premium + pembayaran | Belum |

## Teknologi
Chrome Extension Manifest V3 (JavaScript, UI panel samping), Chrome Identity API (OAuth 2.0 Google), Google Docs API, Semantic Scholar API, OpenAlex API, Gemini API, Chrome Storage API.

## Cara mencoba
1. Clone repo ini atau unduh ZIP, lalu ekstrak.
2. Buka `chrome://extensions`, aktifkan Developer mode, klik Load unpacked, lalu pilih folder `extension/`. ID ekstensi tetap karena ada `key` di `manifest.json`, sehingga Client ID di repo langsung berlaku.
3. Klik ikon AutoCite, lalu Masuk dengan Google.
4. Di Google Docs: blok kalimat, klik Ambil teks terpilih, klik Cari Sumber Referensi, pilih kalimat tujuan, lalu klik Sisipkan Sitasi. Gunakan Salin Daftar Pustaka untuk entri daftar pustaka.

Catatan: selama aplikasi berstatus Testing di Google Cloud, hanya akun yang terdaftar sebagai penguji yang bisa login. Minta pemilik proyek menambahkan email Anda ke Test users.

### Pengaturan opsional (API key)
Ekstensi berjalan tanpa API key. Key berikut bisa diisi lewat Pengaturan di panel untuk hasil yang lebih baik, disimpan hanya di browser dan tidak pernah ada di kode:
- Gemini API key: meringkas klaim menjadi kueri pencarian yang lebih tepat.
- Semantic Scholar API key: mengurangi pembatasan permintaan. Tanpa key, pencarian lebih sering beralih ke OpenAlex (label "sumber" di hasil menunjukkan mana yang dipakai).

## Setup pengembang (hanya jika membuat Client ID sendiri)
1. Di Google Cloud Console, buat OAuth Client ID tipe Chrome Extension dengan Item ID sama
