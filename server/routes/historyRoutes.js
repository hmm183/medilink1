const express = require('express');
const router = express.Router();

const {
  createDiseaseHistory,
  getHistoryByPatient,
  updateDiseaseHistory,
  getHistorySummaryByPatient,
  getDiseaseHotspots
} = require('../controllers/historyController');

// --- NEW: Route to get disease hotspot locations ---
// Example: GET /api/v1/history/hotspots?disease=Flu&lat=28.6139&lng=77.2090&radius=10
router.get('/hotspots', getDiseaseHotspots);

// POST: Create a new history entry
router.post('/', createDiseaseHistory);

// GET: Get a summarized history for a patient
router.get('/patient/:patientId/summary', getHistorySummaryByPatient);

// GET: Get the full history for a patient
// This route is placed after the more specific '/summary' route to avoid conflicts
router.get('/patient/:patientId', getHistoryByPatient);

// PUT: Update an existing history entry by its unique ID
router.put('/:id', updateDiseaseHistory);

module.exports = router;