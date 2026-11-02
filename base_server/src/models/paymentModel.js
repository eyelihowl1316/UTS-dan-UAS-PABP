const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

const select = `SELECT p.*, b.booking_code, b.customer FROM payments p
  JOIN bookings b ON b.id = p.booking_id`;

const findAll = () => dbAll(`${select} ORDER BY p.payment_date DESC, p.id DESC`);
const findById = (id) => dbGet(`${select} WHERE p.id = ?`, [id]);

const createForBooking = async (booking) => {
  const transactionCode = `TRX-${Date.now().toString().slice(-6)}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
  await dbRun(
    `INSERT INTO payments (transaction_code, booking_id, method, amount, status)
     VALUES (?, ?, ?, ?, 'Menunggu')`,
    [transactionCode, booking.id, 'Transfer Bank', booking.total_amount],
  );
};

const updateStatus = async (id, status) => {
  const payment = await findById(id);
  if (!payment) return null;
  await dbRun('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
  const bookingPaymentStatus = status === 'Terverifikasi' ? 'Lunas' : status;
  await dbRun(
    `UPDATE bookings SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [bookingPaymentStatus, payment.booking_id],
  );
  return findById(id);
};

module.exports = { findAll, findById, createForBooking, updateStatus };

