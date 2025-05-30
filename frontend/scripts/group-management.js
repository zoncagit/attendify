import utils from './utils.js'; 
const API_URL = 'http://127.0.0.1:8000/api/v1/classes';
const ENDPOINTS = {
  ENROLLED_CLASSES: `${API_URL}/api/v1/classes`,
  TUTORED_CLASSES: `${API_URL}/api/v1/classes`,
  ENROLL_CLASS: `${API_URL}/api/v1/classes/enroll`,
  CREATE_CLASS: `${API_URL}/api/v1/classes`,  // POST to root of classes
  DELETE_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}`, // Fixed double slash and removed {class_id} template

  QUIT_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}/leave`,

  USER_PROFILE: `http://127.0.0.1:8000/api/v1/users/me`,
  // New endpoints
  GET_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}`,
  CREATE_GROUP: (classId) => `${API_URL}/api/v1/classes/${classId}/groups`,
  LIST_CLASS_GROUPS: (classId) => `${API_URL}/api/v1/classes/${classId}`,
  GET_CLASS_USERS: (classId) => `${API_URL}/api/v1/classes/${classId}/users`,
  GET_GROUP_USERS: (groupId) => `${API_URL}/api/v1/classes/groups/${groupId}/users`,
  REMOVE_USER_FROM_GROUP: (groupCode, userId) => `${API_URL}/api/v1/groups/groups/${groupCode}/members/${userId}`,
  GET_CLASS_GROUPS: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}`,
  GET_GROUP_COUNT: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}/count`,
  GET_USER_COUNT: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}/users/count`,
  JOIN_GROUP: (groupCode) => `${API_URL}/api/v1/classes/groups/join/${groupCode}`,
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
        const response = await fetch(ENDPOINTS.GET_GROUPS(classId), {

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