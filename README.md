# MJBCourt

Aplikasi manajemen penyewaan lapangan olahraga. Pengelola (admin/staff) dapat mengatur data lapangan, jam operasional, harga sewa, pemesanan, pembayaran, dan melihat laporan dalam satu panel.

## Daftar isi

- [Cakupan versi ini](#cakupan-versi-ini)
- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur proyek](#struktur-proyek)
- [Cara menjalankan](#cara-menjalankan)
- [Akun](#akun)
- [Alur penggunaan pertama kali](#alur-penggunaan-pertama-kali)
- [Aturan tarif dan jam operasional](#aturan-tarif-dan-jam-operasional)
- [Alur pemesanan](#alur-pemesanan)
- [Endpoint API](#endpoint-api)
- [Dokumentasi lainnya](#dokumentasi-lainnya)
- [Pemecahan masalah](#pemecahan-masalah)
- [Catatan keamanan](#catatan-keamanan)
- [Tim pengembang](#tim-pengembang)

## Cakupan versi ini

MJBCourt dirancang sebagai sistem multi-platform. Pada tahap Ujian Tengah Semester (UTS), yang dikerjakan adalah:

| Komponen | Pengguna | Status |
|---|---|---|
| Web Client | Administrator (pengelola) | Tersedia di repo ini |
| API Server (backend) | Seluruh client | Tersedia di repo ini |
| Desktop Client | Petugas lapangan | Direncanakan pada tahap Ujian Akhir Semester (UAS) |
| Mobile Client | Pelanggan | Direncanakan pada tahap Ujian Akhir Semester (UAS) |

## Fitur

- **Autentikasi**: login dengan JWT, sesi bertahan setelah refresh, otomatis keluar saat token kedaluwarsa.
- **Dashboard**: ringkasan jumlah lapangan, booking hari ini, booking menunggu, dan pendapatan terverifikasi, serta daftar booking terbaru dan status tiap lapangan.
- **Data lapangan**: tambah, ubah, hapus, dan atur status (Aktif / Perawatan).
- **Jadwal operasional**: jam buka dan tutup untuk Weekday dan Weekend, serta tombol Buka/Tutup cepat.
- **Harga sewa**: tarif per lapangan berdasarkan periode (Weekday, Weekend, Semua Hari) dan rentang jam. Tarif yang tumpang tindih ditolak.
- **Pemesanan**: total dihitung otomatis dari tarif, dengan validasi jam operasional, jadwal yang sudah lewat, dan bentrok dengan booking lain.
- **Pembayaran**: verifikasi transaksi dan tandai refund, dengan ringkasan total transaksi, menunggu verifikasi, dana terverifikasi, dan refund.
- **Laporan**: rekap pemesanan dan pendapatan, dapat dicetak.
- **Profil pengelola**: ubah nama dan email.
- **Pencarian**: setiap halaman daftar (lapangan, jadwal, harga, pemesanan, pembayaran) memiliki kotak pencarian.
- **Indikator operasional**: di bagian atas panel tampil status Buka atau Tutup sesuai jadwal operasional.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React, TypeScript, Vite, Axios |
| Backend | Node.js, Express |
| Database | SQLite3 |
| Autentikasi | JSON Web Token (JWT) |

## Struktur proyek

```
.
├── base_server/               # Backend (REST API)
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares_helpers/
│       ├── models/
│       ├── routes/
│       └── sql_scripts/       # Skema tabel dan data awal (init.sql)
└── futsal-frontend/           # Frontend (React + Vite)
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── Login.tsx
        ├── api.ts
        └── types.ts
```

## Cara menjalankan

### 1. Prasyarat

- Node.js 18 atau lebih baru
- npm

### 2. Backend

```bash
cd base_server
npm install
```

Buat file `.env` di folder `base_server`:

```env
PORT=3000
JWT_SECRET=ganti-dengan-secret-yang-panjang-dan-tetap
JWT_EXPIRES_IN=1d
FRONTEND_ORIGIN=http://localhost:5173
SQLITE_DB_PATH=database.sqlite
```

Penjelasan variabel:

| Variabel | Fungsi |
|---|---|
| `PORT` | Port tempat server berjalan |
| `JWT_SECRET` | Kunci untuk menandatangani token login |
| `JWT_EXPIRES_IN` | Masa berlaku token (`1d` = 1 hari) |
| `FRONTEND_ORIGIN` | Alamat frontend yang diizinkan mengakses API (CORS), tanpa spasi dan tanpa garis miring di akhir |
| `SQLITE_DB_PATH` | Lokasi file database SQLite |

Jalankan server:

```bash
npm run dev
```

### 3. Frontend

```bash
cd futsal-frontend
npm install
```

Buat file `.env` di folder `futsal-frontend`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173`.

> Jalankan backend lebih dahulu. Jika `PORT` backend diganti, sesuaikan `VITE_API_BASE_URL`, lalu jalankan ulang frontend karena Vite hanya membaca `.env` saat dimulai.

## Akun

Untuk keperluan demo, halaman daftar dibuka sehingga bapak dosen dapat membuat akun sendiri dan masuk ke dalam panel sebagai admin
> Catatan pengembangan: pada versi produksi, pendaftaran publik akan ditutup dan akun baru hanya dapat dibuat oleh admin.

## Alur penggunaan pertama kali

Urutan berikut membantu agar pemesanan langsung bisa dicoba tanpa galat:

1. Daftar akun, lalu login.
2. Buka **Data Lapangan** dan pastikan ada lapangan berstatus **Aktif**.
3. Buka **Jadwal Operasional** dan pastikan jam buka Weekday dan Weekend sudah terisi dengan status **Buka**.
4. Buka **Harga Sewa** dan pastikan lapangan memiliki tarif pada jam yang akan dipesan.
5. Buka **Pemesanan** dan buat booking pada tanggal yang belum lewat.
6. Buka **Pembayaran** dan verifikasi transaksi dari booking tersebut.
7. Buka **Dashboard** dan **Laporan** untuk melihat pendapatan terverifikasi.

## Aturan tarif dan jam operasional

Agar pemesanan berjalan benar, data diatur dengan pemisahan berikut:

| Yang diatur | Halaman | Isi |
|---|---|---|
| Jam buka | Jadwal Operasional | Jam buka dan tutup untuk Weekday dan Weekend |
| Harga | Harga Sewa | Tarif per jam untuk tiap lapangan |

Aturan pengisian tarif per lapangan, pilih salah satu mode:

- **Harga sama setiap hari**: satu baris dengan periode "Semua Hari".
- **Harga berbeda weekday dan weekend**: dua baris, "Weekday" dan "Weekend".

Jangan mencampur "Semua Hari" dengan "Weekday/Weekend" pada jam yang sama. Sistem akan menolak tarif yang tumpang tindih.

Saat lapangan baru dibuat, otomatis dibuat satu tarif "Semua Hari" 07:00-23:00 sesuai tarif per jam lapangan.

## Alur pemesanan

1. Tanggal booking menentukan periode (Sabtu dan Minggu = Weekend, selain itu Weekday).
2. Sistem memeriksa status lapangan, jadwal operasional, jadwal yang sudah lewat, dan bentrok dengan booking lain.
3. Total dihitung per menit dengan tarif yang cocok. Tarif spesifik (Weekday/Weekend) didahulukan dari "Semua Hari".
4. Booking dibuat berstatus "Menunggu" beserta data pembayarannya.

Kode booking dan kode transaksi dibuat otomatis oleh sistem, bukan diisi pengguna. Jika booking ditolak, panel menampilkan pesan alasannya:

| Kondisi | Alasan yang ditampilkan |
|---|---|
| Lapangan berstatus Perawatan | Lapangan sedang dalam perawatan dan tidak dapat dipesan |
| Jam di luar jam operasional | Jam booking harus berada dalam jam operasional (misalnya 07:00-23:00) |
| Jam sudah lewat | Jam mulai sudah lewat, pilih jam yang belum lewat |
| Bentrok dengan booking lain | Jadwal bentrok dengan booking lain pada lapangan dan tanggal yang sama |

Contoh perhitungan: booking Lapangan A pada hari Sabtu pukul 16:00 sampai 18:00, dengan tarif Weekend 120.000 per jam sebelum 17:00 dan 150.000 per jam sesudahnya, menghasilkan 120.000 + 150.000 = 270.000.

## Endpoint API

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registrasi |
| GET, POST | `/api/fields` | Daftar dan tambah lapangan |
| PUT, DELETE | `/api/fields/:id` | Ubah dan hapus lapangan |
| GET, POST | `/api/schedules` | Daftar dan tambah jadwal |
| PUT, DELETE | `/api/schedules/:id` | Ubah dan hapus jadwal |
| GET, POST | `/api/bookings` | Daftar dan buat booking |
| PUT, DELETE | `/api/bookings/:id` | Ubah dan hapus booking |
| PATCH | `/api/bookings/:id/status` | Ubah status booking |
| GET | `/api/payments` | Daftar pembayaran |
| PATCH | `/api/payments/:id/status` | Ubah status pembayaran |
| GET, POST | `/api/prices` | Daftar dan tambah tarif |
| PUT, DELETE | `/api/prices/:id` | Ubah dan hapus tarif |
| GET, PUT | `/api/profile` | Lihat dan ubah profil |
| GET | `/api/reports/summary` | Ringkasan laporan |

Semua endpoint selain login dan registrasi memerlukan header `Authorization: Bearer <token>`.

Semua respons berbentuk JSON dengan field `success`, `message`, dan `data` (serta `error` jika gagal). Contoh dan kode status lengkap ada di [INTEGRATION.md](INTEGRATION.md).


## Pemecahan masalah

| Gejala | Penanganan |
|---|---|
| Frontend menampilkan galat jaringan | Pastikan backend berjalan dan `VITE_API_BASE_URL` sesuai dengan `PORT` backend. |
| Galat CORS di konsol browser | Samakan `FRONTEND_ORIGIN` dengan alamat frontend di browser. |
| Selalu kembali ke halaman login | Token kedaluwarsa atau `JWT_SECRET` berubah. Login ulang. |
| Booking ditolak | Periksa status lapangan, jadwal operasional, tarif, dan apakah jadwal sudah lewat atau bentrok. |
| Pesan "Token tidak ditemukan" | Header `Authorization` tidak terkirim. Login ulang. |

Daftar yang lebih lengkap ada di `PROJECT_NOTES.md`.

## Catatan keamanan

- Jangan commit file `.env`. Pastikan sudah ada di `.gitignore`.
- Gunakan `JWT_SECRET` yang panjang dan tetap.
- Password disimpan dalam bentuk hash bcrypt, bukan teks asli.

## Tim pengembang

Proyek mata kuliah Pengembangan Aplikasi Berbasis Platform, Program Studi S-1 Sistem Informasi, Fakultas Informatika, Universitas Mikroskil, Medan, 2026.

- Michael Nicholas Sirait
- Jumita Paulina Blanzesky Tambunan
- Boyris Lolodo Hutajulu