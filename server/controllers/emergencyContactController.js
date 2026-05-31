const EmergencyContact = require('../models/emergencyContactModel');
const mongoose = require('mongoose');

// @desc    Create a new emergency contact for a patient
// @route   POST /api/v1/emergency-contacts
exports.createEmergencyContact = async (req, res) => {
    try {
        const { patientId, name, relationship, phone } = req.body;
        if (!patientId || !name || !relationship || !phone) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const newContact = await EmergencyContact.create({ patientId, name, relationship, phone });
        res.status(201).json(newContact);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all emergency contacts for a specific patient
// @route   GET /api/v1/emergency-contacts/patient/:patientId
exports.getContactsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid Patient ID.' });
        }
        const contacts = await EmergencyContact.find({ patientId });
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update an emergency contact
// @route   PUT /api/v1/emergency-contacts/:id
exports.updateEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedContact = await EmergencyContact.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found.' });
        }
        res.status(200).json(updatedContact);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete an emergency contact
// @route   DELETE /api/v1/emergency-contacts/:id
exports.deleteEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await EmergencyContact.findByIdAndDelete(id);
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found.' });
        }
        res.status(200).json({ message: 'Contact deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};