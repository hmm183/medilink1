import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/models/disease_history.dart';

class DiseaseHistoryScreen extends StatelessWidget {
  final List<DiseaseHistory> history;

  const DiseaseHistoryScreen({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Full Disease History'),
      ),
      body: history.isEmpty
          ? const Center(
              child: Text(
                'No disease history records found.',
                style: TextStyle(fontSize: 16, color: Colors.white70),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final record = history[index];

                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ListTile(
                    isThreeLine: true,
                    leading: const Icon(Icons.history_edu_outlined),
                    title: Text(
                      record.illnessName,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                            'Diagnosed: ${DateFormat.yMMMd().format(record.diagnosisDate)}'),
                        Text('Status: ${record.status}'),
                        if (record.hospital != null &&
                            record.hospital!.isNotEmpty)
                          Text('Hospital: ${record.hospital}'),
                        if (record.initialSymptoms.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              'Symptoms: ${record.initialSymptoms.join(', ')}',
                              style: TextStyle(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurface
                                      .withOpacity(0.7)),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
