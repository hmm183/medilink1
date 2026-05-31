import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart'; // Import the new chart library
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../app_theme.dart';
import '../../widgets/section_card.dart';
import '../../widgets/stat_card.dart';
import '../../core/models/Prescription.dart';
import '../../core/models/disease_history.dart';
import '../../core/models/DailyReading.dart';
import '../../core/models/Note.dart';
import '../../core/models/HealthSummary.dart';
import 'disease_history_screen.dart'; // Re-add import
import '../../core/network/ApiService.dart';
import 'language_provider.dart';

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({super.key});

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

// Helper class to associate a medicine with its parent prescription
class _MedicineInfo {
  final Medicine medicine;
  final String prescriptionId;
  _MedicineInfo(this.medicine, this.prescriptionId);
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> {
  final ApiService _apiService = ApiService();
  List<_MedicineInfo> currentMeds = [];
  List<_MedicineInfo> prescribedMeds = [];
  List<_MedicineInfo> pastMeds = [];
  List<DiseaseHistory> diseaseHistory = [];
  List<Note> notes = [];
  List<DailyReading> dailyReadings = [];
  HealthSummary? healthSummary;
  bool isLoading = true;
  bool _isSummaryExpanded = false;

  final _currentInput = TextEditingController();
  final _noteCtrl = TextEditingController();

  // Controllers for adding daily readings
  final _systolicCtrl = TextEditingController();
  final _diastolicCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  final _pulseCtrl = TextEditingController();

  // State for dynamically translated content
  String? _translatedSummary;

  @override
  void initState() {
    super.initState();
    _apiService.init().then((_) {
      _fetchPatientData();
    }).catchError((e) {
      debugPrint("ApiService init failed: $e");
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Listen to language changes to re-translate dynamic content
    Provider.of<LanguageProvider>(context)
        .addListener(_translateDynamicContent);
  }

  @override
  void dispose() {
    Provider.of<LanguageProvider>(context, listen: false)
        .removeListener(_translateDynamicContent);
    _currentInput.dispose();
    _noteCtrl.dispose();
    _systolicCtrl.dispose();
    _diastolicCtrl.dispose();
    _weightCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  /// Translates dynamic content like the AI health summary when the language changes.
  Future<void> _translateDynamicContent() async {
    final langProvider = Provider.of<LanguageProvider>(context, listen: false);
    final langCode = langProvider.selectedLanguage;

    // If there's no summary, or it's empty, nothing to do.
    if (healthSummary?.summary == null || healthSummary!.summary.isEmpty) {
      setState(() => _translatedSummary = healthSummary?.summary);
      return;
    }

    // If the language is English, just use the original summary.
    if (langCode == 'en') {
      setState(() => _translatedSummary = healthSummary?.summary);
      return;
    }

    // Otherwise, call the API to translate it.
    try {
      final translated =
          await _apiService.translateTexts([healthSummary!.summary], langCode);
      if (mounted && translated.isNotEmpty) {
        setState(() => _translatedSummary = translated.first);
      }
    } catch (e) {
      debugPrint("Dynamic content translation failed: $e");
      if (mounted) {
        // Fallback to the original summary on error.
        setState(() => _translatedSummary = healthSummary?.summary);
      }
    }
  }

  Future<void> _fetchPatientData() async {
    if (!mounted) return;
    setState(() {
      isLoading = true;
    });

    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        // Show explicit UI message and offer re-login
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('Session Expired'),
            content: const Text('You are not logged in. Please log in again.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close dialog
                  Navigator.of(context).pushNamedAndRemoveUntil('/landing',
                      (Route<dynamic> route) => false); // Go to landing
                },
                child: const Text('Log In'),
              ),
            ],
          ),
        );
        setState(() {
          isLoading = false;
        });
        return;
      }

      final patientId = currentUser.id;
      // Fetch data in parallel for better performance, like the web app.
      final results = await Future.wait([
        _apiService.getPrescriptions(patientId),
        _apiService.getPatientHistory(patientId),
        _apiService.getNotesByPatient(patientId),
        // First, try to GET an existing summary. This is much faster.
        _apiService.getSummary(patientId),
        _apiService.getDailyReadings(patientId), // Fetch readings for the chart
      ]);

