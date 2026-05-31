import 'package:flutter/material.dart';
import '../../core/network/ApiService.dart';

class DoctorSignUpScreen extends StatefulWidget {
  const DoctorSignUpScreen({super.key});

  @override
  State<DoctorSignUpScreen> createState() => _DoctorSignUpScreenState();
}

class _DoctorSignUpScreenState extends State<DoctorSignUpScreen> {
  final ApiService _apiService = ApiService();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _doctorId = TextEditingController();
  final _licenseNumber = TextEditingController();
  bool _isLoading = false;
  bool _obscure = true;
  Map<String, dynamic>? _verifiedDoctor;

  Future<void> _verifyDoctor() async {
    if (_doctorId.text.isEmpty || _licenseNumber.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter Doctor ID and License Number')),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res = await _apiService.verifyDoctor({
        'doctorId': _doctorId.text,
        'licenseNumber': _licenseNumber.text,
      });
      if (res['success'] == true) {
        setState(() {
          _verifiedDoctor = res['doctor'];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Doctor verified successfully')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Verification failed')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification error: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _register() async {
    if (_username.text.isEmpty || _email.text.isEmpty || _password.text.isEmpty || _verifiedDoctor == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields and verify doctor')),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      await _apiService.registerDoctor({
        'username': _username.text,
        'email': _email.text,
        'password': _password.text,
        'verifiedDoctor': _verifiedDoctor,
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration successful! Please sign in.')),
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
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _doctorId.dispose();
    _licenseNumber.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Doctor Sign Up')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: _doctorId,
                    decoration: const InputDecoration(hintText: 'Doctor ID'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _licenseNumber,
                    decoration: const InputDecoration(hintText: 'License Number'),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _verifyDoctor,
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Verify Doctor'),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _username,
                    decoration: const InputDecoration(hintText: 'Username'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _email,
                    decoration: const InputDecoration(hintText: 'Email'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      hintText: 'Password',
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(
                            _obscure ? Icons.visibility : Icons.visibility_off),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _register,
                      child: _isLoading
                          ? const CircularProgressIndicator()
                          : const Text('Register'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
