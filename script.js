/* ============================================================
   Platform A.L.A.G.A. — Main Script
   Mandaue City Health Services
   ============================================================ */

/* ---------------- CONSTANTS ---------------- */

const SMS_API_KEY = "1697|2hlOHLNmvN7dFRrAynP2pIlzddhrrYbGqJ9M986L1e6978ed";
const DEMO_OTP    = "123456";

const SMS_TEMPLATES = {
  vaccination: "ALAGA ALERT: Free COVID-19 vaccination on [DATE] at [LOCATION]. Bring valid ID. Slots limited. For info: 0917-XXX-XXXX",
  medicine:    "ALAGA ALERT: Free medicine distribution for seniors & PWDs on [DATE] at [LOCATION]. Bring ID & senior citizen card.",
  reminder:    "REMINDER: You have a health appointment on [DATE] at [LOCATION]. Please arrive on time. Contact us: 0917-XXX-XXXX",
  emergency:   "URGENT ALERT: Important health advisory for [BARANGAY]. Please check with your barangay health center immediately."
};

/* ---------------- IN-MEMORY DATA ---------------- */

let residents = [
  { id: 1, name: "Maria Santos",   phone: "09171234567", barangay: "Centro",  registered: "2026-01-10" },
  { id: 2, name: "Juan Dela Cruz", phone: "09281234568", barangay: "Bakilid", registered: "2026-01-11" }
];

let schedules = [
  {
    id: 1, title: "COVID-19 Booster Vaccination", type: "vaccination",
    barangay: "Centro", date: "2026-01-15", time: "09:00 AM - 04:00 PM",
    location: "Centro Barangay Hall", slots: 150, slotsUsed: 45,
    description: "Free COVID-19 booster shots available for all residents 18 years and above."
  },
  {
    id: 2, title: "Free Medicine Distribution", type: "medicine",
    barangay: "Bakilid", date: "2026-01-18", time: "08:00 AM - 12:00 PM",
    location: "Bakilid Health Center", slots: 200, slotsUsed: 78,
    description: "Free maintenance medicines for senior citizens and PWDs."
  }
];

let notifications = [
  {
    id: 1,
    message: "COVID-19 Booster Vaccination scheduled for January 15 at Centro Barangay Hall",
    barangay: "Centro", sent: "2026-01-12 10:30 AM", recipients: 1
  }
];

let supplies = [
  { name: "Paracetamol",      stock: 120 },
  { name: "Vitamin C",        stock: 80  },
  { name: "ORS Packs",        stock: 50  },
  { name: "Dengue Test Kits", stock: 12  }
];

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

/** Show a toast notification instead of alert() where appropriate */
function showToast(msg, type = "success") {
  let toast = document.getElementById("toastNotification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotification";
    document.body.appendChild(toast);
  }
  toast.textContent  = msg;
  toast.className    = "toast toast-" + type + " toast-visible";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = "toast"; }, 3500);
}

/** Set a button to loading state */
function setButtonLoading(btn, loading, originalText) {
  if (!btn) return;
  if (loading) {
    btn.disabled      = true;
    btn.dataset.orig  = btn.textContent;
    btn.innerHTML     = '<span class="spinner"></span> Please wait…';
  } else {
    btn.disabled     = false;
    btn.textContent  = originalText || btn.dataset.orig || "Submit";
  }
}

/** Safe getElementById wrapper */
function el(id) { return document.getElementById(id); }

/** Hide every top-level page/section and then show one */
function showPage(id) {
  ["landingPage","residentRegistration","residentLogin","residentDashboard","dashboard"]
    .forEach(p => { const e = el(p); if (e) e.classList.add("hidden"); });
  const target = el(id);
  if (target) target.classList.remove("hidden");
}

/* ============================================================
   FIREBASE HELPERS
   ============================================================ */

async function fsImport() {
  const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  return mod;
}

async function dbCollection(name) {
  const { collection } = await fsImport();
  return collection(window.db, name);
}

/* ============================================================
   LANDING-PAGE COUNTERS
   ============================================================ */

