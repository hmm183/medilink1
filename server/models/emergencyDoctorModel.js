const mongoose = require('mongoose');

const emergencyDoctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required.'],
        trim: true,
    },
    specialty: {
        type: String,
        trim: true,
        default: 'General Physician',
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required.'],
        trim: true,
    },
    hospitalAffiliation: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

const EmergencyDoctor = mongoose.model('EmergencyDoctor', emergencyDoctorSchema);

module.exports = EmergencyDoctor;