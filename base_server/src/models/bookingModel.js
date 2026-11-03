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

// Mencari booking lain yang bentrok pada lapangan + tanggal yang sama.
// Dua jam dianggap bentrok jika: start_lama < end_baru DAN end_lama > start_baru.
// Booking berstatus "Dibatalkan" tidak dihitung.
// excludeId dipakai saat update/ubah status, supaya booking tidak bentrok dengan dirinya sendiri.
const findConflict = ({
  field_id,
  booking_date,
  start_time,
  end_time,
  excludeId = null,
}) => {
  let sql = `SELECT id, booking_code, start_time, end_time FROM bookings
    WHERE field_id = ?
      AND booking_date = ?
      AND status != 'Dibatalkan'
      AND start_time < ?
      AND end_time > ?`;
  const params = [field_id, booking_date, end_time, start_time];

  if (excludeId) {
    sql += ` AND id != ?`;
    params.push(excludeId);
  }

  sql += ` LIMIT 1`;
  return dbGet(sql, params);
};

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
  findConflict,
  create,
  update,
  updateStatuses,
  remove,
};