    document.addEventListener('DOMContentLoaded', function () {
    console.log("🏠 Home Page Loaded");
    const tkn = sessionStorage.getItem("token");
    console.log("jwt token :", tkn);
    
    
        
    // Specialization Dropdown Logic

    const searchInput = document.getElementById("specialization");
    const suggestionBox = document.getElementById("suggestionBox");
    const specialityList = document.getElementById("specialityList");
    const popularContainer = document.getElementById("popularContainer");

    // Hardcoded data
    const popularSearches = ["Hysterectomy", "Normal Delivery"];

    const specialities = [
        "Dentist",
        "Cardiologist",
        "Gynecologist",
        "General Physician",
        "Dermatologist",
        "ENT Specialist",
        "Homeopath",
        "Ayurveda"
    ];

    //Render Popular
    function renderPopular() {
        if (!popularContainer) return;

        popularContainer.innerHTML = popularSearches.map(item => `
            <div class="popular-item" data-value="${item}">${item}</div>
        `).join("");
    }

    //Render Specialities
    function renderSpecialities(list = specialities) {
        if (!specialityList) return;

        specialityList.innerHTML = list.map(spec => `
            <div class="speciality-item" data-value="${spec}">
                <span>${spec}</span>
                <span>SPECIALITY</span>
            </div>
        `).join("");
    }

    // Show dropdown on focus
    searchInput?.addEventListener("focus", () => {
        suggestionBox?.classList.remove("hidden");
        renderPopular();
        renderSpecialities();
    });

    //Filter on typing
    searchInput?.addEventListener("input", () => {
        const value = searchInput.value.toLowerCase();

        const filtered = specialities.filter(s =>
            s.toLowerCase().includes(value)
        );

        renderSpecialities(filtered);
    });

    //Handle click on suggestion
    document.addEventListener("click", (e) => {

        const item = e.target.closest(".speciality-item, .popular-item");

        if (item) {
            const value = item.dataset.value;
            searchInput.value = value;
            suggestionBox.classList.add("hidden");
            return;
        }

        // Hide dropdown if clicked outside
        if (!e.target.closest(".search-wrapper")) {
            suggestionBox?.classList.add("hidden");
        }
    });

    fetch(`${API_BASE_URL}/api/userName`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + tkn
        }
    })
    .then(response => response.json())
    .then(data => {
        const username = data.userName;
        const elements = document.getElementsByClassName('welcome-message');
        for (let element of elements) {
            element.textContent = username ? username : 'Welcome, Guest';
        }
    })
    .catch(error => console.error('Error fetching the username:', error));

    // Profile Dropdown Toggle
    document.getElementById('profileImg')?.addEventListener('click', function () {
        const dropdown = document.getElementById('dropdownMenu');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    // Close Dropdown when Clicking Outside
    document.addEventListener("click", function (event) {
        const dropdown = document.getElementById("dropdownMenu");
        if (dropdown && event.target.id !== "profileImg" && !dropdown.contains(event.target)) {
            dropdown.style.display = "none";
        }
    });



    // Get the form element
    const form = document.getElementById('appointmentForm');

    if (form) {
        console.log("Form found! Adding event listener.");
        form.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent default form submission

            // Get input values
            const location = document.getElementById('location').value;
            const specialization = document.getElementById('specialization').value;

            // Validate inputs
            if (location && specialization) {

                if (!tkn) {
                    alert('You are not authenticated. Please log in first.');
                    window.location.href = './login.html';  // Redirect to login if no token
                    return;
                }

                // Fetch data from the backend with Authorization header
                fetch(`${API_BASE_URL}/api/v1/doctor/search?location=${encodeURIComponent(location)}&specialization=${encodeURIComponent(specialization)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + tkn,  // Attach the token
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.status === 401 || response.status === 403) {
                        alert('Session expired or unauthorized. Please log in again.');
                        sessionStorage.clear();
                        window.location.href = './login';
                        return Promise.reject('Unauthorized');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.length === 0) {
                        sessionStorage.removeItem('doctorData');
                        window.location.href = './book.html';
                    } else {
                        sessionStorage.setItem('doctorData', JSON.stringify(data));
                        sessionStorage.setItem('searchLocation', location);
                        sessionStorage.setItem('searchSpecialization', specialization);
                        window.location.href = './book.html';
                        // window.location.href = `${API_BASE_URL}/api/bookAppointment/book?location=${encodeURIComponent(location)}&specialization=${encodeURIComponent(specialization)}`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while searching for doctors. Please try again.');
                });
            } else {
                alert('Please fill in both location and specialization fields.');
            }

        });
    }

});


// Attach logout function to a button (Optional)
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            sessionStorage.clear();
            sessionStorage.setItem("logoutMessage", "You’re now logged out.");
            window.location.replace("./login.html");
        });
    }
});