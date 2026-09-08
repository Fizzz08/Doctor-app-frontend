import { 
    fetchAllDoctors, 
    updateDoctor, 
    addNewDoctor, 
    deleteDoctorById 
} from './apiService.js';

// DOM Elements
const tableBody = document.getElementById('tableBody');
const fromSpan = document.getElementById('from');
const toSpan = document.getElementById('to');
const totalEntriesSpan = document.getElementById('totalTableEntries');
const pageNumbersDiv = document.getElementById('pageNumbers');
const pageNumberInput = document.getElementById('pageNumberInput');
const goToPageButton = document.getElementById('goToPageButton');
const searchInput = document.getElementById('searchInput');
const addDoctorForm = document.getElementById('addDoctorContainer');

// State variables
let doctors = [];
let currentPage = 1;
let rowsPerPage = 6;
const selectedDays = new Set();

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderDoctors();
    setupEventListeners();
    initializeTimePickers();
    setupDaySelection();
});

/**
 * Fetches doctors and renders the table
 */
async function fetchAndRenderDoctors() {
    try {
        doctors = await fetchAllDoctors();
        renderTable();
        updatePagination();
    } catch (err) {
        console.error('Error fetching doctors:', err);
        alert('Error fetching doctor data.');
    }
}

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', filterDoctors);
    
    // Pagination controls
    goToPageButton.addEventListener('click', goToPage);
    document.getElementById('rowsInput').addEventListener('input', updateRowsPerPage);
    
    // Add doctor form
    document.getElementById('showAddDoctorForm').addEventListener('click', showAddDoctorForm);
    document.getElementById('closeAddForm').addEventListener('click', closeAddDoctor);
    document.getElementById('submitAddDoctor').addEventListener('click', addDoctor);
}

/**
 * Renders the doctor table with current data
 */
function renderTable(data = doctors) {
    tableBody.innerHTML = '';
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, data.length);

    data.slice(start, end).forEach(doctor => {
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
                    <button id="editBtn-${doctor.id}" class="edit-btn">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="delete-btn">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Add event listeners to buttons
        row.querySelector(`#editBtn-${doctor.id}`).addEventListener('click', () => editDoctor(doctor.id));
        row.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteDoctor(doctor.id));
        
        tableBody.appendChild(row);
    });

    updatePaginationInfo(start, end, data.length);
}

/**
 * Updates pagination information display
 */
function updatePaginationInfo(start, end, total) {
    fromSpan.innerText = start + 1;
    toSpan.innerText = end;
    totalEntriesSpan.innerText = total;
}

/**
 * Handles doctor editing functionality
 */
function editDoctor(id) {
    const row = document.getElementById(`row-${id}`);
    const editButton = document.getElementById(`editBtn-${id}`);
    const icon = editButton.querySelector("i");

    if (editButton.getAttribute("data-mode") !== "editing") {
        // Switch to edit mode
        row.querySelectorAll('.editable').forEach(span => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = span.innerText;
            input.setAttribute('data-field', span.getAttribute('data-field'));
            span.replaceWith(input);
        });

        editButton.setAttribute("data-mode", "editing");
        icon.className = "fa-solid fa-check";
    } else {
        // Save changes
        saveDoctorChanges(id);
    }
}

async function saveDoctorChanges(id) {
    const row = document.getElementById(`row-${id}`);
    const editButton = document.getElementById(`editBtn-${id}`);
    const icon = editButton.querySelector("i");

    const updatedDoctor = { id };

    // Collect updated values from input fields
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
        // Call API to update doctor
        await updateDoctor(id, updatedDoctor);

        // Update local doctors array
        const index = doctors.findIndex(doc => doc.id === id);
        if (index !== -1) {
            doctors[index] = { ...doctors[index], ...updatedDoctor };
        }

        // Update the DOM row dynamically to show updated data
        // Instead of creating spans, just update innerText of existing spans or replace inputs with spans

        row.querySelectorAll('input').forEach(input => {
            const field = input.getAttribute('data-field');
            const span = document.createElement('span');
            span.classList.add('editable');
            span.setAttribute('data-field', field);
            span.innerText = updatedDoctor[field] !== undefined ? updatedDoctor[field] : input.value;
            input.replaceWith(span);
        });

        // Reset edit button icon and mode
        editButton.setAttribute("data-mode", "");
        icon.className = "fa-solid fa-pen";

        alert('Doctor updated successfully!');
    } catch (err) {
        console.error('Update error:', err);
        alert('Failed to update doctor.');
    }
}

