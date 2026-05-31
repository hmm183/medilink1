// models/ocrPrescriptionModel.js
const mongoose = require('mongoose');

const ocrPrescriptionSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing',
  },
  ocrText: { 
    type: String 
  },
  structuredMedicines: { 
    type: mongoose.Schema.Types.Mixed // Allows storing flexible JSON from Gemini
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

const OcrPrescription = mongoose.model('OcrPrescription', ocrPrescriptionSchema);
module.exports = OcrPrescription;