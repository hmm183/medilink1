class PatientNote {
  final String id;
  final String patientId;
  final String noteText;
  final bool isArchived;
  final DateTime createdAt;
  final DateTime updatedAt;

  PatientNote({
    required this.id,
    required this.patientId,
    required this.noteText,
    required this.isArchived,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PatientNote.fromJson(Map<String, dynamic> json) {
    return PatientNote(
      id: json['_id'] ?? json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      noteText: json['noteText'] ?? '',
      isArchived: json['isArchived'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'patientId': patientId,
        'noteText': noteText,
        'isArchived': isArchived,
      };
}
