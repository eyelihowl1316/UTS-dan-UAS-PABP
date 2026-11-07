# Feature Depth MJBCourt

Dokumen ini menjelaskan fitur aplikasi MJBCourt dan seberapa dalam tiap fitur dikerjakan. Cakupannya sengaja dibuat basic: fitur inti berjalan dari awal sampai akhir tanpa fitur lanjutan.

## Daftar fitur

| No | Fitur | Yang bisa dilakukan | Kedalaman |
|---|---|---|---|
| 1 | Login dan logout | Masuk dengan email dan password, sesi bertahan setelah refresh | Dasar |
| 2 | Dashboard | Melihat ringkasan lapangan, booking, dan pendapatan | Dasar |
| 3 | Data lapangan | Tambah, ubah, hapus, dan cari lapangan | Dasar (CRUD) |
| 4 | Jadwal operasional | Atur jam buka dan tutup, serta status Buka/Tutup | Dasar (CRUD) |
| 5 | Harga sewa | Atur tarif per lapangan, periode, dan jam | Dasar + validasi |
| 6 | Pemesanan | Buat, ubah, konfirmasi, batalkan, dan hapus booking | Dasar + logika bisnis |
| 7 | Pembayaran | Verifikasi pembayaran dan tandai refund | Dasar |
| 8 | Laporan | Melihat rekap booking dan pendapatan, lalu mencetak | Dasar |
| 9 | Profil | Ubah nama dan email pengelola | Dasar |

Keterangan kedalaman:

- **Dasar**: fungsi utama berjalan dengan validasi input sederhana.
- **Dasar (CRUD)**: tambah, lihat, ubah, hapus data.
- **Dasar + validasi**: ditambah aturan agar data tidak salah.
- **Dasar + logika bisnis**: ditambah perhitungan atau pengecekan otomatis.

## Fitur dengan logika tambahan

**Harga sewa**: tarif yang jamnya tumpang tindih dengan tarif lain pada lapangan yang sama ditolak.

**Pemesanan**: sebelum disimpan, sistem otomatis memeriksa:

1. Lapangan sedang aktif.
2. Jadwal belum lewat.
3. Jam booking berada dalam jam operasional.
4. Tidak bentrok dengan booking lain.
5. Total harga dihitung otomatis dari tarif.

## Di luar cakupan

Hal berikut tidak termasuk dalam versi ini: pelanggan memesan sendiri, pembayaran online, notifikasi, hak akses berbeda untuk admin dan staff, serta ekspor laporan ke Excel atau PDF.