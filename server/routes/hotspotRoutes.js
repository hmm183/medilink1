const express = require("express");
const router = express.Router();
const History = require("../models/diseaseHistoryModel"); // adjust path to your model

// GET /api/v1/hotspots?illnessName=Chickenpox
router.get("/", async (req, res) => {
  try {
    const { illnessName } = req.query;

    if (!illnessName) {
      return res.status(400).json({ message: "illnessName is required" });
    }

    const cases = await History.find({ illnessName, status: "ongoing" });

    res.json(cases);
  } catch (err) {
    console.error("Error fetching hotspots:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
