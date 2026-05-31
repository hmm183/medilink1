// src/context/LangContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

// 🌍 Supported Languages
const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "as", label: "Assamese" },
  { value: "bho", label: "Bhojpuri" },
  { value: "doi", label: "Dogri" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "kok", label: "Konkani" },
  { value: "mai", label: "Maithili" },
  { value: "ml", label: "Malayalam" },
  { value: "mni-Mtei", label: "Meiteilon (Manipuri)" },
  { value: "ne", label: "Nepali" },
  { value: "or", label: "Odia (Oriya)" },
  { value: "pa", label: "Punjabi" },
  { value: "sa", label: "Sanskrit" },
  { value: "sd", label: "Sindhi" },
  { value: "ur", label: "Urdu" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
  
];


// ⚠️ TEMPORARY: Replace with env variable & backend proxy later
const BACKEND_URL = "http://localhost:5000/api/v1";

// 📌 Base English dictionary
const BASE_TEXTS = {
  // Landing / Hero
  heroTag: "SwiftMediLink • Fast, Secure Patient Transfers",
  heroHeading: "Medical Records Ready Before Arrival",
  heroDesc:
    "With Aadhaar verification & AI-powered record extraction, doctors receive clean, actionable data before the stretcher arrives. Every second counts — SwiftMediLink saves lives.",
  signIn: "Sign in",
  viewStats: "View stats",
  smarterCare: "Smarter Care Journeys",
  smarterCareDesc:
    "From diagnosis to treatment, every step powered by connected records.",
  multilingual: "Multilingual",
  multilingualDesc: "Hindi • Bengali • Tamil • Malayalam • English",
  featuresHeading: "What you can do",
  featuresDesc:
    "Scan a QR health ID, add visit records, update vaccinations, and view analytics. Built with React, Tailwind CSS, Chart.js & Three.js for a fast, responsive web experience.",
  feature1: "Unified Health Records",
  feature1Desc:
    "Access your complete medical history in one place, including lab results, prescriptions, and past treatments.",
  feature2: "Seamless Hospital Transfers",
  feature2Desc:
    "Quick and secure sharing of patient data between hospitals using the FHIR API for continuity of care.",
  feature3: "Interactive Patient Dashboard",
  feature3Desc:
    "Patients can track their health records, upcoming appointments, and reports with a clean, user-friendly dashboard.",

  // 📊 Stats Section
  chartTitle: "Registered vs Cured",
  demoData: "(Demo Data)",
  totalRegistered: "Total Registered",
  totalCured: "Total Cured",
  cureRate: "Cure Rate",
  activeCases: "Active Cases",
  demoNote: "* Demo values – connect to your API to make these live.",
  footerTitle: "Migrant Health",
  allRights: "All rights reserved.",
  footerBuiltWith: "Built with React, Tailwind CSS, Chart.js & Three.js.",
  features: "Features",
  stats: "Stats",
  registered: "Registered",
  beingCured: "Being Cured",
  cured: "Cured",
  registerWithKyc: "Register with KYC",
  verifyWithDigiLocker: "We'll verify your identity with DigiLocker.",
  startKyc: "Start KYC Process",
  alreadyRegistered: "Already registered? Login here.",
  verifiedDetails: "Your Verified Details",
  completeRegistration: "Complete Your Registration",
  enterEmailPassword: "Your details are verified. Add your email and create a password.",
  email: "Email Address",
  newPassword: "New Password",
  confirmPassword: "Confirm Password",
  createAccount: "Create Account",
  login: "Login",
  aadhaarNumber: "Aadhaar Number (UID)",
  fullName: "Full Name (as per Aadhaar)",
  password: "Password",
  firstTimeUser: "First time user? Complete KYC to register.",
  initiatingSession: "🚀 Initiating session...",
  fetchingDetails: "📄 Welcome back! Fetching your details...",
  loggingIn: "Logging in...",
  passwordMismatch: "Passwords do not match.",
  enterEmail: "Please enter your email address.",
  userDataNotFound: "User data not found. Please start KYC again.",
  creatingAccount: "Creating your account...",
  kycDesc: "We'll verify your identity with DigiLocker.",
  aadhaarUid: "Aadhaar Number (UID)",
  firstTime: "First time user? Complete KYC to register.",
  emailAddress: "Email Address",

  // 📋 Patient Dashboard
  healthTrends: "Health Trends",
  systolic: "Systolic",
  diastolic: "Diastolic",
  weight: "Weight",
  hospitalVisits: "Hospital Visits",
  prescriptionsStored: "Prescriptions Stored",
  currentMedicines: "Current Medicines",
  pastMedicines: "Past Medicines",
  markAsPast: "Mark as Past",
  noCurrentMedicines: "No current medicines.",
  medicineNamePlaceholder: "Medicine name",
  add: "Add",
  markAsCurrent: "Mark as Current",
  noPastMedicines: "No past medicines.",
  diseaseHistory: "Disease History",
  noHistoryFound: "No history summary found.",
  seeMore: "See More",
  patientNotes: "Patient Notes",
  showArchived: "Show Archived",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  noNotesFound: "No notes found.",
  archivedNotes: "Archived Notes",
  restoreNote: "Restore Note",
  writeNotePlaceholder: "Write your symptoms or notes here...",
  saveNote: "Save Note",
  healthSummary: "Health Summary",
  lastUpdated: "Last: {{date}}",
  generating: "Generating...",
  regenerate: "Regenerate",
  generate: "Generate",
  loadingSummary: "Loading summary...",
  error: "Error",
  translationError: "Failed to translate summary. Displaying original text.",
  generatedAt: "Generated: {{date}}",
  hidePrompt: "Hide prompt",
  showPrompt: "Show prompt",
  noPromptSaved: "No prompt saved.",
  noSummaryFound: "No health summary found. Generate one to get a concise overview of the patient's condition.",
  patientDiseaseHistory: "Patient Disease History",
  diagnosisDate: "Diagnosis Date",
  illness: "Illness",
  symptoms: "Symptoms",
  doctor: "Doctor",
  hospital: "Hospital",
  status: "Status",
  ongoing: "Ongoing",
  cured: "Cured",
  loadingHistory: "Loading history...",
  noHistoryFound: "No history records found.",
  myPrescriptions: "My Prescriptions",
  loadingPrescriptions: "Loading prescriptions...",
  dr: "Dr.",
  current: "Current", // used for both status and button text
  past: "Past", // used for both status and button text
  markAs: "Mark as",
  noPrescriptionsFound: "No prescriptions found.",
  home: "Home",
  about: "About",
  services: "Services",
  contact: "Contact",
  doctorSignIn: "Doctor Sign In",
  patientSignIn: "Patient Sign In",
  language: "Language",
};

