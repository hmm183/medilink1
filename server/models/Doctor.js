const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    // Details from the NMC API
    doctorId: {
        type: Number,
        required: true,
        unique: true,
    },
    registrationNo: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    council: {
        type: String,
    },
    yearInfo: {
        type: Number,
    },
    address: {
        type: String,
    },
    // Details for your own application's login system
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);