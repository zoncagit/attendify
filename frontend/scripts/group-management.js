import CONFIG from './config.js';
import utils from './utils.js';

const API_URL = 'http://127.0.0.1:8000/api/v1/classes';
  const ENDPOINTS = {
    ENROLLED_CLASSES: `${API_URL}/api/v1/classes`,
    TUTORED_CLASSES: `${API_URL}/api/v1/classes`,
    ENROLL_CLASS: `${API_URL}/api/v1/classes/enroll`,
    CREATE_CLASS: `${API_URL}/api/v1/classes/`,  // POST to root of classes
    ADD_GROUP: (groupCode) => `${API_URL}/api/v1/classes/groups/join/${groupCode}`,
    DELETE_GROUP : (groupID) =>  `${API_URL}/api/v1/classes/groups/${groupID}`, 
    DELETE_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}`, // Fixed double slash and removed {class_id} template

    QUIT_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}/leave`,

    USER_PROFILE:(userId) => `${API_URL}/api/v1/users/${userId}/me`,
    // New endpoints
    GET_CLASS: (classId) => `${API_URL}/api/v1/classes/${classId}`,
    CREATE_GROUP: (classId) => `${API_URL}/api/v1/classes/${classId}/groups`,
    LIST_CLASS_GROUPS: (classId) => `${API_URL}/api/v1/classes/${classId}`,
    GET_CLASS_USERS: (classId) => `${API_URL}/api/v1/classes/${classId}/users`,
    GET_GROUP_USERS: (groupId) => `${API_URL}/api/v1/classes/groups/${groupId}/users`,
    REMOVE_USER_FROM_GROUP: (groupCode, userId) => `${API_URL}/api/v1/groups/groups/${groupCode}/members/${userId}`,
    GET_CLASS_GROUPS: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}`,
    GET_GROUP_COUNT: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}/count`,
    GET_USER_COUNT: (classId) => `${API_URL}/api/v1/groups/groups/class/${classId}/users/count`
  };

export async function addGroup(className, classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth('http://127.0.0.1:8000/api/v1/classes/api/v1/classes/${classId}/groups', {
          method: 'POST',
          body: JSON.stringify({
            class_name: className,
            class_id: parseInt(classId)
          })
        });
  
        if (ok) {  
  
          utils.showNotification(`Class "${data.class_name}" created successfully with code: ${data.class_code}`, 'success');
            loadTutoredClasses();
        } else {
          throw new Error(data.detail || 'Failed to create class');
        }
      } catch (error) {
        utils.showNotification(error.message, 'error');
        console.error('Error creating class:', error);
      }
    }
  

export async function deleteGroup(groupId) {
    try {
        const response = await fetch(ENDPOINTS.DELETE_GROUP(groupId), {
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

export async function moveStudentToGroup(groupId, studentId) {
    try {
        const response = await fetch(ENDPOINTS.MOVE_STUDENT_TO_GROUP(groupId, studentId), {
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

export async function getGroupStudents(groupId) {
    try {
        const response = await fetch(ENDPOINTS.GET_GROUP_USERS(groupId), {
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

export async function getGroups(classId) {
    try {
        const response = await fetch(ENDPOINTS.GET_CLASS_GROUPS(classId), {
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

export async function getClassStudents(classId) {
    try {
        const response = await fetch(ENDPOINTS.GET_CLASS_USERS(classId), {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get students');
        }

        const users = await response.json();
        // Filter for students (assuming students have class_role = 'student')
        return users.filter(user => user.class_role === 'student');
    } catch (error) {
        utils.showToast('Error loading students', 'error');
        console.error('Error:', error);
        throw error;
    }
}