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
    const container = document.querySelector('.notification-container') || createNotificationContainer();
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    
    notification.innerHTML = `
        <span class="notification-text">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 5000);
  },

  // Make authenticated API calls
  async fetchWithAuth(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Prepend API_URL if the endpoint is a relative path
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_URL}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        return { ok: false, data: { message: 'Session expired. Please log in again.' } };
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        return { ok: false, data: { message: 'Resource not found.' } };
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        return { ok: false, data: { message: 'You do not have permission to perform this action.' } };
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return { ok: response.ok, status: response.status, data };

    } catch (error) {
      console.error('API Error:', error);
      return { 
        ok: false, 
        data: { message: 'Network error occurred. Please check your connection.' }
      };
    }
  },

  // Handle unauthorized access
  handleUnauthorized() {
    this.removeAuthToken();
    this.removeUser();
    window.location.href = 'login.html';
  },

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = {
      isValid: password.length >= minLength,
      score: 0,
      message: ''
    };

    if (password.length >= minLength) strength.score++;
    if (hasUpperCase) strength.score++;
    if (hasLowerCase) strength.score++;
    if (hasNumbers) strength.score++;
    if (hasSpecialChar) strength.score++;

    if (strength.score < 2) {
      strength.message = 'Weak password';
    } else if (strength.score < 4) {
      strength.message = 'Moderate password';
    } else {
      strength.message = 'Strong password';
    }

    return strength;
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied to clipboard', 'success');
    } catch (err) {
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  },

  // Logout
  logout() {
    this.removeAuthToken();
    this.removeUser();
    window.location.href = 'login.html';
  }
};

export default utils; 

// Common utility functions used across the application

export function updateCurrentDate() {
  const dateElement = document.getElementById('currentDateDisplay');
  if (dateElement) {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
  }
}

export function closeAllModals() {
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  const modals = document.querySelectorAll('.modal');

  modalOverlays.forEach(overlay => {
    overlay.classList.remove('active');
  });

  modals.forEach(modal => {
    modal.classList.remove('active');
  });
}

export function generateUniqueCode(prefix = 'GRP') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 5);
  return `${prefix}${timestamp}${randomStr}`.toUpperCase();
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `notification ${type} show`;
  toast.innerHTML = `
    <span class="notification-text">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  const container = document.querySelector('.notification-container') || createNotificationContainer();
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
    if (container.children.length === 0) {
      container.remove();
    }
  }, 3000);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
}

export function copyToClipboard(text, successCallback) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (successCallback) {
        successCallback();
      }
    })
    .catch(err => {
      console.error('Copy failed:', err);
      showToast('Failed to copy text', 'error');
    });
}

export function openModal(modalId, overlayId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById(overlayId);
  
  if (modal && overlay) {
    modal.classList.add('active');
    overlay.classList.add('active');
  }
}

export function closeModal(modalId, overlayId) {
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById(overlayId);
  
  if (modal && overlay) {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }
}

export function showError(errorElement, message) {
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

export function hideError(errorElement) {
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

export function validateInput(input, errorElement, message) {
  if (!input || !input.trim()) {
    showError(errorElement, message);
    return false;
  }
  hideError(errorElement);
  return true;
} 