const mongoose = require('mongoose');

const patientNoteSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient',
  },
  noteText: {
    type: String,
    required: [true, 'Note text cannot be empty.'],
    trim: true,
  },
  isArchived: { // For soft-deleting notes
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const PatientNote = mongoose.model('PatientNote', patientNoteSchema);
module.exports = PatientNote;