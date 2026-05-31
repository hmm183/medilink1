// models/appointmentModel.js

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true }, // [cite: 84]
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, // [cite: 84]
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'], // [cite: 84]
      default: 'scheduled',
    },
  },
  {
    timestamps: true, // Adds createdAt timestamp [cite: 84]
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;