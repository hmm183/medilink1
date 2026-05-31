const express = require('express');
const router = express.Router();

const {
  createPrescription,
  getPrescriptionsByPatient,
  updatePrescription,
  updateMedicineStatus,
  addMedicineToPrescription,
  updateMedicineDetails,
  deletePrescription // Ensure this is imported
} = require('../controllers/PrescriptionController');

// Routes for creating a new prescription and getting all for a patient
router.route('/')
  .post(createPrescription);

router.route('/patient/:patientId')
  .get(getPrescriptionsByPatient);

// Routes for a specific prescription by its ID (Update and Delete)
router.route('/:id')
  .put(updatePrescription)
  .delete(deletePrescription);

// Routes for adding a new medicine to a prescription
router.route('/:id/medicines')
  .post(addMedicineToPrescription);

// Routes for a specific medicine within a prescription (Update details and status)
router.route('/:prescriptionId/medicines/:medicineId')
  .put(updateMedicineDetails);

router.route('/medicines/:prescriptionId/:medicineId/status')
  .put(updateMedicineStatus);

module.exports = router;
