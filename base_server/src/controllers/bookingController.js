const crypto = require('crypto');
const fieldModel = require('../models/fieldModel');
const bookingModel = require('../models/bookingModel');
const paymentModel = require('../models/paymentModel');
const { success, fail, errorResponse, parseId } = require('../middlewares_helpers/http_helpers');

const bookingStatuses = ['Menunggu', 'Dikonfirmasi', 'Dibatalkan'];
const paymentStatuses = ['Menunggu', 'Lunas', 'Refund'];
const isDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function calculateTotal(hourlyRate, startTime, endTime) {
  const hours = (toMinutes(endTime) - toMinutes(startTime)) / 60;
  return Math.round(Number(hourlyRate) * hours);
}

function validate(body, partial = false) {
  const output = {};
  const requiredText = ['customer', 'phone'];
  for (const key of requiredText) {
    if (body[key] === undefined && partial) continue;
    if (typeof body[key] !== 'string' || !body[key].trim()) return `${key} wajib diisi`;
    output[key] = body[key].trim();
  }
  if (body.field_id !== undefined || !partial) {
    const fieldId = Number(body.field_id);
    if (!Number.isInteger(fieldId) || fieldId < 1) return 'field_id tidak valid';
    output.field_id = fieldId;
  }
  if (body.booking_date !== undefined || !partial) {
    if (!isDate(body.booking_date)) return 'booking_date harus berformat YYYY-MM-DD';
    output.booking_date = body.booking_date;
  }
  for (const key of ['start_time', 'end_time']) {
    if (body[key] === undefined && partial) continue;
    if (!isTime(body[key])) return `${key} harus menggunakan format HH:MM`;
    output[key] = body[key];
  }
  if (output.start_time && output.end_time && output.start_time >= output.end_time) {
    return 'Jam selesai harus setelah jam mulai';
  }
  
  if (body.status !== undefined) {
    if (!bookingStatuses.includes(body.status)) return 'status booking tidak valid';
    output.status = body.status;
  }
  if (body.payment_status !== undefined) {
    if (!paymentStatuses.includes(body.payment_status)) return 'payment_status tidak valid';
    output.payment_status = body.payment_status;
  }
  return output;
}

  const getAll = async (req, res) => {
  try { success(res, 200, 'Booking berhasil diambil', await bookingModel.findAll()); }
  catch (error) { console.error('BOOKING ERROR:', error); errorResponse(res, error); }
};

const getById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID booking tidak valid');
  try {
    const booking = await bookingModel.findById(id);
    if (!booking) return fail(res, 404, 'Booking tidak ditemukan');
    success(res, 200, 'Detail booking berhasil diambil', booking);
  } catch (error) { errorResponse(res, error); }
};

const create = async (req, res) => {
  const booking = validate(req.body);
  if (typeof booking === 'string') return fail(res, 400, 'Validasi gagal', booking);
  try {
    const field = await fieldModel.findById(booking.field_id);
    if (!field) return fail(res, 400, 'Lapangan tidak ditemukan');
    booking.total_amount = calculateTotal(field.hourly_rate, booking.start_time, booking.end_time);
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    booking.booking_code = `BK-${Date.now().toString().slice(-6)}-${suffix}`;
    booking.status = 'Menunggu';
    booking.payment_status = 'Menunggu';
    const created = await bookingModel.create(booking);
    await paymentModel.createForBooking(created);
    success(res, 201, 'Booking berhasil dibuat', created);
  } catch (error) { console.error('BOOKING ERROR:', error); errorResponse(res, error); }
};

const update = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID booking tidak valid');
  const booking = validate(req.body, true);
  if (typeof booking === 'string') return fail(res, 400, 'Validasi gagal', booking);
  try {
    const existing = await bookingModel.findById(id);
    if (!existing) return fail(res, 404, 'Booking tidak ditemukan');

  
    const fieldId = booking.field_id ?? existing.field_id;
    const startTime = booking.start_time ?? existing.start_time;
    const endTime = booking.end_time ?? existing.end_time;

    if (startTime >= endTime) return fail(res, 400, 'Validasi gagal', 'Jam selesai harus setelah jam mulai');

    const field = await fieldModel.findById(fieldId);
    if (!field) return fail(res, 400, 'Lapangan tidak ditemukan');

    booking.total_amount = calculateTotal(field.hourly_rate, startTime, endTime);

    const updated = await bookingModel.update(id, booking);
    if (!updated) return fail(res, 404, 'Booking tidak ditemukan');
    success(res, 200, 'Booking berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

const updateStatus = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID booking tidak valid');
  const { status } = req.body;
  if (!bookingStatuses.includes(status)) return fail(res, 400, 'Validasi gagal', 'status booking tidak valid');
  try {
    const updated = await bookingModel.updateStatuses(id, { status });
    if (!updated) return fail(res, 404, 'Booking tidak ditemukan');
    success(res, 200, 'Status booking berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

const remove = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID booking tidak valid');
  try {
    if (!await bookingModel.remove(id)) return fail(res, 404, 'Booking tidak ditemukan');
    success(res, 200, 'Booking berhasil dihapus');
  } catch (error) { errorResponse(res, error); }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };

