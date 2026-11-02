const fieldModel = require('../models/fieldModel');
const { success, fail, errorResponse, parseId } = require('../middlewares_helpers/http_helpers');

const validStatuses = ['Aktif', 'Perawatan'];

function validateField(body, partial = false) {
  const result = {};
  const textFields = ['name', 'surface_type', 'capacity'];
  for (const key of textFields) {
    if (body[key] === undefined && partial) continue;
    if (typeof body[key] !== 'string' || !body[key].trim()) return `${key} wajib diisi`;
    result[key] = body[key].trim();
  }
  if (body.status !== undefined || !partial) {
    if (!validStatuses.includes(body.status)) return 'status lapangan tidak valid';
    result.status = body.status;
  }
  if (body.hourly_rate !== undefined || !partial) {
    const rate = Number(body.hourly_rate);
    if (!Number.isFinite(rate) || rate < 0) return 'hourly_rate harus angka minimal 0';
    result.hourly_rate = Math.round(rate);
  }
  return result;
}

const getAll = async (req, res) => {
  try { success(res, 200, 'Data lapangan berhasil diambil', await fieldModel.findAll()); }
  catch (error) { errorResponse(res, error); }
};

const getById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID lapangan tidak valid');
  try {
    const field = await fieldModel.findById(id);
    if (!field) return fail(res, 404, 'Lapangan tidak ditemukan');
    success(res, 200, 'Detail lapangan berhasil diambil', field);
  } catch (error) { errorResponse(res, error); }
};

const create = async (req, res) => {
  const field = validateField(req.body);
  if (typeof field === 'string') return fail(res, 400, 'Validasi gagal', field);
  try { success(res, 201, 'Lapangan berhasil ditambahkan', await fieldModel.create(field)); }
  catch (error) { errorResponse(res, error); }
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID lapangan tidak valid');
  const field = validateField(req.body, true);
  if (typeof field === 'string') return fail(res, 400, 'Validasi gagal', field);
  try {
    const updated = await fieldModel.update(id, field);
    if (!updated) return fail(res, 404, 'Lapangan tidak ditemukan');
    success(res, 200, 'Lapangan berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID lapangan tidak valid');
  try {
    if (!await fieldModel.remove(id)) return fail(res, 404, 'Lapangan tidak ditemukan');
    success(res, 200, 'Lapangan berhasil dihapus');
  } catch (error) { errorResponse(res, error); }
};

module.exports = { getAll, getById, create, update, remove };

