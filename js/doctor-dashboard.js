// ===============================
// DOCTOR DASHBOARD (SPRING BOOT + JWT READY)
// ===============================

// ===== GLOBAL STATE =====
let doctorId = null;
let doctorProfile = {};
let availabilityData = {
    startTime: null,
    endTime: null,
    slotDuration: 60,
    days: []
};

//PAGINATION STATE (FIXED)
let requestsPage = 0;
let upcomingPage = 0;

const REQUESTS_PAGE_SIZE = 3;
const UPCOMING_PAGE_SIZE = 5;

// ===== DOM =====
const docNameInput = document.getElementById("docName");
const specializationInput = document.getElementById("specialization");
const experienceInput = document.getElementById("experience");
const locationInput = document.getElementById("location");
const feesInput = document.getElementById("fees");

const profileProgressBar = document.getElementById("profileProgress");
const progressText = document.getElementById("progressText");
const listingToggle = document.getElementById("listingToggle");
const listingStatus = document.getElementById("listingStatus");

const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const availableDaysTextarea = document.getElementById("availableDays");
const slotDurationSelect = document.getElementById("slotDuration");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const saveAvailabilityBtn = document.getElementById("saveAvailabilityBtn");

const doctorChip = document.getElementById("doctorChip");
const todayCountBadge = document.getElementById("todayCountBadge");
const requestsSection = document.getElementById("requestsSection");
const upcomingTbody = document.querySelector("#upcomingTable tbody");

// ===============================
// PAGINATION CONTROLS (MINIMAL ADD)
// ===============================
function renderPagination(data) {
    const requestsPagination = document.getElementById("requestsPagination");
    const upcomingPagination = document.getElementById("upcomingPagination");

    if (!requestsPagination || !upcomingPagination) return;

    const reqTotal = data.requestsTotalPages || 1;
    const upTotal = data.upcomingTotalPages || 1;

    requestsPagination.innerHTML = `
        <button ${requestsPage === 0 ? "disabled" : ""} onclick="changeRequestsPage(-1)">Prev</button>
        <span>Page ${requestsPage + 1} of ${reqTotal}</span>
        <button ${(requestsPage >= reqTotal - 1) ? "disabled" : ""} onclick="changeRequestsPage(1)">Next</button>
    `;

    upcomingPagination.innerHTML = `
        <button ${upcomingPage === 0 ? "disabled" : ""} onclick="changeUpcomingPage(-1)">Prev</button>
        <span>Page ${upcomingPage + 1} of ${upTotal}</span>
        <button ${(upcomingPage >= upTotal - 1) ? "disabled" : ""} onclick="changeUpcomingPage(1)">Next</button>
    `;
}

function changeRequestsPage(delta) {
    requestsPage = Math.max(0, requestsPage + delta);
    loadDashboardData();
}

function changeUpcomingPage(delta) {
    upcomingPage = Math.max(0, upcomingPage + delta);
    loadDashboardData();
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    initTimePickers();
    initDayButtons();
    attachListeners();

    await loadDoctorFromBackend(); // MUST load first
    await loadDashboardData();
});

// ===============================
// HELPER: GET JWT TOKEN
// ===============================
function getAuthHeaders() {
    const token = sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

// ===============================
// LOAD DOCTOR PROFILE (FROM BACKEND)
// ===============================
async function loadDoctorFromBackend() {
    try {
        // ===== API: GET /dashboard/me =====
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/me`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            throw new Error("Unauthorized or /me endpoint not ready");
        }

        const data = await res.json();

        doctorId = data.id;
        doctorProfile = data;

        // Header chip
        doctorChip.textContent = `👨‍⚕️ Dr. ${data.name || "Doctor"}`;

        // Populate Profile (MATCHES ENTITY FIELDS)
        docNameInput.value = data.name || "";
        specializationInput.value = data.specialization || "";
        experienceInput.value = data.yearOfExp || "";
        locationInput.value = data.location || "";
        feesInput.value = data.fees || "";

        // Populate Availability
        if (data.availableTime) {
            const parts = data.availableTime.split(" - ");
            availabilityData.startTime = parts[0] || null;
            availabilityData.endTime = parts[1] || null;
            startTimeInput.value = parts[0] || "";
            endTimeInput.value = parts[1] || "";
        }

        if (data.availableDays) {
            availabilityData.days = data.availableDays.split(",").map(d => d.trim());
        }

        // Restore selected buttons visually
        document.querySelectorAll(".day-btn").forEach(btn => {
            const day = btn.dataset.day;
            btn.classList.toggle(
                "selected",
                availabilityData.days.includes(day)
            );
        });

        if (data.slotDuration) {
            availabilityData.slotDuration = data.slotDuration;
            slotDurationSelect.value = data.slotDuration;
        }

        // Restore listing toggle state from DB
        listingToggle.checked = data.listed || false;
        listingStatus.textContent = data.listed ? "LIVE" : "OFFLINE";

        updateProfileCompletion();

    } catch (e) {
        console.error("Error loading doctor:", e);
        // Redirect if token invalid
        window.location.href = "/Doctor-Appointment-Booking-App/frontend/myPage/HTML/login.html";
    }
}

// ===============================
// LOAD DASHBOARD DATA (REQUESTS + UPCOMING)
// ===============================
async function loadDashboardData() {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/doctor/dashboard/data?requestsPage=${requestsPage}&upcomingPage=${upcomingPage}&requestsSize=${REQUESTS_PAGE_SIZE}&upcomingSize=${UPCOMING_PAGE_SIZE}`,
            {
                headers: getAuthHeaders()
            }
        );

        if (!res.ok) {
            console.error("Dashboard API failed");
            return;
        }

        const data = await res.json();
        console.log("Dashboard API Response:", data);

        renderRequests(data.requests || []);
        renderUpcoming(data.upcoming || []);
        renderPagination(data);

        todayCountBadge.textContent =
            `Today: ${data.todayCount || 0} Appointments`;

        if (data.doctor) {
            populateProfile(data.doctor);
        }

    } catch (e) {
        console.error("Dashboard load error:", e);
    }
}


