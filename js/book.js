const tkn = sessionStorage.getItem('token');
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
            : './image/default.jpg';

    card.innerHTML = `
        <img src="${imagePath}" alt="Doctor Profile" class="profile-pic">
        <div class="grp">
            <h2>${doctor.name}</h2>
            <p>${doctor.specialization}</p>
            <p>${doctor.location}</p>
            <p>${doctor.yearOfExp} years Experience</p>
            <p>₹${doctor.fees} Consultation fee at clinic</p>
        </div>
        <button class="book-btn" onclick="openBookingModal(${doctor.id}, '${doctor.name}', '${doctor.availableDays}')">Book Now</button>
    `;
    return card;
}

function openBookingModal(doctorId, doctorName, availableDays) {
    const bookingModal = document.getElementById('bookingModal');
    // Store selected doctor safely
    sessionStorage.setItem("selectedDoctor", JSON.stringify({
        doctorId: doctorId,
        name: doctorName,
        availableDays: availableDays
    }));
    sessionStorage.getItem("selectedDoctor");
    console.log("doctorId:", doctorId);
    console.log("doctorName:", doctorName);
    console.log("available days:", availableDays);
    bookingModal.classList.remove('hidden');
    document.getElementById('modalDoctorName').textContent = doctorName;
    initializeCalendar(availableDays);
}

// Function to initialize the calendar with available days
function initializeCalendar(availableDays) {
    console.log("availableDays raw:", availableDays);
    const dayMapping = {
        Sunday: 0, Monday: 1, Tuesday: 2,
        Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };

    const allowedDays = availableDays.split(',').map(day => dayMapping[day.trim()]);
    console.log("allowedDays numeric:", allowedDays);
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

                const doctor = JSON.parse(sessionStorage.getItem("selectedDoctor"));

                if (!doctor || !doctor.doctorId) {
                    console.error("Doctor ID not found in sessionStorage");
                    return;
                }

                displayTimeSlots(selectedDates[0], doctor.doctorId);
            }
        }
    });
}




