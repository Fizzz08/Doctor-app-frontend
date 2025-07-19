const tkn = localStorage.getItem('token');
window.onload = function () {
    const doctorData = JSON.parse(sessionStorage.getItem('doctorData'));
    const doctorsList = document.getElementById('doctorsList');

    if (doctorData && doctorData.length > 0) {
        const head = document.querySelector('.heading');
        head.innerHTML = `<h2 class="Book-title">Available Doctors</h2>`;

        doctorData.forEach(doctor => {
            const doctorCard = createDoctorCard(doctor);
            doctorsList.appendChild(doctorCard);
        });
    } else {

        doctorsList.innerHTML = '<p>No doctors available for the selected criteria.</p>';
    }
};

function createDoctorCard(doctor) {
    const card = document.createElement('div');
    card.className = 'doctor-card';

    const imagePath = doctor.image
            ? `../${doctor.image}`
            : '../image/default.jpg';

    card.innerHTML = `
        <img src="${imagePath}" alt="Doctor Profile" class="profile-pic">
        <div class="grp">
            <h2>${doctor.name}</h2>
            <p>${doctor.specialization}</p>
            <p>${doctor.location}</p>
            <p>${doctor.yearOfExp} years Experience</p>
            <p>₹${doctor.fees} Consultation fee at clinic</p>
        </div>
        <button class="book-btn" onclick="openBookingModal('${doctor.name}', '${doctor.availableDays}')">Book Now</button>
    `;
    return card;
}

function openBookingModal(doctorName, availableDays) {
    const bookingModal = document.getElementById('bookingModal');
    bookingModal.classList.remove('hidden');
    document.getElementById('modalDoctorName').textContent = doctorName;
    initializeCalendar(availableDays);
}

// Function to initialize the calendar with available days
function initializeCalendar(availableDays) {
    const dayMapping = {
        Sunday: 0, Monday: 1, Tuesday: 2,
        Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };

    const allowedDays = availableDays.split(',').map(day => dayMapping[day.trim()]);

    if (allowedDays.length === 0) {
        console.error("No available days to enable.");
        return;
    }

    // Initialize flatpickr for the calendar
    flatpickr("#datePicker", {
        minDate: "today", // Ensure the date picker starts from today
        enable: [date => allowedDays.includes(date.getDay())], // Only enable allowed days
        dateFormat: "Y-m-d", // Use a simple date format
        onChange: selectedDates => {
            if (selectedDates[0]) {
                const doctorName = document.getElementById('modalDoctorName').textContent;
                displayTimeSlots(selectedDates, doctorName); // Call to fetch and display slots
            }
        }
    });
}




// Function to fetch and display available and booked time slots
function displayTimeSlots(selectedDate, doctorName) {
    if (!(selectedDate instanceof Date)) {
        selectedDate = new Date(selectedDate); // Ensure the selected date is a Date object
    }

    if (isNaN(selectedDate)) {
        console.error("Invalid date:", selectedDate);
        return;
    }

    const formattedDate = selectedDate.toLocaleDateString('en-CA'); // 'en-CA' uses 'YYYY-MM-DD' format
    console.log("Formatted Date:", formattedDate); // Debugging: Log the formatted date

    // Show the time slots container
    document.getElementById('timeSlotsContainer').classList.remove('hidden');


    if (!tkn) {
        console.error('No token found. Please log in again.');
        return;
    }

    const availableSlotsFetch = fetch(`http://localhost:8080/api/v1/doctor/availableSlot?doctorName=${encodeURIComponent(doctorName)}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tkn
        }
    });

    const bookedSlotsFetch = fetch(`http://localhost:8080/api/bookAppointment/bookedSlots?doctorName=${encodeURIComponent(doctorName)}&date=${formattedDate}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tkn
        }
    });


    Promise.all([availableSlotsFetch, bookedSlotsFetch])
        .then(responses => {
            if (!responses[0].ok || !responses[1].ok ) {
                throw new Error('Failed to fetch slots');
            }
            return Promise.all(responses.map(response => response.json())); // Parse responses to JSON
        })
        .then(([availableSlots, bookedSlots]) => {
            console.log('Available Slots:', availableSlots); // Debugging: Log the available slots
            console.log('Booked Slots:', bookedSlots); // Debugging: Log the booked slots

            // Generate hourly time slots based on available slots
            const allTimeSlots = availableSlots.map(slot => {
                const [startTime, endTime] = slot.split(' - ');
                return generateHourlySlots(startTime, endTime); // Generate hourly slots
            }).flat(); // Flatten to get all individual slots

            renderTimeSlots(allTimeSlots, bookedSlots); // Render the slots
        })
        .catch(error => {
            console.error('Error fetching slots:', error);
            const timeGrid = document.getElementById('timeGrid');
            timeGrid.innerHTML = '<p>Error fetching slots.</p>';
        });
}