// ===============================
// TIME PICKERS (SPRING FORMAT SAFE)
// ===============================
function formatToBackendTime(timeStr) {
    if (!timeStr) return null;

    const [time, period] = timeStr.split(" ");
    if (!time || !period) return timeStr;

    let [hour, minute] = time.split(":");

    // Force leading zero for Java LocalTime parser (hh:mm a)
    hour = hour.padStart(2, "0");

    return `${hour}:${minute} ${period.toUpperCase()}`;
}

function initTimePickers() {
    flatpickr(startTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K", // correct flatpickr format
        onChange: (_, time) => {
            const formatted = formatToBackendTime(time);
            availabilityData.startTime = formatted;
            startTimeInput.value = formatted; // keep UI + payload consistent
            updateProfileCompletion();
        }
    });

    flatpickr(endTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K", // correct format
        onChange: (_, time) => {
            const formatted = formatToBackendTime(time);
            availabilityData.endTime = formatted;
            endTimeInput.value = formatted;
            updateProfileCompletion();
        }
    });
}


// ===============================
// DAY BUTTONS
// ===============================
function initDayButtons() {
    document.querySelectorAll(".day-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const day = btn.dataset.day;

            if (availabilityData.days.includes(day)) {
                availabilityData.days =
                    availabilityData.days.filter(d => d !== day);
                btn.classList.remove("selected");
            } else {
                availabilityData.days.push(day);
                btn.classList.add("selected");
            }

            availableDaysTextarea.value = availabilityData.days.join(", ");
            updateProfileCompletion();
        });
    });
}

// ===============================
// LISTENERS
// ===============================
function attachListeners() {
    saveProfileBtn.addEventListener("click", saveProfile);
    saveAvailabilityBtn.addEventListener("click", saveAvailability);
    listingToggle.addEventListener("change", toggleListing);

    slotDurationSelect.addEventListener("change", () => {
        availabilityData.slotDuration = parseInt(slotDurationSelect.value);
        updateProfileCompletion();
    });

    [docNameInput, specializationInput, experienceInput, locationInput, feesInput]
        .forEach(input => {
            input.addEventListener("input", updateProfileCompletion);
        });
}

// ===============================
// POPULATE PROFILE
// ===============================
function populateProfile(profile) {
    docNameInput.value = profile.name || "";
    specializationInput.value = profile.specialization || "";
    experienceInput.value = profile.yearOfExp || "";
    locationInput.value = profile.location || "";
    feesInput.value = profile.fees || "";
}

// ===============================
// SAVE PROFILE (MATCHES DTO: yearOfExp, fees)
// ===============================
async function saveProfile() {
    const payload = {
        name: docNameInput.value.trim(),
        specialization: specializationInput.value.trim(),
        yearOfExp: parseInt(experienceInput.value),
        location: locationInput.value.trim(),
        fees: parseInt(feesInput.value)
    };

    if (!payload.name || !payload.specialization ||
        !payload.yearOfExp || !payload.location || !payload.fees) {
        alert("Fill all mandatory fields");
        return;
    }

    try {
        // ===== API: PUT /dashboard/profile =====
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/profile`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Profile API not ready or failed");
        }

        alert("Profile saved successfully!");
        updateProfileCompletion();

    } catch (e) {
        console.error("Profile save failed:", e);
        alert("Profile save failed");
    }
}

// ===============================
// SAVE AVAILABILITY (MATCHES ENTITY FORMAT)
// ===============================
async function saveAvailability() {
    if (!availabilityData.startTime || !availabilityData.endTime || availabilityData.days.length === 0) {
        alert("Select time and days");
        return;
    }

    const payload = {
        availableDays: availabilityData.days.join(", "),
        availableTime: `${availabilityData.startTime} - ${availabilityData.endTime}`,
        slotDuration: availabilityData.slotDuration
    };

    try {
        // ===== API: PUT /dashboard/availability =====
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/availability`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error("Availability API not ready");
        }

        alert("Availability saved successfully!");
        updateProfileCompletion();

    } catch (e) {
        console.error("Availability save error:", e);
        alert("Failed to save availability");
    }
}

