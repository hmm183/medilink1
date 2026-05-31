const mongoose = require('mongoose');

const emergencyHospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hospital name is required.'],
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required.'],
        trim: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere', // For geospatial queries
        },
    },
}, { timestamps: true });

const EmergencyHospital = mongoose.model('EmergencyHospital', emergencyHospitalSchema);

module.exports = EmergencyHospital;