import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:medilink1/core/network/ApiService.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider with ChangeNotifier {
  final ApiService _apiService;

  LanguageProvider(this._apiService) {
    _loadFromCache();
  }

  // --- Centralized Text Store ---
  static const Map<String, String> _baseTexts = {
    // Welcome Screen
    'welcomeTitle': 'Welcome to SwiftMedilink',
    'welcomeSubtitle': 'Your Health, Connected.',
    'getStarted': 'Get Started',

    // Landing Screen
    'landingTitle': 'SwiftMediLink',
    'doctorSignIn': 'Doctor Sign In',
    'patientSignIn': 'Patient Sign In',
    'heroTag': 'SwiftMediLink • Fast, Secure Patient Transfers',
    'heroHeading': 'Medical Records\nReady Before\nArrival',
    'heroDesc':
        'With Aadhaar verification & AI-powered record extraction, doctors receive clean, actionable data before the stretcher arrives.',
    'signIn': 'Sign in',
    'statRegistered': 'Registered',
    'statTreating': 'Being Treated',
    'statDischarged': 'Discharged',
    'footerSlogan':
        'Smarter Care Journeys — From diagnosis to treatment, every step powered by connected records. ',
    'footerLangs':
        'Multilingual: Hindi • Bengali • Tamil • Malayalam • English',

    // Patient Dashboard
    'patientDashboardTitle': 'SwiftMediLink • Patient',
    'logout': 'Log out',
    'healthTrends': 'Health Trends',
    'hospitalVisits': 'Hospital Visits',
    'prescriptionsStored': 'Prescriptions Stored',
    'healthSummary': 'Health Summary',
    'noSummary': 'No summary available.',
    'seeLess': 'See Less',
    'seeMore': 'See More',
    'currentMedicines': 'Current Medicines',
    'medicineNameHint': 'Medicine name',
    'pastMedicines': 'Past Medicines',
    'noPastMedicines': 'No past medicines found.',
    'markAsPast': 'Mark as Past',
    'markAsCurrent': 'Mark as Current',
    'add': 'Add',
    'prescribedMedicines': 'Prescribed Medicines',
    'noPrescribed':
        'No prescribed medicines yet.\nConsult your doctor for prescriptions.',
    'diseaseHistory': 'Disease History',
    'noHistoryDetails': 'No details available',
    'patientNotes': 'Patient Notes',
    'emptyNote': 'Empty note',
    'noNotes': 'No notes have been added yet.',
    'notesHint': 'Write your symptoms or notes here...',
    'saveNote': 'Save Note',
    'removeTooltip': 'Remove',
    'addDailyReading': 'Add Daily Reading',
    'systolic': 'Systolic',
    'diastolic': 'Diastolic',
    'systolicBP': 'Systolic BP',
    'diastolicBP': 'Diastolic BP',
    'weight': 'Weight',
    'weightKg': 'Weight (Kg)',
    'pulse': 'Pulse',
    'pulseRate': 'Pulse Rate',
    'saveReading': 'Save Reading',
    'noReadingsForChart': 'No readings to display in chart.',

    // Patient Sign Up
    'patientSignUpTitle': 'Patient Sign Up',
    'step1Title': 'Step 1: Verify your identity',
    'step1Desc': 'We use DigiLocker to securely verify your Aadhaar details.',
    'startDigilocker': 'Start DigiLocker Authentication',
    'step2Title': 'Step 2: Complete Registration',
    'emailHint': 'Enter your Email',
    'passwordHint': 'Create a Password',
    'createAccount': 'Create Account',

    // Doctor/Patient Detail
    'aiChatHint':
        "Ask a specific question about this patient's history, medications, or vitals.",
    'newMedicineHint': 'New medicine name...',
    'addPrescriptionTooltip': 'Add Prescription',
    'doctorNotesHint': 'Write notes or observations here...',
    'aiChatInputHint': 'Type your question...',
    'markAsPrescribed': 'Mark as Prescribed',
    'noIllnessName': 'No illness name provided',
    'noNoteContent': 'No content',
    'deleteNoteTooltip': 'Delete Note',
    'deleteNoteTitle': 'Delete Note',
    'deleteNoteConfirm':
        'Are you sure you want to delete this note? This action cannot be undone.',
    'cancel': 'Cancel',
    'delete': 'Delete',
  };

  Map<String, String> _translations = Map.from(_baseTexts);
  String _selectedLanguage = 'en';
  bool _isTranslating = false;

  final List<Map<String, String>> supportedLanguages = [
    {'value': 'en', 'label': 'English'},
    {'value': 'ml', 'label': 'Malayalam'},
    {'value': 'mr', 'label': 'Marathi'},
    {'value': 'hi', 'label': 'Hindi'},
    {'value': 'bn', 'label': 'Bengali'},
    {'value': 'ta', 'label': 'Tamil'},
    {'value': 'te', 'label': 'Telugu'},
    {'value': 'as', 'label': 'Assamese'},
    {'value': 'bho', 'label': 'Bhojpuri'},
    {'value': 'doi', 'label': 'Dogri'},
    {'value': 'gu', 'label': 'Gujarati'},
    {'value': 'kn', 'label': 'Kannada'},
    {'value': 'kok', 'label': 'Konkani'},
    {'value': 'mai', 'label': 'Maithili'},
    {'value': 'mni-Mtei', 'label': 'Meiteilon (Manipuri)'},
    {'value': 'ne', 'label': 'Nepali'},
    {'value': 'or', 'label': 'Odia (Oriya)'},
    {'value': 'pa', 'label': 'Punjabi'},
    {'value': 'sa', 'label': 'Sanskrit'},
    {'value': 'sd', 'label': 'Sindhi'},
    {'value': 'ur', 'label': 'Urdu'},
  ];

  // --- Getters ---
  String get selectedLanguage => _selectedLanguage;
  bool get isTranslating => _isTranslating;
  String t(String key) => _translations[key] ?? _baseTexts[key] ?? key;

  /// Loads the selected language and translations from device storage on app start.
  Future<void> _loadFromCache() async {
    final prefs = await SharedPreferences.getInstance();
    final langCode = prefs.getString('selectedLanguage');

    if (langCode != null && langCode != 'en') {
      final translationsString = prefs.getString('translations');
      if (translationsString != null) {
        _translations =
            Map<String, String>.from(jsonDecode(translationsString));
        _selectedLanguage = langCode;
        notifyListeners();
      }
    }
  }

  // --- Methods ---
  Future<void> setLanguage(String langCode) async {
    if (langCode == _selectedLanguage) return;

    final prefs = await SharedPreferences.getInstance();

    if (langCode == 'en') {
      _translations = Map.from(_baseTexts);
      _selectedLanguage = 'en';
      await prefs.remove('selectedLanguage');
      await prefs.remove('translations');
      notifyListeners();
      return;
    }

    _isTranslating = true;
    notifyListeners();

    try {
      final keys = _baseTexts.keys.toList();
      final values = _baseTexts.values.toList();
      final translatedValues =
          await _apiService.translateTexts(values, langCode);

      final newTranslations = <String, String>{};
      for (int i = 0; i < keys.length; i++) {
        newTranslations[keys[i]] = translatedValues[i];
      }

      _translations = newTranslations;
      _selectedLanguage = langCode;

      // Save to SharedPreferences for persistence
      await prefs.setString('selectedLanguage', langCode);
      await prefs.setString('translations', jsonEncode(newTranslations));
    } catch (e) {
      debugPrint("Translation failed in Provider: $e");
      // Fallback to English on failure
      _translations = Map.from(_baseTexts);
      _selectedLanguage = 'en';
      await prefs.remove('selectedLanguage');
      await prefs.remove('translations');
    } finally {
      _isTranslating = false;
      notifyListeners();
    }
  }
}
