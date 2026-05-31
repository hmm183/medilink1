const EmergencyHospital = require('../models/emergencyHospitalModel');

// @desc    Create a new emergency hospital
// @route   POST /api/v1/emergency-hospitals
exports.createEmergencyHospital = async (req, res) => {
    try {
        const newHospital = await EmergencyHospital.create(req.body);
        res.status(201).json(newHospital);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create hospital.', error: error.message });
    }
};

// @desc    Get all emergency hospitals
// @route   GET /api/v1/emergency-hospitals
exports.getAllEmergencyHospitals = async (req, res) => {
    try {
        const hospitals = await EmergencyHospital.find({});
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update an emergency hospital
// @route   PUT /api/v1/emergency-hospitals/:id
exports.updateEmergencyHospital = async (req, res) => {
    try {
        const updatedHospital = await EmergencyHospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }
        res.status(200).json(updatedHospital);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update hospital.', error: error.message });
    }
};

// @desc    Delete an emergency hospital
// @route   DELETE /api/v1/emergency-hospitals/:id
exports.deleteEmergencyHospital = async (req, res) => {
    try {
        const deletedHospital = await EmergencyHospital.findByIdAndDelete(req.params.id);
        if (!deletedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }
        res.status(200).json({ message: 'Hospital deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};