const success = (res, status, message, data = null) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, status, message, error = null) =>
  res.status(status).json({ success: false, message, error });

const errorResponse = (res, error) => {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
    return fail(res, 409, 'Data dengan nilai tersebut sudah ada');
  }
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message?.includes('FOREIGN KEY constraint failed')) {
    return fail(res, 409, 'Data masih digunakan oleh transaksi lain');
  }
  console.error(error);
  return fail(res, 500, 'Terjadi kesalahan pada server');
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

module.exports = { success, fail, errorResponse, parseId };

