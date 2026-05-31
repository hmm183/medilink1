const mongoose = require('mongoose');

const dailyReadingSchema = new mongoose.Schema(
  {
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    // This 'date' field stores a full timestamp, including both date and time.
    date: { 
      type: Date, 
      default: Date.now 
    },
    bloodPressure: {
      systolic: { type: Number, required: true },
      diastolic: { type: Number, required: true },
    },
    // New field for pulse rate in beats per minute (BPM)
    pulseRate: { 
      type: Number, 
      required: true 
    },
    weightKg: { 
      type: Number 
    },
  },
  {
    // This adds a createdAt timestamp automatically
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const DailyReading = mongoose.model('DailyReading', dailyReadingSchema);
module.exports = DailyReading;