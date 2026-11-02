const {
  dbRun,
  dbGet,
  dbAll,
} = require("../middlewares_helpers/sqlite3_helpers");

const select = `SELECT p.*, f.name AS field_name FROM prices p
  JOIN fields f ON f.id = p.field_id`;

const findAll = () => dbAll(`${select} ORDER BY p.field_id ASC, p.period ASC`);
const findById = (id) => dbGet(`${select} WHERE p.id = ?`, [id]);

const create = async (price) => {
  const result = await dbRun(
    `INSERT INTO prices (field_id, period, start_time, end_time, price)
     VALUES (?, ?, ?, ?, ?)`,
    [
      price.field_id,
      price.period,
      price.start_time,
      price.end_time,
      price.price,
    ],
  );
  return findById(result.lastID);
};

const update = async (id, price) => {
  const current = await findById(id);
  if (!current) return null;
  await dbRun(
    `UPDATE prices SET field_id = ?, period = ?, start_time = ?, end_time = ?, price = ? WHERE id = ?`,
    [
      price.field_id ?? current.field_id,
      price.period ?? current.period,
      price.start_time ?? current.start_time,
      price.end_time ?? current.end_time,
      price.price ?? current.price,
      id,
    ],
  );
  return findById(id);
};

const remove = async (id) => {
  const result = await dbRun("DELETE FROM prices WHERE id = ?", [id]);
  return result.changes > 0;
};

const findByFieldAndPeriod = (fieldId, period) =>
  dbAll(
    `SELECT * FROM prices
     WHERE field_id = ? AND period = ?
     ORDER BY start_time ASC`,
    [fieldId, period],
  );
module.exports = {
  findAll,
  findById,
  findByFieldAndPeriod,
  create,
  update,
  remove,
};
