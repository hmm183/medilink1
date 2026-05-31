import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_theme.dart';
import 'patient/language_provider.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primary.withOpacity(0.3),
              AppTheme.background,
            ],
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  const Icon(
                    Icons.medical_services_outlined,
                    size: 120,
                    color: AppTheme.primary,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    langProvider.t('SwiftMedilink'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    langProvider.t('Swift way to manage patient records'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 18, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 50),
                  ElevatedButton(
                    onPressed: () =>
                        Navigator.of(context).pushReplacementNamed('/landing'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 40, vertical: 15),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30)),
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      textStyle: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    child: Text(langProvider.t('Get Started')),
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
