import CONFIG from './config.js';
import utils from './utils.js';

export async function addStudent(classId, studentData) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/students`, {
            method: 'POST',
            body: JSON.stringify(studentData)
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to add student');
        }
        utils.showNotification('Student added successfully', 'success');
        return data;
    } catch (error) {
        console.error('Error adding student:', error);
        utils.showNotification('Failed to add student', 'error');
        throw error;
    }
}

export async function deleteStudent(classId, studentId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/students/${studentId}`, {
            method: 'DELETE'
        });

        if (!ok && data) {
            throw new Error(data.detail || 'Failed to delete student');
        }
        utils.showNotification('Student removed successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting student:', error);
        utils.showNotification('Failed to remove student', 'error');
        throw error;
    }
}

export async function getStudents(classId, groupId = null) {
    try {
        const endpoint = groupId 
            ? `${CONFIG.API_URL}/api/v1/classes/${classId}/groups/${groupId}/students`
            : `${CONFIG.API_URL}/api/v1/classes/${classId}/students`;

        const { ok, data } = await utils.fetchWithAuth(endpoint);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch students');
        }
        return data;
    } catch (error) {
        console.error('Error fetching students:', error);
        utils.showNotification('Failed to load students', 'error');
        throw error;
    }
}

export async function updateStudent(classId, studentId, studentData) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to update student');
        }
        utils.showNotification('Student updated successfully', 'success');
        return data;
    } catch (error) {
        console.error('Error updating student:', error);
        utils.showNotification('Failed to update student', 'error');
        throw error;
    }
}

export async function importStudents(classId, fileData) {
    try {
        const formData = new FormData();
        formData.append('file', fileData);

        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/students/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to import students');
        }

        const result = await response.json();
        utils.showToast(`Successfully imported ${result.imported} students`, 'success');
        return result;
    } catch (error) {
        utils.showToast('Error importing students', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function exportStudents(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/students/export`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to export students');
        }

        // Create a blob from the response and download it
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${classId}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        utils.showNotification('Students exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting students:', error);
        utils.showNotification('Failed to export students', 'error');
        throw error;
    }
}

export async function getStudentCount(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/students/count`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get student count');
        }

        const data = await response.json();
        return data.count;
    } catch (error) {
        utils.showToast('Error getting student count', 'error');
        console.error('Error:', error);
        return 0;
    }
} 