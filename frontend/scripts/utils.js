import CONFIG from './config.js';

const utils = {
  // Store authentication token
  setAuthToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
  },

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  // Remove authentication token
  removeAuthToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
  },

  // Store user data
  setUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  },

  // Get user data
  getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Remove user data
  removeUser() {
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  // Show notification message
  showNotification(message, type = 'info') {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.className = `success-message show ${type}`;
      setTimeout(() => {
        successMessage.classList.remove('show');
      }, 3000);
    }
  },

  // Make authenticated API calls
  async fetchWithAuth(endpoint, options = {}) {
    const token = this.getAuthToken();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      if (response.status === 401) {
        // Token expired or invalid
        this.removeAuthToken();
        this.removeUser();
        window.location.href = '/login.html';
        return null;
      }

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      console.error('API call failed:', error);
      return { ok: false, error: error.message };
    }
  },

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  validatePassword(password) {
    return {
      isValid: password.length >= 8,
      message: password.length < 8 ? 'Password must be at least 8 characters' : ''
    };
  }
};

export default utils; 