function generateHourlySlots(startTimeStr, endTimeStr) {
    const slots = [];

    // Helper function to convert time string (e.g., "9:00 AM") to Date object
    const parseTimeToDate = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        const [hours, minutes] = time.split(":");
        const hours24 = (modifier === "PM" && hours !== "12") ? parseInt(hours) + 12 : parseInt(hours);
        return new Date(1970, 0, 1, hours24, minutes); // 1970-01-01 is a dummy date
    };

    const startTime = parseTimeToDate(startTimeStr);
    const endTime = parseTimeToDate(endTimeStr);

    // Generate hourly slots
    while (startTime < endTime) {
        const slotEndTime = new Date(startTime);
        slotEndTime.setHours(startTime.getHours() + 1);

        // Format the slot in "start - end" format
        const formattedSlot = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - ${slotEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        slots.push(formattedSlot);

        // Increment start time by 1 hour
        startTime.setHours(startTime.getHours() + 1);
    }

    return slots;
}

function renderTimeSlots(allTimeSlots, bookedSlots) {
    const timeGrid = document.getElementById('timeGrid');
    timeGrid.innerHTML = ''; // Clear existing slots

    // Normalize booked slots for consistent comparison
    const normalizedBookedSlots = bookedSlots.map(slot => slot.trim().toLowerCase());

    // Get the selected date from the date picker
    const datePicker = document.getElementById('datePicker');
    const selectedDate = datePicker.value; // Format: YYYY-MM-DD

    // If no date is selected, do not render any slots
    if (!selectedDate) {
        timeGrid.innerHTML = '<div class="no-slots-msg">Please select a date to view available slots.</div>';
        return;
    }

    // Get the current local date and time
    const currentTime = new Date();

    // Track if any slots are available
    let hasAvailableSlots = false;

    allTimeSlots.forEach(slot => {
        // Combine the selected date with the slot's start time
        const startTimeStr = slot.split(' - ')[0].trim(); // Extract start time (e.g., "09:00 AM")
        const slotStartTime = new Date(`${selectedDate} ${startTimeStr}`); // Create a Date object

        // Check if the slot's start time is in the past
        if (slotStartTime < currentTime) {
            return; // Skip this slot as its start time has already passed
        }

        // If we reach here, there is at least one available slot
        hasAvailableSlots = true;

        const slotDiv = document.createElement('div');
        slotDiv.classList.add('grid-item');
        slotDiv.textContent = slot; // Display the time slot (e.g., "09:00 AM - 10:00 AM")

        // Normalize current slot for comparison
        const normalizedSlot = slot.trim().toLowerCase();

        // Disable slots that are already booked
        if (normalizedBookedSlots.includes(normalizedSlot)) {
            slotDiv.classList.add('disabled'); // Add a class for disabled styling
            slotDiv.textContent += ' (Booked)'; // Append text indicating booked status
        } else {
            // Add event listener to select the time slot
            slotDiv.addEventListener('click', () => {
                if (!slotDiv.classList.contains('disabled')) {
                    // Deselect any previously selected slot
                    const previouslySelectedSlot = document.querySelector('.grid-item.selected');
                    if (previouslySelectedSlot) {
                        previouslySelectedSlot.classList.remove('selected');
                    }

                    // Select the new slot
                    slotDiv.classList.add('selected');
                }
            });
        }

        timeGrid.appendChild(slotDiv);
    });

    // If no slots are available, display a message
    if (!hasAvailableSlots) {
        timeGrid.innerHTML = '<div class="no-slots-msg">Sorry, there are no available slots for the selected date.</div>';
    }
}

// Function to open the modal and fetch doctor-specific details
function openModal(doctorName, availableDays) {
    // Set the doctor name in the modal
    document.getElementById('modalDoctorName').textContent = doctorName;

    // Initialize the calendar with available days for the doctor
    initializeCalendar(availableDays);

    // Set the default date (today) for the time slots
    const today = new Date();
    displayTimeSlots(today, doctorName); // Fetch and display slots for today by default

    // Show the modal
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'block';
}

