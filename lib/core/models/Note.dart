class Note {
  final String id;
  final String noteText;
  final String? createdByName;
  final String? createdByType; // 'Doctor' or 'Patient'
  final DateTime createdAt;

  Note({
    required this.id,
    required this.noteText,
    this.createdByName,
    this.createdByType,
    required this.createdAt,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    String? name;
    // The backend populates 'createdBy' with an object like { _id, name }
    if (json['createdBy'] != null && json['createdBy'] is Map) {
      name = json['createdBy']['name'];
    }

    return Note(
      id: json['_id'],
      noteText: json['noteText'] ?? '',
      createdByName: name,
      createdByType: json['createdByType'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
