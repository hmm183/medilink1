const mongoose = require('mongoose');
const DiseaseHistory = require('../models/diseaseHistoryModel');

/**
 * @desc    Create a new disease history entry
 * @route   POST /api/v1/history
 * @access  Public
 */
exports.createDiseaseHistory = async (req, res) => {
    try {
        const {
            patientId,
            illnessName,
            diagnosisDate,
            initialSymptoms,
            remarks,
            medicinesPrescribed,
            prescribedBy, // Frontend must now send the Doctor's ID here
            status,
            hospital,
            address,
            location,
        } = req.body;

        if (!patientId || !illnessName || !prescribedBy) {
            return res.status(400).json({ message: 'Patient ID, Illness Name, and Doctor ID (prescribedBy) are required.' });
        }

        const newHistoryEntry = await DiseaseHistory.create({
            patientId,
            illnessName,
            diagnosisDate,
            initialSymptoms,
            remarks,
            medicinesPrescribed,
            prescribedBy,
            status,
            hospital,
            address,
            location,
        });

        const populatedEntry = await DiseaseHistory.findById(newHistoryEntry._id)
            .populate('prescribedBy', 'name');

        res.status(201).json(populatedEntry);

    } catch (error) {
        console.error('Error creating disease history:', error);
        res.status(500).json({ message: 'Server error while creating history entry.' });
    }
};

/**
 * @desc    Get all disease history for a specific patient
 * @route   GET /api/v1/history/patient/:patientId
 * @access  Public
 */
exports.getHistoryByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'Invalid patient ID format.' });
        }
        const history = await DiseaseHistory.find({ patientId: req.params.patientId })
            .populate('prescribedBy', 'name')
            .sort({ diagnosisDate: -1 });

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching disease history:', error);
        res.status(500).json({ message: 'Server error while fetching history.' });
    }
};

/**
 * @desc    Update an existing disease history entry
 * @route   PUT /api/v1/history/:id
 * @access  Public
 */
exports.updateDiseaseHistory = async (req, res) => {
    try {
        const updatedHistory = await DiseaseHistory.findByIdAndUpdate(
            req.params.id,
            req.body, // The entire body, including prescribedBy, is used for the update
            { new: true, runValidators: true }
        ).populate('prescribedBy', 'name');

        if (!updatedHistory) {
            return res.status(404).json({ message: 'History record not found.' });
        }

        res.status(200).json(updatedHistory);
    } catch (error) {
        console.error('Error updating disease history:', error);
        res.status(500).json({ message: 'Server error while updating history.' });
    }
};

/**
 * @desc    Delete a disease history entry
 * @route   DELETE /api/v1/history/:id
 * @access  Public
 */
exports.deleteDiseaseHistory = async (req, res) => {
    try {
        const historyEntry = await DiseaseHistory.findByIdAndDelete(req.params.id);

        if (!historyEntry) {
            return res.status(404).json({ message: 'History record not found.' });
        }

        res.status(200).json({ success: true, message: 'History record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting disease history:', error);
        res.status(500).json({ message: 'Server error while deleting history record.' });
    }
};


/**
 * @desc    Get a summarized disease history for a patient
 * @route   GET /api/v1/history/patient/:patientId/summary
 * @access  Public
 */
exports.getHistorySummaryByPatient = async (req, res) => {
    try {
        const historyRecords = await DiseaseHistory.find({ patientId: req.params.patientId })
            .select('illnessName diagnosisDate')
            .sort({ diagnosisDate: -1 });

        const summary = historyRecords.map(record => ({
            illnessName: record.illnessName,
            diagnosisYear: record.diagnosisDate ? record.diagnosisDate.getFullYear() : 'N/A',
        }));

        res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching disease history summary:', error);
        res.status(500).json({ message: 'Server error while fetching history summary.' });
    }
};

/**
 * @desc    Get disease hotspots
 * @route   GET /api/v1/history/hotspots
 * @access  Public
 */
exports.getDiseaseHotspots = async (req, res) => {
    try {
        const { disease, lng, lat, radius } = req.query;

        if (!disease || !lng || !lat) {
            return res.status(400).json({
                message: 'Missing required query parameters: disease, lng (longitude), and lat (latitude).'
            });
        }

        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);
        const searchRadiusKm = parseFloat(radius) || 10;

        if (isNaN(longitude) || isNaN(latitude) || isNaN(searchRadiusKm)) {
            return res.status(400).json({ message: 'Invalid geographic coordinates or radius.' });
        }
        const radiusInMeters = searchRadiusKm * 1000;

        const hotspots = await DiseaseHistory.find({
            illnessName: { $regex: new RegExp(disease, 'i') },
            location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: radiusInMeters,
                },
            },
        }).select('location illnessName');

        res.status(200).json({
            success: true,
            message: `Found ${hotspots.length} hotspots for '${disease}' within ${searchRadiusKm}km.`,
            count: hotspots.length,
            data: hotspots,
        });

    } catch (error) {
        console.error('Error fetching disease hotspots:', error);
        res.status(500).json({ message: 'Server error while fetching hotspots.' });
    }
};