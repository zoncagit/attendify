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

      let data = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        data = { message: 'Error parsing server response' };
      }
      
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