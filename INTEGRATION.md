# Dokumen Integrasi MJBCourt

Dokumen ini menjelaskan bagaimana frontend, backend, dan database MJBCourt terhubung.

## 1. Gambaran sistem

```
Browser (React + Vite)  --HTTP/JSON-->  Express REST API  --SQL-->  SQLite
      localhost:5173                       localhost:3000
```

| Bagian | Teknologi | Tugas |
|---|---|---|
| Frontend | React, TypeScript, Axios | Tampilan panel pengelola, memanggil API |
| Backend | Node.js, Express | Validasi, logika bisnis, autentikasi JWT |
| Database | SQLite3 | Menyimpan data |

## 2. Cara frontend terhubung ke backend

- Alamat API diatur di `futsal-frontend/.env`:

  ```env
  VITE_API_BASE_URL=http://localhost:3000
  ```

- Semua request dikirim lewat satu instance Axios di `api.ts`.
- Setelah login, token JWT disimpan di `localStorage` dan otomatis dikirim di setiap request:

  ```
  Authorization: Bearer <token>
  ```

- Backend memeriksa token lewat `authMiddleware`. Token tidak ada atau tidak valid dibalas **401**.
- Token berlaku 1 hari.

## 3. Format respons

Semua endpoint membalas JSON dengan bentuk yang sama.

Sukses:

```json
{ "success": true, "message": "Booking berhasil dibuat", "data": { } }
```

Gagal:

```json
{ "success": false, "message": "Validasi gagal", "data": null, "error": "Jam selesai harus setelah jam mulai" }
```

## 4. Daftar endpoint

Daftar lengkap endpoint ada di [README.md]. Hanya `/api/auth/*` yang terbuka, endpoint lain wajib memakai token.

Nilai status yang diterima:

| Data | Nilai |
|---|---|
| Booking | `Menunggu`, `Dikonfirmasi`, `Dibatalkan` |
| Pembayaran | `Menunggu`, `Terverifikasi`, `Refund` |
| Lapangan | `Aktif`, `Perawatan` |
| Jadwal | `Buka`, `Tutup` |
| Periode tarif | `Weekday`, `Weekend`, `Semua Hari` |

## 5. Contoh alur

### Login

`POST /api/auth/login`

```json
{ "email": "email yang sudah di daftar", "password": "password" }
```

Respons 200:

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "name": "nama", "email": "email yang didaftar", "role": "admin" }
  }
}
```

### Membuat booking

`POST /api/bookings` (dengan header `Authorization`)

```json
{
  "customer": "Nathan",
  "phone": "089766543534",
  "field_id": 5,
  "booking_date": "2026-11-07",
  "start_time": "18:00",
  "end_time": "19:00"
}
```

Total harga dihitung oleh backend dari tarif. Respons 201 berisi data booking dengan `booking_code`, `total_amount`, serta `status` dan `payment_status` bernilai `Menunggu`.

### Mengubah status pembayaran

`PATCH /api/payments/1/status`

```json
{ "status": "Terverifikasi" }
```

## 6. Kode status HTTP

| Kode | Arti | Contoh |
|---|---|---|
| 200 | Berhasil | Data diambil atau diperbarui |
| 201 | Dibuat | Booking atau tarif baru |
| 400 | Permintaan tidak valid | Format jam salah, jadwal sudah lewat |
| 401 | Belum login atau token tidak valid | Token hilang, password salah |
| 404 | Data tidak ditemukan | ID booking tidak ada |
| 409 | Konflik | Jadwal bentrok, email sudah dipakai |
| 500 | Kesalahan server | Error tak terduga |

## 7. Alur singkat frontend ke backend

1. Pengguna login, lalu token disimpan di `localStorage`.
2. `App.tsx` memuat semua data (lapangan, jadwal, booking, pembayaran, tarif, ringkasan) secara paralel.
3. Saat pengguna menyimpan data, frontend memanggil API, backend memvalidasi lalu menyimpan ke SQLite.
4. Jika sukses, frontend memuat ulang data. Jika gagal, pesan `error` dari backend ditampilkan.

## 8. Cara menguji

Pengujian dilakukan di Command Prompt (CMD) Windows. Backend harus sudah berjalan. Jika backend memakai port lain, ganti `3000` dengan port tersebut.

**1. Login dan ambil token**

```
curl.exe -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"EMAIL_AKUN\",\"password\":\"PASSWORD_AKUN\"}"
```

Hasil yang diharapkan: respons JSON berisi `token` dan data `user`. Salin nilai `token` (teks panjang di antara tanda kutip) untuk langkah berikutnya.

**2. Akses data dengan token (harus 200)**

```
curl.exe -i http://localhost:3000/api/fields -H "Authorization: Bearer TOKEN_DARI_LANGKAH_1"
```

Hasil yang diharapkan: `HTTP/1.1 200 OK` dan daftar lapangan.
![Hasil dengan token berhasil (200)](image-1.png)

**3. Akses tanpa token (harus 401)**

```
curl.exe -i http://localhost:3000/api/fields
```
![Hasil yang menandalan endpoint dilindungi (401)](image.png)

Hasil yang diharapkan: `HTTP/1.1 401 Unauthorized`, menandakan endpoint terlindungi.