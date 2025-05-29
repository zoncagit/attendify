// Token management and authentication utilities
import { CONFIG } from './config.js';

// Save token and user data to localStorage
export function saveAuthData(token, userData) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
}

// Get token from localStorage
export function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

// Get user data from localStorage
export function getUserData() {
    const userData = localStorage.getItem(CONFIG.USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getToken();
}

// Clear authentication data
export function clearAuthData() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
}

// Add authorization header to fetch requests
export function getAuthHeaders() {
    const token = getToken();
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
}

// Handle API responses
export async function handleApiResponse(response) {
    if (response.status === 401) {
        // Token expired or invalid
        clearAuthData();
        redirectToLogin();
        return null;
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Une erreur est survenue');
    }
    return data;
}

// Make authenticated API request
export async function authenticatedFetch(url, options = {}) {
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

// Redirect to login page
export function redirectToLogin() {
    window.location.href = '/login.html';
} 