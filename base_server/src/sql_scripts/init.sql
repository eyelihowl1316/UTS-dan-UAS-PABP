CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    surface_type TEXT NOT NULL,
    capacity TEXT NOT NULL DEFAULT '5 vs 5',
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Perawatan')),
    hourly_rate INTEGER NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operating_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_label TEXT NOT NULL UNIQUE,
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Buka' CHECK (status IN ('Buka', 'Tutup')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_code TEXT NOT NULL UNIQUE,
    customer TEXT NOT NULL,
    phone TEXT NOT NULL,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    booking_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Dikonfirmasi', 'Dibatalkan')),
    payment_status TEXT NOT NULL DEFAULT 'Menunggu' CHECK (payment_status IN ('Menunggu', 'Lunas', 'Refund')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_code TEXT NOT NULL UNIQUE,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
    method TEXT NOT NULL DEFAULT 'Transfer Bank',
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Terverifikasi', 'Refund')),
    payment_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON UPDATE CASCADE ON DELETE CASCADE,
    period TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

INSERT OR IGNORE INTO fields (id, name, surface_type, capacity, status, hourly_rate) VALUES
    (1, 'Lapangan A', 'Vinyl', '5 vs 5', 'Aktif', 120000),
    (2, 'Lapangan B', 'Rumput Sintetis', '5 vs 5', 'Aktif', 150000),
    (3, 'Lapangan C', 'Interlock', '7 vs 7', 'Perawatan', 180000);

INSERT OR IGNORE INTO operating_schedules (day_label, open_time, close_time, status) VALUES
    ('Senin - Jumat', '08:00', '23:00', 'Buka'),
    ('Sabtu - Minggu', '07:00', '23:00', 'Buka');

INSERT INTO prices (field_id, period, start_time, end_time, price)
SELECT id, 'Weekday', '08:00', '17:00', 100000 FROM fields WHERE name = 'Lapangan A'
AND NOT EXISTS (SELECT 1 FROM prices WHERE field_id = fields.id);
INSERT INTO prices (field_id, period, start_time, end_time, price)
SELECT id, 'Weekend', '17:00', '23:00', 150000 FROM fields WHERE name = 'Lapangan A'
AND NOT EXISTS (SELECT 1 FROM prices WHERE field_id = fields.id AND period = 'Weekend');
INSERT INTO prices (field_id, period, start_time, end_time, price)
SELECT id, 'Semua Hari', '08:00', '23:00', 150000 FROM fields WHERE name = 'Lapangan B'
AND NOT EXISTS (SELECT 1 FROM prices WHERE field_id = fields.id);


INSERT OR IGNORE INTO payments (transaction_code, booking_id, method, amount, status)
SELECT 'TRX-001', id, 'Transfer Bank', total_amount, 'Terverifikasi' FROM bookings WHERE booking_code = 'BK-001';
INSERT OR IGNORE INTO payments (transaction_code, booking_id, method, amount, status)
SELECT 'TRX-002', id, 'QRIS', total_amount, 'Menunggu' FROM bookings WHERE booking_code = 'BK-002';
INSERT OR IGNORE INTO payments (transaction_code, booking_id, method, amount, status)
SELECT 'TRX-003', id, 'Transfer Bank', total_amount, 'Refund' FROM bookings WHERE booking_code = 'BK-003';

INSERT OR IGNORE INTO profile (id, name, email) VALUES (1, 'Admin Futsal', 'admin@futsalpro.id');

