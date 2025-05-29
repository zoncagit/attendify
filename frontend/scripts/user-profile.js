import CONFIG from './config.js';
import utils from './utils.js';

export class UserProfile {
  constructor() {
    this.userName = document.getElementById('userName');
    this.studentId = document.getElementById('headerStudentId');
    this.copyBtn = document.getElementById('headerCopyIdBtn');
    this.copySuccess = document.getElementById('headerCopySuccess');
    this.profileImage = document.getElementById('profileImage');
    this.avatarIcon = document.getElementById('avatarIcon');

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Copy student ID functionality
    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => this.copyStudentId());
    }
  }

  async loadUserProfile() {
    try {
      const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/users/me`);
      if (ok && data) {
        // Update user name (combine first and last name)
        if (this.userName) {
          this.userName.textContent = `${data.name} ${data.prenom}`;
        }

        // Update student ID
        if (this.studentId) {
          this.studentId.textContent = data.user_id;
        }

        return data;
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      utils.showNotification('Failed to load user profile', 'error');
      return null;
    }
  }

  async copyStudentId() {
    if (!this.studentId || !this.copySuccess) return;

    try {
      await navigator.clipboard.writeText(this.studentId.textContent);
      this.copySuccess.style.display = 'inline';
      setTimeout(() => {
        this.copySuccess.style.display = 'none';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy student ID:', error);
      utils.showNotification('Failed to copy student ID', 'error');
    }
  }
}

export default UserProfile; 