// controllers/reportController.js

const aiService = require('../services/aiService');
const notificationService = require('../services/notificationService');

// @desc    Generate and email a full report
// @route   POST /api/v1/report/generate
// @access  Private (Patient)
const generateReport = async (req, res) => {
  try {
    // The service handles the async nature of this task
    const result = await notificationService.generateAndEmailReport(req.user._id, req.user.email);
    res.status(202).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Generate AI summary for a patient
// @route   GET /api/v1/patients/:patientId/summary
// @access  Private (Patient, Doctor)
const getAISummary = async (req, res) => {
  try {
    const summary = await aiService.generateAISummary(req.params.patientId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Generate medicine side effects table
// @route   GET /api/v1/patients/:patientId/medicines/side-effects
// @access  Private (Patient, Doctor)
const getSideEffects = async (req, res) => {
  try {
    const sideEffects = await aiService.generateSideEffectsTable(req.params.patientId);
    res.json(sideEffects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  generateReport,
  getAISummary,
  getSideEffects,
};