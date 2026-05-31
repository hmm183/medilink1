const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
  status: {
    type: String,
    enum: ['current', 'past'],
    default: 'current',
  },
});

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' , required: true },
  
  // --- NEW FIELD ADDED HERE ---
  // Optional link to a specific disease history entry
  diseaseHistoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DiseaseHistory', // This links to the DiseaseHistory model
    required: false,       // It's optional
  },
  // --------------------------
  
  date: { type: Date, default: Date.now },
  medicines: [medicineSchema],
  prescriptionUrl: { type: String },
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;