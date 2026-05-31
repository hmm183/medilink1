// services/patientService.js

const DailyReading = require('../models/dailyReadingModel');
const Patient = require('../models/patientModel');
const Prescription = require('../models/prescriptionModel');
const DiseaseHistory = require('../models/diseaseHistoryModel');

// Add daily health readings for a patient
const addDailyReading = async (patientId, readingData) => {
  const reading = new DailyReading({
    patientId,
    ...readingData,
  });
  return await reading.save();
};

// Get daily readings for a patient within a date range
const getDailyReadings = async (patientId, startDate, endDate) => {
  const query = { patientId };
  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  return await DailyReading.find(query).sort({ date: -1 });
};

// Get detailed profile and visit history of a patient
const getPatientDetails = async (patientId) => {
  // In a real app, visitCount might be calculated differently
  const patient = await Patient.findById(patientId).select('-password');
  const visitCount = await Prescription.countDocuments({ patientId });

  return { profile: patient, visitCount };
};

// Get all prescriptions for a patient
const getPrescriptions = async (patientId) => {
  return await Prescription.find({ patientId }).populate('doctorId', 'fullName specialization');
};

// Get the disease history of a patient
const getDiseaseHistory = async (patientId) => {
  return await DiseaseHistory.find({ patientId });
};

// Get a patient's current medications
const getCurrentMedicines = async (patientId) => {
  const patient = await Patient.findById(patientId).select('currentMedications');
  return patient ? patient.currentMedications : [];
};

module.exports = {
  addDailyReading,
  getDailyReadings,
  getPatientDetails,
  getPrescriptions,
  getDiseaseHistory,
  getCurrentMedicines,
};