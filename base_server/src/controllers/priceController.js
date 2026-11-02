const fieldModel = require('../models/fieldModel');
const priceModel = require('../models/priceModel');
const { success, fail, errorResponse, parseId } = require('../middlewares_helpers/http_helpers');

const periods = ['Weekday', 'Weekend', 'Semua Hari'];
const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

function validate(body, partial = false) {
  const output = {};
  if (body.field_id !== undefined || !partial) {
    const fieldId = Number(body.field_id);
    if (!Number.isInteger(fieldId) || fieldId < 1) return 'field_id tidak valid';
    output.field_id = fieldId;
  }
  if (body.period !== undefined || !partial) {
    if (!periods.includes(body.period)) return 'period tidak valid';
    output.period = body.period;
  }
  for (const key of ['start_time', 'end_time']) {
    if (body[key] === undefined && partial) continue;
    if (!isTime(body[key])) return `${key} harus menggunakan format HH:MM`;
    output[key] = body[key];
  }
  if (output.start_time && output.end_time && output.start_time >= output.end_time) return 'Jam selesai harus setelah jam mulai';
  if (body.price !== undefined || !partial) {
    const amount = Number(body.price);
    if (!Number.isFinite(amount) || amount < 0) return 'price harus angka minimal 0';
    output.price = Math.round(amount);
  }
  return output;
}

const getAll = async (req, res) => {
  try { success(res, 200, 'Tarif berhasil diambil', await priceModel.findAll()); }
  catch (error) { errorResponse(res, error); }
};

const getById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID tarif tidak valid');
  try {
    const price = await priceModel.findById(id);
    if (!price) return fail(res, 404, 'Tarif tidak ditemukan');
    success(res, 200, 'Detail tarif berhasil diambil', price);
  } catch (error) { errorResponse(res, error); }
};

const create = async (req, res) => {
  const price = validate(req.body);
  if (typeof price === 'string') return fail(res, 400, 'Validasi gagal', price);
  try {
    if (!await fieldModel.findById(price.field_id)) return fail(res, 400, 'Lapangan tidak ditemukan');
    success(res, 201, 'Tarif berhasil ditambahkan', await priceModel.create(price));
  } catch (error) { errorResponse(res, error); }
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID tarif tidak valid');
  const price = validate(req.body, true);
  if (typeof price === 'string') return fail(res, 400, 'Validasi gagal', price);
  try {
    if (price.field_id && !await fieldModel.findById(price.field_id)) return fail(res, 400, 'Lapangan tidak ditemukan');
    const updated = await priceModel.update(id, price);
    if (!updated) return fail(res, 404, 'Tarif tidak ditemukan');
    success(res, 200, 'Tarif berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID tarif tidak valid');
  try {
    if (!await priceModel.remove(id)) return fail(res, 404, 'Tarif tidak ditemukan');
    success(res, 200, 'Tarif berhasil dihapus');
  } catch (error) { errorResponse(res, error); }
};

module.exports = { getAll, getById, create, update, remove };

