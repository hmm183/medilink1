const express = require('express');
const router = express.Router();
const {
    createEmergencyDoctor,
    getAllEmergencyDoctors,
    updateEmergencyDoctor,
    deleteEmergencyDoctor,
} = require('../controllers/emergencyDoctorController');

// Routes
router.route('/')
    .post(createEmergencyDoctor)
    .get(getAllEmergencyDoctors);

router.route('/:id')
    .put(updateEmergencyDoctor)
    .delete(deleteEmergencyDoctor);

module.exports = router;