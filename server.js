const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Patient = require("./models/Patient");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("Healthcare Queue Server Running 🚀");
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const user = new User({ name, email, mobile, password });
    await user.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient Login
app.post("/login", async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
      password
    });

    if (!user) {
      return res.json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register patient
app.post("/register", async (req, res) => {
  try {
    const { name, age, mobile, hospital, department } = req.body;

    const count = await Patient.countDocuments({
      hospital,
      department
    });

    const token = count + 1;

    const patient = new Patient({
      name,
      age,
      mobile,
      hospital,
      department,
      token,
      status: "waiting"
    });

    await patient.save();

    res.json({
      message: "Patient registered successfully",
      patient
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin queue
app.get("/queue", async (req, res) => {
  try {
    const { hospital, department } = req.query;

    const patients = await Patient.find({
      hospital,
      department,
      status: "waiting"
    }).sort({ token: 1 });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All patients
app.get("/patients", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin next patient
app.post("/next-patient", async (req, res) => {
  try {
    const { hospital, department } = req.body;

    const nextPatient = await Patient.findOne({
      hospital,
      department,
      status: "waiting"
    }).sort({ token: 1 });

    if (!nextPatient) {
      return res.json({ message: "No patients waiting" });
    }

    nextPatient.status = "completed";
    await nextPatient.save();

    res.json({
      message: "Next patient completed",
      patient: nextPatient
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patient queue status
app.get("/queue-status", async (req, res) => {
  try {
    const { hospital, department, token } = req.query;

    const patient = await Patient.findOne({
      hospital,
      department,
      token: Number(token)
    });

    if (!patient) {
      return res.json({
        currentToken: "No queue",
        yourToken: Number(token),
        patientsAhead: 0,
        estimatedWait: 0,
        status: "not found"
      });
    }

    if (patient.status === "completed") {
      return res.json({
        currentToken: "Completed",
        yourToken: Number(token),
        patientsAhead: 0,
        estimatedWait: 0,
        status: "completed"
      });
    }

    const waitingBefore = await Patient.countDocuments({
      hospital,
      department,
      status: "waiting",
      token: { $lt: Number(token) }
    });

    const currentPatient = await Patient.findOne({
      hospital,
      department,
      status: "waiting"
    }).sort({ token: 1 });

    res.json({
      currentToken: currentPatient ? currentPatient.token : "No queue",
      yourToken: Number(token),
      patientsAhead: waitingBefore,
      estimatedWait: waitingBefore * 10,
      status: "waiting"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hospital dashboard department-wise patients
app.get("/hospital-dashboard", async (req, res) => {
  try {
    const { hospital } = req.query;

    const departments = [
      "General Medicine",
      "ENT",
      "Orthopedic",
      "Cardiology"
    ];

    const dashboard = [];

    for (let dept of departments) {
      const patients = await Patient.find({
        hospital,
        department: dept,
        status: "waiting"
      }).sort({ token: 1 });

      const currentPatient = patients.length > 0 ? patients[0] : null;

      dashboard.push({
        department: dept,
        currentToken: currentPatient ? currentPatient.token : "No queue",
        currentPatientName: currentPatient ? currentPatient.name : "-",
        totalPatients: patients.length,
        estimatedWait: patients.length > 0 ? (patients.length - 1) * 10 : 0,
        patients
      });
    }

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});