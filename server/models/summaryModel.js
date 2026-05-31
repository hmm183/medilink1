const mongoose = require('mongoose');

const SummarySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  summaryContent: {
    type: String,
    default: '',
  },
  sourceData: {
    type: String,
    default: '',
  },
  model: {
    type: String,
    default: '',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Optional: ensure one summary per patient (uncomment if desired)
// SummarySchema.index({ patientId: 1 }, { unique: true });

module.exports = mongoose.model('Summary', SummarySchema);