function updateCounts() {
  const safe = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  safe("residentCount",      residents.length);
  safe("scheduleCount",      schedules.length);
  safe("notificationCount",  notifications.length);
  safe("dashResidentCount",  residents.length);
  safe("dashScheduleCount",  schedules.length);
  safe("dashNotificationCount", notifications.length);
  safe("statResidents",      residents.length);
  safe("statPrograms",       schedules.length);
  safe("statAlerts",         notifications.length);
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function showResidentRegistration() { showPage("residentRegistration"); }

function backToHome() {
  // Also handle residentLogin back
  showPage("landingPage");
}

function showResidentLogin() { showPage("residentLogin"); }

function showLogin() {
  const m = el("loginModal");
  if (m) {
    m.classList.remove("hidden");
    // Reset modal to first step
    el("loginForm") && el("loginForm").classList.remove("hidden");
    el("otpForm")   && el("otpForm").classList.add("hidden");
    el("loginPhone")    && (el("loginPhone").value    = "");
    el("loginPassword") && (el("loginPassword").value = "");
    el("otpCode")       && (el("otpCode").value       = "");
  }
}

function closeLogin() {
  const m = el("loginModal");
  if (m) m.classList.add("hidden");
}

function logout() {
  showPage("landingPage");
}

function logoutResident() {
  localStorage.removeItem("residentBarangay");
  localStorage.removeItem("residentName");
  showPage("landingPage");
}

/* ============================================================
   HEALTH WORKER LOGIN  (OTP flow)
   ============================================================ */

function sendOTP() {
  const phone    = (el("loginPhone")?.value    || "").trim();
  const password = (el("loginPassword")?.value || "").trim();

  if (!phone || !password) {
    showToast("Please enter your phone number and password.", "error");
    return;
  }

  // Basic phone validation
  if (!/^(09|\+639)\d{9}$/.test(phone)) {
    showToast("Enter a valid Philippine mobile number (e.g. 09171234567).", "error");
    return;
  }

  // In production: call your backend to send a real OTP via PhilSMS
  // For demo we just advance the step
  el("loginForm").classList.add("hidden");
  el("otpForm").classList.remove("hidden");
  showToast("OTP sent! (Demo OTP: " + DEMO_OTP + ")", "info");
}

function backToLogin() {
  el("loginForm").classList.remove("hidden");
  el("otpForm").classList.add("hidden");
}

function verifyOTP() {
  const otp = (el("otpCode")?.value || "").trim();

  if (!otp) {
    showToast("Please enter the OTP code.", "error");
    return;
  }

  if (otp !== DEMO_OTP) {
    showToast("Invalid OTP. For demo, use: " + DEMO_OTP, "error");
    el("otpCode").value = "";
    el("otpCode").focus();
    return;
  }

  closeLogin();
  showPage("dashboard");
  renderDashboard();
  updateRecipientCount();
  loadResidents();
}

/* ============================================================
   RESIDENT LOGIN
   ============================================================ */

async function loginResident() {
  const phone    = (el("loginResidentPhone")?.value    || "").trim();
  const password = (el("loginResidentPassword")?.value || "").trim();

  if (!phone) { showToast("Enter your phone number.", "error"); return; }
  if (!password) { showToast("Enter your password.", "error"); return; }

  const btn = el("loginResidentBtn");
  setButtonLoading(btn, true);

  try {
    const { getDocs, collection } = await fsImport();
    const snapshot = await getDocs(collection(window.db, "residents"));

    let found = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.phone === phone && data.password === password) {
        found = { id: doc.id, ...data };
      }
    });

    if (!found) {
      showToast("Phone number or password is incorrect.", "error");
      return;
    }

    localStorage.setItem("residentBarangay", found.barangay);
    localStorage.setItem("residentName",     found.name || "Resident");

    showPage("residentDashboard");
    loadResidentData();

  } catch (err) {
    console.error("Resident login error:", err);
    showToast("Login failed. Please check your connection and try again.", "error");
  } finally {
    setButtonLoading(btn, false, "Login");
  }
}

/* ============================================================
   RESIDENT REGISTRATION
   ============================================================ */

