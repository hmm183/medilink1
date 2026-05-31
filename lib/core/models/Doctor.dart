class Doctor {
  final String id;
  final String name;
  final String? email;
  final String? registrationNo;
  final String? council;
  final String? address;
  final String? username;

  Doctor({
    required this.id,
    required this.name,
    this.email,
    this.registrationNo,
    this.council,
    this.address,
    this.username,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) => Doctor(
        id: json["_id"] ?? json["id"],
        name: json["name"] ?? "",
        email: json["email"],
        registrationNo: json["registrationNo"],
        council: json["council"],
        address: json["address"],
        username: json["username"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "email": email,
        "registrationNo": registrationNo,
        "council": council,
        "address": address,
        "username": username,
      };
}
