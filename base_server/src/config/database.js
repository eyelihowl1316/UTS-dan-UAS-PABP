const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const configuredPath = process.env.SQLITE_DB_PATH;
const dbPath = configuredPath
  ? path.resolve(process.cwd(), configuredPath)
  : path.resolve(__dirname, '../../database.sqlite');
const initSqlPath = path.resolve(__dirname, '../sql_scripts/init.sql');

if (!fs.existsSync(initSqlPath)) {
  throw new Error(`File inisialisasi SQLite tidak ditemukan: ${initSqlPath}`);
}

const initSQL = fs.readFileSync(initSqlPath, 'utf8');
const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Gagal membuka SQLite:', error.message);
    process.exit(1);
  }
  console.log('Terhubung ke SQLite:', dbPath);
});

const initializeDatabase = () =>
  new Promise((resolve, reject) => {
    db.exec(`PRAGMA foreign_keys = ON;\n${initSQL}`, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

module.exports = { db, dbPath, initializeDatabase };

