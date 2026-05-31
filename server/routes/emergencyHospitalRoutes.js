const express = require('express');
const router = express.Router();
const {
    createEmergencyHospital,
    getAllEmergencyHospitals,
    updateEmergencyHospital,
    deleteEmergencyHospital,
} = require('../controllers/emergencyHospitalController');

// Routes
router.route('/')
    .post(createEmergencyHospital)
    .get(getAllEmergencyHospitals);

router.route('/:id')
    .put(updateEmergencyHospital)
    .delete(deleteEmergencyHospital);

module.exports = router;