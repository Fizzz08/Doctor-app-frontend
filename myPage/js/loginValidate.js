const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"  // Local Development
    : "https://chikithsa.netlify.app"; // Netlify Deployment



async function validateLoginForm(event) {
    event.preventDefault(); 

    // const BASE_URL = "http://localhost:3000";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none"; 

    try {
        // Send login request to backend
        const response = await fetch("http://localhost:8080/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Login failed:", data);
            errorMessage.style.display = "block";
            errorMessage.textContent = data.error || "Login failed";
            return; 
        }

        if (data.token) {
            localStorage.setItem("token", data.token);
            console.log("Token stored:", data.token);

            // Retrieve token from localStorage
            const storedToken = localStorage.getItem("token");
            console.log("Retrieved token:", storedToken);

            if (!storedToken) {
                console.error("No token found in localStorage");
                errorMessage.style.display = "block";
                errorMessage.textContent = "Token not found. Please try again.";
                return;
            }

            // Fetch the home page using the token
            try {
                const homeResponse = await fetch("http://localhost:8080/api/Home", {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + storedToken, // Include token in the header
                    },
                    credentials: "include",
                });

                if (!homeResponse.ok) {
                    throw new Error("Failed to fetch home page");
                }

                sessionStorage.setItem("userEmail", email);
                sessionStorage.setItem("loggedIn", "true");
                sessionStorage.setItem('role', data.role);      
                if (data.role === 'ADMIN') {
                    window.location.href = BASE_URL + '/myPage/HTML/admin-dashboard.html'; 
                } else {
                    window.location.href = BASE_URL + '/myPage/HTML/Home.html';
                }
                
            } catch (homeError) {
                console.error("Error accessing Home:", homeError);
                errorMessage.style.display = "block";
                errorMessage.textContent = "Failed to access Home. Please try again.";
            }
        }
    } catch (error) {
        console.error("Error:", error);
        errorMessage.style.display = "block";
        errorMessage.textContent = "An error occurred. Please try again.";
    }
}



//registration message handling
document.addEventListener("DOMContentLoaded", function () {
    const registrationMessage = sessionStorage.getItem("registrationMessage");
    const messageDiv = document.getElementById("successMessageBox");

    if (registrationMessage && messageDiv) {
        messageDiv.textContent = registrationMessage;
        messageDiv.style.display = "block";

        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.style.display = "none";
            sessionStorage.removeItem("registrationMessage"); 
        }, 3000);
    }
});



// Log-out message handling
document.addEventListener("DOMContentLoaded", function () {
    const logoutMessage = sessionStorage.getItem("logoutMessage");

    if (logoutMessage) {
        const messageDiv = document.getElementById("logout-message");

        if (messageDiv) { // Ensure element exists
            messageDiv.textContent = logoutMessage;
            messageDiv.style.display = "block";

            // Function to remove the message
            function removeLogoutMessage() {
                messageDiv.remove(); // Remove the message
                sessionStorage.clear();
                document.removeEventListener("click", removeLogoutMessage); // Prevent duplicate listeners
            }
            setTimeout(removeLogoutMessage, 3000);
            document.addEventListener("click", removeLogoutMessage, { once: true });
        }
    }
});