// ✅ Translation function using Google Translate API
async function translateText(texts, targetLang) {
  try {
    const response = await fetch(`${BACKEND_URL}/translate`, {
      method: "POST",
      body: JSON.stringify({
        q: Array.isArray(texts) ? texts : [texts],
        target: targetLang,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      // Handle non-ok responses from your backend
      const errorData = await response.json();
      console.error("Server-side translation error:", errorData.error);
      throw new Error("Translation failed on the server side.");
    }
    
    const data = await response.json();
    return data.translations; // Assuming your backend sends the translated texts in an array named 'translations'
  } catch (err) {
    console.error("Frontend translation network error:", err);
    return Array.isArray(texts) ? texts : [texts];
  }
}


const LangContext = createContext();
export const useLang = () => useContext(LangContext);

export const LangProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState(BASE_TEXTS);

  // 🔄 Auto-translate when language changes (skip English)
  useEffect(() => {
    if (language === "en") {
      setTranslations(BASE_TEXTS);
      return;
    }

    const translateAll = async () => {
      const keys = Object.keys(BASE_TEXTS);
      const values = Object.values(BASE_TEXTS);

      // ✅ FIX: Filter out empty strings before translating
      const nonNullValues = values.filter(text => text !== null && text !== '');
      
      const translated = await translateText(nonNullValues, language);
      const newTranslations = {};
      
      // ✅ FIX: Map translated values back to their original keys
      let translatedIndex = 0;
      keys.forEach((key, i) => {
        if (values[i] !== null && values[i] !== '') {
          newTranslations[key] = translated[translatedIndex];
          translatedIndex++;
        } else {
          newTranslations[key] = values[i];
        }
      });

      setTranslations(newTranslations);
    };

    translateAll();
  }, [language]);

  // Safe lookup for JSX
  const t = (key, fallback = key) => translations[key] || fallback;

  return (
    <LangContext.Provider
      value={{
        language,
        setLanguage,
        translations,
        setTranslations,
        t,
        languages,
        translateText // ✅ Expose the translateText function
      }}
    >
      {children}
    </LangContext.Provider>
  );
};