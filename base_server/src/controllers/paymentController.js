const paymentModel = require('../models/paymentModel');
const { success, fail, errorResponse, parseId } = require('../middlewares_helpers/http_helpers');

const statuses = ['Menunggu', 'Terverifikasi', 'Refund'];

const getAll = async (req, res) => {
  try { success(res, 200, 'Pembayaran berhasil diambil', await paymentModel.findAll()); }
  catch (error) { errorResponse(res, error); }
};

const getById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID pembayaran tidak valid');
  try {
    const payment = await paymentModel.findById(id);
    if (!payment) return fail(res, 404, 'Pembayaran tidak ditemukan');
    success(res, 200, 'Detail pembayaran berhasil diambil', payment);
  } catch (error) { errorResponse(res, error); }
};

const updateStatus = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'ID pembayaran tidak valid');
  if (!statuses.includes(req.body.status)) return fail(res, 400, 'Validasi gagal', 'status pembayaran tidak valid');
  try {
    const updated = await paymentModel.updateStatus(id, req.body.status);
    if (!updated) return fail(res, 404, 'Pembayaran tidak ditemukan');
    success(res, 200, 'Status pembayaran berhasil diperbarui', updated);
  } catch (error) { errorResponse(res, error); }
};

module.exports = { getAll, getById, updateStatus };

