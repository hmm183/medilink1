// controllers/doctorController.js

const Doctor = require('../models/doctorModel');
const mongoose = require('mongoose');
// For a real application, you would use a library like bcryptjs for hashing passwords
// const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new doctor
 * @route   POST /api/doctors
 * @access  Public
 */
const createDoctor = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      specialization,
      licenseNumber,
      qualifications,
    } = req.body;

    // Check if a doctor with a unique field already exists to provide a clear error
    const doctorExists = await Doctor.findOne({
      $or: [{ email }, { username }, { licenseNumber }],
    });

    if (doctorExists) {
      return res.status(409).json({ message: 'A doctor with this username, email, or license number already exists.' });
    }

    // IMPORTANT: In a real-world app, the password MUST be hashed before saving.
    // This is often done using a pre-save hook in the Mongoose schema itself.
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const newDoctor = new Doctor({
      username,
      email,
      password, // This should be the hashedPassword in a production environment
      fullName,
      phone,
      specialization,
      licenseNumber,
      qualifications,
    });

    const savedDoctor = await newDoctor.save();

    // Create a response object without the password for security
    const doctorResponse = { ...savedDoctor._doc };
    delete doctorResponse.password;

    res.status(201).json(doctorResponse);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Server error while creating doctor.' });
  }
};

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public or Protected
 */
const getAllDoctors = async (req, res) => {
  try {
    // Fetch all documents but exclude the password field from the result
    const doctors = await Doctor.find({}).select('-password');
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Server error while fetching doctors.' });
  }
};

/**
 * @desc    Get a single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public or Protected
 */
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        // First, check if the provided ID is a valid MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid doctor ID format.' });
        }

        const doctor = await Doctor.findById(id).select('-password');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        res.status(200).json(doctor);
    } catch (error) {
        console.error('Error fetching doctor by ID:', error);
        res.status(500).json({ message: 'Server error while fetching doctor.' });
    }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
};