const mongoose = require('mongoose');

const diseaseHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient', 
  },
  illnessName: {
    type: String,
    required: true,
    trim: true, // Good practice to trim whitespace
    index: true, // Index this field for faster disease-specific queries
  },
  diagnosisDate: {
    type: Date,
    default: Date.now,
  },
  initialSymptoms: {
    type: [String],
    default: [],
  },
  remarks: {
    type: String,
  },
  medicinesPrescribed: {
    type: [String],
    default: [],
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor', 
  },
  status: {
    type: String,
    enum: ['ongoing', 'resolved'],
    default: 'ongoing',
  },
  hospital: {
    type: String,
  },
  // --- NEW: Location field for geospatial queries ---
  location: {
    type: {
      type: String,
      enum: ['Point'], // We are storing a single point
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers for [longitude, latitude]
      required: true,
    },
  },
}, {
  timestamps: true,
});

// --- NEW: Add a 2dsphere index for efficient location queries ---
diseaseHistorySchema.index({ location: '2dsphere' });

const DiseaseHistory = mongoose.model('DiseaseHistory', diseaseHistorySchema);
module.exports = DiseaseHistory;