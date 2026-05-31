class User {
  final String id;
  final String username;

  User({required this.id, required this.username});

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json["_id"],
        username: json["username"],
      );

  Map<String, dynamic> toJson() => {"id": id, "username": username};
}
