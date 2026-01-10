import CONFIG from './config.js';
import utils from './utils.js';

export async function addStudent(classId, studentData) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error('Failed to add student');
        }        const newStudent = await response.json();
        utils.showNotification('Student added successfully', 'success');
        return newStudent;
    } catch (error) {
        utils.showNotification('Error adding student', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function deleteStudent(classId, studentId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/users/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete student');
        }        utils.showNotification('Student removed successfully', 'success');
    } catch (error) {
        utils.showNotification('Error removing student', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getStudents(classId, groupId = null) {
    try {
        let url = `${CONFIG.API_URL}/api/v1/classes/${classId}/users`;
        if (groupId) {
            url += `?groupId=${groupId}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get students');
        }        return await response.json();
    } catch (error) {
        utils.showNotification('Error loading students', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function updateStudent(classId, studentId, studentData) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/users/${studentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error('Failed to update student');
        }
        utils.showNotification('Student updated successfully', 'success');
        return await response.json();
    } catch (error) {
        utils.showNotification('Error updating student', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function importStudents(classId, fileData) {
    try {
        const formData = new FormData();
        formData.append('file', fileData);

        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/users/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to import students');
        }        const result = await response.json();
        utils.showNotification(`Successfully imported ${result.imported} students`, 'success');
        return result;
    } catch (error) {
        utils.showNotification('Error importing students', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function exportStudents(classId, format = 'xlsx') {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/users/export?format=${format}`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to export students');
        }

        const blob = await response.blob();
        const fileName = `students_${classId}_${new Date().toISOString().split('T')[0]}.${format}`;
        
        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        utils.showToast('Students exported successfully', 'success');
    } catch (error) {
        utils.showToast('Error exporting students', 'error');
        console.error('Error:', error);
        throw error;
    }
} 