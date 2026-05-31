class BloodPressure {
  final int systolic;
  final int diastolic;

  BloodPressure({required this.systolic, required this.diastolic});

  factory BloodPressure.fromJson(Map<String, dynamic> json) {
    return BloodPressure(
      systolic: json['systolic'] ?? 0,
      diastolic: json['diastolic'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'systolic': systolic,
        'diastolic': diastolic,
      };
}

class DailyReading {
  final String? id;
  final String patientId;
  final DateTime date;
  final BloodPressure bloodPressure;
  final int pulseRate;
  final double? weightKg;

  DailyReading({
    this.id,
    required this.patientId,
    required this.date,
    required this.bloodPressure,
    required this.pulseRate,
    this.weightKg,
  });

  factory DailyReading.fromJson(Map<String, dynamic> json) {
    return DailyReading(
      id: json['_id'] ?? json['id'],
      patientId: json['patientId'] ?? '',
      date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
      bloodPressure: BloodPressure.fromJson(
          Map<String, dynamic>.from(json['bloodPressure'] ?? {})),
      pulseRate: (json['pulseRate'] is int)
          ? json['pulseRate']
          : int.tryParse('${json['pulseRate']}') ?? 0,
      weightKg: json['weightKg'] != null
          ? (json['weightKg'] is num
              ? (json['weightKg'] as num).toDouble()
              : double.tryParse('${json['weightKg']}'))
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'patientId': patientId,
        'date': date.toIso8601String(),
        'bloodPressure': bloodPressure.toJson(),
        'pulseRate': pulseRate,
        if (weightKg != null) 'weightKg': weightKg,
      };
}
/*
class DailyReading {
  final String id;
  final double? value;
  final String? date;

  DailyReading({
    required this.id,
    this.value,
    this.date,
  });

  factory DailyReading.fromJson(Map<String, dynamic> json) => DailyReading(
        id: json["_id"] ?? json["id"],
        value: json["value"] != null ? (json["value"] as num).toDouble() : null,
        date: json["date"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "value": value,
        "date": date,
      };
}
*/
