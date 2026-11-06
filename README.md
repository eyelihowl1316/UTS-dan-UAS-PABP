# MJBCourt

Aplikasi manajemen penyewaan lapangan olahraga. Pengelola (admin/staff) dapat mengatur data lapangan, jam operasional, harga sewa, pemesanan, pembayaran, dan melihat laporan dalam satu panel.

## Fitur

- **Autentikasi**: login dengan JWT, sesi bertahan setelah refresh, otomatis keluar saat token kedaluwarsa.
- **Dashboard**: ringkasan jumlah lapangan, booking hari ini, booking menunggu, dan pendapatan terverifikasi.
- **Data lapangan**: tambah, ubah, hapus, dan atur status (Aktif / Perawatan).
- **Jadwal operasional**: jam buka dan tutup untuk Weekday dan Weekend, serta tombol Buka/Tutup cepat.
- **Harga sewa**: tarif per lapangan berdasarkan periode (Weekday, Weekend, Semua Hari) dan rentang jam. Tarif yang tumpang tindih ditolak.
- **Pemesanan**: total dihitung otomatis dari tarif, dengan validasi jam operasional, jadwal yang sudah lewat, dan bentrok dengan booking lain.
- **Pembayaran**: verifikasi transaksi dan tandai refund.
- **Laporan**: rekap pemesanan dan pendapatan, dapat dicetak.
- **Profil pengelola**: ubah nama dan email.

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
├── base_server/          # Backend (REST API)
│   └── src/
│       ├──config
│       ├── controllers/  
│       ├── models/       
│       ├── middlewares_helpers/
│       ├──models
│       ├──routes
│       ├──sql_scripts
└── futsal_frontend/           # Frontend (React + Vite)
    └── src/
        ├──main.tsx
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
FRONTEND_ORIGIN= http://localhost:5173
SQLITE_DB_PATH=database.sqlite
```

Jalankan server:

```bash
npm run dev
```

### 3. Frontend

```bash
cd futsal-frontend
npm install
```

Buat file `.env` di folder `web_client`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173`.

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


## Catatan keamanan

- Jangan commit file `.env`. Pastikan sudah ada di `.gitignore`.
- Gunakan `JWT_SECRET` yang panjang dan tetap.