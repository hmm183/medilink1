class Medicine {
  final String id;
  final String name;
  final String? dosage;
  final String? frequency;
  final String? duration;
  final String status;

  Medicine({
    required this.id,
    required this.name,
    this.dosage,
    this.frequency,
    this.duration,
    required this.status,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      dosage: json['dosage'],
      frequency: json['frequency'],
      duration: json['duration'],
      status: json['status'] ?? 'current',
    );
  }

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) '_id': id,
        'name': name,
        'dosage': dosage,
        'frequency': frequency,
        'duration': duration,
        'status': status,
      };
}

class Prescription {
  final String id;
  final String patientId;
  final String doctorId;
  final DateTime date;
  final List<Medicine> medicines;
  final String? prescriptionUrl;

  Prescription({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.date,
    required this.medicines,
    this.prescriptionUrl,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    final meds = (json['medicines'] as List<dynamic>?)
            ?.map((m) => Medicine.fromJson(Map<String, dynamic>.from(m)))
            .toList() ??
        [];
    return Prescription(
      id: json['_id'] ?? json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      doctorId: json['doctorId'] is Map
          ? (json['doctorId']['_id'] ?? '')
          : (json['doctorId'] ?? ''),
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      medicines: meds,
      prescriptionUrl: json['prescriptionUrl'],
    );
  }
}
/*
class Prescription {
  final String id;
  final String? patientId;
  final String? doctorId;
  final List<dynamic>? medicines;
  final String? date;
  final String? notes;

  Prescription({
    required this.id,
    this.patientId,
    this.doctorId,
    this.medicines,
    this.date,
    this.notes,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) => Prescription(
        id: json["_id"] ?? json["id"],
        patientId: json["patientId"],
        doctorId: json["doctorId"],
        medicines: json["medicines"],
        date: json["date"],
        notes: json["notes"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "patientId": patientId,
        "doctorId": doctorId,
        "medicines": medicines,
        "date": date,
        "notes": notes,
      };
}
*/
