require('dotenv').config();
<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const testRoutes =  require('./src/routes/test')
const productRoutes = require('./src/routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Root route */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Product API is running',
    endpoints: {
      'GET    /api/products':      'Ambil semua produk',
      'GET    /api/products/:id':  'Ambil produk by id',
      'POST   /api/products':      'Buat produk baru',
      'PUT    /api/products/:id':  'Update produk',
      'DELETE /api/products/:id':  'Hapus produk',
    },
  });
});

/* Routes */
app.use('/api/test', testRoutes)
app.use('/api/products', productRoutes);

/* 404 */
=======

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const fieldsRoutes = require('./src/routes/fieldRoutes');
const schedulesRoutes = require('./src/routes/scheduleRoutes');
const bookingsRoutes = require('./src/routes/bookingRoutes');
const paymentsRoutes = require('./src/routes/paymentRoutes');
const pricesRoutes = require('./src/routes/priceRoutes');
const reportsRoutes = require('./src/routes/reportRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FutsalPro API berjalan',
    endpoints: [
      '/api/fields',
      '/api/schedules',
      '/api/bookings',
      '/api/payments',
      '/api/prices',
      '/api/reports/summary',
      '/api/profile',
    ],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/api/fields', fieldsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);

>>>>>>> d5ef0fb (API dan Web Client Version 1)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

<<<<<<< HEAD
/* Start */
(async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
  });
})();
=======
async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`FutsalPro API berjalan di http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Gagal menyiapkan database:', error.message);
  process.exitCode = 1;
});

>>>>>>> d5ef0fb (API dan Web Client Version 1)
