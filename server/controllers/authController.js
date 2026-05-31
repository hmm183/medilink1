const digilockerService = require('../services/digilockerService');
const authService = require('../services/authService');
const User = require('../models/User'); // Used only if you need direct model access

// @desc    Step 1: Initiate a KYC session
// @route   POST /api/v1/auth/initiate-digilocker
const initiateDigilocker = async (req, res) => {
  try {
    const sessionData = await digilockerService.initiateSession();
    res.json({ success: true, ...sessionData });
  } catch (error) {
    console.error("Error during DigiLocker initiation:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: "An error occurred." });
  }
};

// @desc    Step 2: Fetch verified user data
// @route   POST /api/v1/auth/get-digilocker-data
const getDigilockerData = async (req, res) => {
  const { sessionId, accessToken } = req.body;
  if (!sessionId || !accessToken) {
    return res.status(400).json({ success: false, message: "Session ID and Access Token are required." });
  }
  try {
    const userData = await digilockerService.fetchUserData(sessionId, accessToken);
    res.json({ success: true, userData });
  } catch (error) {
    console.error("Error fetching/parsing DigiLocker data:", error.message);
    res.status(500).json({ success: false, message: "An error occurred while fetching data." });
  }
};

// @desc    Step 3: Set password and create the patient account
// @route   POST /api/v1/auth/set-password
// @desc    Step 3: Set password and create the patient account
const setPasswordAndRegister = async (req, res) => {
  const { userData, password, email } = req.body;
  
  if (!userData || !password || !email) {
    return res.status(400).json({ success: false, message: 'User data, password, and email are required.' });
  }

  try {
    await authService.registerUser(userData, password, email);
    res.status(201).json({ success: true, message: 'Account created successfully! You can now log in.' });
  } catch (error) {
    console.error("Error in /set-password route:", error.message);

    // --- NEW: Handle the specific error from the service ---
    if (error.message === 'This user is already registered. Please log in.') {
      // Send a 409 Conflict status code for this specific case
      return res.status(409).json({ success: false, message: error.message });
    }

    // Handle other potential errors (like database validation)
    res.status(500).json({ success: false, message: 'Server error while setting password.' });
  }
};

// @desc    Login a registered user
// @route   POST /api/v1/auth/login
const loginUser = async (req, res) => {
  const { uid, name, password } = req.body;
  if (!uid || !name || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const user = await authService.authenticateUser(uid, name, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not found.' });
    }
    const token = authService.generateToken(user);

    // --- FIX IS HERE ---
    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id, // Add the user's ID to the response
        name: user.fullName // Use fullName to be consistent with the Patient model
      }
    });
  } catch (error) {
    console.error("Error in /login route:", error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};


module.exports = {
  initiateDigilocker,
  getDigilockerData,
  setPasswordAndRegister,
  loginUser,
};