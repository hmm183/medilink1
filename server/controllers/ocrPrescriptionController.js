// server/controllers/ocrPrescriptionController.js

const OcrPrescription = require('../models/ocrPrescriptionModel');
const { LLMWhispererClientV2 } = require('llmwhisperer-client');
const { downloadFile } = require('../utils/fileDownloader');
const { extractMedicinesFromText } = require('../services/geminiService');

// Initialize LLMWhisperer Client
const whispererClient = new LLMWhispererClientV2();

/**
 * @desc    Accepts a prescription file for processing
 * @route   POST /api/v1/ocr-prescriptions
 */
exports.processOcrPrescription = async (req, res) => {
  // WARNING: Insecure - Reading patientId directly from the request body.
  const { fileUrl, patientId } = req.body;

  if (!fileUrl || !patientId) {
    return res.status(400).json({ message: 'Missing fileUrl or patientId.' });
  }

  let ocrRecord;
  try {
    ocrRecord = await OcrPrescription.create({ patientId, fileUrl, status: 'processing' });
    res.status(202).json({ 
      message: 'Prescription accepted and is being processed.',
      recordId: ocrRecord._id 
    });
  } catch (dbError) {
    console.error('DB Error on initial create:', dbError);
    return res.status(500).json({ message: 'Failed to create initial record.' });
  }
  
  processInBackground(ocrRecord);
};

/**
 * @desc    Helper function to run OCR and AI extraction in the background.
 */
const processInBackground = async (ocrRecord) => {
  try {
    const tempFilePath = await downloadFile(ocrRecord.fileUrl);
    const whisperResult = await whispererClient.whisper({
      filePath: tempFilePath,
      waitForCompletion: true,
      waitTimeout: 180,
    });

    if (whisperResult.status !== 'processed') {
      throw new Error('LLMWhisperer failed to process the file.');
    }
    const extractedText = whisperResult.extraction.result_text;
    ocrRecord.ocrText = extractedText;
    
    const medicines = await extractMedicinesFromText(extractedText);
    ocrRecord.structuredMedicines = medicines;
    
    ocrRecord.status = 'completed';
    await ocrRecord.save();
  } catch (error) {
    console.error(`Error processing OCR for record ${ocrRecord._id}:`, error);
    ocrRecord.status = 'error';
    ocrRecord.errorMessage = error.message;
    await ocrRecord.save();
  }
};

/**
 * @desc    Get the result of a specific OCR prescription process
 * @route   GET /api/v1/ocr-prescriptions/:id
 */
exports.getOcrPrescriptionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await OcrPrescription.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found.' });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * @desc    Get all prescription records for a specific patient
 * @route   GET /api/v1/ocr-prescriptions/patient/:patientId
 */
exports.getPrescriptionsForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await OcrPrescription.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};