// ===============================
// GO LIVE TOGGLE
// ===============================
async function toggleListing() {
    const isLive = listingToggle.checked;

    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/listing-status`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ listed: isLive })
        });

        if (!res.ok) {
            throw new Error("Failed to update listing status");
        }

        listingStatus.textContent = isLive ? "LIVE" : "OFFLINE";

    } catch (e) {
        console.error("Toggle error:", e);

        // revert UI if backend fails
        listingToggle.checked = !isLive;
        listingStatus.textContent = !isLive ? "LIVE" : "OFFLINE";
    }
}

// ===============================
// RENDER APPOINTMENT REQUESTS (Pending)
// ===============================
function renderRequests(requests) {
    if (!requestsSection) return;

    // Keep the heading, remove only old rows
    const oldRows = requestsSection.querySelectorAll(".appointment-row, .no-data");
    oldRows.forEach(row => row.remove());

    if (!requests || requests.length === 0) {
        const empty = document.createElement("p");
        empty.className = "no-data";
        empty.textContent = "No pending requests";
        requestsSection.appendChild(empty);
        return;
    }

    requests.forEach(req => {
        const patientName = req.user?.name || "Patient";

        const row = document.createElement("div");
        row.className = "appointment-row";

        row.innerHTML = `
            <div>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p>${req.appointmentDate} • ${formatTime(req.startTime)} - ${formatTime(req.endTime)}</p>
            </div>
            <div>
                <button class="accept-btn" data-id="${req.id}">Accept</button>
                <button class="reject-btn" data-id="${req.id}">Reject</button>
            </div>
        `;

        requestsSection.appendChild(row);
    });

    attachRequestActions();
}

//format
function formatTime(timeStr) {
    return new Date(`1970-01-01T${timeStr}`)
        .toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
}

// ===============================
// ACCEPT / REJECT APPOINTMENTS
// ===============================
function attachRequestActions() {
    document.querySelectorAll(".accept-btn").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/appointments/${id}/accept`, {
                    method: "PUT",
                    headers: getAuthHeaders()
                });

                if (!res.ok) throw new Error("Accept failed");

                await loadDashboardData();

            } catch (e) {
                console.error("Accept failed:", e);
            }
        };
    });

    document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/doctor/dashboard/appointments/${id}/reject`, {
                    method: "PUT",
                    headers: getAuthHeaders()
                });

                if (!res.ok) throw new Error("Reject failed");

                await loadDashboardData();

            } catch (e) {
                console.error("Reject failed:", e);
            }
        };
    });
}


// ===============================
// RENDER UPCOMING APPOINTMENTS
// ===============================
function renderUpcoming(list) {
    if (!upcomingTbody) return;
    upcomingTbody.innerHTML = "";


    if (!list || list.length === 0) {
        upcomingTbody.innerHTML =
            `<tr><td colspan="4">No upcoming appointments</td></tr>`;
        return;
    }

    list.forEach(app => {
        const patientName = app.user?.name || "Patient";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${patientName}</td>
            <td>${app.appointmentDate}</td>
            <td>${formatTime(app.startTime)} - ${formatTime(app.endTime)}</td>
            <td>
                <span class="status confirmed">
                    ${app.status}
                </span>
            </td>
        `;

        upcomingTbody.appendChild(tr);
    });
}


// ===============================
// PROFILE COMPLETION LOGIC
// ===============================
function updateProfileCompletion() {
    const profileFields = [
        docNameInput.value,
        specializationInput.value,
        experienceInput.value,
        locationInput.value,
        feesInput.value
    ];

    const filledProfile = profileFields.filter(f => f && f.trim() !== "").length;
    const profilePercent = (filledProfile / profileFields.length) * 70;

    const availabilityComplete =
        availabilityData.startTime &&
        availabilityData.endTime &&
        availabilityData.days.length > 0;

    const availabilityPercent = availabilityComplete ? 30 : 0;
    const totalPercent = Math.round(profilePercent + availabilityPercent);

    profileProgressBar.style.width = totalPercent + "%";
    progressText.textContent = `${totalPercent}% completed`;

    if (totalPercent === 100) {
        listingToggle.disabled = false;
        listingStatus.textContent = "READY";
        listingStatus.classList.remove("offline");
    } else {
        listingToggle.checked = false;
        listingToggle.disabled = true;
        listingStatus.textContent = "OFFLINE";
    }
}

// ===============================
// JWT LOGOUT
// ===============================
document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("token");
            sessionStorage.clear();
            window.location.replace("./login.html");
        });
    }
});
