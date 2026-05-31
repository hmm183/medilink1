// services/doctorService.js

const Appointment = require('../models/appointmentModel');
const Patient = require('../models/patientModel');

// Get statistics for a doctor
const getDoctorStats = async (doctorId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointmentsToday = await Appointment.countDocuments({
    doctorId,
    date: { $gte: today, $lt: tomorrow },
  });

  const upcomingAppointments = await Appointment.countDocuments({
    doctorId,
    date: { $gte: tomorrow },
    status: 'scheduled',
  });

  // This is a mock value as 'cured' is not tracked
  const totalPatientsCured = 152;

  return {
    totalPatientsCured,
    appointmentsToday,
    upcomingAppointments,
  };
};

// Search for patients by name or Aadhaar number
const searchPatients = async (query) => {
  const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
  return await Patient.find({
    $or: [{ fullName: searchRegex }, { aadhaarNumber: searchRegex }],
  }).select('fullName dateOfBirth');
};

module.exports = {
  getDoctorStats,
  searchPatients,
};