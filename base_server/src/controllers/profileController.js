
const { dbGet, dbRun } = require("../middlewares_helpers/sqlite3_helpers");
const { success, fail, errorResponse } = require("../middlewares_helpers/http_helpers");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mengambil profil berdasarkan akun yang sedang login
const get = async (req, res) => {
  try {
    const user = await dbGet(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return fail(res, 404, "Pengguna tidak ditemukan.");
    }

    return success(res, 200, "Profil berhasil diambil.", user);
  } catch (error) {
    errorResponse(res, error);
  }
};

// Memperbarui profil akun yang sedang login
const update = async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (name.length < 2) {
    return fail(res, 400, "Nama minimal 2 karakter.");
  }

  if (!EMAIL_RE.test(email)) {
    return fail(res, 400, "Alamat email tidak valid.");
  }

  try {
    await dbRun(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name, email, req.user.id]
    );

    const user = await dbGet(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      return fail(res, 404, "Pengguna tidak ditemukan.");
    }

    return success(res, 200, "Profil berhasil diperbarui.", user);
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") {
      return fail(res, 409, "Email sudah digunakan oleh akun lain.");
    }

    errorResponse(res, error);
  }
};

module.exports = { get, update };
