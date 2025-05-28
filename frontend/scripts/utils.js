import CONFIG from './config.js';

const TOKEN_KEY = 'attendify_token';
const USER_KEY = 'attendify_user';

export default {
    // Authentication helpers
    getAuthToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    setAuthToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },

    clearAuthToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // API request helper with authentication
    async fetchWithAuth(endpoint, options = {}) {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const defaultHeaders = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            const data = await response.json();

            // Check for token expiration
            if (response.status === 401) {
                this.clearAuthToken();
                window.location.href = 'login.html';
                throw new Error('Session expired. Please login again.');
            }

            return {
                ok: response.ok,
                status: response.status,
                data
            };
        } catch (error) {
            console.error('API request failed:', error);
            return {
                ok: false,
                status: error.status || 500,
                data: { message: error.message || 'An unexpected error occurred' }
            };
        }
    },

    // Toast notification helper
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = document.createElement('i');
        icon.className = this.getToastIcon(type);
        
        const text = document.createElement('span');
        text.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    getToastIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            default:
                return 'fas fa-info-circle';
        }
    },

    // Date formatting helper
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

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