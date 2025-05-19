import { utils } from './utils.js';
import { CONFIG } from './config.js';

// Modal management
export const modals = {
  // Modal elements
  elements: {
    overlay: null,
    modals: {}
  },

  // Initialize modals
  init() {
    this.elements.overlay = document.getElementById('modalOverlay');
    
    // Initialize all modal elements
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modal => {
      this.elements.modals[modal.id] = modal;
    });
  },

  // Open a modal
  open(modalId) {
    const modal = this.elements.modals[modalId];
    if (!modal) {
      console.error(`Modal with id ${modalId} not found`);
      return;
    }

    this.elements.overlay.classList.add('active');
    modal.classList.add('active');
  },

  // Close a modal
  close(modalId) {
    const modal = this.elements.modals[modalId];
    if (!modal) {
      console.error(`Modal with id ${modalId} not found`);
      return;
    }

    this.elements.overlay.classList.remove('active');
    modal.classList.remove('active');
  },

  // Close all modals
  closeAll() {
    this.elements.overlay.classList.remove('active');
    Object.values(this.elements.modals).forEach(modal => {
      modal.classList.remove('active');
    });
  },

  // Create and open settings modal
  openSettingsModal() {
    // Check if modal already exists
    if (document.getElementById('settingsModal')) {
      document.getElementById('settingsModal').remove();
    }
    
    // Get user unique ID from localStorage
    const userUniqueId = localStorage.getItem('userUniqueCode') || 'STU-ABC-1234';
    
    const settingsModal = document.createElement('div');
    settingsModal.id = 'settingsModal';
    settingsModal.className = 'modal';
    
    settingsModal.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-title">Settings</h2>
        <div class="form-group">
          <label>Profile Picture</label>
          <div class="profile-picture-container">
            <div class="current-avatar">
              <div class="avatar-circle large">
                <span class="initials">SM</span>
              </div>
            </div>
            <div class="avatar-upload">
              <label for="avatarUpload" class="btn btn-secondary">
                <i class="fas fa-upload"></i> Choose Image
              </label>
              <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>Your Unique Student ID</label>
          <div class="user-id-container">
            <div class="user-id-display">${userUniqueId}</div>
            <button id="copyUserIdBtn" class="btn btn-secondary">
              <i class="fas fa-copy"></i> Copy ID
            </button>
          </div>
          <p class="form-help">Use this ID when requested by instructors for attendance tracking</p>
        </div>
        
        <div class="modal-footer">
          <button id="cancelSettingsBtn" class="btn btn-cancel">Cancel</button>
          <button id="saveSettingsBtn" class="btn btn-confirm">Save Changes</button>
        </div>
      </div>
    `;
    
    this.elements.overlay.appendChild(settingsModal);
    this.elements.modals.settingsModal = settingsModal;
    
    // Add event listeners
    document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.close('settingsModal'));
    document.getElementById('saveSettingsBtn').addEventListener('click', this.saveSettings);
    
    const avatarUpload = document.getElementById('avatarUpload');
    avatarUpload.addEventListener('change', this.previewProfilePicture);
    
    // Add copy ID button listener
    document.getElementById('copyUserIdBtn').addEventListener('click', function() {
      const idText = userUniqueId;
      navigator.clipboard.writeText(idText)
        .then(() => {
          this.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            this.innerHTML = '<i class="fas fa-copy"></i> Copy ID';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy. Please select and copy the ID manually.');
        });
    });
    
    this.open('settingsModal');
  },

  // Preview profile picture
  previewProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        // Create avatar with image instead of initials
        const currentAvatar = document.querySelector('.current-avatar');
        currentAvatar.innerHTML = `
          <div class="avatar-circle large" style="background-image: url('${e.target.result}'); background-size: cover; background-position: center;">
          </div>
        `;
      };
      
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file');
    }
  },

  // Save settings
  saveSettings() {
    const avatarCircles = document.querySelectorAll('.avatar-circle');
    const currentAvatar = document.querySelector('.current-avatar .avatar-circle');
    
    // If user uploaded a new image
    if (currentAvatar.style.backgroundImage) {
      const newBackgroundImage = currentAvatar.style.backgroundImage;
      
      // Update all avatar circles with the new image
      avatarCircles.forEach(circle => {
        circle.style.backgroundImage = newBackgroundImage;
        circle.style.backgroundSize = 'cover';
        circle.style.backgroundPosition = 'center';
        // Hide initials when using image
        const initials = circle.querySelector('.initials');
        if (initials) {
          initials.style.display = 'none';
        }
      });
      
      utils.showNotification('Profile picture updated', 'success');
    }
    
    this.close('settingsModal');
  }
}; 