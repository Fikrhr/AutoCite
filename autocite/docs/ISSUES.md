# Daftar Issue (salin satu per satu ke GitHub Issues)

Label yang disarankan: `30%` (dikerjakan sekarang), `ditunda` (sisa 70%), `fitur`, `bug`, `dokumen`.

## Label 30% (dikerjakan)
1. **feat: login dengan Google (UC-01)**: chrome.identity, simpan email pengguna. Acceptance: tombol masuk/keluar berfungsi.
2. **feat: ambil teks terpilih (UC-02)**: content script membaca seleksi, fallback kolom tempel teks.
3. **feat: ekstraksi klaim dengan LLM (UC-03)**: Gemini menghasilkan kueri pencarian; fallback ke teks asli.
4. **feat: pencarian Semantic Scholar (UC-03)**: ambil 5 paper teratas beserta metadata.
5. **feat: tampilkan rekomendasi referensi (UC-04)**: daftar kartu di popup.
6. **feat: format sitasi APA dan salin (UC-05)**: sitasi dalam teks dan daftar pustaka.
7. **feat: kuota harian akun Free**: batas 10 pencarian per hari.
8. **docs: README, SRS, SDD ke folder docs/**

## Label 50% (dikerjakan pada tahap ini)
9. **feat: sisipkan sitasi ke dokumen via Google Docs API (UC-05)**: sitasi muncul setelah kalimat yang dipilih pengguna. Status: selesai, sudah diuji.
10. **feat: pilih format sitasi APA, MLA, IEEE, Harvard (UC-06)**: dropdown di panel, `lib/formats.js`; semua format terbuka selama mode pengembangan.
11. **feat: riwayat pencarian (UC-08)**: 20 pencarian terakhir, buka ulang tanpa memakai kuota, hapus satu atau semua.
12. **feat: preferensi sitasi (UC-09)**: format bawaan dan jumlah referensi per pencarian di halaman Pengaturan.

13. **fix: pencarian lambat dan sering kosong**: Semantic Scholar dan OpenAlex dicari paralel, kueri bertingkat, batas waktu 7 detik, terjemahan kata kunci ID ke EN, kuota tidak terpotong bila hasil kosong.
14. **fix: sitasi tidak lagi meminta login berulang**: token tersimpan dipakai ulang, token hanya dibuang saat 401; error 403 (tanpa akses edit) tidak lagi membuang token.
15. **fix: OpenAlex wajib API key sejak Feb 2026**: tambah kolom key, sumber Crossref tanpa key, pesan penyebab saat hasil kosong.
16. **chore: buka semua fitur Premium selama pengembangan** (`DEV_UNLOCK_ALL`).

## Label ditunda
17. Daftar pustaka otomatis di akhir dokumen (UC-07 penuh)
18. Backend, Midtrans/Xendit, dan sinkronisasi status premium (UC-10)
19. Website promosi dan checkout
20. Penomoran IEEE otomatis lintas pencarian
21. **fix: logout benar-benar keluar**: token dicabut di Google dan semua cache dibersihkan; hasil dan riwayat akun lama dihapus.
