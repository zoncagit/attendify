import CONFIG from './config.js';
import utils from './utils.js';

export async function addGroup(classId, groupName) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                group_name: groupName,
                class_id: parseInt(classId)  // Ensure class_id is an integer
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add group');
        }        const newGroup = await response.json();
        utils.showNotification('Group added successfully', 'success');
        return newGroup;
    } catch (error) {
        utils.showNotification('Error adding group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function deleteGroup(classId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete group');
        }        utils.showNotification('Group deleted successfully', 'success');
    } catch (error) {
        utils.showNotification('Error deleting group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function moveStudentToGroup(classId, studentId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/students/${studentId}/group`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ groupId })
        });

        if (!response.ok) {
            throw new Error('Failed to move student to group');
        }        utils.showNotification('Student moved to group successfully', 'success');
    } catch (error) {
        utils.showNotification('Error moving student to group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getGroupStudents(classId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/groups/${groupId}/students`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get group students');
        }        return await response.json();
    } catch (error) {
        utils.showNotification('Error loading group students', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getGroups(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/v1/classes/${classId}/groups`, {

            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get groups');
        }        return await response.json();
    } catch (error) {
        utils.showNotification('Error loading groups', 'error');
        console.error('Error:', error);
        throw error;
    }
} 