      if (mounted) {
        // The ApiService methods already return strongly-typed lists. No need to re-parse.
        final allPrescriptions = results[0] as List<Prescription>;
        final historyList = results[1] as List<DiseaseHistory>;
        final notesList = results[2] as List<Note>;
        HealthSummary? summaryData = results[3] as HealthSummary?;
        // If no summary exists, generate one now.
        if (summaryData == null) {
          summaryData =
              await _apiService.generateSummary({'patientId': patientId});
        }
        final readingsList = results[4] as List<DailyReading>;

        // Flatten the list of medicines from all prescriptions, like the web app
        final flatMeds = allPrescriptions.expand((p) {
          return p.medicines.map((m) => _MedicineInfo(m, p.id));
        }).toList();

        setState(() {
          prescribedMeds =
              flatMeds // Filter the flat list of medicines by status
                  .where((info) => info.medicine.status == 'prescribed')
                  .toList();
          currentMeds = flatMeds
              .where((info) => info.medicine.status == 'current')
              .toList();
          pastMeds =
              flatMeds.where((info) => info.medicine.status == 'past').toList();
          diseaseHistory = historyList;
          notes = notesList as List<Note>;
          healthSummary = summaryData as HealthSummary?;
          //_translatedSummary = summaryData?.summary; // Initialize summary
          dailyReadings = readingsList;
          isLoading = false;
        });

        // After fetching new data, re-translate dynamic content if necessary.
        await _translateDynamicContent();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load data: $e')),
        );
        debugPrint("Failed to load patient data: $e");
      }
    }
  }

  Future<void> _addCurrent() async {
    final t = _currentInput.text.trim();
    if (t.isEmpty) return;
    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User not logged in')),
        );
        return;
      }
      // This payload matches the backend model structure where 'medicines' is a list of objects.
      final data = {
        "patientId": currentUser.id,
        "medicines": [
          {"name": t, "status": "current"}
        ],
      };
      await _apiService.createPrescription(data);
      await _fetchPatientData();
      _currentInput.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add current medicine: $e')),
      );
    }
  }

  Future<void> _markMedicineAsPast(_MedicineInfo medInfo) async {
    try {
      // "Deleting" a medicine is implemented by setting its status to 'past'.
      // This moves it from the "Current" or "Prescribed" list to the "Past" list.
      await _apiService.updateMedicineStatus(
          medInfo.prescriptionId, medInfo.medicine.id, {"status": "past"});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${medInfo.medicine.name}" marked as past.')),
      );
      await _fetchPatientData(); // Refresh the lists
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update medicine: $e')),
      );
      debugPrint("Failed to mark medicine as past: $e");
    }
  }

  Future<void> _markMedicineAsCurrent(_MedicineInfo medInfo) async {
    try {
      await _apiService.updateMedicineStatus(
          medInfo.prescriptionId, medInfo.medicine.id, {"status": "current"});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('"${medInfo.medicine.name}" marked as current.')),
      );
      await _fetchPatientData(); // Refresh the lists
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update medicine: $e')),
      );
      debugPrint("Failed to mark medicine as current: $e");
    }
  }

  Future<void> _addDailyReading() async {
    final systolic = int.tryParse(_systolicCtrl.text);
    final diastolic = int.tryParse(_diastolicCtrl.text);
    final weight = double.tryParse(_weightCtrl.text);
    final pulse = int.tryParse(_pulseCtrl.text);

    if (systolic == null || diastolic == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter valid Blood Pressure values.')),
      );
      return;
    }

    try {
      final currentUser = _apiService.currentUser;
      if (currentUser == null) return;

      final readingData = {
        "patientId": currentUser.id,
        "bloodPressure": {"systolic": systolic, "diastolic": diastolic},
        if (weight != null) "weightKg": weight,
        if (pulse != null) "pulseRate": pulse,
      };

      await _apiService.addDailyReading(readingData);
      _systolicCtrl.clear();
      _diastolicCtrl.clear();
      _weightCtrl.clear();
      _pulseCtrl.clear();
      await _fetchPatientData(); // Refresh chart and data
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Daily reading saved successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save reading: $e')),
      );
    }
  }

  Future<void> _deleteNote(String noteId) async {
    final langProvider = context.read<LanguageProvider>();
    // Show confirmation dialog
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(langProvider.t('deleteNoteTitle')),
        content: Text(langProvider.t('deleteNoteConfirm')),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(langProvider.t('cancel'))),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(langProvider.t('delete'),
                style: const TextStyle(color: AppTheme.warning)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _apiService.deleteNote(noteId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Note deleted successfully')),
      );
      await _fetchPatientData(); // Refresh list
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete note: $e')),
      );
    }
  }

  /// Builds a more interactive and detailed trends chart using fl_chart.
  Widget _buildInteractiveTrendsChart(LanguageProvider langProvider) {
    if (dailyReadings.isEmpty) {
      return Center(
        child: Text(
          langProvider.t('noReadingsForChart'),
          style: const TextStyle(color: AppTheme.textMuted),
        ),
      );
    }

    // Sort readings by date to ensure the chart is chronological
    final sortedReadings = List<DailyReading>.from(dailyReadings)
      ..sort((a, b) => a.date.compareTo(b.date));

    // Create data points (spots) for each line
    final systolicSpots = <FlSpot>[];
    final diastolicSpots = <FlSpot>[];
    final weightSpots = <FlSpot>[];
    final pulseSpots = <FlSpot>[];

    for (int i = 0; i < sortedReadings.length; i++) {
      final reading = sortedReadings[i];
      final x = i.toDouble();
      systolicSpots.add(FlSpot(x, reading.bloodPressure.systolic.toDouble()));
      diastolicSpots.add(FlSpot(x, reading.bloodPressure.diastolic.toDouble()));
      if (reading.weightKg != null) {
        weightSpots.add(FlSpot(x, reading.weightKg!));
      }
      if (reading.pulseRate != null) {
        pulseSpots.add(FlSpot(x, reading.pulseRate!.toDouble()));
      }
    }

    // Define the line bars
    final lineBars = [
      _lineBarData(systolicSpots, AppTheme.primary),
      _lineBarData(diastolicSpots, AppTheme.accent),
      if (weightSpots.isNotEmpty) _lineBarData(weightSpots, AppTheme.success),
      if (pulseSpots.isNotEmpty) _lineBarData(pulseSpots, AppTheme.warning),
    ];

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: true,
          getDrawingHorizontalLine: (value) => FlLine(
              color: Theme.of(context).dividerColor.withOpacity(0.1),
              strokeWidth: 1),
          getDrawingVerticalLine: (value) => FlLine(
              color: Theme.of(context).dividerColor.withOpacity(0.1),
              strokeWidth: 1),
        ),
        titlesData: FlTitlesData(
          leftTitles: const AxisTitles(
              sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
          )),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 30,
              interval: sortedReadings.length > 5
                  ? (sortedReadings.length / 5).floorToDouble()
                  : 1,
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index >= 0 && index < sortedReadings.length) {
                  return SideTitleWidget(
                    axisSide: meta.axisSide,
                    child: Text(
                      DateFormat('d MMM').format(sortedReadings[index].date),
                      style: const TextStyle(
                          fontSize: 10, color: AppTheme.textMuted),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: lineBars,
        lineTouchData: LineTouchData(
          // Constrain the tooltip to fit within the chart's bounds.
          // This prevents the tooltip from rendering outside the view,
          // especially for data points near the top edge.
          touchTooltipData: LineTouchTooltipData(
            fitInsideHorizontally: true,
            fitInsideVertically: true,
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                String text;
                switch (spot.barIndex) {
                  case 0:
                    text =
                        '${langProvider.t('systolic')}: ${spot.y.toStringAsFixed(0)}';
                    break;
                  case 1:
                    text =
                        '${langProvider.t('diastolic')}: ${spot.y.toStringAsFixed(0)}';
                    break;
                  case 2:
                    text =
                        '${langProvider.t('weight')}: ${spot.y.toStringAsFixed(1)} kg';
                    break;
                  case 3:
                    text =
                        '${langProvider.t('pulse')}: ${spot.y.toStringAsFixed(0)} bpm';
                    break;
                  default:
                    throw Error();
                }
                return LineTooltipItem(
                  text,
                  TextStyle(
                      color: spot.bar.gradient?.colors.first ??
                          spot.bar.color ??
                          AppTheme.primary,
                      fontWeight: FontWeight.bold),
                );
              }).toList();
            },
          ),
        ),
        // Explicitly clip the chart drawing area to prevent lines from
        // going out of bounds, especially with curved lines.
        clipData: const FlClipData.all(),
      ),
    );
  }

  LineChartBarData _lineBarData(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      gradient: LinearGradient(colors: [color, color.withOpacity(0.5)]),
      barWidth: 3,
      isStrokeCapRound: true,
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(show: true, color: color.withOpacity(0.1)),
    );
  }

  @override
  Widget build(BuildContext context) {
    // lock to portrait for a mobile vibe (optional)
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    final langProvider = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text(langProvider.t('patientDashboardTitle')),
        actions: [
          // Language Dropdown
          if (langProvider.isTranslating)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppTheme.primary)),
            )
          else
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: langProvider.selectedLanguage,
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    // Use context.read in a callback
                    context.read<LanguageProvider>().setLanguage(newValue);
                  }
                },
                items: langProvider.supportedLanguages
                    .map<DropdownMenuItem<String>>((lang) {
                  return DropdownMenuItem<String>(
                    value: lang['value']!,
                    child: Text(lang['label']!),
                  );
                }).toList(),
                dropdownColor: AppTheme.background,
              ),
            ),
          TextButton(
            onPressed: () {
              _apiService.logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                  '/landing', (Route<dynamic> route) => false);
            },
            child: Text(langProvider.t('logout'),
                style: const TextStyle(color: Colors.white)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPatientData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(
            children: [
              // Top row: Chart + right stats (Hospital Visits / Prescriptions)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 3,
                    child: SectionCard(
                      title: langProvider.t('Health Trends'),
                      child: SizedBox(
                          height: 220,
                          child: _buildInteractiveTrendsChart(langProvider)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    flex: 2,
                    child: Column(
                      children: [
                        StatCard(
                          title: langProvider.t('hospitalVisits'),
                          value: diseaseHistory.length.toString(),
                          icon: Icons.local_hospital,
                          gradient: true,
                        ),
                        const SizedBox(height: 12),
                        StatCard(
                          title: langProvider.t('Prescriptions Stored'),
                          value: (currentMeds.length + prescribedMeds.length)
                              .toString(),
                          icon: Icons.medical_information,
                          gradient: true,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              SectionCard(
                title: langProvider.t('Health Summary'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _translatedSummary ?? langProvider.t('No Summary'),
                      style: const TextStyle(
                          color: AppTheme.textMuted, height: 1.5),
                      maxLines: _isSummaryExpanded ? null : 3,
                      overflow: _isSummaryExpanded
                          ? TextOverflow.visible
                          : TextOverflow.ellipsis,
                    ),
                    if (healthSummary != null &&
                        (healthSummary?.summary.length ?? 0) > 150)
                      TextButton(
                        onPressed: () => setState(
                            () => _isSummaryExpanded = !_isSummaryExpanded),
                        child: Text(_isSummaryExpanded
                            ? langProvider.t('seeLess')
                            : langProvider.t('seeMore')),
                      )
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Add Daily Reading Section
              SectionCard(
                title: langProvider.t('Add Daily Reading'),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                            child: TextField(
                                controller: _systolicCtrl,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                    labelText: langProvider.t('systolicBP')))),
                        const SizedBox(width: 10),
                        Expanded(
                            child: TextField(
                                controller: _diastolicCtrl,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                    labelText: langProvider.t('diastolicBP')))),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                            child: TextField(
                                controller: _weightCtrl,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                    labelText: langProvider.t('weightKg')))),
                        const SizedBox(width: 10),
                        Expanded(
                            child: TextField(
                                controller: _pulseCtrl,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                    labelText: langProvider.t('pulseRate')))),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _addDailyReading,
                      child: Text(langProvider.t('Save Reading')),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),

              LayoutBuilder(builder: (context, constraints) {
                final isWide = constraints.maxWidth > 600;
                final currentMedsCard = SectionCard(
                  title: langProvider.t('Current Medicines'),
                  child: Column(
                    children: [
                      ..._buildMedicineList(currentMeds,
                          onDelete: _markMedicineAsPast),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _currentInput,
                              decoration: InputDecoration(
                                  hintText: langProvider.t('medicineNameHint')),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: _addCurrent,
                            icon: const Icon(Icons.add),
                            label: Text(langProvider.t('add')),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
                final pastMedsCard = SectionCard(
                  title: langProvider.t('pastMedicines'), //
                  child: Column(
                    children: [
                      if (pastMeds.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            langProvider.t('noPastMedicines') ??
                                'No past medicines found.',
                            style: const TextStyle(color: AppTheme.textMuted),
                            textAlign: TextAlign.center,
                          ),
                        )
                      else
                        ..._buildPastMedicineList(pastMeds),
                    ],
                  ),
                );

                if (isWide) {
                  return Row(
                    children: [
                      Expanded(child: currentMedsCard),
                      const SizedBox(width: 14),
                      Expanded(child: pastMedsCard),
                    ],
                  );
                } else {
                  return Column(
                    children: [
                      currentMedsCard,
                      const SizedBox(height: 16),
                      pastMedsCard,
                    ],
                  );
                }
              }),
              const SizedBox(height: 16),

              LayoutBuilder(builder: (context, constraints) {
                final isWide = constraints.maxWidth > 600;
                final diseaseHistoryCard = SectionCard(
                  title: langProvider.t('diseaseHistory'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ...diseaseHistory.map((h) => _historyItem(
                          h.illnessName.isNotEmpty
                              ? h.illnessName
                              : langProvider.t('noHistoryDetails'))),
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => DiseaseHistoryScreen(
                                        history: diseaseHistory)));
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(color: AppTheme.primary),
                          ),
                          child: Text(langProvider.t('seeMore')),
                        ),
                      ),
                    ],
                  ),
                );
                final patientNotesCard = SectionCard(
                  title: langProvider.t('patientNotes'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (notes.isNotEmpty)
                        ...notes.map((n) => Card(
                              color: AppTheme.background,
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.note_alt_outlined,
                                    color: AppTheme.textMuted),
                                title: Text(
                                    n.noteText ?? langProvider.t('emptyNote')),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      color: AppTheme.warning),
                                  onPressed: () => _deleteNote(n.id),
                                  tooltip: langProvider.t('deleteNoteTooltip'),
                                ),
                              ),
                            )),
                      if (notes.isEmpty)
                        Text(
                            langProvider.t('noNotes') ??
                                'No notes have been added yet.',
                            style: const TextStyle(color: AppTheme.textMuted)),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _noteCtrl,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText: langProvider.t('notesHint'),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: ElevatedButton(
                          onPressed: () async {
                            final note = _noteCtrl.text.trim();
                            if (note.isEmpty) return;
                            try {
                              final currentUser = _apiService.currentUser;
                              if (currentUser == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('User not logged in')),
                                );
                                return;
                              }
                              final data = {
                                "patientId": currentUser.id,
                                "noteText": note,
                              };
                              await _apiService.createNote(data);
                              await _fetchPatientData();
                              _noteCtrl.clear();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Note saved successfully')),
                              );
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                    content: Text('Failed to save note: $e')),
                              );
                            }
                          },
                          child: Text(langProvider.t('saveNote')),
                        ),
                      ),
                    ],
                  ),
                );

                if (isWide) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: diseaseHistoryCard),
                      const SizedBox(width: 14),
                      Expanded(child: patientNotesCard),
                    ],
                  );
                } else {
                  return Column(
                    children: [
                      diseaseHistoryCard,
                      const SizedBox(height: 16),
                      patientNotesCard,
                    ],
                  );
                }
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _medTile(String text, IconData icon, Color iconColor,
      {required VoidCallback onAction, required String tooltip, Key? key}) {
    return Card(
      key: key,
      color: AppTheme.background,
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ListTile(
        title: Text(text),
        trailing: IconButton(
            icon: Icon(icon, color: iconColor),
            onPressed: onAction,
            tooltip: tooltip),
      ),
    );
  }

  List<Widget> _buildMedicineList(List<_MedicineInfo> medInfoList,
      {required void Function(_MedicineInfo) onDelete}) {
    if (medInfoList.isEmpty) return [const SizedBox.shrink()];
    final langProvider = Provider.of<LanguageProvider>(context, listen: false);
    return medInfoList.map((info) {
      return _medTile(
        info.medicine.name,
        Icons.history,
        AppTheme.warning,
        onAction: () => onDelete(info),
        tooltip: langProvider.t('markAsPast'),
        key: ValueKey(info.medicine.id),
      );
    }).toList();
  }

  List<Widget> _buildPastMedicineList(List<_MedicineInfo> medInfoList) {
    if (medInfoList.isEmpty) return [const SizedBox.shrink()];
    final langProvider = Provider.of<LanguageProvider>(context, listen: false);
    return medInfoList.map((info) {
      return _medTile(
        info.medicine.name,
        Icons.refresh,
        AppTheme.success,
        onAction: () => _markMedicineAsCurrent(info),
        tooltip: langProvider.t('markAsCurrent'),
        key: ValueKey(info.medicine.id),
      );
    }).toList();
  }

  Widget _historyItem(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        const Icon(Icons.history_edu_outlined,
            size: 16, color: AppTheme.textMuted),
        const SizedBox(width: 8),
        Expanded(
            child:
                Text(label, style: const TextStyle(color: AppTheme.textMuted))),
      ]),
    );
  }
}
