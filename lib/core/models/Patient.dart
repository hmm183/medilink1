// class Patient {
//   final String id;
//   final String name;
//   final String? email;
//   final String? phone;
//   final String? dob;
//   final String? address;
//   final String? status;

//   Patient({
//     required this.id,
//     required this.name,
//     this.email,
//     this.phone,
//     this.dob,
//     this.address,
//     this.status,
//   });

//   factory Patient.fromJson(Map<String, dynamic> json) => Patient(
//         id: json["_id"] ?? json["id"],
//         name: (json["fullName"] ?? json["name"])?.toString() ?? "",
//         email: json["email"],
//         phone: json["phone"],
//         dob: json["dateOfBirth"] ?? json["dob"],
//         address: json["address"],
//         status: json["status"],
//       );

//   Map<String, dynamic> toJson() => {
//         "id": id,
//         "name": name,
//         "email": email,
//         "phone": phone,
//         "dob": dob,
//         "address": address,
//         "status": status,
//       };
// }
class Patient {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? dob;
  final String? address;
  final String? status;

  Patient({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.dob,
    this.address,
    this.status,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    String? formattedAddress;
    final addressData = json['address'];

    if (addressData is String) {
      formattedAddress = addressData;
    } else if (addressData is Map) {
      // Handle the specific case where the backend saves the address as { "street": "..." }
      // This makes the client resilient to the backend's data structure, as requested.
      if (addressData.containsKey('street') &&
          addressData['street'] is String) {
        formattedAddress = addressData['street'];
      } else {
        // Fallback for other map structures, just join the values.
        formattedAddress =
            addressData.values.where((v) => v != null).join(', ');
      }
    }

    return Patient(
      id: json["_id"] ?? json["id"],
      name: (json["fullName"] ?? json["name"])?.toString() ?? "",
      email: json["email"]?.toString(),
      phone: json["phone"]?.toString(),
      dob: (json["dateOfBirth"] ?? json["dob"])?.toString(),
      address: formattedAddress,
      status: json["status"]?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "email": email,
        "phone": phone,
        "dob": dob,
        "address": address,
        "status": status,
      };
}
