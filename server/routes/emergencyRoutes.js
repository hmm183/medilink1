// routes/emergencyRoutes.js

const express = require('express');
const router = express.Router();
const { triggerAlert } = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/authMiddleware');

//router.post('/alert', protect, authorize('patient'), triggerAlert);

module.exports = router;