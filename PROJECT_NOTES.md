# Catatan Tambahan MJBCourt

Dokumen ini melengkapi `README.md`, `INTEGRATION.md`, `FEATURE_DEPTH.md`, dan `data_model.md`. Isinya perilaku database, daftar periksa pengujian, panduan pemecahan masalah, dan rencana pengembangan berikutnya.

## 1. Perilaku database

- Menghapus lapangan yang sudah punya booking ditolak oleh database, karena relasi `bookings.field_id` memakai `ON DELETE RESTRICT`. Hapus atau batalkan booking terkait terlebih dahulu.
- Menghapus lapangan ikut menghapus semua tarifnya (`ON DELETE CASCADE` pada tabel `prices`).
- Menghapus booking ikut menghapus data pembayarannya (`ON DELETE CASCADE` pada tabel `payments`).
- Membatalkan booking tidak menghapus data. Statusnya menjadi `Dibatalkan` dan jadwalnya tidak lagi dihitung saat 

## 2. Panduan pemecahan masalah

| Gejala | Kemungkinan penyebab | Penanganan |
|---|---|---|
| Frontend menampilkan galat jaringan | Backend belum berjalan atau port berbeda | Jalankan `npm run dev` di `base_server`, lalu cocokkan `VITE_API_BASE_URL` dengan `PORT` di `.env` backend. |
| Galat CORS di konsol browser | `FRONTEND_ORIGIN` tidak sama dengan alamat frontend | Samakan dengan alamat yang tampil di browser, tanpa garis miring di akhir. |
| Selalu kembali ke halaman login | Token kedaluwarsa atau `JWT_SECRET` berubah | Login ulang. Jangan mengganti `JWT_SECRET` selagi ada sesi aktif. |
| Perubahan `.env` frontend tidak berpengaruh | Vite hanya membaca `.env` saat dijalankan | Hentikan lalu jalankan ulang `npm run dev`. |
| `npm run dev` gagal karena `package.json` tidak ditemukan | Perintah dijalankan di folder root repo | Masuk dulu ke `base_server` atau `futsal-frontend`, lalu jalankan perintahnya. |
| Tabel kosong setelah database baru dibuat | Data awal belum dimasukkan | Jalankan bagian DML pada `data_model.md`, atau tambah data lewat aplikasi. |

## 4. Rencana pengembangan berikutnya

1. Tahap UAS: Desktop Client untuk petugas lapangan (jadwal dan status booking) dan Mobile Client untuk pelanggan (katalog lapangan, pemesanan, pembayaran, riwayat), memakai API Server yang sama. Peran pelanggan akan ditambahkan pada tabel `users`.
2. Menambahkan fitur lupa password pada halaman login dan ganti password pada menu profil.
3. Menutup pendaftaran publik dan menambah manajemen akun oleh admin.
4. Menerapkan pembatasan hak akses berdasarkan `role` (`admin` dan `staff`).
5. Menambah pengujian otomatis untuk perhitungan tarif dan pengecekan bentrok jadwal.
6. Menambah ekspor laporan ke PDF atau Excel.