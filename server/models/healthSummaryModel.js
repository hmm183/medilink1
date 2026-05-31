const mongoose = require('mongoose');

const healthSummarySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true, // Each patient has only one summary document
  },
  summaryContent: {
    type: String,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  sourceData: { // The prompt used to generate the summary
    type: String, 
  },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const HealthSummary = mongoose.model('HealthSummary', healthSummarySchema);
module.exports = HealthSummary;
