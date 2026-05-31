// routes/ocrPrescriptionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  processOcrPrescription, 
  getOcrPrescriptionResult,
  getPrescriptionsForPatient // ✅ CORRECTED: This name now matches the controller export
} = require('../controllers/ocrPrescriptionController');

router.post('/', processOcrPrescription);
router.get('/:id', getOcrPrescriptionResult);
// The handler name here must also match the imported name
router.get('/patient/:patientId', getPrescriptionsForPatient); 

module.exports = router;