<<<<<<< HEAD
const { db } = require("../config/database");

const dbRun = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
=======
const { db } = require('../config/database');

const dbRun = (query, params = []) =>
  new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
      if (error) reject(error);
>>>>>>> d5ef0fb (API dan Web Client Version 1)
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const dbGet = (query, params = []) =>
  new Promise((resolve, reject) => {
<<<<<<< HEAD
    db.get(query, params, (err, row) => {
      if (err) reject(err);
=======
    db.get(query, params, (error, row) => {
      if (error) reject(error);
>>>>>>> d5ef0fb (API dan Web Client Version 1)
      else resolve(row);
    });
  });

const dbAll = (query, params = []) =>
  new Promise((resolve, reject) => {
<<<<<<< HEAD
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
=======
    db.all(query, params, (error, rows) => {
      if (error) reject(error);
>>>>>>> d5ef0fb (API dan Web Client Version 1)
      else resolve(rows);
    });
  });

<<<<<<< HEAD

module.exports ={
    dbRun,
    dbGet,
    dbAll
}
=======
module.exports = { dbRun, dbGet, dbAll };

>>>>>>> d5ef0fb (API dan Web Client Version 1)
