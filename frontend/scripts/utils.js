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
  showNotification(message, type = 'success') {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${type}`;
    notificationElement.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notificationElement);
    
    setTimeout(() => {
      notificationElement.remove();
    }, 3000);
  },

  // Make authenticated API calls
  async fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      console.error('API Error:', error);
      return { ok: false, data: { message: 'Network error occurred' } };
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
  },

  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = '/login.html';
  }
};

export default utils; 