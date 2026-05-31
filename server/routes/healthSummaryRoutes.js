const express = require('express');
const router = express.Router();
const {
    getHealthSummary,
    generateHealthSummary,
    queryHealthData,generateAndEmailSummary
} = require('../controllers/healthSummaryController'); // Adjust path as needed

// A router to handle authentication would go here
// const { protect } = require('../middleware/authMiddleware');

// GET a patient's saved health summary -> THIS FIXES THE 404 ERROR
router.get('/patient/:patientId', getHealthSummary);

// POST to generate a new health summary
router.post('/generate', generateHealthSummary);

// POST to ask a specific question (query)
router.post('/query', queryHealthData);

router.post('/generate-and-email', generateAndEmailSummary);

module.exports = router;
