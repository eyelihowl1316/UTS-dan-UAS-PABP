const profileModel = require('../models/profileModel');
const { success, fail, errorResponse } = require('../middlewares_helpers/http_helpers');

const get = async (req, res) => {
  try { success(res, 200, 'Profil berhasil diambil', await profileModel.get()); }
  catch (error) { errorResponse(res, error); }
};

const update = async (req, res) => {
  const { name, email } = req.body;
  if (typeof name !== 'string' || !name.trim()) return fail(res, 400, 'Validasi gagal', 'Nama pengelola wajib diisi');
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return fail(res, 400, 'Validasi gagal', 'Alamat email tidak valid');
  }
  try {
    success(res, 200, 'Profil berhasil diperbarui', await profileModel.update({ name: name.trim(), email: email.trim() }));
  } catch (error) { errorResponse(res, error); }
};

module.exports = { get, update };

