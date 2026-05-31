const DailyReading = require('../models/dailyReadingModel');
const mongoose = require('mongoose');

/**
 * @desc    Create a new daily reading for a patient
 * @route   POST /api/readings
 * @access  Private
 */
// controllers/dailyReadingController.js

const addDailyReading = async (req, res) => {
  try {
    // --- FIX APPLIED HERE ---
    // Instead of destructuring systolic and diastolic directly, we get the whole bloodPressure object.
    const { patientId, bloodPressure, weightKg, pulseRate, date } = req.body;

    // A quick check to ensure the bloodPressure object and its keys were provided.
    if (!bloodPressure || !bloodPressure.systolic || !bloodPressure.diastolic) {
      return res.status(400).json({ message: 'A bloodPressure object with systolic and diastolic values is required.' });
    }

    const newReading = new DailyReading({
      patientId,
      // We can now pass the bloodPressure object directly, as it matches the model.
      bloodPressure: {
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic,
      },
      pulseRate,
      weightKg,
      date,
    });

    const savedReading = await newReading.save();
    res.status(201).json(savedReading);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error adding daily reading:', error);
    res.status(500).json({ message: 'Server error while adding reading.' });
  }
};

/**
 * @desc    Update an existing daily reading
 * @route   PUT /api/readings/:id
 * @access  Private
 */
const updateDailyReading = async (req, res) => {
  try {
    const { id } = req.params;
    // Destructure pulseRate and date from the body for updates
    const { systolic, diastolic, weightKg, pulseRate, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid reading ID format.' });
    }

    const reading = await DailyReading.findById(id);

    if (!reading) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    // Update the fields if new values are provided
    if (systolic) reading.bloodPressure.systolic = systolic;
    if (diastolic) reading.bloodPressure.diastolic = diastolic;
    if (weightKg) reading.weightKg = weightKg;
    if (pulseRate) reading.pulseRate = pulseRate; // Added pulseRate update logic
    if (date) reading.date = date; // Added date/time update logic

    const updatedReading = await reading.save();
    res.status(200).json(updatedReading);
  } catch (error) {
    console.error('Error updating daily reading:', error);
    res.status(500).json({ message: 'Server error while updating reading.' });
  }
};

// controllers/dailyReadingController.js


const getReadingsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID format.' });
    }

    // Find all readings for the patient and sort them by date in ascending order
    const readings = await DailyReading.find({ patientId }).sort({ date: 'asc' });

    if (!readings) {
      // Return an empty array if no readings are found, which is not an error
      return res.status(200).json([]);
    }

    res.status(200).json(readings);
  } catch (error) {
    console.error('Error fetching daily readings:', error);
    res.status(500).json({ message: 'Server error while fetching readings.' });
  }
};


module.exports = {
  addDailyReading,
  updateDailyReading,
  getReadingsForPatient, // <-- Export the new function
};
