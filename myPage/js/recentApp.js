document.addEventListener('DOMContentLoaded', function () {

    const appointmentsList = document.getElementById('appointments-list');
    const token = sessionStorage.getItem('token');

    let currentPage = 0;
    let currentType = 'active';
    const size = 5;

    if (!token) {
        appointmentsList.innerHTML = `<div class="appointment-card error">Session expired. Please log in again.</div>`;
        setTimeout(() => window.location.href = '/loginDemo.html', 2000);
        return;
    }

    async function fetchAppointments() {

        const apiUrl = `${API_BASE_URL}/api/bookAppointment/appointments?type=${currentType}&page=${currentPage}&size=${size}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                sessionStorage.clear();
                window.location.href = "/loginDemo.html";
                return;
            }

            const data = await response.json();
            const appointments = data.content;

            if (!appointments || appointments.length === 0) {
                appointmentsList.innerHTML = `<div class="appointment-card no-appointments">No appointments found</div>`;
                return;
            }

            let appointmentsHTML = "";

            data.content.forEach(appointment => {
                appointmentsHTML += `
                    <div class="Text-Container">
                        <div class="appointment-card">
                            <h3>${appointment.doctorName}</h3>
                            <p><strong>Date:</strong> ${appointment.appointmentDate} (${appointment.day_of_appointment})</p>
                            <p><strong>Time:</strong> ${appointment.timeOfAppointment}</p>
                            <p><strong>Token:</strong> ${appointment.patient_token}</p>
                        </div>
                        <div class="Status">
                            <p><strong>Status:</strong>
                                <span class="status ${appointment.status.toLowerCase()}">${appointment.status}</span>
                            </p>
                        </div>
                    </div>
                `;
            });

            // 🔥 Pagination UI
            appointmentsHTML += `
                <div class="pagination">
                    <button id="prevBtn" ${currentPage === 0 ? 'disabled' : ''}>Prev</button>
                    <span>Page ${currentPage + 1} / ${data.totalPages}</span>
                    <button id="nextBtn" ${currentPage >= data.totalPages - 1 ? 'disabled' : ''}>Next</button>
                </div>
            `;

            appointmentsList.innerHTML = appointmentsHTML;

            // Pagination events
            document.getElementById('prevBtn')?.addEventListener('click', () => {
                currentPage--;
                fetchAppointments();
            });

            document.getElementById('nextBtn')?.addEventListener('click', () => {
                currentPage++;
                fetchAppointments();
            });

        } catch (error) {
            console.error("Error fetching appointments:", error);
            appointmentsList.innerHTML = `<div class="appointment-card error">Error fetching appointments</div>`;
        }
    }

    //TAB SWITCHING
    window.switchTab = function(type) {
        currentType = type;
        currentPage = 0;

        document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
        document.getElementById(type + 'Tab').classList.add('active');

        fetchAppointments();
    };

    // Initial load
    fetchAppointments();

    // Logout
    document.getElementById("logoutButton")?.addEventListener("click", function () {
        sessionStorage.clear();
        window.location.href = "/loginDemo.html";
    });
});