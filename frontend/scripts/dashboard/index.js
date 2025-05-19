import { utils } from './utils.js';
import { CONFIG } from './config.js';
import { modals } from './modals.js';
import { attendance } from './attendance.js';
import { classes } from './classes.js';

// Dashboard management
const dashboard = {
  // Dashboard elements
  elements: {
    viewSwitcher: null,
    dashboardViews: null,
    userMenu: null,
    notifications: null
  },

  // Initialize dashboard
  init() {
    this.initializeElements();
    this.setupEventListeners();
    this.initializeModules();
    this.loadUserData();
  },

  // Initialize dashboard elements
  initializeElements() {
    this.elements.viewSwitcher = document.getElementById('viewSwitcher');
    this.elements.dashboardViews = document.getElementById('dashboardViews');
    this.elements.userMenu = document.getElementById('userMenu');
    this.elements.notifications = document.getElementById('notifications');
  },

  // Setup event listeners
  setupEventListeners() {
    // View switcher
    this.elements.viewSwitcher?.addEventListener('click', (e) => {
      if (e.target.matches('.view-switch')) {
        this.switchView(e.target.dataset.view);
      }
    });

    // User menu
    this.elements.userMenu?.addEventListener('click', (e) => {
      if (e.target.matches('.settings-btn')) {
        modals.openSettingsModal();
      } else if (e.target.matches('.logout-btn')) {
        this.handleLogout();
      }
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.matches('#modalOverlay')) {
        modals.closeAll();
      }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modals.closeAll();
      }
    });
  },

  // Initialize all modules
  initializeModules() {
    modals.init();
    attendance.init();
    classes.init();
  },

  // Load user data
  async loadUserData() {
    try {
      // In a real application, this would be an API call
      const response = await fetch(CONFIG.API_ENDPOINTS.USER_DATA);
      const data = await response.json();
      
      this.updateUserInterface(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      utils.showNotification('Failed to load user data', 'error');
      
      // Fallback to mock data for development
      this.updateUserInterface(CONFIG.MOCK_DATA.user);
    }
  },

  // Update user interface with user data
  updateUserInterface(userData) {
    // Update user menu
    if (this.elements.userMenu) {
      const userAvatar = this.elements.userMenu.querySelector('.user-avatar');
      const userName = this.elements.userMenu.querySelector('.user-name');
      
      if (userAvatar) {
        userAvatar.innerHTML = `
          <div class="avatar-circle">
            <span class="initials">${userData.initials}</span>
          </div>
        `;
      }
      
      if (userName) {
        userName.textContent = userData.name;
      }
    }
    
    // Update notifications
    if (this.elements.notifications) {
      const notificationCount = userData.notifications?.length || 0;
      const notificationBadge = this.elements.notifications.querySelector('.notification-badge');
      
      if (notificationBadge) {
        notificationBadge.textContent = notificationCount;
        notificationBadge.style.display = notificationCount > 0 ? 'block' : 'none';
      }
    }
  },

  // Switch dashboard view
  switchView(viewName) {
    if (!this.elements.dashboardViews) return;
    
    // Update active view button
    this.elements.viewSwitcher?.querySelectorAll('.view-switch').forEach(button => {
      button.classList.toggle('active', button.dataset.view === viewName);
    });
    
    // Show selected view
    this.elements.dashboardViews.querySelectorAll('.dashboard-view').forEach(view => {
      view.classList.toggle('active', view.id === `${viewName}View`);
    });
  },

  // Handle logout
  async handleLogout() {
    try {
      // In a real application, this would be an API call
      await fetch(CONFIG.API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local storage
      localStorage.clear();
      
      // Redirect to login page
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Error during logout:', error);
      utils.showNotification('Failed to logout', 'error');
    }
  }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
}); 