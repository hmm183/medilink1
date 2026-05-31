const jwt = require('jsonwebtoken');
const Patient = require('../models/patientModel');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Using Patient model from your auth flow
      req.user = await Patient.findById(decoded.id).select('-password');
      
      if (!req.user) {
         // This is a valid token but the user doesn't exist in the DB
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed only if everything is valid
    } catch (error) {
      console.error(error);
      // --- FIX: Add return to stop execution on token failure ---
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    // --- FIX: Add return to stop execution if no token is found ---
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };