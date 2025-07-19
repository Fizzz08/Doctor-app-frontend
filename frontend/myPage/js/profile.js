document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const userEmail = sessionStorage.getItem("userEmail");
    const profileForm = document.getElementById("profileForm");
    const editButton = document.getElementById("editButton");
    const saveButton = document.getElementById("saveButton");
    const inputs = document.querySelectorAll("#profileForm input, #profileForm select, #profileForm textarea");

    // Pre-fill email if you add it to form
    if (profileForm.email) {
        profileForm.email.value = userEmail || "Not Available";
        profileForm.email.readOnly = true;
    }

    function setFormEditable(isEditable) {
        inputs.forEach(input => {
            if (input.name !== "email") {
                input.readOnly = !isEditable;
                if (input.tagName === "SELECT") input.disabled = !isEditable;
            }
        });
        saveButton.hidden = !isEditable;
        editButton.hidden = isEditable;
    }

    setFormEditable(false);  // Start with form in read-only mode

    async function loadProfile() {
        if (!token) {
            alert("No token found. Please log in.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/v1/userProfile/get-profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                
                const profileData = await response.json();
                profileForm.firstName.value = profileData.firstName || "";
                profileForm.lastName.value = profileData.lastName || "";
                profileForm.gender.value = profileData.gender || "";
                profileForm.dob.value = profileData.dateOfBirth || "";
                profileForm.address.value = profileData.address || "";
                profileForm.phone.value = profileData.phoneNumber || "";
                profileForm.emergencyContact.value = profileData.alternateNumber || "";
            } else {
                console.warn("No profile found — starting fresh.");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    }

    editButton.addEventListener("click", () => {
        setFormEditable(true);
    });

    saveButton.addEventListener("click", async function (e) {
        e.preventDefault();

        if (!validateProfileForm()) {
            alert("Please fill in all required fields.");
            return;
        }

        const formData = {
            firstName: profileForm.firstName.value.trim(),
            lastName: profileForm.lastName.value.trim(),
            gender: profileForm.gender.value.trim(),
            dateOfBirth: profileForm.dob.value.trim(),
            address: profileForm.address.value.trim(),
            phoneNumber: profileForm.phone.value.trim(),
            alternateNumber: profileForm.emergencyContact.value.trim()
        };

        const url = `http://localhost:8080/api/v1/userProfile/add?email=${encodeURIComponent(userEmail)}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert("Profile updated successfully!");

                // Force full page reload to re-fetch latest data
                setTimeout(() => {
                    window.location.reload(true);
                }, 100);
                setFormEditable(false);
                loadProfile();  
            } else {
                const errorText = await response.text();
                console.error("Error saving profile:", errorText);
                alert("Failed to save profile. Please try again.");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        }
    });

    function validateProfileForm() {
        let isValid = true;
        ["firstName", "gender", "dob", "address", "phone", "emergencyContact"].forEach(field => {
            const input = profileForm[field];
            const errorElement = document.getElementById(field + "Error");
            if (input.value.trim() === "") {
                errorElement.style.display = 'inline';
                isValid = false;
            } else {
                errorElement.style.display = 'none';
            }
        });
        return isValid;
    }

    loadProfile();  // Initial load on page ready
});
