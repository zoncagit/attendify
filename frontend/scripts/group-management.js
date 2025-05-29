import CONFIG from './config.js';
import utils from './utils.js';

export async function addGroup(classId, groupName) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: groupName })
        });

        if (!response.ok) {
            throw new Error('Failed to add group');
        }

        const newGroup = await response.json();
        utils.showToast('Group added successfully', 'success');
        return newGroup;
    } catch (error) {
        utils.showToast('Error adding group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function deleteGroup(classId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete group');
        }

        utils.showToast('Group deleted successfully', 'success');
    } catch (error) {
        utils.showToast('Error deleting group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getGroups(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/groups`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get groups');
        }

        return await response.json();
    } catch (error) {
        utils.showToast('Error loading groups', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getGroupStudents(classId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/groups/${groupId}/students`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get group students');
        }

        return await response.json();
    } catch (error) {
        utils.showToast('Error loading group students', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function moveStudentToGroup(classId, studentId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/students/${studentId}/group`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ groupId })
        });

        if (!response.ok) {
            throw new Error('Failed to move student to group');
        }

        utils.showToast('Student moved to group successfully', 'success');
    } catch (error) {
        utils.showToast('Error moving student to group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

export async function getGroupCount(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/classes/${classId}/groups/count`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get group count');
        }

        const data = await response.json();
        return data.count;
    } catch (error) {
        utils.showToast('Error getting group count', 'error');
        console.error('Error:', error);
        return 0;
    }
} 