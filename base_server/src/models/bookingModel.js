const {
  dbRun,
  dbGet,
  dbAll,
} = require("../middlewares_helpers/sqlite3_helpers");

const select = `SELECT b.*, f.name AS field_name FROM bookings b
  JOIN fields f ON f.id = b.field_id`;

const findAll = () =>
  dbAll(`${select} ORDER BY b.booking_date DESC, b.start_time ASC`);
const findById = (id) => dbGet(`${select} WHERE b.id = ?`, [id]);

const create = async (booking) => {
  const result = await dbRun(
    `INSERT INTO bookings
      (booking_code, customer, phone, field_id, booking_date, start_time, end_time,
       total_amount, status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking.booking_code,
      booking.customer,
      booking.phone,
      booking.field_id,
      booking.booking_date,
      booking.start_time,
      booking.end_time,
      booking.total_amount,
      booking.status || "Menunggu",
      booking.payment_status || "Menunggu",
    ],
  );
  return findById(result.lastID);
};

const update = async (id, booking) => {
  const current = await findById(id);
  if (!current) return null;
  await dbRun(
    `UPDATE bookings SET customer = ?, phone = ?, field_id = ?, booking_date = ?,
      start_time = ?, end_time = ?, total_amount = ?, status = ?, payment_status = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      booking.customer ?? current.customer,
      booking.phone ?? current.phone,
      booking.field_id ?? current.field_id,
      booking.booking_date ?? current.booking_date,
      booking.start_time ?? current.start_time,
      booking.end_time ?? current.end_time,
      booking.total_amount ?? current.total_amount,
      booking.status ?? current.status,
      booking.payment_status ?? current.payment_status,
      id,
    ],
  );
  await dbRun(
    `UPDATE payments SET amount = ? WHERE booking_id = ? AND status = 'Menunggu'`,
    [booking.total_amount ?? current.total_amount, id],
  );
  return findById(id);
};

const updateStatuses = async (id, { status, payment_status }) => {
  const current = await findById(id);
  if (!current) return null;
  await dbRun(
    `UPDATE bookings SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status ?? current.status, payment_status ?? current.payment_status, id],
  );
  return findById(id);
};

const remove = async (id) => {
  const result = await dbRun("DELETE FROM bookings WHERE id = ?", [id]);
  return result.changes > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatuses,
  remove,
};
