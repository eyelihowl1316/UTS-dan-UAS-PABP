const { dbGet } = require('../middlewares_helpers/sqlite3_helpers');

// Metrik pembayaran hanya menghitung pembayaran yang booking-nya masih ada
// (sama seperti halaman Pembayaran), supaya laporan dan daftar pembayaran sejalan.
const getSummary = (today) =>
  dbGet(
    `SELECT
      (SELECT COUNT(*) FROM fields) AS field_count,
      (SELECT COUNT(*) FROM bookings WHERE booking_date = ?) AS bookings_today,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Menunggu') AS pending_bookings,
      (SELECT COUNT(*) FROM bookings) AS booking_count,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Dikonfirmasi') AS confirmed_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Dibatalkan') AS cancelled_bookings,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.status = 'Terverifikasi') AS verified_revenue,
      (SELECT COUNT(*) FROM payments p JOIN bookings b ON b.id = p.booking_id) AS payment_count,
      (SELECT COUNT(*) FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.status = 'Menunggu') AS pending_payments,
      (SELECT COUNT(*) FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE p.status = 'Refund') AS refunds`,
    [today],
  );

module.exports = { getSummary };