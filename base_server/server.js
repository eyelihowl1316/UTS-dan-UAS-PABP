require('dotenv').config();

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
app.use('/api/auth', require('./src/routes/auth'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

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

