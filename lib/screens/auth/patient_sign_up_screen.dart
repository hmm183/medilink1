import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/ApiService.dart';
import '../patient/language_provider.dart';
import 'digilocker_webview_screen.dart';

class PatientSignUpScreen extends StatefulWidget {
  const PatientSignUpScreen({super.key});

  @override
  State<PatientSignUpScreen> createState() => _PatientSignUpScreenState();
}

class _PatientSignUpScreenState extends State<PatientSignUpScreen> {
  final ApiService _apiService = ApiService();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _isLoading = false;
  // Holds the final verified user data from DigiLocker
  Map<String, dynamic>? _userData;
  // Temporary session data for the DigiLocker flow
  String? _sessionId;
  String? _digilockerAccessToken;

  Future<void> _initiateDigilocker() async {
    setState(() => _isLoading = true);
    try {
      // Step 1: Initiate session with our backend to get session details and the authorization URL.
      final res = await _apiService.initiateDigilocker({});
      final authorizationUrl = res['authorizationUrl'];
      _sessionId = res['sessionId'];
      _digilockerAccessToken = res['accessToken'];

      if (authorizationUrl != null &&
          _sessionId != null &&
          _digilockerAccessToken != null) {
        // The redirect URL is what the backend's digilockerService is configured with.
        // The webview needs to listen for this URL to know the flow is complete.
        const String redirectUrl = 'http://localhost:3000/auth';

        // Step 2: Open the WebView and wait for it to signal completion.
        final success = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DigiLockerWebViewScreen(
                authorizationUrl: authorizationUrl, redirectUrl: redirectUrl),
          ),
        );

        if (!mounted) return;

        // Step 3: If the webview popped with a success signal, fetch the user data.
        if (success == true) {
          final userDataRes = await _apiService.getDigilockerData({
            'sessionId': _sessionId,
            'accessToken': _digilockerAccessToken,
          });

          if (userDataRes != null && userDataRes['userData'] != null) {
            setState(() => _userData = userDataRes['userData']);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('DigiLocker authentication successful!')),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Failed to retrieve user data.')),
            );
          }
        }
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Authorization URL or session data not found')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to initiate DigiLocker: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    if (_email.text.isEmpty || _password.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email and a password')),
      );
      return;
    }
    if (_userData == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please complete DigiLocker authentication first')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await _apiService.setPasswordAndRegister({
        'userData': _userData,
        'password': _password.text,
        'email': _email.text,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Registration successful! Please sign in.')),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registration failed: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    return Scaffold(
      appBar: AppBar(title: Text(langProvider.t('Patient Sign Up'))),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (_userData == null) ...[
                  Text(
                    langProvider.t('KYC via DigiLocker'),
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    langProvider.t('step1Desc'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: _isLoading
                          ? const SizedBox.shrink()
                          : const Icon(Icons.lock_open),
                      onPressed: _isLoading ? null : _initiateDigilocker,
                      label: _isLoading
                          ? const CircularProgressIndicator()
                          : Text(langProvider.t('Start Digilocker')),
                    ),
                  ),
                ] else ...[
                  Text(
                    langProvider.t('step2Title'),
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: ListTile(
                      leading:
                          const Icon(Icons.check_circle, color: Colors.green),
                      title: Text(_userData!['name'] ?? 'Name not found'),
                      subtitle: Text(
                          'UID: XXXX-XXXX-${_userData!['uid']?.substring(_userData!['uid'].length - 4) ?? 'XXXX'}'),
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(fontSize: 14),
                    decoration:
                        InputDecoration(hintText: langProvider.t('emailHint')),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                        hintText: langProvider.t('passwordHint')),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _register,
                      child: _isLoading
                          ? const CircularProgressIndicator()
                          : Text(langProvider.t('createAccount')),
                    ),
                  ),
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }
}
