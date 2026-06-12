const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  mobile: String,
  hospital: String,
  department: String,
  token: Number,
  status: {
    type: String,
    default: "waiting"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Patient", patientSchema);


