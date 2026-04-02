document.addEventListener('DOMContentLoaded', function() {
    const appointmentsList = document.getElementById('appointments-list');

    // Get JWT Token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
        appointmentsList.innerHTML = `<div class="appointment-card error">Session expired. Please log in again.</div>`;
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }

    // API Endpoint (No need for email in URL now)
    const apiUrl = `http://localhost:8080/api/bookAppointment/recent-appointments`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer `+ token,  // Send token in Authorization header
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.status === 401) {
            localStorage.removeItem('token'); // Clear token if unauthorized
            appointmentsList.innerHTML = `<div class="appointment-card error">Session expired. Please log in again.</div>`;
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return Promise.reject("Unauthorized - Token Expired");
        }
        return response.json();
    })
    .then(data => {
        if (data.message === "No recent appointments found") {
            appointmentsList.innerHTML = `<div class="appointment-card no-appointments">No recent appointments found</div>`;
            return;
        }

        let appointmentsHTML = "";
        data.forEach(appointment => {
            appointmentsHTML += `
                <div class="Text-Container">
                    <div class="appointment-card">
                        <h3>${appointment.doctorName}</h3>
                        <p><strong>Date:</strong> ${appointment.appointmentDate} (${appointment.day_of_appointment})</p>
                        <p><strong>Time:</strong> ${appointment.timeOfAppointment}</p>
                        <p><strong>Token:</strong> ${appointment.patient_token}</p>
                    </div>
                    <div class="Status">
                        <p><strong>Status:</strong> ${appointment.status}</p>
                    </div>
                </div>
            `;
        });
        appointmentsList.innerHTML = appointmentsHTML;
    })
    .catch(error => {
        console.error("Error fetching appointments:", error);
        if (appointmentsList.innerHTML.trim() === "") {
            appointmentsList.innerHTML = `<div class="appointment-card error">Error fetching appointments</div>`;
        }
    });

    // ✅ Log-out (Client-side Token Clear)
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem('token');  // Clear token
            sessionStorage.clear();             // Clear session data if needed
            window.location.href = "/login.html"; // Redirect to login page
        });
    }
});
