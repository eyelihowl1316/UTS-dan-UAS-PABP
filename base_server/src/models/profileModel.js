const { dbRun, dbGet } = require('../middlewares_helpers/sqlite3_helpers');

const get = () => dbGet('SELECT name, email FROM profile WHERE id = 1');

const update = async ({ name, email }) => {
  await dbRun('UPDATE profile SET name = ?, email = ? WHERE id = 1', [name, email]);
  return get();
};

module.exports = { get, update };

