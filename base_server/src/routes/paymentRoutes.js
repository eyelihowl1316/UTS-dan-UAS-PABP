const express = require('express');
const controller = require('../controllers/paymentController');
const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;

