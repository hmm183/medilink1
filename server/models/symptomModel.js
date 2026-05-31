// models/symptomModel.js

const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true }, // [cite: 79]
  symptom: { type: String, required: true }, // [cite: 80]
  reportedBy: { type: String, enum: ['patient', 'doctor'], required: true }, // [cite: 77, 81]
  date: { type: Date, default: Date.now }, // [cite: 78]
});

const Symptom = mongoose.model('Symptom', symptomSchema);
module.exports = Symptom;