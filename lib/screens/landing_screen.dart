import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_theme.dart';
import '../widgets/gradient_button.dart';
import '../core/network/ApiService.dart';
import 'patient/language_provider.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _stats;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final stats = await _apiService.getPatientStatistics();
      setState(() {
        _stats = stats;
        _isLoadingStats = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingStats = false;
      });
      // Keep static values as fallback
    }
  }

  @override
  Widget build(BuildContext context) {
    final langProvider = context.watch<LanguageProvider>();
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 600; // phones vs tablets/desktop

    // scale factor for font sizes
    double scale(double base) => base * (isSmall ? 0.85 : 1.0);

    return Scaffold(
      appBar: AppBar(
        title: Text(langProvider.t('landingTitle')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _pillButton(
                    label: langProvider.t('doctorSignIn'), // Changed color
                    color: AppTheme.success,
                    onTap: () => Navigator.pushNamed(context, '/auth/doctor'),
                  ),
                  const SizedBox(width: 8),
                  _pillButton(
                    label: langProvider.t('patientSignIn'), // Changed color
                    color: AppTheme.accent,
                    onTap: () => Navigator.pushNamed(context, '/auth/patient'),
                  ),
                  const SizedBox(width: 8),
                  _languageMenu(),
                ],
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // background gradient
          Positioned.fill(
            child: IgnorePointer(
              child: Opacity(
                opacity: 0.08,
                child: Container(
                  // Subtle background gradient
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primary, AppTheme.accent],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ),
            ),
          ),
          SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(20, 24, 20, isSmall ? 80 : 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Card
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppTheme.card.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  padding: EdgeInsets.all(isSmall ? 16 : 22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          // Tag background
                          color: AppTheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          langProvider.t('heroTag'),
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: scale(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        langProvider.t('heroHeading'),
                        style: TextStyle(
                          fontSize: scale(32),
                          height: 1.1,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        langProvider.t('heroDesc'),
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: scale(14),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          GradientButton(
                            label: langProvider.t('Sign In'),
                            onTap: () =>
                                Navigator.pushNamed(context, '/auth/patient'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Quick stats
                Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                            child: _metricCard(
                                _isLoadingStats
                                    ? '...'
                                    : (_stats?['totalPatients']?.toString() ??
                                        '...'),
                                langProvider.t('statRegistered'),
                                scale)),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                            child: _metricCard(
                                _isLoadingStats
                                    ? '...'
                                    : (_stats?['patientsBeingCured']
                                            ?.toString() ??
                                        '...'),
                                langProvider.t('statTreating'),
                                scale)),
                        const SizedBox(width: 14),
                        Expanded(
                            child: _metricCard(
                                _isLoadingStats
                                    ? '...'
                                    : (_stats?['patientsDischarged']
                                            ?.toString() ??
                                        '...'),
                                langProvider.t('statDischarged'),
                                scale)),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 18),
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  padding: EdgeInsets.all(isSmall ? 12 : 16),
                  child: Text(
                    '${langProvider.t('footerSlogan')} ${langProvider.t('footerLangs')}',
                    style: TextStyle(
                        color: AppTheme.textMuted, fontSize: scale(12)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _languageMenu() {
    final langProvider = context.watch<LanguageProvider>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: langProvider.isTranslating
          ? const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2)),
            )
          : DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: langProvider.selectedLanguage,
                dropdownColor: AppTheme.card,
                style:
                    TextStyle(color: Theme.of(context).colorScheme.onSurface),
                items: langProvider.supportedLanguages.map((lang) {
                  return DropdownMenuItem<String>(
                    value: lang['value']!,
                    child: Text(lang['label']!),
                  );
                }).toList(),
                onChanged: (v) =>
                    context.read<LanguageProvider>().setLanguage(v ?? 'en'),
              ),
            ),
    );
  }

  Widget _pillButton({
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: const TextStyle(
              fontWeight: FontWeight.w700,
              color:
                  Colors.white), // Font color remains white for good contrast
        ),
      ),
    );
  }

  Widget _metricCard(
      String value, String label, double Function(double) scale) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: scale(16),
        vertical: scale(16),
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppTheme.primary,
      ),
      child: Row(
        children: [
          Flexible(
            flex: 2,
            child: Text(
              value,
              style: TextStyle(
                fontSize: scale(24),
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 10),
          Flexible(
            flex: 3,
            child: Text(
              label,
              style: TextStyle(
                  color: Colors.white.withOpacity(0.8), fontSize: scale(14)),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
