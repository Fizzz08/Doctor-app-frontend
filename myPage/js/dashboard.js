const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://chikithsa.netlify.app";

const apiBaseUrl = 'http://localhost:8080/api/v1/doctor';
const token = localStorage.getItem('token');

const tableBody = document.getElementById('tableBody');
const fromSpan = document.getElementById('from');
const toSpan = document.getElementById('to');
const totalEntriesSpan = document.getElementById('totalTableEntries');
const pageNumbersDiv = document.getElementById('pageNumbers');
const pageNumberInput = document.getElementById('pageNumberInput');
const goToPageButton = document.getElementById('goToPageButton');

let doctors = [];
let currentPage = 1;
let rowsPerPage = 6;



async function fetchDoctors() {
    if (!token) {
        alert('Unauthorized access. Please log in again.');
        window.location.href = BASE_URL + '/myPage/HTML/login.html';
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/getAll`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch doctors');

        doctors = await response.json();
        updatePagination();
        renderTable();
    } catch (err) {
        console.error('Error fetching doctors:', err);
        alert('Error fetching doctor data.');
    }
}

function renderTable() {
    tableBody.innerHTML = '';
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, doctors.length);

    doctors.slice(start, end).forEach(doctor => {
        const row = document.createElement('tr');
        row.setAttribute('id', `row-${doctor.id}`);

        row.innerHTML = `
        <td class="leftalign-column">${doctor.id}</td>
        <td><span class="editable" data-field="name">${doctor.name}</span></td>
        <td><span class="editable" data-field="specialization">${doctor.specialization}</span></td>
        <td><span class="editable" data-field="location">${doctor.location}</span></td>
        <td><span class="editable" data-field="yearOfExp">${doctor.yearOfExp}</span></td>
        <td><span class="editable" data-field="availableDays">${doctor.availableDays}</span></td>
        <td><span class="editable" data-field="fees">${doctor.fees}</span></td>
        <td><span class="editable" data-field="availableTime">${doctor.availableTime}</span></td>
        <td>
            <div class="c1">
            <button id="editBtn-${doctor.id}" class="edit-btn" onclick="editDoctor('${doctor.id}')">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="delete-btn" onclick="deleteDoctor('${doctor.id}')">
                <i class="fa-solid fa-trash"></i>
            </button>
            </div>
        </td>
        `;
        tableBody.appendChild(row);
    });

    fromSpan.innerText = start + 1;
    toSpan.innerText = end;
    updatePagination();
}

function editDoctor(id) {
    const row = document.getElementById(`row-${id}`);
    const editButton = document.getElementById(`editBtn-${id}`);
    const icon = editButton.querySelector("i");

    if (!row || !editButton || !icon) return;

    if (editButton.getAttribute("data-mode") !== "editing") {
        row.querySelectorAll('.editable').forEach(span => {
            const value = span.innerText;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.setAttribute('data-field', span.getAttribute('data-field'));
            span.replaceWith(input);
        });

        editButton.setAttribute("data-mode", "editing");
        icon.className = "fa-solid fa-check";
    } else {
        saveDoctor(id);
    }
}

async function saveDoctor(id) {
    const row = document.getElementById(`row-${id}`);
    const editButton = document.getElementById(`editBtn-${id}`);
    const icon = editButton.querySelector("i");

    const updatedDoctor = { id };

    row.querySelectorAll('input').forEach(input => {
        const field = input.getAttribute('data-field');
        let value = input.value.trim();

        if (field === 'yearOfExp' || field === 'fees') {
            value = parseFloat(value);
        } else if (field === 'availableTime') {
            value = value.replace(/\s*,\s*/g, ',');
        }

        updatedDoctor[field] = value;
    });

    try {
        const response = await fetch(`${apiBaseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDoctor)
        });

        if (!response.ok) throw new Error(await response.text());

        // Switch back from input to span
        row.querySelectorAll('input').forEach(input => {
            const span = document.createElement('span');
            span.classList.add('editable');
            span.setAttribute('data-field', input.getAttribute('data-field'));
            span.innerText = input.value;
            input.replaceWith(span);
        });

        // Reset edit button mode and icon
        editButton.setAttribute("data-mode", "");
        icon.className = "fa-solid fa-pen";

        alert('Doctor updated successfully!');
    } catch (err) {
        console.error('Update error:', err);
        alert('Failed to update doctor.');
    }
}

function showAddDoctorForm() {
    document.getElementById('addDoctorContainer').style.display = 'block';
}

function clearAddDoctorForm() {
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("availableTime").value = "";
}


function closeAddDoctor() {
    document.getElementById('addDoctorContainer').style.display = 'none';
    clearAddDoctorForm();
}

