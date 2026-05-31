class Translation {
  final String translatedText;

  Translation({required this.translatedText});

  factory Translation.fromJson(Map<String, dynamic> json) => Translation(
        translatedText: json["translatedText"],
      );

  Map<String, dynamic> toJson() => {"translatedText": translatedText};
}
