// controllers/emergencyController.js

const notificationService = require('../services/notificationService');

// @desc    Trigger an emergency alert
// @route   POST /api/v1/emergency/alert
// @access  Private (Patient)
const triggerAlert = async (req, res) => {
  try {
    const result = await notificationService.dispatchEmergencyAlerts(req.user._id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  triggerAlert,
};