const {
  dbRun,
  dbGet,
  dbAll,
} = require("../middlewares_helpers/sqlite3_helpers");

const findAll = () => dbAll("SELECT * FROM fields ORDER BY id ASC");
const findById = (id) => dbGet("SELECT * FROM fields WHERE id = ?", [id]);

const create = async (field) => {
  const result = await dbRun(
    `INSERT INTO fields (name, surface_type, capacity, status, hourly_rate)
    VALUES (?, ?, ?, ?, ?)`,
    [
      field.name,
      field.surface_type,
      field.capacity,
      field.status,
      field.hourly_rate,
    ],
  );
  return findById(result.lastID);
};

const update = async (id, field) => {
  const current = await findById(id);
  if (!current) return null;
  await dbRun(
    `UPDATE fields SET name = ?, surface_type = ?, capacity = ?, status = ?,
       hourly_rate = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      field.name ?? current.name,
      field.surface_type ?? current.surface_type,
      field.capacity ?? current.capacity,
      field.status ?? current.status,
      field.hourly_rate ?? current.hourly_rate,
      id,
    ],
  );
  return findById(id);
};

const remove = async (id) => {
  const result = await dbRun("DELETE FROM fields WHERE id = ?", [id]);
  return result.changes > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