async function addDoctor() {
    const doctorName = document.getElementById('name').value.trim();
    const specialization = document.getElementById('specialization').value.trim();
    const location = document.getElementById('location').value.trim();
    const yearOfExp = document.getElementById('yearOfExp').value;
    const availableDays = document.getElementById('availableDays').value.trim();
    const fees = document.getElementById('fees').value;
    const availableTime = document.getElementById('availableTime').value.trim();

    if (!doctorName || !specialization || !location || !yearOfExp || !availableDays || !fees || !availableTime) {
        alert('Please fill out all fields before adding a doctor.');
        return;
    }

    const newDoctor = {
        name: doctorName,
        specialization,
        location,
        yearOfExp: parseInt(yearOfExp),
        availableDays,
        fees: parseFloat(fees),
        availableTime
    };

    try {
        const response = await fetch(`${apiBaseUrl}/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newDoctor)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add doctor');
        }

        await fetchDoctors();
        closeAddDoctor();
        alert('Doctor added successfully!');
    } catch (err) {
        console.error('Add doctor error:', err);
        alert(`Failed to add doctor: ${err.message}`);
    }
}

const availableTimeInput = document.getElementById("availableTime");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
function convertTo24Hour(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hour] = time.split(":").map(Number);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour;
}
function updateHiddenField() {
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  if (start && end) {
    const startHr = convertTo24Hour(start);
    const endHr = convertTo24Hour(end);
    if (endHr <= startHr) {
      alert("End time must be after start time.");
      availableTimeInput.value = "";
      return;
    }
    availableTimeInput.value = `${start} - ${end}`;
  }
}
flatpickr(startTimeInput, {
  enableTime: true,
  noCalendar: true,
  dateFormat: "h:i K",
  minuteIncrement: 60,
  defaultHour: 10,
  onChange: updateHiddenField
});
flatpickr(endTimeInput, {
  enableTime: true,
  noCalendar: true,
  dateFormat: "h:i K",
  minuteIncrement: 60,
  defaultHour: 13,
  onChange: updateHiddenField
});


const selectedDays = new Set();

document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const fullDay = btn.getAttribute("data-day");
        if (selectedDays.has(fullDay)) {
            selectedDays.delete(fullDay);
            btn.classList.remove("selected");
        } else {
            selectedDays.add(fullDay);
            btn.classList.add("selected");
        }
        // Update the input with full day names
        document.getElementById("availableDays").value = Array.from(selectedDays).join(", ");
    });
});


async function deleteDoctor(id) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
        const response = await fetch(`${apiBaseUrl}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete doctor');

        alert('Doctor deleted successfully.');
        await fetchDoctors();
    } catch (err) {
        console.error('Error deleting doctor:', err);
        alert('Failed to delete doctor');
    }
}

function updatePagination() {
    const totalEntries = doctors.length;
    const totalPages = Math.ceil(totalEntries / rowsPerPage);
    totalEntriesSpan.innerText = totalEntries;
    pageNumbersDiv.innerHTML = '';

    const addPageButton = (number) => {
        const btn = document.createElement('button');
        btn.innerText = number;
        btn.onclick = () => {
            currentPage = number;
            renderTable();
            updatePagination();
        };
        if (number === currentPage) btn.style.fontWeight = 'bold';
        pageNumbersDiv.appendChild(btn);
    };

    const addIconButton = (iconClass, targetPage, disabled) => {
        const btn = document.createElement('button');
        btn.innerHTML = `<i class="${iconClass}"></i>`;
        if (!disabled) {
            btn.onclick = () => {
                currentPage = targetPage;
                renderTable();
                updatePagination();
            };
        } else {
            btn.disabled = true;
        }
        pageNumbersDiv.appendChild(btn);
    };

    addIconButton('fa-solid fa-angles-left', 1, currentPage === 1);
    addIconButton('fa-solid fa-angle-left', currentPage - 1, currentPage === 1);

    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, currentPage + 1);

    for (let i = start; i <= end; i++) addPageButton(i);

    addIconButton('fa-solid fa-angle-right', currentPage + 1, currentPage === totalPages);
    addIconButton('fa-solid fa-angles-right', totalPages, currentPage === totalPages);
}

function goToPage() {
    const pageNumber = parseInt(pageNumberInput.value);
    if (pageNumber && pageNumber > 0 && pageNumber <= Math.ceil(doctors.length / rowsPerPage)) {
        currentPage = pageNumber;
        renderTable();
        updatePagination();
    } else {
        alert('Invalid page number!');
    }
}
goToPageButton.addEventListener('click', goToPage);

document.getElementById('rowsInput').addEventListener('input', function () {
    const value = parseInt(this.value);
    if (!isNaN(value) && value > 0) {
        rowsPerPage = value;
        currentPage = 1;
        renderTable();
        updatePagination();
    }
});

// Call initial fetch
fetchDoctors();


// Filter doctors based on search input
function filterDoctors() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    // Filter the doctors array based on the search query
    const filteredDoctors = doctors.filter(doctor => 
        doctor.id.toString().includes(searchInput) ||                     // Search by ID
        doctor.name.toLowerCase().includes(searchInput) ||
        doctor.specialization.toLowerCase().includes(searchInput) ||
        doctor.location.toLowerCase().includes(searchInput)
    );

    // Render filtered doctors while maintaining functionality
    renderFilteredTable(filteredDoctors);
}

// Render filtered doctors with functional buttons
function renderFilteredTable(filteredDoctors) {
    tableBody.innerHTML = '';  // Clear the table

    filteredDoctors.forEach(doctor => {
        const row = document.createElement('tr');
        row.setAttribute('id', `row-${doctor.id}`);
        
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td><span class="editable" data-field="name">${doctor.name}</span></td>
            <td><span class="editable" data-field="specialization">${doctor.specialization}</span></td>
            <td><span class="editable" data-field="location">${doctor.location}</span></td>
            <td class="centered-column"><span class="editable" data-field="yearOfExp">${doctor.yearOfExp}</span></td>
            <td><span class="editable" data-field="availableDays">${doctor.availableDays}</span></td>
            <td><span class="editable" data-field="fees">${doctor.fees}</span></td>
            <td><span class="editable" data-field="availableTime">${doctor.availableTime}</span></td>
            <td>
                <div class="c1">
                    <button id="editBtn-${doctor.id}" class="edit-btn" onclick="editDoctor('${doctor.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteDoctor('${doctor.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update pagination based on filtered results
    fromSpan.innerText = filteredDoctors.length > 0 ? 1 : 0;
    toSpan.innerText = filteredDoctors.length;
    totalEntriesSpan.innerText = filteredDoctors.length;
}
