import CONFIG from './config.js';
import utils from './utils.js';

export async function getGroups(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/groups/class/${classId}`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch groups');
        }
        return data;
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
}

export async function addGroup(classId, groupName) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/groups`, {
            method: 'POST',
            body: JSON.stringify({
                group_name: groupName,
                class_id: classId
            })
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to create group');
        }
        return data;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
}

export async function deleteGroup(classId, groupId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/groups/${groupId}`, {
            method: 'DELETE'
        });

        if (!ok && data) {
            throw new Error(data.detail || 'Failed to delete group');
        }
        return true;
    } catch (error) {
        console.error('Error deleting group:', error);
        throw error;
    }
}

export async function joinGroup(groupCode) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/groups/join/${groupCode}`, {
            method: 'POST'
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to join group');
        }
        return data;
    } catch (error) {
        console.error('Error joining group:', error);
        throw error;
    }
}

export async function leaveGroup(groupId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/groups/leave/${groupId}`, {
            method: 'DELETE'
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to leave group');
        }
        return data;
    } catch (error) {
        console.error('Error leaving group:', error);
        throw error;
    }
}

export async function getGroupUsers(groupId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/groups/${groupId}/users`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch group users');
        }
        return data;
    } catch (error) {
        console.error('Error fetching group users:', error);
        throw error;
    }
}

export async function removeUserFromGroup(groupCode, userId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/groups/${groupCode}/members/${userId}`, {
            method: 'DELETE'
        });

        if (!ok && data) {
            throw new Error(data.detail || 'Failed to remove user from group');
        }
        return true;
    } catch (error) {
        console.error('Error removing user from group:', error);
        throw error;
    }
}

export async function getGroupCountInClass(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/groups/class/${classId}/count`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch group count');
        }
        return data.group_count;
    } catch (error) {
        console.error('Error fetching group count:', error);
        return 0;
    }
}

export async function getUserCountInClass(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/groups/class/${classId}/users/count`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch user count');
        }
        return data.user_count;
    } catch (error) {
        console.error('Error fetching user count:', error);
        return 0;
    }
} 