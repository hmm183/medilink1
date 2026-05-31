const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Patient = require('../models/patientModel');
const DiseaseHistory = require('../models/diseaseHistoryModel');
const Prescription = require('../models/prescriptionModel');
const DailyReading = require('../models/dailyReadingModel');
const HealthSummary = require('../models/healthSummaryModel');
const { sendPatientSummaryEmail } = require('../services/emailService'); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper function to delay execution ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Wrapper for Gemini API call with retry logic ---
async function generateContentWithRetry(model, prompt, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result; // Success
    } catch (error) {
      // Check for API overload or temporary errors
      if (error.status === 503 || (error.message && error.message.includes('503'))) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`Gemini API failed after ${maxRetries} attempts due to overload.`);
          throw error; // Throw the final error after all retries
        }
        console.warn(`Gemini API overloaded. Retrying in ${delay / 1000}s... (Attempt ${attempt})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        // For other errors (like 404 Not Found for the model), fail immediately
        console.error("A non-retriable Gemini API error occurred:", error.message);
        throw error;
      }
    }
  }
}

/**
 * @desc    Get the saved health summary for a patient
 * @route   GET /api/v1/summary/patient/:patientId
 * @access  Public
 */
exports.getHealthSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Invalid Patient ID format.' });
    }
    const summary = await HealthSummary.findOne({ patientId });
    if (!summary) {
      return res.status(404).json({ message: 'No health summary found for this patient.' });
    }
    res.status(200).json(summary);
  } catch (error) {
    console.error("Error in getHealthSummary:", error);
    res.status(500).json({ error: "Failed to retrieve health summary.", details: error.message });
  }
};

/**
 * @desc    Generate and SAVE a health summary using patient data
 * @route   POST /api/v1/summary/generate
 * @access  Public
 */
exports.generateHealthSummary = async (req, res) => {
  let patient; // Define patient here to be accessible in the catch block
  const { patientId } = req.body;
  
  try {
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'A valid Patient ID is required.' });
    }
    
    patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    
    const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const latestReading = await DailyReading.findOne({ patientId }).sort({ date: -1 });

    let dataContext = `Patient Name: ${patient.fullName}\nAge: ${patient.age}\nGender: ${patient.gender}\n`;
    if (latestReading?.bloodPressure) {
      dataContext += `Latest Vitals: Blood Pressure ${latestReading.bloodPressure.systolic}/${latestReading.bloodPressure.diastolic} mmHg, Pulse: ${latestReading.pulseRate} bpm.\n`;
    }
    if (history.length > 0) {
      dataContext += "Known Conditions: " + history.map(h => `${h.illnessName} (Status: ${h.status})`).join(', ') + ".\n";
    }
    const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === 'current');
    if (currentMeds.length > 0) {
      dataContext += "Current Medications: " + currentMeds.map(m => `${m.name} (${m.dosage})`).join(', ') + ".\n";
    }

    const prompt = `
      You are a senior medical analyst. Synthesize the provided data into a comprehensive health summary.
      Structure the summary into sections: "Overview", "Key Medical History", "Current Status", and "Medication Review".
      Present it in a cohesive, paragraph-based format.

      Data:
      ---
      ${dataContext}
      ---
    `;
    
    // --- FIXED: Reverted to the flash model you have access to ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await generateContentWithRetry(model, prompt);
    const summaryText = result.response.text();

    const summaryData = {
      patientId,
      summaryContent: summaryText,
      generatedAt: new Date(),
      sourceData: `AI-Generated. Prompt included: ${prompt.substring(0, 200)}...`
    };

    const savedSummary = await HealthSummary.findOneAndUpdate({ patientId }, summaryData, { new: true, upsert: true });
    res.status(200).json(savedSummary);

  } catch (error) {
    console.error("Error in generateHealthSummary:", error.message);
    
    // --- FALLBACK MECHANISM: If AI fails, generate a basic summary ---
    console.warn("AI generation failed. Creating a basic fallback summary.");
    try {
        if (!patient) {
             // Ensure patient is loaded before creating a fallback
            patient = await Patient.findById(patientId);
            if (!patient) return res.status(404).json({ error: 'Patient not found for fallback.' });
        }

        const fallbackSummaryContent = `
            **Overview**: A basic health summary for ${patient.fullName}, a ${patient.age}-year-old ${patient.gender}.
            **Medical History**: Includes ${await DiseaseHistory.find({ patientId }).then(h => h.length ? h.map(item => item.illnessName).join(', ') : 'no specified conditions')}.
            **Medications**: Current medications include: ${await Prescription.find({ patientId }).then(p => {
                const meds = p.flatMap(pres => pres.medicines).filter(m => m.status === 'current');
                return meds.length ? meds.map(m => `${m.name} ${m.dosage}`).join(', ') : 'None listed';
            })}.
        `.replace(/\s+/g, ' ').trim();

        const summaryData = {
          patientId: patient._id,
          summaryContent: fallbackSummaryContent,
          generatedAt: new Date(),
          sourceData: "Fallback summary generated due to AI service unavailability or error."
        };

        const savedSummary = await HealthSummary.findOneAndUpdate({ patientId: patient._id }, summaryData, { new: true, upsert: true });
        res.status(200).json(savedSummary);

    } catch (fallbackError) {
        console.error("Error creating fallback summary:", fallbackError);
        res.status(500).json({ error: "Failed to generate health summary, and the fallback also failed.", details: fallbackError.message });
    }
  }
};

/**
 * @desc    Answer a specific question based on a patient's health data
 * @route   POST /api/v1/summary/query
 * @access  Public
 */
exports.queryHealthData = async (req, res) => {
  try {
    const { patientId, userQuery } = req.body;
    if (!patientId || !userQuery || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: 'Valid Patient ID and user query are required.' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    
    const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
    const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
    const readings = await DailyReading.find({ patientId }).sort({ date: -1 }).limit(30);

    let context = `CONTEXT: You are a helpful medical AI assistant. Analyze the health data for patient "${patient.fullName}".\n\n`;
    context += `PATIENT DETAILS:\n- Age: ${patient.age}\n- Gender: ${patient.gender}\n\n`;
    
    if (history.length > 0) {
      context += "DISEASE HISTORY:\n" + history.map(h => `- ${h.illnessName} (Diagnosed: ${new Date(h.diagnosisDate).toLocaleDateString()}, Status: ${h.status})`).join('\n') + "\n\n";
    }
    const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === 'current');
    if (currentMeds.length > 0) {
        context += "CURRENT MEDICATIONS:\n" + currentMeds.map(m => `- ${m.name} ${m.dosage}`).join('\n') + "\n\n";
    }
    if (readings.length > 0) {
        context += "RECENT VITALS:\n" + readings.map(r => `- Date: ${new Date(r.date).toLocaleString()}, BP: ${r.bloodPressure.systolic}/${r.bloodPressure.diastolic}, Pulse: ${r.pulseRate}`).join('\n') + "\n\n";
    }

    const prompt = `${context}QUESTION: Based *only* on the provided health data, answer the doctor's question concisely: "${userQuery}"`;

    // --- FIXED: Reverted to the flash model you have access to ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await generateContentWithRetry(model, prompt);
    const answer = result.response.text();

    res.status(200).json({ answer });

  } catch (error) {
    console.error("Error in queryHealthData:", error);
    res.status(500).json({ error: "Failed to query health data after multiple retries.", details: error.message });
  }
};


