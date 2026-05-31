const express = require('express');
const router = express.Router();
const {
  initiateDigilocker,
  getDigilockerData,
  setPasswordAndRegister,
  loginUser,
} = require('../controllers/authController');

// KYC and Registration Flow from your logic
router.post('/initiate-digilocker', initiateDigilocker);
router.post('/get-digilocker-data', getDigilockerData);
router.post('/set-password', setPasswordAndRegister);

// Standard Login from your logic
router.post('/login', loginUser);

module.exports = router;