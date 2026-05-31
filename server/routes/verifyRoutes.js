// routes/verifyRoutes.js
const express = require("express");
const axios = require("axios");
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const router = express.Router();

router.post("/verify-doctor", express.json(), async (req, res) => {
  try {
    const { doctorId, licenseNumber } = req.body;

    if (!doctorId || !licenseNumber) {
      return res.status(400).json({
        verified: false,
        message: "Doctor ID and License Number are both required.",
      });
    }

    const nmcURL = "https://www.nmc.org.in/MCIRest/open/getDataFromService?service=searchDoctor";
    const payload = {
      registrationNo: licenseNumber,
    };

    const response = await axios.post(nmcURL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 8000,
      httpsAgent: agent,
    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        verified: false,
        message: "No doctor found with that registration number.",
      });
    }

    // --- UPDATED MATCHING LOGIC ---
    // 1. Search through ALL returned records to find one with a matching Doctor ID.
    const inputDoctorId = String(doctorId).trim();
    const doctor = data.find(doc => String(doc.doctorId).trim() === inputDoctorId);

    // 2. If no record in the list has that Doctor ID, the details are invalid.
    if (!doctor) {
      return res.status(400).json({
        verified: false,
        message: "Invalid Details: The Doctor ID does not match any record found with that registration number.",
      });
    }
    
    // 3. Final check to ensure the registration number also matches.
    const apiRegNo = String(doctor.registrationNo || "").trim();
    const inputRegNo = String(licenseNumber).trim();

    if (apiRegNo !== inputRegNo) {
      // This is a rare case but good for security
      return res.status(400).json({
        verified: false,
        message: `Mismatch: The registration number in the found record ('${apiRegNo}') does not match your input ('${inputRegNo}').`,
      });
    }

    // If all checks pass, create the response object
    const doctorData = {
      firstName: doctor.firstName,
      registrationNo: doctor.registrationNo,
      regDate: doctor.regDate,
      yearInfo: doctor.yearInfo,
      address: doctor.address
    };

    return res.json({ verified: true, source: "nmc", doctor: doctorData });
    
  } catch (error) {
    console.error("Error verifying doctor:", error.message);
    return res.status(503).json({
      verified: false,
      message: "NMC server is temporarily unavailable. Please try again later.",
    });
  }
});

module.exports = router;