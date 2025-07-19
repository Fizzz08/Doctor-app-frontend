const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"  // Local Development
    : "https://chikithsa.netlify.app"; // Netlify Deployment

// document.addEventListener('DOMContentLoaded', function () {
//     console.log("🏠 Home Page Loaded");
//     const tkn = localStorage.getItem("token"); 
//     console.log("jwt token :",tkn);

//     fetch('http://localhost:8080/api/userName', {
//         method: 'GET',
//         headers: {
//             'Authorization': 'Bearer ' + tkn
//         }
//     })
//     .then(response => response.text())
//     .then(username => {
//         const elements = document.getElementsByClassName('welcome-message');
//         for (let element of elements) {
//             element.textContent = username !== 'User not found' ? username : 'Welcome, Guest';
//         }
//     })
//     .catch(error => console.error('Error fetching the username:', error));


    document.addEventListener('DOMContentLoaded', function () {
    console.log("🏠 Home Page Loaded");
    const tkn = localStorage.getItem("token"); 
    console.log("jwt token :", tkn);

    fetch('http://localhost:8080/api/userName', {
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
                    window.location.href = BASE_URL + '/myPage/HTML/login.html';  // Redirect to login if no token
                    return;
                }

                // Fetch data from the backend with Authorization header
                fetch(`http://localhost:8080/api/v1/doctor/search?location=${encodeURIComponent(location)}&specialization=${encodeURIComponent(specialization)}`, {
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
                        window.location.href = '/login';
                        return Promise.reject('Unauthorized');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.length === 0) {
                        sessionStorage.removeItem('doctorData');
                        window.location.href = BASE_URL + '/myPage/HTML/book.html';
                    } else {
                        sessionStorage.setItem('doctorData', JSON.stringify(data));
                        sessionStorage.setItem('searchLocation', location);
                        sessionStorage.setItem('searchSpecialization', specialization);
                        window.location.href = BASE_URL + '/myPage/HTML/book.html';
                        // window.location.href = `http://localhost:8080/api/bookAppointment/book?location=${encodeURIComponent(location)}&specialization=${encodeURIComponent(specialization)}`;
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
            sessionStorage.setItem("logoutMessage", "Successfully logged out"); // Set message
            localStorage.clear();
            window.location.href = "http://localhost:3000/myPage/HTML/login.html"; // Redirect
        });
    }
});