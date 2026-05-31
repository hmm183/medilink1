class DiseaseHistory {
  final String id;
  final String patientId;
  final String illnessName;
  final DateTime diagnosisDate;
  final List<String> initialSymptoms;
  final String? remarks;
  final List<String> medicinesPrescribed;
  final String? prescribedBy;
  final String status;
  final String? hospital;
  final Map<String, dynamic>? location;

  DiseaseHistory({
    required this.id,
    required this.patientId,
    required this.illnessName,
    required this.diagnosisDate,
    required this.initialSymptoms,
    this.remarks,
    required this.medicinesPrescribed,
    this.prescribedBy,
    required this.status,
    this.hospital,
    this.location,
  });

  factory DiseaseHistory.fromJson(Map<String, dynamic> json) {
    return DiseaseHistory(
      id: json['_id'] ?? json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      illnessName: json['illnessName'] ?? '',
      diagnosisDate:
          DateTime.tryParse(json['diagnosisDate'] ?? '') ?? DateTime.now(),
      initialSymptoms: (json['initialSymptoms'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      remarks: json['remarks'],
      medicinesPrescribed: (json['medicinesPrescribed'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      prescribedBy: json['prescribedBy']?.toString(),
      status: json['status'] ?? 'ongoing',
      hospital: json['hospital'],
      location: json['location'] != null
          ? Map<String, dynamic>.from(json['location'])
          : null,
    );
  }
}
