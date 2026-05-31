// routes/dailyReadingRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  addDailyReading,
  updateDailyReading,
  getReadingsForPatient, // <-- Import the new function
} = require('../controllers/dailyReadingController');

// Define the POST route to add a new reading
router.post('/', addDailyReading);

// Define the GET route to fetch all readings for a patient
// Endpoint: GET http://localhost:PORT/api/readings/patient/60d5ecb4b3e3f1a3b8e8f8a1
router.get('/patient/:patientId', getReadingsForPatient);

// Define the PUT route to update a reading by its ID
router.put('/:id', updateDailyReading);

module.exports = router;