/**
 * Confirms and handles doctor deletion
 */
async function confirmDeleteDoctor(id) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
        await deleteDoctorById(id);
        alert('Doctor deleted successfully.');
        await fetchAndRenderDoctors();
    } catch (err) {
        console.error('Error deleting doctor:', err);
        alert('Failed to delete doctor');
    }
}

/**
 * Shows the add doctor form
 */
function showAddDoctorForm() {
    const addDoctorContainer = document.getElementById('addDoctorContainer');
    addDoctorContainer.style.display = 'block';
}

/**
 * Closes the add doctor form
 */
function closeAddDoctor() {
    addDoctorForm.style.display = 'none';
    clearAddDoctorForm();
}

/**
 * Clears the add doctor form
 */
function clearAddDoctorForm() {
    document.querySelectorAll(".day-btn").forEach(btn => btn.classList.remove("selected"));
    selectedDays.clear();
    document.getElementById("addDoctorForm").reset();
}

/**
 * Handles adding a new doctor
 */
async function addDoctor() {
    const formData = getAddDoctorFormData();
    if (!validateDoctorForm(formData)) return;

    try {
        await addNewDoctor(formData);
        await fetchAndRenderDoctors();
        closeAddDoctor();
        alert('Doctor added successfully!');
    } catch (err) {
        console.error('Add doctor error:', err);
        alert(`Failed to add doctor: ${err.message}`);
    }
}

/**
 * Gets form data for adding a new doctor
 */
function getAddDoctorFormData() {
    return {
        name: document.getElementById('name').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        location: document.getElementById('location').value.trim(),
        yearOfExp: parseInt(document.getElementById('yearOfExp').value),
        availableDays: document.getElementById('availableDays').value.trim(),
        fees: parseFloat(document.getElementById('fees').value),
        availableTime: document.getElementById('availableTime').value.trim()
    };
}

/**
 * Validates the add doctor form
 */
function validateDoctorForm(formData) {
    for (const key in formData) {
        if (formData[key] === '' || (typeof formData[key] === 'number' && isNaN(formData[key]))) {
            alert('Please fill out all fields with valid data before adding a doctor.');
            return false;
        }
    }
    return true;
}

/**
 * Initializes time pickers for available time selection
 */
function initializeTimePickers() {
    const availableTimeInput = document.getElementById("availableTime");
    const startTimeInput = document.getElementById("startTime");
    const endTimeInput = document.getElementById("endTime");

    flatpickr(startTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",
        minuteIncrement: 60,
        defaultHour: 10,
        onChange: () => updateAvailableTimeField()
    });

    flatpickr(endTimeInput, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",
        minuteIncrement: 60,
        defaultHour: 13,
        onChange: () => updateAvailableTimeField()
    });
}

/**
 * Updates the available time field based on start/end times
 */
function updateAvailableTimeField() {
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    const availableTimeInput = document.getElementById("availableTime");

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

/**
 * Converts 12-hour time to 24-hour format
 */
function convertTo24Hour(timeStr) {
    const [time, period] = timeStr.split(" ");
    let [hour] = time.split(":").map(Number);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour;
}

/**
 * Sets up day selection buttons
 */
function setupDaySelection() {
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
            document.getElementById("availableDays").value = Array.from(selectedDays).join(", ");
        });
    });
}

/**
 * Filters doctors based on search input
 */
function filterDoctors() {
    const searchQuery = searchInput.value.toLowerCase();
    const filteredDoctors = doctors.filter(doctor => 
        doctor.id.toString().includes(searchQuery) ||
        doctor.name.toLowerCase().includes(searchQuery) ||
        doctor.specialization.toLowerCase().includes(searchQuery) ||
        doctor.location.toLowerCase().includes(searchQuery)
    );
    renderTable(filteredDoctors);
}

/**
 * Updates pagination controls
 */
