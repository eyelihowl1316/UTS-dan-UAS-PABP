const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

const findAll = () => dbAll('SELECT * FROM operating_schedules ORDER BY id ASC');
const findById = (id) => dbGet('SELECT * FROM operating_schedules WHERE id = ?', [id]);

const create = async (schedule) => {
  const result = await dbRun(
    `INSERT INTO operating_schedules (day_label, open_time, close_time, status)
     VALUES (?, ?, ?, ?)`,
    [schedule.day_label, schedule.open_time, schedule.close_time, schedule.status],
  );
  return findById(result.lastID);
};

const update = async (id, schedule) => {
  const current = await findById(id);
  if (!current) return null;
  await dbRun(
    `UPDATE operating_schedules SET day_label = ?, open_time = ?, close_time = ?, status = ?
     WHERE id = ?`,
    [
      schedule.day_label ?? current.day_label,
      schedule.open_time ?? current.open_time,
      schedule.close_time ?? current.close_time,
      schedule.status ?? current.status,
      id,
    ],
  );
  return findById(id);
};

const remove = async (id) => {
  const result = await dbRun('DELETE FROM operating_schedules WHERE id = ?', [id]);
  return result.changes > 0;
};

module.exports = { findAll, findById, create, update, remove };

