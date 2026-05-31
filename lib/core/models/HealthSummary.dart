class HealthSummary {
  final String? id;
  final String summaryContent;
  final String? sourceData;
  final DateTime? generatedAt;

  HealthSummary({
    this.id,
    required this.summaryContent,
    this.sourceData,
    this.generatedAt,
  });

  // For compatibility with old code that uses .summary
  String get summary => summaryContent;

  factory HealthSummary.fromJson(Map<String, dynamic> json) {
    // Handles responses from both generateSummary and getSummary
    return HealthSummary(
      id: json['_id'],
      summaryContent: json['summaryContent'] ?? json['healthSummary'] ?? '',
      sourceData: json['sourceData'] ?? json['source'],
      generatedAt: json['generatedAt'] != null
          ? DateTime.tryParse(json['generatedAt'].toString())
          : (json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString())
              : null),
    );
  }
}
