import CONFIG from './config.js';
import utils from './utils.js';

export async function createClass(className) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes`, {
            method: 'POST',
            body: JSON.stringify({
                class_name: className
            })
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to create class');
        }
        return data;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
}

export async function getClasses() {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch classes');
        }
        return data;
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
}

export async function getClass(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch class');
        }
        return data;
    } catch (error) {
        console.error('Error fetching class:', error);
        throw error;
    }
}

export async function deleteClass(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}`, {
            method: 'DELETE'
        });

        if (!ok && data) {
            throw new Error(data.detail || 'Failed to delete class');
        }
        return true;
    } catch (error) {
        console.error('Error deleting class:', error);
        throw error;
    }
}

export async function leaveClass(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/leave`, {
            method: 'DELETE'
        });

        if (!ok) {
            throw new Error(data.detail || 'Failed to leave class');
        }
        return data;
    } catch (error) {
        console.error('Error leaving class:', error);
        throw error;
    }
}

export async function getClassUsers(classId) {
    try {
        const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes/${classId}/users`);
        if (!ok) {
            throw new Error(data.detail || 'Failed to fetch class users');
        }
        return data;
    } catch (error) {
        console.error('Error fetching class users:', error);
        throw error;
    }
} 