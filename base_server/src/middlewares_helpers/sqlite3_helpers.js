const { db } = require('../config/database');

const dbRun = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const dbGet = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });

const dbAll = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

module.exports = { dbRun, dbGet, dbAll };