async function registerResident() {
  const name     = (el("residentName")?.value     || "").trim();
  const phone    = (el("residentPhone")?.value    || "").trim();
  const password = (el("residentPassword")?.value || "").trim();
  const barangay = el("residentBarangay")?.value  || "";
  const address  = (el("residentAddress")?.value  || "").trim();

  // Validation
  if (!name || !phone || !barangay) {
    showToast("Please fill in all required fields.", "error");
    return;
  }
  if (!/^(09|\+639)\d{9}$/.test(phone)) {
    showToast("Enter a valid Philippine mobile number (e.g. 09171234567).", "error");
    return;
  }
  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", "error");
    return;
  }

  // Check duplicate phone in local array
  if (residents.some(r => r.phone === phone)) {
    showToast("This phone number is already registered.", "error");
    return;
  }

  const btn = el("registerBtn");
  setButtonLoading(btn, true);

  try {
    const { addDoc, collection } = await fsImport();

    const docRef = await addDoc(collection(window.db, "residents"), {
      name:       name,
      phone:      phone,
      password:   password,
      barangay:   barangay,
      address:    address,
      vaccine:    "Not Recorded",
      registered: new Date().toISOString().split("T")[0]
    });

    const newResident = {
      id:         docRef.id,
      name:       name,
      phone:      phone,
      barangay:   barangay,
      registered: new Date().toISOString().split("T")[0]
    };
    residents.push(newResident);

    localStorage.setItem("residentBarangay", barangay);
    localStorage.setItem("residentName",     name);

    // Clear fields
    ["residentName","residentPhone","residentPassword","residentAddress"].forEach(id => {
      if (el(id)) el(id).value = "";
    });
    if (el("residentBarangay")) el("residentBarangay").value = "";

    updateCounts();
    showToast("Registration complete! Welcome, " + name + "!", "success");

    showPage("residentDashboard");
    loadResidentData();

  } catch (err) {
    console.error("Registration error:", err);
    showToast("Registration failed. Please check your connection.", "error");
  } finally {
    setButtonLoading(btn, false, "Register Now");
  }
}

/* ============================================================
   RESIDENT DASHBOARD
   ============================================================ */

function loadResidentData() {
  const barangay = localStorage.getItem("residentBarangay") || "";
  const name     = localStorage.getItem("residentName")     || "Resident";

  const lbl = el("residentBarangayLabel");
  if (lbl) lbl.textContent = barangay;

  const nameLbl = el("residentNameLabel");
  if (nameLbl) nameLbl.textContent = name;

  loadResidentAnnouncements();
  loadResidentPrograms();
  loadResidentNotifications();
  loadSuppliesForResident();
  updateCounts();
}

async function loadResidentAnnouncements() {
  const barangay  = localStorage.getItem("residentBarangay") || "";
  const container = el("residentAnnouncements");
  if (!container) return;
  container.innerHTML = '<p class="text-gray-400 text-sm">Loading…</p>';

  try {
    const { getDocs, collection } = await fsImport();
    const snapshot = await getDocs(collection(window.db, "announcements"));

    let html = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.barangay === "" || d.barangay === barangay) {
        html += `
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded shadow animate-slide-in">
            <h4 class="font-bold text-blue-800">${escHtml(d.title)}</h4>
            <p class="text-gray-700 mt-1">${escHtml(d.message)}</p>
            <p class="text-xs text-gray-500 mt-2">${escHtml(d.date)}</p>
          </div>`;
      }
    });

    container.innerHTML = html || '<p class="text-gray-400 text-sm">No announcements yet.</p>';
  } catch (err) {
    console.error("Announcements load error:", err);
    container.innerHTML = '<p class="text-red-400 text-sm">Failed to load announcements.</p>';
  }
}

function loadResidentPrograms() {
  const barangay  = localStorage.getItem("residentBarangay") || "";
  const container = el("residentPrograms");
  if (!container) return;

  const filtered = schedules.filter(s => s.barangay === barangay);

  if (!filtered.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm">No upcoming programs for your barangay.</p>';
    return;
  }

  container.innerHTML = filtered.map(s => {
    const pct = Math.round((s.slotsUsed / s.slots) * 100);
    return `
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-green-600 animate-slide-in">
        <h4 class="font-bold">${escHtml(s.title)}</h4>
        <p class="text-sm text-gray-600">📍 ${escHtml(s.location)}</p>
        <p class="text-sm text-gray-600">📅 ${escHtml(s.date)} | ${escHtml(s.time)}</p>
        <div class="w-full bg-gray-200 rounded h-2 mt-2">
          <div class="bg-green-600 h-2 rounded transition-all" style="width:${pct}%"></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">${s.slotsUsed}/${s.slots} slots filled</p>
      </div>`;
  }).join("");
}

