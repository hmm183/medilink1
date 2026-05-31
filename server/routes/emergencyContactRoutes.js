const express = require('express');
const router = express.Router();
const {
    createEmergencyContact,
    getContactsByPatient,
    updateEmergencyContact,
    deleteEmergencyContact,
} = require('../controllers/emergencyContactController');

// Routes
router.post('/', createEmergencyContact);
router.get('/patient/:patientId', getContactsByPatient);
router.put('/:id', updateEmergencyContact);
router.delete('/:id', deleteEmergencyContact);

module.exports = router;