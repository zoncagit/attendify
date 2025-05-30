import CONFIG from './config.js';
import utils from './utils.js';

/**
 * Add a new group to a class
 * @param {number} classId - The ID of the class to add the group to
 * @param {string} groupName - The name for the new group
 * @returns {Promise<object>} - The created group data
 */
export async function addGroup(classId, groupName) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.ADD_GROUP(classId)}`, {
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to add group');
        }        const newGroup = await response.json();
        utils.showNotification('Group added successfully', 'success');
        return newGroup;
    } catch (error) {
        utils.showNotification('Error adding group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Delete a group from a class
 * @param {number} classId - The ID of the class containing the group
 * @param {number} groupId - The ID of the group to delete
 * @returns {Promise<void>}
 */
export async function deleteGroup(classId, groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.DELETE_GROUP(classId, groupId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to delete group');
        }        utils.showNotification('Group deleted successfully', 'success');
    } catch (error) {
        utils.showNotification('Error deleting group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

// moveStudentToGroup function has been removed as it is not supported by the backend API

/**
 * Get all users in a group
 * @param {number} groupId - The ID of the group
 * @returns {Promise<Array<object>>} - List of users in the group
 */
export async function getGroupUsers(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.GET_GROUP_USERS(groupId)}`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to get group users');
        }
        return await response.json();
    } catch (error) {
        utils.showNotification('Error loading group users', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Get all groups in a class
 * @param {number} classId - The ID of the class
 * @returns {Promise<Array<object>>} - List of group objects
 */
export async function getGroups(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.GET_CLASS_GROUPS(classId)}`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to get groups');
        }
        return await response.json();
    } catch (error) {
        utils.showNotification('Error loading groups', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Join a group using its code
 * @param {string} groupCode - The unique code of the group to join
 * @returns {Promise<object>} - The response data from joining the group
 */
export async function joinGroup(groupCode) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.JOIN_GROUP(groupCode)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to join group');
        }

        utils.showNotification('Successfully joined group', 'success');
        return await response.json();
    } catch (error) {
        utils.showNotification('Error joining group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Leave a group
 * @param {number} groupId - The ID of the group to leave
 * @returns {Promise<void>}
 */
export async function leaveGroup(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.LEAVE_GROUP(groupId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to leave group');
        }
        
        utils.showNotification('Successfully left the group', 'success');
    } catch (error) {
        utils.showNotification('Error leaving group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Get the count of groups in a class
 * @param {number} classId - The ID of the class
 * @returns {Promise<number>} - The count of groups
 */
export async function getGroupCount(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.GET_CLASS_GROUP_COUNT(classId)}`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to get group count');
        }
        
        const data = await response.json();
        return data.count || 0;
    } catch (error) {
        utils.showNotification('Error getting group count', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Get the count of users in a class
 * @param {number} classId - The ID of the class
 * @returns {Promise<number>} - The count of users
 */
export async function getUserCount(classId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.GET_CLASS_USER_COUNT(classId)}`, {
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to get user count');
        }
        
        const data = await response.json();
        return data.count || 0;
    } catch (error) {
        utils.showNotification('Error getting user count', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Remove a user from a group
 * @param {string} groupCode - The code of the group
 * @param {number} userId - The ID of the user to remove
 */
export async function removeUserFromGroup(groupCode, userId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.REMOVE_USER_FROM_GROUP(groupCode, userId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`
            }
        });        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to remove user from group');
        }

        utils.showNotification('User removed from group successfully (if this was their only group, they have also been removed from the class)', 'success');
    } catch (error) {
        utils.showNotification('Error removing user from group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Update an existing group
 * @param {number} classId - The ID of the class
 * @param {number} groupId - The ID of the group to update
 * @param {string} groupName - The new name for the group
 * @returns {Promise<object>} - The updated group data
 */
export async function updateGroup(classId, groupId, groupName) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.UPDATE_GROUP(classId, groupId)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                group_name: groupName
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to update group');
        }

        utils.showNotification('Group updated successfully', 'success');
        return await response.json();
    } catch (error) {
        utils.showNotification('Error updating group', 'error');
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Update an existing class
 * @param {number} classId - The ID of the class to update
 * @param {string} className - The new name for the class
 * @returns {Promise<object>} - The updated class data
 */
export async function updateClass(classId, className) {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.UPDATE_CLASS(classId)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${utils.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                class_name: className
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to update class');
        }

        utils.showNotification('Class updated successfully', 'success');
        return await response.json();
    } catch (error) {
        utils.showNotification('Error updating class', 'error');
        console.error('Error:', error);
        throw error;
    }
}