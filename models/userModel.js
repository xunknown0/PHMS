const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff" },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  currentSession: { type: String, default: null },
  browser: {
  type: String,
  default: null,
}

});

// ===== Hash password before save =====
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ===== Match password =====
userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