function updatePagination() {
    const totalPages = Math.ceil(doctors.length / rowsPerPage);
    pageNumbersDiv.innerHTML = '';

    // Clamp currentPage within valid range
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    // Previous buttons
    addPaginationButton('fa-solid fa-angles-left', 1, currentPage === 1);
    addPaginationButton('fa-solid fa-angle-left', currentPage - 1, currentPage === 1);

    // Calculate visible pages (max 3)
    let startPage, endPage;

    if (totalPages <= 3) {
        // Show all if 3 or less pages total
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage === 1) {
            // At the start show first 2 pages
            startPage = 1;
            endPage = 2;
        } else if (currentPage === totalPages) {
            // At the end show last 2 pages
            startPage = totalPages - 1;
            endPage = totalPages;
        } else {
            // In the middle show 3 pages with current in center
            startPage = currentPage - 1;
            endPage = currentPage + 1;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        addPaginationButton(i, i, false, i === currentPage);
    }

    // Next buttons
    addPaginationButton('fa-solid fa-angle-right', currentPage + 1, currentPage === totalPages);
    addPaginationButton('fa-solid fa-angles-right', totalPages, currentPage === totalPages);
}


function addPaginationButton(content, targetPage, disabled, isCurrent = false) {
    const btn = document.createElement('button');
    btn.innerHTML = typeof content === 'number' ? content : `<i class="${content}"></i>`;

    if (!disabled) {
        btn.addEventListener('click', () => {
            currentPage = targetPage;

            // Clamp currentPage to valid values
            const totalPages = Math.ceil(doctors.length / rowsPerPage);
            if (currentPage < 1) currentPage = 1;
            if (currentPage > totalPages) currentPage = totalPages;

            renderTable();
            updatePagination();
        });
    } else {
        btn.disabled = true;
    }

    if (isCurrent) {
        btn.style.fontWeight = 'bold';
        btn.style.backgroundColor = '#ddd'; // Highlight current page button
    }

    pageNumbersDiv.appendChild(btn);
}


/**
 * Handles page navigation
 */
function goToPage() {
    const pageNumber = parseInt(pageNumberInput.value);
    const totalPages = Math.ceil(doctors.length / rowsPerPage);
    
    if (pageNumber > 0 && pageNumber <= totalPages) {
        currentPage = pageNumber;
        renderTable();
        updatePagination();
    } else {
        alert(`Please enter a page number between 1 and ${totalPages}`);
    }
}

/**
 * Updates rows per page setting
 */
function updateRowsPerPage() {
    const value = parseInt(this.value);
    if (!isNaN(value) && value > 0) {
        rowsPerPage = value;
        currentPage = 1;
        renderTable();
    }
}




// Keep track of sort state
let sortDirection = {}; // { columnName: 'asc' or 'desc' }


function sortColumn(column) {
  const direction = sortDirection[column] === 'asc' ? 'desc' : 'asc';
  sortDirection = {};
  sortDirection[column] = direction;

  doctors.sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // Handle undefined or missing data safely
    if (valA === undefined) valA = '';
    if (valB === undefined) valB = '';

    // Special handling for numbers
    if (column === 'experience' || column === 'fees' || column === 'id') {
      valA = Number(valA);
      valB = Number(valB);
      if (isNaN(valA)) valA = 0;
      if (isNaN(valB)) valB = 0;
    }

    // Special handling for time column
    if (column === 'time') {
      valA = parseTime(valA);
      valB = parseTime(valB);
    }

    // For strings, do case-insensitive comparison
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderTable();
  updateSortArrows(column, direction);
}

// Render doctor rows into tbody
function renderSortedTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = ''; // clear current rows

  doctors.forEach(doc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${doc.id}</td>
      <td>${doc.name}</td>
      <td>${doc.specialization}</td>
      <td>${doc.location}</td>
      <td>${doc.experience}</td>
      <td>${doc.days}</td>
      <td>${doc.fees}</td>
      <td>${doc.time}</td>
      <td><!-- action buttons if any --></td>
    `;
    tbody.appendChild(tr);
  });
}

// Update sort arrows styling to show active column and direction
function updateSortArrows(activeColumn, direction) {
  document.querySelectorAll('th[data-column]').forEach(th => {
    const col = th.getAttribute('data-column');
    const arrow = th.querySelector('.sort-arrow');

    if (col === activeColumn) {
      arrow.classList.add('active');
      arrow.innerHTML = direction === 'asc' ? '&#9650;' : '&#9660;';
    } else {
      arrow.classList.remove('active');
      arrow.innerHTML = '&#9650;'; // default up arrow for others, not active
    }
  });
}

// Attach event listeners on all <th> with data-column after DOM is ready
document.querySelectorAll('th[data-column]').forEach(th => {
  th.style.cursor = 'pointer'; // show pointer on hover for clarity
  th.addEventListener('click', () => {
    const column = th.getAttribute('data-column');
    sortColumn(column);
  });
});

// Initial render
renderSortedTable();