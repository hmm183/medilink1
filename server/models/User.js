const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  age: { type: Number },
  gender: { type: String },
  address: { type: String },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
module.exports = User;