// Function to fetch and display available and booked time slots
function displayTimeSlots(selectedDate, doctorId) {
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

    console.log(doctorId);
    const availableSlotsFetch = fetch(`${API_BASE_URL}/api/v1/doctor/availableSlot?doctorId=${doctorId}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tkn
        }
    });

    const bookedSlotsFetch = fetch(`${API_BASE_URL}/api/v1/doctor/bookedSlots?doctorId=${doctorId}&date=${formattedDate}`, {
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
        .then(([availableResponse, bookedSlots]) => {

            console.log("BOOKED SLOTS RESPONSE:", bookedSlots);
            const availableSlots = availableResponse.availableTime;
            const slotDuration = availableResponse.slotDuration;

            const allTimeSlots = availableSlots.map(slot => {
                const [startTime, endTime] = slot.split(' - ');
                return generateSlots(startTime, endTime, slotDuration);
            }).flat();

            renderTimeSlots(allTimeSlots, bookedSlots);
        })
        .catch(error => {
            console.error('Error fetching slots:', error);
            const timeGrid = document.getElementById('timeGrid');
            timeGrid.innerHTML = '<p>Error fetching slots.</p>';
        });
}

//Dynamic slot generation
function generateSlots(startTimeStr, endTimeStr, slotDurationMinutes) {
    const slots = [];

    const parseTimeToDate = (timeStr) => {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");

        let hoursNum = parseInt(hours);

        // Fix 12 AM / 12 PM issue properly
        if (modifier === "AM" && hoursNum === 12) {
            hoursNum = 0;
        }
        if (modifier === "PM" && hoursNum !== 12) {
            hoursNum += 12;
        }

        return new Date(1970, 0, 1, hoursNum, parseInt(minutes));
    };

    let current = parseTimeToDate(startTimeStr);
    const endTime = parseTimeToDate(endTimeStr);

    while (current < endTime) {
        const next = new Date(current.getTime() + slotDurationMinutes * 60000);

        // Prevent overflow beyond doctor's availability
        if (next > endTime) break;

        const formattedSlot =
            `${current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` +
            ` - ` +
            `${next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

        slots.push(formattedSlot);

        current = next;
    }

    return slots;
}

function renderTimeSlots(allTimeSlots, bookedSlots) {

    const timeGrid = document.getElementById('timeGrid');
    timeGrid.innerHTML = '';

    const datePicker = document.getElementById('datePicker');
    const selectedDate = datePicker.value;

    if (!selectedDate) {
        timeGrid.innerHTML =
            '<div class="no-slots-msg">Please select a date to view available slots.</div>';
        return;
    }

    const currentTime = new Date();
    let hasAvailableSlots = false;

    //Helper to parse "09:00 AM - 10:00 AM" into minutes
    function parseTimeRange(startStr, endStr) {

        const parse = (timeStr) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);

            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;

            return hours * 60 + minutes;
        };

        return {
            start: parse(startStr),
            end: parse(endStr)
        };
    }

    const parsedBookedSlots = bookedSlots.map(slot => ({
        ...parseTimeRange(slot.startTime, slot.endTime),
        status: slot.status
    }));


    allTimeSlots.forEach(slot => {

        const startTimeStr = slot.split(' - ')[0].trim();
        const slotStartTime = new Date(`${selectedDate} ${startTimeStr}`);

        if (slotStartTime < currentTime) {
            return;
        }

        hasAvailableSlots = true;

        const slotDiv = document.createElement('div');
        slotDiv.classList.add('grid-item');
        slotDiv.textContent = slot;

        const [startStr, endStr] = slot.split(' - ').map(t => t.trim());
        const currentSlotTime = parseTimeRange(startStr, endStr);

        //Overlap detection
        let isBooked = false;

        for (let booked of parsedBookedSlots) {

            if (booked.status === 'REJECTED') {
                continue;
            }
            if (
                currentSlotTime.start < booked.end &&
                currentSlotTime.end > booked.start
            ) {
                isBooked = true;
                break;
            }
        }

        if (isBooked) {
            slotDiv.classList.add('disabled');
            slotDiv.textContent += ' (Booked)';
        } else {
            slotDiv.addEventListener('click', () => {

                const previouslySelected =
                    document.querySelector('.grid-item.selected');

                if (previouslySelected) {
                    previouslySelected.classList.remove('selected');
                }

                slotDiv.classList.add('selected');
            });
        }

        timeGrid.appendChild(slotDiv);
    });

    if (!hasAvailableSlots) {
        timeGrid.innerHTML =
            '<div class="no-slots-msg">Sorry, there are no available slots for the selected date.</div>';
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
            window.location.href = './loginDemo.html';
            return;
        }

        const doctor = JSON.parse(sessionStorage.getItem("selectedDoctor"));

        if (!doctor || !doctor.doctorId) {
            console.error("Doctor ID missing");
            return;
        }

        // Fetch doctor details
        const doctorResponse = await fetch(`${API_BASE_URL}/api/v1/doctor/details/${doctor.doctorId}`, {
            headers: {
                'Authorization': 'Bearer ' + tkn
            }
        });

        if (!doctorResponse.ok) {
            throw new Error('Failed to fetch doctor details');
        }
        const doctorData = await doctorResponse.json();
        console.log('Doctor Data:', doctorData);


        // Fetch user details (from token)
        const userResponse = await fetch(`${API_BASE_URL}/api/userdetails`, {
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

        const [startTime, endTime] = selectedSlot.textContent
        .split(' - ')
        .map(t => t.trim());

        const userId = userData.userId;
        const userName = userData.userName;

        const selectedDoctor = JSON.parse(sessionStorage.getItem("selectedDoctor"));


        if (!userId || !doctor.doctorId) {
            alert("Error: Missing user or doctor details...");
            return;
        }

        const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });

        // Prepare the appointment data
        const appointmentData = {
            doctorName,
            appointmentDate: selectedDate,
            dayOfAppointment: dayOfWeek,
            startTime: startTime.toUpperCase(),
            endTime: endTime.toUpperCase(),
            doctor: { doctorId: doctor.doctorId },
            user: { id: userId, name: userName }
        };

    console.log('Appointment Data:', appointmentData);
    
    console.log("token book:", tkn);

    if (!tkn) {
        alert('Session expired. Please log in again.');
        window.location.href = "./loginDemo.html";
        return;
    }

    console.log("start:", startTime);
    console.log("end:", endTime);

    const bookingResponse = await fetch(`${API_BASE_URL}/api/bookAppointment/book`, {
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