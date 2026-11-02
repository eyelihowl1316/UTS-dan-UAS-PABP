const scheduleModel = require('../models/scheduleModel');
const { success, fail, errorResponse, parseId } = require('../middlewares_helpers/http_helpers');

const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const statuses = ['Buka', 'Tutup'];

function validate(body, partial = false) {
  const output = {};
  for (const key of ['day_label', 'open_time', 'close_time', 'status']) {
    if (body[key] === undefined && partial) continue;
    if (key === 'day_label') {
      if (typeof body[key] !== 'string' || !body[key].trim()) return 'day_label wajib diisi';
      output[key] = body[key].trim();
    } else if (key === 'status') {
      if (!statuses.includes(body[key])) return 'status jadwal tidak valid';
      output[key] = body[key];
    } else {
      if (!isTime(body[key])) return `${key} harus menggunakan format HH:MM`;
      output[key] = body[key];
    }
  }
  if (output.open_time && output.close_time && output.open_time >= output.close_time) {
    return 'Jam tutup harus setelah jam buka';
  }
  return output;
}

const getAll = async (req, res) => {
  try { success(res, 200, 'Jadwal berhasil diambil', await scheduleModel.findAll()); }
  catch (error) { errorResponse(res, error); }
};

const getById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID jadwal tidak valid');
  try {
    const schedule = await scheduleModel.findById(id);
    if (!schedule) return fail(res, 404, 'Jadwal tidak ditemukan');
    success(res, 200, 'Detail jadwal berhasil diambil', schedule);
  } catch (error) { errorResponse(res, error); }
};

const create = async (req, res) => {
  const schedule = validate(req.body);
  if (typeof schedule === 'string') return fail(res, 400, 'Validasi gagal', schedule);
  try { success(res, 201, 'Jadwal berhasil ditambahkan', await scheduleModel.create(schedule)); }
  catch (error) { errorResponse(res, error); }
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID jadwal tidak valid');
  const schedule = validate(req.body, true);
  if (typeof schedule === 'string') return fail(res, 400, 'Validasi gagal', schedule);
  try {
    const updated = await scheduleModel.update(id, schedule);
    if (!updated) return fail(res, 404, 'Jadwal tidak ditemukan');
    success(res, 200, 'Jadwal berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID jadwal tidak valid');
  try {
    if (!await scheduleModel.remove(id)) return fail(res, 404, 'Jadwal tidak ditemukan');
    success(res, 200, 'Jadwal berhasil dihapus');
  } catch (error) { errorResponse(res, error); }
};

module.exports = { getAll, getById, create, update, remove };

