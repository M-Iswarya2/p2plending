const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: String,
  username: { type: String, unique: true },
  phone: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
});

module.exports = mongoose.model("User", UserSchema);
