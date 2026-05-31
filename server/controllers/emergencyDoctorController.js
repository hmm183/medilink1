const EmergencyDoctor = require('../models/emergencyDoctorModel');

// @desc    Create a new emergency doctor
// @route   POST /api/v1/emergency-doctors
exports.createEmergencyDoctor = async (req, res) => {
    try {
        const newDoctor = await EmergencyDoctor.create(req.body);
        res.status(201).json(newDoctor);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create doctor.', error: error.message });
    }
};

// @desc    Get all emergency doctors
// @route   GET /api/v1/emergency-doctors
exports.getAllEmergencyDoctors = async (req, res) => {
    try {
        const doctors = await EmergencyDoctor.find({});
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update an emergency doctor
// @route   PUT /api/v1/emergency-doctors/:id
exports.updateEmergencyDoctor = async (req, res) => {
    try {
        const updatedDoctor = await EmergencyDoctor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }
        res.status(200).json(updatedDoctor);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update doctor.', error: error.message });
    }
};

// @desc    Delete an emergency doctor
// @route   DELETE /api/v1/emergency-doctors/:id
exports.deleteEmergencyDoctor = async (req, res) => {
    try {
        const deletedDoctor = await EmergencyDoctor.findByIdAndDelete(req.params.id);
        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }
        res.status(200).json({ message: 'Doctor deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};