// Function to confirm the booking
async function confirmBooking() {
    try {
        const doctorName = document.getElementById('modalDoctorName').textContent;

        if (!tkn) {
            alert('You are not authenticated. Please log in first.');
            window.location.href = 'login.html';
            return;
        }

        // Fetch doctor details
        const doctorResponse = await fetch(`http://localhost:8080/api/v1/doctor/details?doctorName=${encodeURIComponent(doctorName)}`, {
            headers: {
                'Authorization': 'Bearer ' + tkn
            }
        });

        if (!doctorResponse.ok) {
            throw new Error('Failed to fetch doctor details');
        }
        const doctorData = await doctorResponse.json();
        console.log('Doctor Data:', doctorData);

        sessionStorage.setItem('doctorId', doctorData.doctorId);

        // Fetch user details (from token)
        const userResponse = await fetch("http://localhost:8080/api/userdetails", {
            headers: {
                'Authorization': 'Bearer ' + tkn
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user details');
        }

        const userData = await userResponse.json();

        if (!userData.userId || !userData.userName) {
            throw new Error("No user logged in");
        }

        console.log("User Details:", userData);
        sessionStorage.setItem("userId", userData.userId);
        sessionStorage.setItem("userName", userData.userName);

        // Ensure the slot and date are selected
        const selectedSlot = document.querySelector('.grid-item.selected');
        const selectedDate = document.querySelector('#datePicker').value;

        if (!selectedSlot || !selectedDate) {
            alert('Please select both a date and a time to book your appointment.');
            return;
        }

        // Retrieve stored session data
        const userName = sessionStorage.getItem('userName');
        const userId = sessionStorage.getItem('userId');
        const doctorId = sessionStorage.getItem('doctorId');

        if (!userId || !doctorId) {
            alert("Error: Missing user or doctor details. Please try again.");
            return;
        }

        const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });

        // Prepare the appointment data
        const appointmentData = {
            doctorName,
            appointmentDate: selectedDate,
            dayOfAppointment: dayOfWeek,
            timeOfAppointment: selectedSlot.textContent,
            doctor: { doctorId: doctorId },
            user: { id: userId, name: userName }
        };

    console.log('Appointment Data:', appointmentData);
    
    console.log("token book:", tkn);

    if (!tkn) {
        alert('Session expired. Please log in again.');
        window.location.href = BASE_URL + '/myPage/HTML/login.html';
        return;
    }

    const bookingResponse = await fetch('http://localhost:8080/api/bookAppointment/book', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + tkn,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData),
    });

    // Check if the response is successful
    if (!bookingResponse.ok) {
        const errorDetails = await bookingResponse.text();  // Get detailed error response
        console.error('Backend Error:', errorDetails);
        throw new Error('Booking failed: ' + errorDetails);
    }

    const bookingData = await bookingResponse.json();
    console.log("Booking Response:", bookingData);

    if (bookingData.success) {
        // Update the message box content
        document.getElementById('successDate').textContent = selectedDate;
        document.getElementById('successTime').textContent = selectedSlot.textContent;

        // Show the message box
        const successMessageBox = document.getElementById('successMessageBox');
        successMessageBox.style.display = 'block';

        // Optionally, hide the message box after a few seconds
        setTimeout(() => {
            successMessageBox.classList.add('fade-out');
            setTimeout(() => {
                successMessageBox.style.display = 'none';
                successMessageBox.classList.remove('fade-out');
            }, 500); // Match the duration of the fade-out animation
        }, 4500); // Start fade-out 4.5 seconds after showing

        updateUIAfterBooking(selectedSlot.textContent);
        closeModal();
    } else {
        alert('Error booking appointment: ' + bookingData.message);
    }


    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while booking your appointment: ' + error.message);
    }
}


// Function to update UI after booking a time slot
function updateUIAfterBooking(time) {
    const slotDiv = Array.from(document.querySelectorAll('.grid-item')).find(
        slot => slot.textContent.startsWith(time)
    );

    if (slotDiv) {
        slotDiv.classList.add('disabled'); // Disable further selection
        slotDiv.textContent += ' (Booked)';
        slotDiv.removeEventListener('click', () => {}); // Remove click event listener
    }
}

// Function to close the modal and clear selected date and time
function closeModal() {
    // Hide the modal
    document.getElementById('bookingModal').classList.add('hidden');

    // Clear the date picker input
    document.getElementById('datePicker').value = '';

    // Clear the selected time slot
    const selectedSlot = document.querySelector('.grid-item.selected');
    if (selectedSlot) {
        selectedSlot.classList.remove('selected');
    }

    // Clear the time grid UI
    const timeGrid = document.getElementById('timeGrid');
    timeGrid.innerHTML = '';

    // Optionally hide the time slots container
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    timeSlotsContainer.classList.add('hidden');
}