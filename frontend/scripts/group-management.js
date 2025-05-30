import utils from './utils.js';

// Base API URL without any path segments
const API_BASE = 'http://127.0.0.1:8000';

const ENDPOINTS = {
  // Class endpoints
  ENROLLED_CLASSES: `${API_BASE}/api/v1/classes/enrolled`,
  TUTORED_CLASSES: `${API_BASE}/api/v1/classes/tutored`,
  ENROLL_CLASS: `${API_BASE}/api/v1/classes/enroll`,
  CREATE_CLASS: `${API_BASE}/api/v1/classes`,
  DELETE_CLASS: (classId) => `${API_BASE}/api/v1/classes/${classId}`,
  QUIT_CLASS: (classId) => `${API_BASE}/api/v1/classes/${classId}/leave`,
  
  // User profile endpoint
  USER_PROFILE: `${API_BASE}/api/v1/users/me`,
  
  // Group endpoints
  GET_CLASS: (classId) => `${API_BASE}/api/v1/classes/${classId}`,
  CREATE_GROUP: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/groups`,
  DELETE_GROUP: (classId, groupId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/groups/${groupId}`,
  LIST_CLASS_GROUPS: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/groups`,
  GET_CLASS_USERS: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/users`,
  GET_GROUP_USERS: (groupId) => `${API_BASE}/api/v1/classes/api/v1/classes/groups/${groupId}/users`,
  REMOVE_USER_FROM_GROUP: (groupCode, userId) => 
    `${API_BASE}/api/v1/groups/groups/${groupCode}/members/${userId}`,
  GET_CLASS_GROUPS: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/groups`,
  GET_GROUP_COUNT: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/groups/count`,
  GET_USER_COUNT: (classId) => `${API_BASE}/api/v1/classes/api/v1/classes/${classId}/users/count`,
  JOIN_GROUP: (groupCode) => `${API_BASE}/api/v1/classes/groups/join/${groupCode}`,
};

export async function createGroup(classId, groupName) {
    try {
        const response = await fetch(ENDPOINTS.CREATE_GROUP(classId), {
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
        const response = await fetch(ENDPOINTS.DELETE_GROUP(classId, groupId), {
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
        const response = await fetch(ENDPOINTS.MOVE_STUDENT_TO_GROUP(classId, studentId), {
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
        const response = await fetch(ENDPOINTS.GET_GROUP_STUDENTS(classId, groupId), {
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
        const response = await fetch(ENDPOINTS.LIST_CLASS_GROUPS(classId), {

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