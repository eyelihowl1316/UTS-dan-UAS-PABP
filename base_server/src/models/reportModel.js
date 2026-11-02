const { dbGet } = require('../middlewares_helpers/sqlite3_helpers');

const getSummary = (today) =>
  dbGet(
    `SELECT
      (SELECT COUNT(*) FROM fields) AS field_count,
      (SELECT COUNT(*) FROM bookings WHERE booking_date = ?) AS bookings_today,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Menunggu') AS pending_bookings,
      (SELECT COUNT(*) FROM bookings) AS booking_count,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Dikonfirmasi') AS confirmed_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'Dibatalkan') AS cancelled_bookings,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'Terverifikasi') AS verified_revenue,
      (SELECT COUNT(*) FROM payments) AS payment_count,
      (SELECT COUNT(*) FROM payments WHERE status = 'Menunggu') AS pending_payments,
      (SELECT COUNT(*) FROM payments WHERE status = 'Refund') AS refunds`,
    [today],
  );

module.exports = { getSummary };

