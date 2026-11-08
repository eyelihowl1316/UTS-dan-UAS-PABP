# Catatan Tambahan MJBCourt

Dokumen ini melengkapi `README.md`, `INTEGRATION.md`, `FEATURE_DEPTH.md`, dan `data_model.md`. Isinya hasil pembacaan ulang seluruh dokumen sebelum pengumpulan: hal yang perlu diseragamkan, daftar periksa pengujian, masalah umum saat menjalankan aplikasi, dan batasan yang diketahui.

## 1. Hal yang perlu diseragamkan di dokumentasi

| No | Temuan | Lokasi | Saran |
|---|---|---|---|
| 1 | Nama folder frontend tidak konsisten: `futsal_frontend` (underscore) pada struktur proyek, tetapi `futsal-frontend` (tanda hubung) pada perintah `cd` dan `.env`. | `README.md` | Samakan dengan nama folder yang sebenarnya di repo. |
| 2 | Folder `models` tertulis dua kali pada pohon struktur proyek. | `README.md` | Hapus salah satu. |
| 3 | Contoh membuat booking memakai `field_id: 5`, padahal data awal hanya berisi lapangan dengan id 1 sampai 3. | `INTEGRATION.md` | Ganti menjadi `1` atau `2` agar contoh bisa langsung dicoba. |
| 4 | Nilai `FRONTEND_ORIGIN= http://localhost:5173` memiliki spasi setelah tanda sama dengan. | `README.md` | Tulis tanpa spasi: `FRONTEND_ORIGIN=http://localhost:5173`. |
| 5 | Teks alternatif gambar bertuliskan "menandalan", seharusnya "menandakan". Gambar hasil 401 juga muncul sebelum kalimat hasil yang diharapkan. | `INTEGRATION.md` | Perbaiki ejaan dan pindahkan gambar ke bawah kalimat penjelasnya. |
| 6 | Data contoh booking memakai tanggal 2026-11-06 dan 2026-11-07. Karena validasi menolak jadwal yang sudah lewat, data ini tidak bisa dibuat ulang lewat aplikasi setelah tanggalnya lewat. | `data_model.md` | Tambahkan catatan bahwa data contoh hanya untuk demo. |
| 7 | Tabel `users` memiliki kolom `role` (`admin`, `staff`), tetapi hak akses berbeda tidak diterapkan. | `FEATURE_DEPTH.md` | Sudah tercatat di bagian "Di luar cakupan"; cukup disebutkan bahwa kolom disiapkan untuk pengembangan berikutnya. |

Temuan nomor 1 sampai 5 sudah diperbaiki pada `README.md` dan `INTEGRATION.md` versi terbaru.

## 2. Perilaku database yang perlu diketahui

- Menghapus lapangan yang sudah punya booking akan ditolak oleh database, karena relasi `bookings.field_id` memakai `ON DELETE RESTRICT`. Hapus atau batalkan booking terkait terlebih dahulu.
- Menghapus lapangan akan ikut menghapus semua tarifnya (`ON DELETE CASCADE` pada tabel `prices`).
- Menghapus booking akan ikut menghapus data pembayarannya (`ON DELETE CASCADE` pada tabel `payments`).
- Pembatalan booking tidak menghapus data. Statusnya menjadi `Dibatalkan` dan jadwalnya tidak lagi dihitung saat pengecekan bentrok.
- `PRAGMA foreign_keys = ON` harus aktif pada setiap koneksi. SQLite tidak menegakkan relasi antartabel tanpa pengaturan ini.

## 3. Daftar periksa pengujian sebelum pengumpulan

Jalankan backend dan frontend, lalu cek satu per satu.

**Autentikasi**
- [ ] Daftar akun baru berhasil, lalu login dengan akun tersebut berhasil.
- [ ] Login dengan password salah menampilkan pesan galat.
- [ ] Setelah halaman di-refresh, sesi masih bertahan.
- [ ] Tanpa token, `GET /api/fields` mengembalikan 401.

