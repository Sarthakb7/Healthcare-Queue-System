const API = "http://localhost:5000";

let loggedInPatient = {};
let selectedHospital = "";
let registeredToken = null;
let selectedDepartment = "";

const hospitals = [
  "KMC Hospital",
  "A.J Hospital",
  "Yenepoya Hospital",
  "Father Muller Hospital",
  "City Clinic",
  "Unity Hospital"
];

function showLogin() {
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function showSignup() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";
}

async function signupPatient() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const mobile = document.getElementById("signupMobile").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!name || !email || !mobile || !password || !confirmPassword) {
    alert("Please fill all details");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, mobile, password })
  });

  const data = await res.json();
  alert(data.message);

  if (data.message === "Signup successful") {
    showLogin();
  }
}

async function loginPatient() {
  const emailOrMobile = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!emailOrMobile || !password) {
    alert("Please enter email/mobile and password");
    return;
  }

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ emailOrMobile, password })
  });

  const data = await res.json();

  if (data.message !== "Login successful") {
    alert("Invalid login details");
    return;
  }

  loggedInPatient = data.user;

  document.getElementById("authPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  document.getElementById("patientName").value = data.user.name;
  document.getElementById("mobile").value = data.user.mobile;

  displayHospitals(hospitals);
}

function openEmergency() {
  document.getElementById("authPage").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("emergencyPage").style.display = "block";
}

function backToAuth() {
  document.getElementById("emergencyPage").style.display = "none";
  document.getElementById("authPage").style.display = "flex";
}

function displayHospitals(list) {
  const hospitalList = document.getElementById("hospitalList");
  hospitalList.innerHTML = "";

  list.forEach(hospital => {
    const div = document.createElement("div");
    div.className = "hospital-card";
    div.innerHTML = `
      <h3>${hospital}</h3>
      <button onclick="selectHospital('${hospital}')">Select Hospital</button>
    `;
    hospitalList.appendChild(div);
  });
}

function searchHospitals() {
  const search = document.getElementById("searchHospital").value.toLowerCase();

  const filtered = hospitals.filter(hospital =>
    hospital.toLowerCase().includes(search)
  );

  displayHospitals(filtered);
}

function selectHospital(hospital) {
  selectedHospital = hospital;

  document.getElementById("hospitalList").style.display = "none";
  document.getElementById("searchHospital").style.display = "none";
  document.getElementById("hospitalHeading").style.display = "none";

  document.getElementById("registerBox").style.display = "block";
  document.getElementById("selectedHospitalName").innerText =
    `Register at ${hospital}`;

  loadHospitalDashboard();
}

function backToHospitals() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("queueResult").innerHTML = "";

  document.getElementById("hospitalList").style.display = "block";
  document.getElementById("searchHospital").style.display = "block";
  document.getElementById("hospitalHeading").style.display = "block";
}

async function loadHospitalDashboard() {
  if (!selectedHospital) return;

  const res = await fetch(
    `${API}/hospital-dashboard?hospital=${selectedHospital}`
  );

  const data = await res.json();

  const box = document.getElementById("hospitalDashboard");
  box.innerHTML = "";

  data.forEach(dept => {
    let patientRows = "";

    if (dept.patients.length === 0) {
      patientRows = `<p>No patients waiting</p>`;
    } else {
      dept.patients.forEach(patient => {
        patientRows += `
          <div class="queue-patient">
            <p><b>Token:</b> ${patient.token}</p>
            <p><b>Name:</b> ${patient.name}</p>
            <p><b>Age:</b> ${patient.age}</p>
            <p><b>Mobile:</b> ${patient.mobile}</p>
          </div>
        `;
      });
    }

    box.innerHTML += `
      <div class="department-block">
        <h3>${dept.department}</h3>
        ${patientRows}
      </div>
    `;
  });
}

async function registerPatient() {
  const name = document.getElementById("patientName").value;
  const age = document.getElementById("age").value;
  const mobile = document.getElementById("mobile").value;
  const department = document.getElementById("department").value;

  if (!name || !age || !mobile || !department || !selectedHospital) {
    alert("Please fill all registration details");
    return;
  }

  selectedDepartment = department;

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      age,
      mobile,
      hospital: selectedHospital,
      department
    })
  });

  const data = await res.json();

  if (!data.patient) {
    alert("Registration failed");
    return;
  }

  registeredToken = data.patient.token;

  loadQueueStatus();
  loadHospitalDashboard();
}

async function loadQueueStatus() {
  if (!registeredToken) return;

  const res = await fetch(
    `${API}/queue-status?hospital=${selectedHospital}&department=${selectedDepartment}&token=${registeredToken}`
  );

  const data = await res.json();

  if (data.status === "completed") {
    document.getElementById("queueResult").innerHTML = `
      <h2>Your turn is completed ✅</h2>
      <p>Your Token: ${registeredToken}</p>
      <p>Hospital: ${selectedHospital}</p>
      <p>Department: ${selectedDepartment}</p>
    `;
    return;
  }

  document.getElementById("queueResult").innerHTML = `
    <h2>Registration Successful ✅</h2>
    <p>Your Token: ${registeredToken}</p>
    <p>Hospital: ${selectedHospital}</p>
    <p>Department: ${selectedDepartment}</p>

    <h3>Queue Status</h3>
    <p>Current Token: ${data.currentToken}</p>
    <p>Patients Ahead: ${data.patientsAhead}</p>
    <p>Estimated Wait: ${data.estimatedWait} minutes</p>
  `;
}

setInterval(() => {
  if (registeredToken) {
    loadQueueStatus();
  }

  if (selectedHospital) {
    loadHospitalDashboard();
  }
}, 5000);