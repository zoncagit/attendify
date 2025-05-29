// Token management and authentication utilities
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Save token and user data to localStorage
function saveAuthData(token, userData) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Get user data from localStorage
function getUserData() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Add authorization header to fetch requests
function getAuthHeaders() {
    const token = getToken();
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
}

// Handle API responses
async function handleApiResponse(response) {
    if (response.status === 401) {
        // Token expired or invalid
        clearAuthData();
        window.location.href = '/login.html';
        return null;
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Une erreur est survenue');
    }
    return data;
}

// Make authenticated API request
async function authenticatedFetch(url, options = {}) {
    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    return handleApiResponse(response);
}

// Export functions
window.auth = {
    saveAuthData,
    getToken,
    getUserData,
    isAuthenticated,
    clearAuthData,
    getAuthHeaders,
    authenticatedFetch
}; 