**Data master**
- [ ] Tambah, ubah, hapus, dan cari lapangan berjalan.
- [ ] Jadwal operasional dapat diubah dan tombol Buka/Tutup berfungsi.
- [ ] Tarif yang jamnya tumpang tindih ditolak.

**Pemesanan dan pembayaran**
- [ ] Booking pada lapangan berstatus `Perawatan` ditolak.
- [ ] Booking di luar jam operasional ditolak.
- [ ] Booking pada tanggal atau jam yang sudah lewat ditolak.
- [ ] Booking yang bentrok dengan booking lain ditolak (kode 409).
- [ ] Total harga terhitung otomatis sesuai tarif.
- [ ] Verifikasi pembayaran mengubah pendapatan terverifikasi di dashboard.

**Laporan dan profil**
- [ ] Rekap laporan tampil dan dapat dicetak.
- [ ] Ubah nama dan email profil berhasil.

**Skenario tambahan di luar Tabel 4.1 laporan** (belum tercakup, sebaiknya dicoba sebelum demo)
- [ ] Registrasi dengan email yang sudah dipakai ditolak (kode 409).
- [ ] Login dengan email tidak terdaftar dan dengan password salah menampilkan pesan galat.
- [ ] Tarif yang jamnya tumpang tindih ditolak.
- [ ] Menghapus lapangan yang masih punya booking ditolak.
- [ ] Tombol Konfirmasi dan Batal pada booking mengubah statusnya.
- [ ] Tombol Cetak laporan membuka tampilan cetak.
- [ ] Ubah nama dan email di Profil berhasil dan tampil di panel.
- [ ] Akses `/api/fields` tanpa token mengembalikan 401.

## 4. Masalah umum saat menjalankan

| Gejala | Kemungkinan penyebab | Penanganan |
|---|---|---|
| Frontend menampilkan galat jaringan | Backend belum berjalan atau port berbeda | Jalankan `npm run dev` di `base_server`, lalu cocokkan `VITE_API_BASE_URL` dengan `PORT` di `.env` backend. |
| Galat CORS di konsol browser | `FRONTEND_ORIGIN` tidak sama dengan alamat frontend | Samakan dengan alamat yang tampil di browser, tanpa garis miring di akhir. |
| Selalu kembali ke halaman login | Token kedaluwarsa atau `JWT_SECRET` berubah | Login ulang. Jangan mengganti `JWT_SECRET` selagi ada sesi aktif. |
| Perubahan `.env` frontend tidak berpengaruh | Vite hanya membaca `.env` saat dijalankan | Hentikan lalu jalankan ulang `npm run dev`. |
| Tabel kosong setelah database baru dibuat | Data awal belum dimasukkan | Jalankan bagian DML pada `data_model.md`, atau tambah data lewat aplikasi. |

## 5. Batasan yang diketahui

- Pendaftaran akun dibuka untuk keperluan demo. Pada versi produksi, pendaftaran sebaiknya ditutup dan akun dibuat oleh admin.
- Token disimpan di `localStorage`, sehingga rentan jika terjadi serangan XSS. Alternatifnya cookie `HttpOnly`.
- Peran `staff` belum dibedakan dari `admin`.
- Tabel `users` hanya menerima peran `admin` dan `staff`. Mobile Client untuk pelanggan (tahap UAS) memerlukan peran atau tabel tambahan.
- Belum ada pembayaran online, notifikasi, pemesanan mandiri oleh pelanggan, maupun ekspor laporan ke Excel atau PDF.

## 6. Rencana pengembangan berikutnya

1. Tahap UAS: Desktop Client untuk petugas lapangan (jadwal dan status booking) dan Mobile Client untuk pelanggan (katalog lapangan, pemesanan, pembayaran, riwayat), memakai API Server yang sama.
2. Menutup pendaftaran publik dan menambah manajemen akun oleh admin.
3. Menerapkan pembatasan hak akses berdasarkan `role`.
4. Menambah pengujian otomatis untuk perhitungan tarif dan pengecekan bentrok jadwal.
5. Menambah ekspor laporan ke PDF atau Excel.