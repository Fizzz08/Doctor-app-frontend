

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const successBox = document.getElementById("success-message");

    // Show post-registration success toast (set by register page)
    const msg = sessionStorage.getItem("registrationMessage");
    if (msg && successBox) {
        successBox.textContent = msg;
        successBox.classList.add("show");
        sessionStorage.removeItem("registrationMessage");
        setTimeout(() => successBox.classList.remove("show"), 4000);
    }

    // ---------- Password visibility toggles ----------
    document.querySelectorAll(".toggle-pass").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;
            input.type = input.type === "password" ? "text" : "password";
        });
    });

    // ---------- Enable button only when required fields filled ----------
    function checkFormCompletion() {
        let allFilled = true;
        document.querySelectorAll("#loginForm input[required]").forEach(input => {
            if (input.value.trim() === "") allFilled = false;
        });
        loginButton.disabled = !allFilled;
    }

    document.querySelectorAll("#loginForm input").forEach(input => {
        input.addEventListener("input", checkFormCompletion);
    });

    function validateEmail() {
        const email = document.getElementById("email").value.trim();
        const emailError = document.getElementById("email-error");
        const emailPattern = /^[a-z][a-z0-9._%+-]*@[a-z0-9.-]+.[a-z]{2,4}$/;

        if (!emailPattern.test(email)) {
            emailError.textContent = "Please enter a valid email address.";
            emailError.style.display = "block";
            return false;
        }
        emailError.style.display = "none";
        return true;
    }

    async function handleLogin(event) {
        event.preventDefault();
        if (!validateEmail()) return;

        const payload = {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim()
        };

        try {
            // Send login request to backend
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (data.token) sessionStorage.setItem("token", data.token);
                if (data.role) sessionStorage.setItem("userRole", data.role);

                // Fetch home page or role-specific dashboard using the token
                const storedToken = sessionStorage.getItem("token");
                if (storedToken) {
                    const homeResponse = await fetch(`${API_BASE_URL}/api/Home`, {
                        method: "GET",
                        headers: {
                            "Authorization": "Bearer " + storedToken, // Include token in the header
                        },
                        credentials: "include",
                    });

                    if (!homeResponse.ok) {
                        alert("Error accessing Home. Please try again.");
                        return;
                    }

                    // Store user info in sessionStorage and navigate to the respective dashboard
                    sessionStorage.setItem("userEmail", payload.email);
                    sessionStorage.setItem("loggedIn", "true");
                    const role = data.role?.trim().toUpperCase();
                    sessionStorage.setItem('role', role);
                    
                    if (role === 'ADMIN') {
                        window.location.href = "./admin-dashboard.html";
                    } else if (role === "DOCTOR") {
                        window.location.href = './doctor-dashboard.html';
                    } else {
                        window.location.href = './Home.html';
                    }
                } else {
                    alert("No token found. Please try again.");
                }
            } else {
                alert(data.message || "Invalid email or password.");
            }
        } catch (error) {
            alert("Could not connect to the server. Please try again.");
            console.error("Login error:", error);
        }
    }

    form.addEventListener("submit", handleLogin);
});

// Registration message handling
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

document.addEventListener("DOMContentLoaded", function () {
    const logoutMessage = sessionStorage.getItem("logoutMessage");

    if (logoutMessage) {
        const messageDiv = document.getElementById("logout-message");

        if (messageDiv) {
            messageDiv.textContent = logoutMessage;
            messageDiv.style.display = "block";

            function removeLogoutMessage() {
                messageDiv.style.display = "none"; // safer than remove()
                sessionStorage.removeItem("logoutMessage"); // important
                document.removeEventListener("click", removeLogoutMessage);
            }

            setTimeout(removeLogoutMessage, 3000);
            document.addEventListener("click", removeLogoutMessage, { once: true });
        }
    }
});