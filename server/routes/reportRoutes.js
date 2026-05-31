// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

//router.post('/generate', protect, authorize('patient'), generateReport);

module.exports = router;