function loadResidentNotifications() {
  const barangay  = localStorage.getItem("residentBarangay") || "";
  const container = el("residentNotifications");
  if (!container) return;

  const filtered = notifications.filter(n => n.barangay === barangay || n.barangay === "All Barangays");

  if (!filtered.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm">No notifications yet.</p>';
    return;
  }

  container.innerHTML = filtered.map(n => `
    <div class="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded animate-slide-in">
      <p class="font-semibold">${escHtml(n.message)}</p>
      <p class="text-sm text-gray-600">📍 ${escHtml(n.barangay)} • ${escHtml(n.sent)}</p>
    </div>`).join("");
}

function loadSuppliesForResident() {
  const container = el("residentSupplies");
  if (!container) return;

  if (!supplies.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm">No supplies listed.</p>';
    return;
  }

  container.innerHTML = supplies.map(s => `
    <div class="flex justify-between border-b py-2">
      <span>${escHtml(s.name)}</span>
      <span class="font-semibold text-green-600">${s.stock}</span>
    </div>`).join("");
}

/* ============================================================
   HEALTH WORKER DASHBOARD TABS
   ============================================================ */

function showTab(tabName) {
  document.querySelectorAll('[id$="Tab"]').forEach(tab => tab.classList.add("hidden"));

  document.querySelectorAll('[id^="tab"]').forEach(btn => {
    btn.classList.remove("border-blue-600", "text-blue-600", "border-b-2");
    btn.classList.add("text-gray-600");
  });

  const tabEl = el(tabName + "Tab");
  if (tabEl) tabEl.classList.remove("hidden");

  const btnId = "tab" + tabName.charAt(0).toUpperCase() + tabName.slice(1);
  const btn   = el(btnId);
  if (btn) {
    btn.classList.add("border-blue-600", "text-blue-600", "border-b-2");
    btn.classList.remove("text-gray-600");
  }

  if (tabName === "schedules")     renderSchedules();
  if (tabName === "residents")     renderResidents();
  if (tabName === "notifications") renderNotifications();
  if (tabName === "sms")           updateRecipientCount();
  if (tabName === "supplies")      renderMedicineList();
}

/* ============================================================
   DASHBOARD RENDER
   ============================================================ */

function renderDashboard() {
  const div = el("upcomingPrograms");
  if (!div) return;

  if (!schedules.length) {
    div.innerHTML = '<p class="text-gray-400 text-sm">No upcoming programs.</p>';
    return;
  }

  div.innerHTML = schedules.map(s => `
    <div class="border-l-4 border-blue-600 pl-4 py-2 animate-slide-in">
      <div class="font-semibold">${escHtml(s.title)}</div>
      <div class="text-sm text-gray-600">${escHtml(s.barangay)} — ${escHtml(s.date)} — ${escHtml(s.time)}</div>
      <div class="text-sm text-gray-500 mt-1">Slots: ${s.slotsUsed}/${s.slots}</div>
    </div>`).join("");
}

