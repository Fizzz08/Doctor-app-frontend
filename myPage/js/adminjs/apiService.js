// API base URLs configuration
const BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://chikithsa.netlify.app";

const apiBaseUrl = 'http://localhost:8080/api/v1/doctor';


//Fetches all doctors from the API
export async function fetchAllDoctors() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Unauthorized access. Please log in again.');
        window.location.href = BASE_URL + '/myPage/HTML/login.html';
        return;
    }

    const response = await fetch(`${apiBaseUrl}/getAll`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch doctors');
    return await response.json();
}

/**
 * Updates a doctor's information
 * @param {string} id - Doctor ID
 * @param {Object} updatedDoctor - Updated doctor data
 * @returns {Promise<Object>} Updated doctor object
 * @throws {Error} If request fails
 */
export async function updateDoctor(id, updatedDoctor) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBaseUrl}/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedDoctor)
    });

    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

/**
 * Adds a new doctor
 * @param {Object} newDoctor - New doctor data
 * @returns {Promise<Object>} Added doctor object
 * @throws {Error} If request fails
 */
export async function addNewDoctor(newDoctor) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBaseUrl}/add`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDoctor)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add doctor');
    }
    return await response.json();
}

/**
 * Deletes a doctor
 * @param {string} id - Doctor ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If request fails
 */
export async function deleteDoctorById(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBaseUrl}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete doctor');
}