# AutoCite

Ekstensi Chrome untuk merekomendasikan sumber referensi ilmiah di Google Docs berbasis AI dan pencarian semantik.

Pengguna memblok teks, AutoCite meringkas klaim utamanya dengan LLM (Gemini), mencari jurnal yang relevan lewat Semantic Scholar, Crossref, dan OpenAlex, lalu menyiapkan sitasi dalam teks dan entri daftar pustaka format APA. Hasil adalah rekomendasi; pengguna tetap perlu memeriksa kecocokan isi paper dengan klaimnya.

## Status pengembangan (target 50%)

| Use case | Status |
|---|---|
| UC-01 Login dengan Google | Selesai (termasuk keluar yang mencabut izin akun) |
| UC-02 Pilih teks di Google Docs | Selesai dengan cara cadangan (Docs merender teks di canvas, sehingga seleksi dibaca lewat perintah salin atau clipboard; bisa juga tempel manual) |
| UC-03 Cari sumber referensi (LLM + Semantic Scholar, Crossref, OpenAlex) | Selesai |
| UC-04 Lihat rekomendasi referensi | Selesai |
| UC-05 Sisipkan sitasi ke dokumen | Selesai: sitasi disisipkan lewat Google Docs API setelah kalimat yang dipilih pengguna (cadangan: salin ke clipboard) |
| UC-07 Daftar pustaka | Sebagian: salin entri APA per referensi; belum ada daftar otomatis di dokumen |
| Kuota harian akun Free | Selesai (10 pencarian/hari; tidak berlaku saat mode Premium dibuka) |
| UC-06 Pilih format sitasi (premium) | Selesai: APA 7, MLA 9, IEEE, Harvard (selama pembayaran belum ada, semua fitur Premium dibuka lewat `DEV_UNLOCK_ALL` di `lib/plan.js`) |
| UC-08 Riwayat pencarian | Selesai: 20 pencarian terakhir tersimpan, bisa dibuka lagi tanpa memakai kuota, bisa dihapus |
| UC-09 Preferensi sitasi | Selesai: format bawaan dan jumlah referensi per pencarian di Pengaturan |
| UC-10 Upgrade premium + pembayaran | Belum (butuh backend, lihat Rencana pengembangan) |

## Teknologi
Chrome Extension Manifest V3 (JavaScript, UI panel samping), Chrome Identity API (OAuth 2.0 Google), Google Docs API, Semantic Scholar API, Crossref API, OpenAlex API, Gemini API, Chrome Storage API.

## Cara mencoba
1. Clone repo ini atau unduh ZIP, lalu ekstrak.
2. Buka `chrome://extensions`, aktifkan Developer mode, klik Load unpacked, lalu pilih folder `extension/`. ID ekstensi tetap karena ada `key` di `manifest.json`, sehingga Client ID di repo langsung berlaku.
3. Klik ikon AutoCite, lalu Masuk dengan Google.
4. Di Google Docs: blok kalimat, klik Ambil teks terpilih, klik Cari Sumber Referensi, pilih kalimat tujuan, lalu klik Sisipkan Sitasi. Gunakan Salin Daftar Pustaka untuk entri daftar pustaka.

Catatan login:
- Jika aplikasi di Google Cloud sudah berstatus In production, siapa pun bisa login. Karena belum diverifikasi Google, akan muncul layar "Google hasn't verified this app": klik **Advanced**, lalu **Go to AutoCite (unsafe)**, lalu **Allow**. Batas sementara 100 pengguna.
- Jika masih berstatus Testing, hanya akun yang terdaftar sebagai penguji yang bisa login. Minta pemilik proyek menambahkan email Anda ke Test users.

### Pengaturan opsional (API key)
Ekstensi berjalan tanpa API key. Key berikut bisa diisi lewat Pengaturan di panel untuk hasil yang lebih baik, disimpan hanya di browser dan tidak pernah ada di kode:
- Gemini API key: meringkas klaim menjadi kueri pencarian bahasa Inggris yang lebih tepat.
- Semantic Scholar API key: mengurangi pembatasan permintaan (tanpa key sering 429).
- OpenAlex API key (gratis di openalex.org/settings/api): sejak Februari 2026 OpenAlex meminta key; tanpa key hanya ada jatah kecil per hari.

### Cara pencarian bekerja
Semantic Scholar, OpenAlex, dan Crossref (tanpa key, jurnal termasuk jurnal Indonesia) dicari bersamaan dengan kueri bertingkat dari panjang ke pendek, lalu hasilnya digabung tanpa duplikat. Batas waktu tiap permintaan 7 sampai 8 detik. Tanpa Gemini API key, kata kunci teks berbahasa Indonesia diterjemahkan ke Inggris lewat layanan gratis MyMemory (hanya kata kunci pendek yang dikirim, bukan seluruh teks). Label "sumber" di hasil menunjukkan sumber yang dipakai, dan bila hasil kosong, alasannya ditampilkan (misalnya sumber membatasi permintaan). Pada akun Free, kuota harian hanya berkurang bila pencarian menghasilkan referensi.

## Setup pengembang (hanya jika membuat Client ID sendiri)
1. Di Google Cloud Console, buat OAuth Client ID tipe Chrome Extension dengan Item ID sama dengan ID ekstensi, lalu isi `oauth2.client_id` di `extension/manifest.json`.
2. Aktifkan Google Docs API.
3. Tambahkan scope `https://www.googleapis.com/auth/documents` di Data Access.
4. Selama pengembangan, daftarkan akun penguji di Audience (Test users). Agar pengguna baru bisa login tanpa didaftarkan, klik **Publish app** di Audience (status In production; layar peringatan "unverified" tetap muncul sampai aplikasi diverifikasi Google).
5. Pastikan Branding terisi (nama aplikasi, email dukungan, email kontak pengembang).

## Struktur
```
extension/   kode ekstensi (manifest, background, panel, lib)
docs/        SRS, SDD, diagram, daftar issue
```

## Batasan saat ini
- Google Docs merender teks di canvas, sehingga pembacaan seleksi memakai cara cadangan dan belum stabil di semua kondisi.
- Kecocokan paper dengan kalimat hanya perkiraan dari judul dan abstrak; pengguna perlu memverifikasi sumber sebelum mengutip.
- Penyisipan sitasi membutuhkan akun yang punya akses edit ke dokumen.
- Belum ada backend: ekstensi memanggil API langsung dan API key diisi pengguna sendiri di Pengaturan. Kuota dan status Premium hanya disimpan di browser.
- Format IEEE memakai nomor urut kartu hasil (`[1]`, `[2]`, ...); penomoran antar pencarian belum otomatis, jadi pengguna perlu menyesuaikan urutannya.

## Rencana pengembangan
- Backend (mis. Cloudflare Workers atau Vercel) sebagai perantara: menyimpan API key di server, memanggil Gemini dan sumber referensi, sehingga pengguna tidak perlu mengisi key.
- Verifikasi token Google di server, kuota harian dan status Premium disimpan di database server.
- Pembayaran Premium (Midtrans atau Xendit) dan sinkronisasi status (UC-10).
- Daftar pustaka otomatis di akhir dokumen (UC-07 penuh) dan penomoran IEEE lintas pencarian.
- Verifikasi aplikasi di Google agar peringatan "unverified" hilang.

## Lisensi
MIT