function renderSchedules() {
  const div = el("schedulesList");
  if (!div) return;

  if (!schedules.length) {
    div.innerHTML = '<p class="text-gray-400 text-sm">No schedules added yet.</p>';
    return;
  }

  div.innerHTML = schedules.map(s => {
    const typeClass = s.type === "vaccination" ? "bg-blue-100 text-blue-700" :
                      s.type === "medicine"    ? "bg-green-100 text-green-700" :
                                                 "bg-purple-100 text-purple-700";
    const pct = Math.round((s.slotsUsed / s.slots) * 100);
    return `
      <div class="bg-white p-6 rounded-lg shadow animate-slide-in">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-xl font-bold">${escHtml(s.title)}</h3>
              <span class="px-2 py-1 text-xs rounded-full ${typeClass}">${s.type.replace("_"," ")}</span>
            </div>
            <p class="text-gray-600 mb-3">${escHtml(s.description)}</p>
            <div class="grid sm:grid-cols-2 gap-2 text-sm">
              <div>📍 ${escHtml(s.barangay)}</div>
              <div>📅 ${escHtml(s.date)}</div>
              <div>📦 ${escHtml(s.location)}</div>
              <div>👥 ${s.slotsUsed}/${s.slots} slots</div>
            </div>
          </div>
          <button onclick="deleteSchedule(${s.id})" class="text-red-600 hover:text-red-700 p-2" title="Delete">🗑️</button>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div class="bg-blue-600 h-2 rounded-full transition-all" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

function renderResidents() {
  const tbody = el("residentsTableBody");
  if (!tbody) return;

  if (!residents.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-400">No residents registered yet.</td></tr>';
    return;
  }

  tbody.innerHTML = residents.map(r => `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-4">${escHtml(r.name)}</td>
      <td class="px-6 py-4">${escHtml(r.phone)}</td>
      <td class="px-6 py-4">${escHtml(r.barangay)}</td>
      <td class="px-6 py-4">${escHtml(r.registered)}</td>
    </tr>`).join("");
}

function renderNotifications() {
  const div = el("notificationsList");
  if (!div) return;

  if (!notifications.length) {
    div.innerHTML = '<p class="text-gray-400 text-sm">No notifications sent yet.</p>';
    return;
  }

  div.innerHTML = notifications.map(n => `
    <div class="bg-white p-6 rounded-lg shadow animate-slide-in">
      <div class="flex items-start gap-3">
        <div class="text-blue-600 mt-1">📤</div>
        <div class="flex-1">
          <p class="font-medium">${escHtml(n.message)}</p>
          <div class="text-sm text-gray-600 mt-2">Sent to ${n.recipients} resident(s) in ${escHtml(n.barangay)}</div>
          <div class="text-xs text-gray-500 mt-1">${escHtml(n.sent)}</div>
        </div>
      </div>
    </div>`).join("");
}

/* ============================================================
   SCHEDULES CRUD
   ============================================================ */

function addSchedule() {
  const title       = (el("newTitle")?.value       || "").trim();
  const type        =  el("newType")?.value        || "vaccination";
  const barangay    =  el("newBarangay")?.value    || "";
  const date        =  el("newDate")?.value        || "";
  const time        = (el("newTime")?.value        || "").trim();
  const location    = (el("newLocation")?.value    || "").trim();
  const slots       = parseInt(el("newSlots")?.value)  || 100;
  const description = (el("newDescription")?.value || "").trim();
  const sendSms     =  el("sendSmsOnCreate")?.checked;

  if (!title || !barangay || !date) {
    showToast("Please fill in Title, Barangay, and Date.", "error");
    return;
  }

  const schedule = {
    id: schedules.length + 1,
    title, type, barangay, date, time, location,
    slots, slotsUsed: 0, description
  };
  schedules.push(schedule);

  if (sendSms) {
    const msg = `ALAGA: ${title} on ${date} at ${location}. ${description}`;
    const targetResidents = residents.filter(r => r.barangay === barangay);
    targetResidents.forEach(r => sendRealSMS(r.phone, msg));

    notifications.push({
      id:         notifications.length + 1,
      message:    `${title} scheduled for ${date} at ${location}. ${description}`,
      barangay:   barangay,
      sent:       new Date().toLocaleString(),
      recipients: targetResidents.length
    });
  }

  // Clear fields
  ["newTitle","newDate","newTime","newLocation","newSlots","newDescription"].forEach(id => {
    if (el(id)) el(id).value = "";
  });
  if (el("newType"))     el("newType").value     = "vaccination";
  if (el("newBarangay")) el("newBarangay").value = "";

  updateCounts();
  showToast(sendSms ? "Schedule added and SMS sent to residents!" : "Schedule added successfully!", "success");
  showTab("overview");
  renderDashboard();
}

function deleteSchedule(id) {
  if (!confirm("Are you sure you want to delete this schedule?")) return;
  schedules = schedules.filter(s => s.id !== id);
  updateCounts();
  renderSchedules();
  renderDashboard();
  showToast("Schedule deleted.", "info");
}

/* ============================================================
   MEDICINE / SUPPLIES
   ============================================================ */

function addMedicine() {
  const name  = (el("medName")?.value  || "").trim();
  const stock = parseInt(el("medStock")?.value) || 0;

  if (!name || stock <= 0) {
    showToast("Enter a valid medicine name and stock quantity.", "error");
    return;
  }

  const existing = supplies.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.stock += stock;
    showToast(`Updated ${name} stock to ${existing.stock}.`, "info");
  } else {
    supplies.push({ name, stock });
    showToast(`${name} added to inventory.`, "success");
  }

  if (el("medName"))  el("medName").value  = "";
  if (el("medStock")) el("medStock").value = "";

  renderMedicineList();
}

function renderMedicineList() {
  const container = el("medicineList");
  if (!container) return;

  if (!supplies.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm">No medicines in inventory.</p>';
    return;
  }

  container.innerHTML = supplies.map((s, i) => `
    <div class="flex justify-between items-center border-b py-2 animate-slide-in">
      <span class="font-medium">${escHtml(s.name)}</span>
      <div class="flex items-center gap-3">
        <span class="font-semibold ${s.stock < 20 ? "text-red-500" : "text-green-600"}">${s.stock} units</span>
        <button onclick="deleteMedicine(${i})" class="text-red-400 hover:text-red-600 text-xs" title="Remove">✕</button>
      </div>
    </div>`).join("");
}

function deleteMedicine(index) {
  if (!confirm("Remove this medicine from inventory?")) return;
  const removed = supplies.splice(index, 1)[0];
  renderMedicineList();
  loadSuppliesForResident();
  showToast(`${removed.name} removed from inventory.`, "info");
}

/* ============================================================
   ANNOUNCEMENTS
   ============================================================ */

async function postAnnouncement() {
  const title    = (el("annTitle")?.value   || "").trim();
  const message  = (el("annMessage")?.value || "").trim();
  const barangay =  el("annBarangay")?.value || "";

  if (!title || !message) {
    showToast("Please fill in both Title and Message.", "error");
    return;
  }

  const btn = el("postAnnBtn");
  setButtonLoading(btn, true);

  try {
    const { addDoc, collection } = await fsImport();
    await addDoc(collection(window.db, "announcements"), {
      title, message, barangay,
      date: new Date().toLocaleString()
    });

    showToast("Announcement posted successfully!", "success");
    if (el("annTitle"))   el("annTitle").value   = "";
    if (el("annMessage")) el("annMessage").value = "";
    if (el("annBarangay")) el("annBarangay").value = "";

  } catch (err) {
    console.error("Announcement error:", err);
    showToast("Failed to post announcement. Check your connection.", "error");
  } finally {
    setButtonLoading(btn, false, "Post Announcement");
  }
}

/* ============================================================
   SMS — CORE API
   ============================================================ */

async function sendRealSMS(phone, message) {
  // Normalize phone: convert 09XX to +639XX for international format
  const normalized = phone.replace(/^0/, "+63");

  try {
    const response = await fetch("https://dashboard.philsms.com/api/v3/sms/send", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + SMS_API_KEY
      },
      body: JSON.stringify({
        recipient:  normalized,
        sender_id:  "PhilSMS",
        type:       "plain",
        message:    message
      })
    });

    const data = await response.json();
    console.log("SMS Response [" + phone + "]:", data);
    return data;

  } catch (err) {
    console.error("SMS send error [" + phone + "]:", err);
    return null;
  }
}

/* ============================================================
   SMS — BULK SEND FROM DASHBOARD
   ============================================================ */

async function sendSMS() {
  const barangay = el("smsBarangay")?.value  || "";
  const message  = (el("smsMessage")?.value  || "").trim();

  if (!message) {
    showToast("Please enter a message before sending.", "error");
    return;
  }

  const recipients = barangay
    ? residents.filter(r => r.barangay === barangay)
    : residents;

  if (!recipients.length) {
    showToast("No residents found for the selected barangay.", "error");
    return;
  }

  const btn = el("sendSmsBtn");
  setButtonLoading(btn, true);

  // Fire all SMS requests concurrently
  const results = await Promise.allSettled(
    recipients.map(r => sendRealSMS(r.phone, message))
  );

  const successCount = results.filter(r => r.status === "fulfilled" && r.value).length;

  // Log notification
  notifications.push({
    id:         notifications.length + 1,
    message:    message,
    barangay:   barangay || "All Barangays",
    sent:       new Date().toLocaleString(),
    recipients: recipients.length
  });

  // Reset form
  if (el("smsMessage"))  el("smsMessage").value  = "";
  if (el("smsTemplate")) el("smsTemplate").value = "";
  if (el("smsBarangay")) el("smsBarangay").value = "";
  updateCharCount();
  updateRecipientCount();
  updateCounts();

  // Show success modal
  const successMsg = el("smsSuccessMessage");
  if (successMsg) {
    successMsg.textContent =
      `Message sent to ${recipients.length} resident(s) in ${barangay || "all barangays"}.`;
  }
  const modal = el("smsSuccessModal");
  if (modal) modal.classList.remove("hidden");

  setButtonLoading(btn, false, "📤 Send SMS Now");
}

function closeSmsSuccess() {
  const modal = el("smsSuccessModal");
  if (modal) modal.classList.add("hidden");
}

/* ============================================================
   SMS — EMERGENCY BROADCAST
   ============================================================ */

async function sendEmergency() {
  if (!confirm("Send emergency health alert to ALL registered residents?")) return;

  const message = "🚨 HEALTH ALERT: Please check with your barangay health center immediately.";

  const btn = el("emergencyBtn");
  setButtonLoading(btn, true);

  await Promise.allSettled(residents.map(r => sendRealSMS(r.phone, message)));

  notifications.push({
    id:         notifications.length + 1,
    message:    message,
    barangay:   "All Barangays",
    sent:       new Date().toLocaleString(),
    recipients: residents.length
  });

  updateCounts();
  setButtonLoading(btn, false, "🚨 Emergency Alert");
  showToast("Emergency alert sent to all " + residents.length + " residents.", "success");
}

/* ============================================================
   SMS — UI HELPERS
   ============================================================ */

function updateRecipientCount() {
  const barangay = el("smsBarangay")?.value || "";
  const count    = barangay ? residents.filter(r => r.barangay === barangay).length : residents.length;

  ["smsRecipientCount","smsRecipientCount2","selectedRecipients"].forEach(id => {
    if (el(id)) el(id).textContent = count;
  });
  if (el("smsCost"))        el("smsCost").textContent        = count;
  if (el("totalResidents")) el("totalResidents").textContent = residents.length;
  if (el("previewBarangay")) {
    el("previewBarangay").textContent = barangay || "All barangays";
  }
}

function applyTemplate() {
  const template = el("smsTemplate")?.value || "";
  if (template && SMS_TEMPLATES[template]) {
    if (el("smsMessage")) el("smsMessage").value = SMS_TEMPLATES[template];
    updateCharCount();
    updatePreview();
  }
}

function updateCharCount() {
  const message = el("smsMessage")?.value || "";
  const len      = message.length;
  const smsCount = Math.ceil(len / 160) || 1;

  if (el("charCount")) el("charCount").textContent = len + "/160 characters";
  if (el("smsCount"))  el("smsCount").textContent  = smsCount + " SMS";

  updatePreview();
}

function updatePreview() {
  const message = el("smsMessage")?.value || "";
  const preview = el("smsPreview");
  if (!preview) return;

  preview.innerHTML = message.trim()
    ? `<p class="text-sm whitespace-pre-wrap">${escHtml(message)}</p>`
    : `<p class="text-sm text-gray-400">Your message will appear here…</p>`;
}

/* ============================================================
   LOAD RESIDENTS FROM FIREBASE (Health Worker Dashboard)
   ============================================================ */

async function loadResidents() {
  try {
    const { getDocs, collection } = await fsImport();
    const snapshot = await getDocs(collection(window.db, "residents"));

    residents = [];
    snapshot.forEach(doc => {
      residents.push({ id: doc.id, ...doc.data() });
    });

    renderResidents();
    updateCounts();
    updateRecipientCount();

  } catch (err) {
    console.error("loadResidents error:", err);
    showToast("Could not load residents from database.", "error");
  }
}

/* ============================================================
   XSS PROTECTION — escape HTML before inserting into DOM
   ============================================================ */

function escHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/* ============================================================
   INITIALISATION — runs when the page DOM is ready
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // Set up SMS barangay change listener
  const smsBarangayEl = el("smsBarangay");
  if (smsBarangayEl) smsBarangayEl.addEventListener("change", updateRecipientCount);

  // Set up SMS message live preview + char count
  const smsMessageEl = el("smsMessage");
  if (smsMessageEl) {
    smsMessageEl.addEventListener("input", updateCharCount);
  }

  // Auto-login resident if session exists
  const savedBarangay = localStorage.getItem("residentBarangay");
  if (savedBarangay) {
    showPage("residentDashboard");
    loadResidentData();
  }

  // Initialize landing-page counters
  updateCounts();
  renderMedicineList();
});