exports.generateAndEmailSummary = async (req, res) => {
    let patient;
    const { patientId } = req.body;

    try {
        // 1. Authenticate the doctor
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token provided.' });
        }
        jwt.verify(token, process.env.JWT_SECRET); // Throws error if invalid

        // 2. Validate patient ID
        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ error: 'A valid Patient ID is required.' });
        }
        
        // 3. Fetch patient data (check for email early)
        patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found.' });
        }
        if (!patient.email) {
            return res.status(400).json({ error: 'Patient does not have a registered email address.' });
        }
        
        // 4. Aggregate all health data
        const history = await DiseaseHistory.find({ patientId }).sort({ diagnosisDate: -1 });
        const prescriptions = await Prescription.find({ patientId }).sort({ date: -1 });
        const latestReading = await DailyReading.findOne({ patientId }).sort({ date: -1 });

        let dataContext = `Patient Name: ${patient.fullName}\nAge: ${patient.age}\nGender: ${patient.gender}\n`;
        if (latestReading?.bloodPressure) {
            dataContext += `Latest Vitals: Blood Pressure ${latestReading.bloodPressure.systolic}/${latestReading.bloodPressure.diastolic} mmHg, Pulse: ${latestReading.pulseRate} bpm.\n`;
        }
        if (history.length > 0) {
            dataContext += "Known Conditions: " + history.map(h => `${h.illnessName} (Status: ${h.status})`).join(', ') + ".\n";
        }
        const currentMeds = prescriptions.flatMap(p => p.medicines).filter(m => m.status === 'current');
        if (currentMeds.length > 0) {
            dataContext += "Current Medications: " + currentMeds.map(m => `${m.name} (${m.dosage})`).join(', ') + ".\n";
        }

        const prompt = `
            You are a senior medical analyst. Synthesize the provided data into a comprehensive health summary for a patient.
            Structure the summary into sections: "Overview", "Key Medical History", "Current Status", and "Medication Review".
            Present it in a cohesive, paragraph-based format.
            Data:
            ---
            ${dataContext}
            ---
        `;
        
        // 5. Generate summary with AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await generateContentWithRetry(model, prompt);
        const summaryText = result.response.text();

        // 6. Save the new summary to DB
        const summaryData = {
            patientId,
            summaryContent: summaryText,
            generatedAt: new Date(),
            sourceData: `AI-Generated and Emailed. Prompt included: ${prompt.substring(0, 200)}...`
        };
        await HealthSummary.findOneAndUpdate({ patientId }, summaryData, { new: true, upsert: true });

        // 7. Email the summary
        await sendPatientSummaryEmail(patient.email, patient.fullName, summaryText);

        res.status(200).json({ success: true, message: `Summary generated and sent to ${patient.email}` });

    } catch (error) {
        console.error("Error in generateAndEmailSummary:", error.message);
        
        // --- FALLBACK MECHANISM ---
        console.warn("AI generation failed. Attempting to email a basic fallback summary.");
        try {
            if (!patient) patient = await Patient.findById(patientId);
            if (!patient || !patient.email) return res.status(404).json({ error: 'Patient not found for fallback.' });

            const fallbackSummaryContent = `
                **Overview**: A basic health summary for ${patient.fullName}, a ${patient.age}-year-old ${patient.gender}.
                **Medical History**: Includes ${await DiseaseHistory.find({ patientId }).then(h => h.length ? h.map(item => item.illnessName).join(', ') : 'no specified conditions')}.
                **Medications**: Current medications include: ${await Prescription.find({ patientId }).then(p => {
                    const meds = p.flatMap(pres => pres.medicines).filter(m => m.status === 'current');
                    return meds.length ? meds.map(m => `${m.name} ${m.dosage}`).join(', ') : 'None listed';
                })}.
            `.replace(/\s+/g, ' ').trim();

            // Save and email the fallback summary
            const summaryData = { patientId, summaryContent: fallbackSummaryContent, sourceData: "Fallback summary (Emailed)." };
            await HealthSummary.findOneAndUpdate({ patientId }, summaryData, { new: true, upsert: true });
            await sendPatientSummaryEmail(patient.email, patient.fullName, fallbackSummaryContent);
            
            res.status(200).json({ success: true, message: `AI failed, but a basic fallback summary was sent to ${patient.email}` });

        } catch (fallbackError) {
            console.error("Error creating and emailing fallback summary:", fallbackError);
            res.status(500).json({ error: "Failed to generate summary, and the fallback also failed.", details: fallbackError.message });
        }
    }
};
