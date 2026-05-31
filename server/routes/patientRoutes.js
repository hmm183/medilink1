const express = require('express');
const router = express.Router();
const { 
    searchPatients, 
    getPatientById, 
    getPatientsByStatus,
    getPatientStatistics,
    getRegistrationAnalytics
} = require('../controllers/patientController'); // Adjust path as needed

// 🔍 Search for patients by name
router.get('/search', searchPatients);

// 📈 Get aggregate statistics for dashboard cards
router.get('/statistics', getPatientStatistics);

// 📊 Get monthly registration data for charts
router.get('/analytics/registrations', getRegistrationAnalytics);

// 📑 Get lists of patients by their status
router.get('/', getPatientsByStatus);

// 👤 Get a single patient's complete profile by ID
router.get('/:id', getPatientById);

module.exports = router;