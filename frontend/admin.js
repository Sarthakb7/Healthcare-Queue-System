const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  hospital: String,
  username: String,
  password: String
});

module.exports = mongoose.model("Admin", adminSchema);

const API = "http://localhost:5000";

async function loadQueue() {
  const hospital = document.getElementById("hospital").value;
  const department = document.getElementById("department").value;
    
  const res = await fetch(
    `http://localhost:5000/queue?hospital=${hospital}&department=${department}`
  );

  const patients = await res.json();

  const queueList = document.getElementById("queueList");
  queueList.innerHTML = "";

  if (patients.length === 0) {
    queueList.innerHTML = "<h3>No patients waiting</h3>";
    return;
  }

  patients.forEach((p, index) => {
    queueList.innerHTML += `
      <div class="patient-card">
        <h3>${index === 0 ? "🔔 CURRENT PATIENT" : "Waiting Patient"}</h3>
        <p><b>Token:</b> ${p.token}</p>
        <p><b>Name:</b> ${p.name}</p>
        <p><b>Department:</b> ${p.department}</p>
      </div>
    `;
  });
}

async function nextPatient() {
  const hospital = document.getElementById("hospital").value;
  const department = document.getElementById("department").value;

  const res = await fetch("http://localhost:5000/next-patient", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hospital, department })
  });

  const data = await res.json();

  alert(data.message);

  // 🔥 Reload queue immediately
  await loadQueue();
}