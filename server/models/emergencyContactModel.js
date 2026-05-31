const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true, // Index for faster lookups by patient
    },
    name: {
        type: String,
        required: [true, 'Contact name is required.'],
        trim: true,
    },
    relationship: {
        type: String,
        required: [true, 'Relationship to the patient is required.'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required.'],
        trim: true,
    },
}, { timestamps: true });

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

module.exports = EmergencyContact;