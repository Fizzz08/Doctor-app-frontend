//Fetches all doctors from the API
export async function fetchAllDoctors() {
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Unauthorized access. Please log in again.');
        window.location.href = BASE_URL + '/myPage/HTML/login.html';
        return;
    }

    const response = await fetch(`${API_BASE_URL}/getAll`, {
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
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/doctor/${id}`, {
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
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/doctor/add`, {
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
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/doctor/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete doctor');
}