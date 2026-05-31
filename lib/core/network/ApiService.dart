import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medilink1/core/models/History.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/AppConfig.dart';
import '../models/User.dart';
import '../models/Patient.dart';
import '../models/Doctor.dart';
import '../models/Prescription.dart';
import '../models/disease_history.dart';
import '../models/DailyReading.dart';
import '../models/Report.dart';
import '../models/Note.dart';
import '../models/HealthSummary.dart';

class ApiService {
  final String _baseUrl = AppConfig.baseUrl;
  String? _token;
  User? _currentUser;

  ApiService() {
    // Initialize token and currentUser asynchronously
    _loadToken();
    _loadCurrentUser();
  }

  Future<void> init() async {
    await _loadToken();
    await _loadCurrentUser();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  Future<void> _loadCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('userId');
    final userName = prefs.getString('userName');
    if (userId != null && userName != null) {
      _currentUser = User(id: userId, username: userName);
    }
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    _token = token;
  }

  Future<void> _saveCurrentUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userId', user.id);
    await prefs.setString('userName', user.username);
    _currentUser = user;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
    await prefs.remove('userName');
    _token = null;
    _currentUser = null;
  }

  User? get currentUser => _currentUser;

  Map<String, String> get _headers => {
        "Content-Type": "application/json",
        if (_token != null) "Authorization": "Bearer $_token",
      };

  Future<dynamic> _post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse("$_baseUrl$endpoint"),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _processResponse(response);
  }

  Future<dynamic> _get(String endpoint) async {
    final response = await http.get(
      Uri.parse("$_baseUrl$endpoint"),
      headers: _headers,
    );
    return _processResponse(response);
  }

  Future<dynamic> _put(String endpoint, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse("$_baseUrl$endpoint"),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _processResponse(response);
  }

  Future<dynamic> _delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse("$_baseUrl$endpoint"),
      headers: _headers,
    );
    return _processResponse(response);
  }

  dynamic _processResponse(http.Response response) {
    final body = response.body;
    if (body == null || body.isEmpty) {
      if (response.statusCode >= 200 && response.statusCode < 300) return null;
      throw Exception("Empty response with status ${response.statusCode}");
    }
    try {
      final decoded = jsonDecode(body);
      // If API sometimes returns a string-wrapped JSON, handle that.
      if (decoded is String) {
        try {
          return jsonDecode(decoded);
        } catch (_) {
          return decoded;
        }
      }
      return decoded;
    } catch (e) {
      // Fallback: return raw body for non-JSON responses
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return body;
      }
      // include body in thrown message so you can debug server mismatch
      throw Exception("HTTP ${response.statusCode}: ${body}");
    }
  }

  // 🔑 Auth Routes
  Future<dynamic> initiateDigilocker(Map<String, dynamic> data) =>
      _post("/auth/initiate-digilocker", data);

  Future<dynamic> getDigilockerData(Map<String, dynamic> data) =>
      _post("/auth/get-digilocker-data", data);

  Future<dynamic> setPasswordAndRegister(Map<String, dynamic> data) =>
      _post("/auth/set-password", data);

  Future<Map<String, dynamic>> login(
      String uid, String name, String password) async {
    final res = await _post(
        "/auth/login", {"uid": uid, "name": name, "password": password});
    if (res['success'] == false) {
      throw Exception(res['message'] ?? 'Login failed');
    }
    if (res['token'] != null) {
      await _saveToken(res['token']);
      if (res['user'] != null) {
        final user = User(id: res['user']['id'], username: res['user']['name']);
        await _saveCurrentUser(user);
      }
    }
    return res;
  }

  Future<dynamic> sendOtp(String aadhaar) =>
      _post("/auth/send-otp", {"aadhaar": aadhaar});

  Future<Map<String, dynamic>> verifyOtp(String aadhaar, String otp) async {
    final res =
        await _post("/auth/verify-otp", {"aadhaar": aadhaar, "otp": otp});
    if (res['token'] != null) {
      await _saveToken(res['token']);
    }
    return res;
  }

  // 🩺 Doctor Routes
  Future<Doctor> registerDoctor(Map<String, dynamic> data) async {
    final res = await _post("/doctor/register", data);
    return Doctor.fromJson(res);
  }

  // 👤 Patient Routes
  Future<List<Patient>> getPatients() async {
    final res = await _get("/patients");
    return (res as List).map((e) => Patient.fromJson(e)).toList();
  }

  Future<Patient> getPatientById(String id) async {
    final res = await _get("/patients/$id");
    return Patient.fromJson(res);
  }

  // 💊 Prescription Routes
  Future<List<Prescription>> getPrescriptions(String patientId) async {
    final res = await _get("/prescriptions/patient/$patientId");
    if (res is List) {
      return res
          .map((e) => Prescription.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } else if (res is Map && res.containsKey('message')) {
      // No prescriptions found
      return [];
    } else {
      throw Exception('Unexpected response format for prescriptions');
    }
  }

  // 📜 History Routes
  Future<List<DiseaseHistory>> getPatientHistory(String patientId) async {
    final res = await _get("/history/patient/$patientId");
    if (res is List) {
      return res
          .map((e) => DiseaseHistory.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } else if (res is Map && res.containsKey('message')) {
      // Error or no history found
      return [];
    } else {
      throw Exception('Unexpected response format for history');
    }
  }

  // 📊 Daily Readings
  Future<List<DailyReading>> getDailyReadings(String patientId) async {
    final res = await _get("/readings/patient/$patientId");
    if (res is List) {
      return res
          .map((e) => DailyReading.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } else if (res is Map && res.containsKey('message')) {
      // Error or no readings found
      return [];
    } else {
      throw Exception('Unexpected response format for readings');
    }
  }

  // 📑 Reports
  Future<Report> generateReport(Map<String, dynamic> params) async {
    final res = await _post("/report/generate", params);
    return Report.fromJson(res);
  }

  // 📄 Health Summary
  Future<HealthSummary> generateSummary(Map<String, dynamic> params) async {
    final res =
        await _post("/summary/generate", params) as Map<String, dynamic>;
    // Adhere to the consistent API contract { success, data }
    if (res.containsKey('data') && res['data'] is Map<String, dynamic>) {
      return HealthSummary.fromJson(res['data'] as Map<String, dynamic>);
    }
    // Fallback for direct object response
    return HealthSummary.fromJson(res);
  }

  Future<HealthSummary?> getSummary(String patientId) async {
    try {
      // The web app uses this GET endpoint to fetch an existing summary.
      final res = await _get("/summary/patient/$patientId");
      // A 404 or empty response should be handled gracefully.
      if (res is Map<String, dynamic>) {
        return HealthSummary.fromJson(res);
      }
      return null;
    } catch (e) {
      // A 404 from the server might throw an exception which we catch here.
      print("Could not fetch summary (it may not exist yet): $e");
      return null;
    }
  }

  // 🌐 Translation
  Future<List<String>> translateTexts(
      List<String> texts, String targetLang) async {
    // The backend expects 'q' for query and 'target' for target language.
    final res = await _post("/translate", {"q": texts, "target": targetLang});
    if (res != null && res['translations'] is List) {
      // The API returns a list of translated strings.
      return List<String>.from(res['translations']);
    }
    // Fallback to original texts if translation fails.
    return texts;
  }

  // Doctor Routes
  Future<dynamic> verifyDoctor(Map<String, dynamic> data) =>
      _post("/doctors/verify-doctor", data);

  Future<dynamic> doctorLogin(Map<String, dynamic> data) async {
    final res = await _post("/doctors/login", data);
    if (res['token'] != null) {
      await _saveToken(res['token']);
      if (res['doctor'] != null) {
        final user =
            User(id: res['doctor']['id'], username: res['doctor']['name']);
        await _saveCurrentUser(user);
      }
    }
    return res;
  }

  // Patient Routes
  Future<List<Patient>> searchPatients(String query) async {
    try {
      final encoded = Uri.encodeQueryComponent(query);
      final res = await _get("/patients/search?q=$encoded");
      if (res is List) {
        return res.map((e) => Patient.fromJson(e)).toList();
      } else if (res is Map) {
        if (res['success'] == true && res['data'] != null) {
          return (res['data'] as List).map((e) => Patient.fromJson(e)).toList();
        } else if (res['data'] != null && res['data'] is List) {
          return (res['data'] as List).map((e) => Patient.fromJson(e)).toList();
        } else if (res.containsKey('patients') && res['patients'] is List) {
          return (res['patients'] as List)
              .map((e) => Patient.fromJson(e))
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Doctor Stats
  Future<Map<String, dynamic>> getDoctorStatistics(String doctorId) async {
    // This assumes a backend endpoint exists at /doctors/statistics/{id}
    // that returns a map like: { "totalCured": 25, "appointmentsToday": 8, "upcomingAppointments": 12 }
    final res = await _get("/doctors/statistics/$doctorId");
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPatientStatistics() async {
    final res = await _get("/patients/statistics");
    if (res is Map<String, dynamic> &&
        res['success'] == true &&
        res['statistics'] is Map<String, dynamic>) {
      return res['statistics'] as Map<String, dynamic>;
    } else if (res is Map<String, dynamic>) {
      return res; // Fallback for direct map response
    }
    throw Exception('Failed to parse patient statistics');
  }

  Future<Map<String, dynamic>> getPatientAnalytics() async {
    return await _get("/patients/analytics/registrations");
  }

  Future<List<Patient>> getPatientsByStatus(String status) async {
    final res = await _get("/patients?status=$status");
    return (res as List).map((e) => Patient.fromJson(e)).toList();
  }

  // Prescription Routes
  Future<Prescription> createPrescription(Map<String, dynamic> data) async {
    final res = await _post("/prescriptions", data);
    return Prescription.fromJson(res);
  }

  Future<Prescription> updatePrescription(
      String id, Map<String, dynamic> data) async {
    final res = await _put("/prescriptions/$id", data);
    return Prescription.fromJson(res);
  }

  Future<dynamic> updateMedicineStatus(String prescriptionId, String medicineId,
      Map<String, dynamic> data) async {
    return await _put(
        "/prescriptions/$prescriptionId/medicines/$medicineId", data);
  }

  // History Routes
  Future<History> createDiseaseHistory(Map<String, dynamic> data) async {
    final res = await _post("/history", data);
    return History.fromJson(res);
  }

  Future<History> updateDiseaseHistory(
      String id, Map<String, dynamic> data) async {
    final res = await _put("/history/$id", data);
    return History.fromJson(res);
  }

  Future<Map<String, dynamic>> getHistorySummary(String patientId) async {
    return await _get("/history/patient/$patientId/summary");
  }

  // Daily Reading Routes
  Future<DailyReading> addDailyReading(Map<String, dynamic> data) async {
    final res = await _post("/readings", data);
    return DailyReading.fromJson(res);
  }

  Future<DailyReading> updateDailyReading(
      String id, Map<String, dynamic> data) async {
    final res = await _put("/readings/$id", data);
    return DailyReading.fromJson(res);
  }

  // Note Routes
  Future<List<Note>> getNotesByPatient(String patientId) async {
    final res = await _get("/notes/patient/$patientId");
    List<dynamic> data;
    if (res is List) {
      data = res;
    } else if (res is Map && res.containsKey('data') && res['data'] is List) {
      data = res['data'] as List;
    } else {
      return [];
    }
    return data.map((e) => Note.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<dynamic> createNote(Map<String, dynamic> data) async {
    return await _post("/notes", data);
  }

  Future<dynamic> updateNote(String id, Map<String, dynamic> data) async {
    return await _put("/notes/$id", data);
  }

  Future<dynamic> deleteNote(String id) async {
    return await _delete("/notes/$id");
  }

  Future<dynamic> restoreNote(String id) async {
    return await _put("/notes/$id/restore", {});
  }

  // Health Summary Routes
  Future<dynamic> queryHealthData(Map<String, dynamic> data) async {
    // Return the raw dynamic response. The UI layer (PatientDetailScreen) has
    // robust parsing logic to handle different response structures ('answer' vs 'summary').
    return await _post("/summary/query", data);
  }

  // Emergency Routes
  Future<dynamic> triggerAlert(Map<String, dynamic> data) async {
    return await _post("/emergency/alert", data);
  }

  // Verify Routes
  Future<dynamic> verifyDoctorAlt(Map<String, dynamic> data) =>
      _post("/verify/verify-doctor", data);
}
