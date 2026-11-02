const reportModel = require('../models/reportModel');
const { success, fail, errorResponse } = require('../middlewares_helpers/http_helpers');

const getSummary = async (req, res) => {
  const today = req.query.today || new Date().toISOString().slice(0, 10);
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return fail(res, 400, 'Tanggal harus berformat YYYY-MM-DD');
  }
  try { success(res, 200, 'Ringkasan laporan berhasil diambil', await reportModel.getSummary(today)); }
  catch (error) { errorResponse(res, error); }
};

module.exports = { getSummary };

