class History {
  final String id;
  final String? details;
  final String? diagnosisDate;
  final String? illnessName;
  final List<String>? initialSymptoms;
  final String? hospital;
  final String? status;

  History({
    required this.id,
    this.details,
    this.diagnosisDate,
    this.illnessName,
    this.initialSymptoms,
    this.hospital,
    this.status,
  });

  factory History.fromJson(Map<String, dynamic> json) => History(
        id: json["_id"] ?? json["id"],
        details: json["details"],
        diagnosisDate: json["diagnosisDate"],
        illnessName: json["illnessName"],
        initialSymptoms: (json['initialSymptoms'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList(),
        hospital: json["hospital"],
        status: json["status"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "details": details,
        "diagnosisDate": diagnosisDate,
        "illnessName": illnessName,
        "initialSymptoms": initialSymptoms,
        "hospital": hospital,
        "status": status,
      };
}
