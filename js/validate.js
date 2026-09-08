document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("myForm");
    const registerButton = document.querySelector("button[type='submit']");
    const successMessageBox = document.getElementById("success-message");

    // Disable Register Button Initially
    registerButton.disabled = true;

    // Enable Button Only if All Fields Are Filled
    function checkFormCompletion() {
        let allFilled = true;
        document.querySelectorAll("#myForm input[required]").forEach(input => {
            if (input.value.trim() === "") {
                allFilled = false;
            }
        });
        registerButton.disabled = !allFilled;
    }

    document.querySelectorAll("#myForm input").forEach(input => {
        input.addEventListener("input", checkFormCompletion);
    });

    function validateEmail() {
        const email = document.getElementById("email").value.trim();
        const emailError = document.getElementById("email-error");
        const emailPattern = /^[a-z][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,4}$/;

        if (!emailPattern.test(email)) {
            emailError.textContent = "Invalid email format!";
            emailError.style.display = "block";
            return false;
        }
        emailError.style.display = "none";
        return true;
    }

    async function emailExist() {
        const email = document.getElementById("email").value.trim();
        const emailError = document.getElementById("email-error");

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users/check-email?email=${encodeURIComponent(email)}`);
            const isEmailExists = await response.json();

            if (isEmailExists) {
                emailError.textContent = "This email is already registered!";
                emailError.style.display = "block";
                return true;
            } else {
                emailError.style.display = "none";
                return false;
            }
        } catch (error) {
            emailError.textContent = "Error validating email. Try again.";
            emailError.style.display = "block";
            return false;
        }
    }

    function validatePassword() {
        const password = document.getElementById("password").value.trim();
        const passwordError = document.getElementById("password-error");
        const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!passwordPattern.test(password)) {
            passwordError.textContent = "Password must be 8+ chars, include a number & a symbol.";
            passwordError.style.display = "block";
            return false;
        }
        passwordError.style.display = "none";
        return true;
    }

    function validateConfirmPassword() {
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const confirmPasswordError = document.getElementById("confirm-password-error");

        if (password !== confirmPassword) {
            confirmPasswordError.textContent = "Passwords do not match!";
            confirmPasswordError.style.display = "block";
            return false;
        }
        confirmPasswordError.style.display = "none";
        return true;
    }

    document.getElementById("password").addEventListener("input", validateConfirmPassword);
    document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);

    async function validateForm(event) {
        event.preventDefault();

        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();

        if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        const isEmailExists = await emailExist();
        if (isEmailExists) return;

        // ===== ROLE SELECTION (NEW) =====
        const selectedRole =
            document.querySelector('input[name="role"]:checked')?.value || "USER";

        // Create JSON object
        const userData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value.trim(),
            role: document.querySelector('input[name="role"]:checked').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const responseData = await response.json();

            if (response.ok) {
                sessionStorage.setItem("registrationMessage", "Registration successful! Please log in.");
                window.location.href = "login.html";
            } else {
                alert(responseData.message || "Registration failed. Try again.");
            }

        } catch (error) {
            alert("Error connecting to the server. Try again.");
            console.error("Error:", error);
        }
    }

    form.addEventListener("submit", validateForm);
});
