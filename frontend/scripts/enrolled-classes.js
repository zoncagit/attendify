document.addEventListener('DOMContentLoaded', function() {
  // Constants for local storage keys
  const STORAGE_KEYS = {
    USER_DATA: 'attendify_user_data',
    ENROLLED_CLASSES: 'attendify_enrolled_classes'
  };

  // State management
  let userData = {
    name: 'Sididris Meriem',
    id: 'STU123456',
    initials: 'SM',
    profilePicture: 'assets/default-avatar.png'
  };
  
  let enrolledClasses = [];
  
  // Initialize the application
  initApp();
  
  function initApp() {
    // Load user data from local storage
    loadData();
    
    // Initialize UI elements
    initDOMElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the profile elements
    initProfileElements();
    
    // Initialize the UI
    renderEnrolledClasses();
    
    // Set up copy buttons
    setupCopyButtons();
    
    // Set up profile dropdown
    setupProfileDropdown();
  }
  
  function loadData() {
    // Load user data from local storage
    const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (storedUserData) {
      userData = JSON.parse(storedUserData);
    }
    
    // Load enrolled classes
    const storedEnrolledClasses = localStorage.getItem(STORAGE_KEYS.ENROLLED_CLASSES);
    if (storedEnrolledClasses) {
      enrolledClasses = JSON.parse(storedEnrolledClasses);
    }
  }
  
  function saveData() {
    // Save user data to local storage
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    
    // Save enrolled classes
    localStorage.setItem(STORAGE_KEYS.ENROLLED_CLASSES, JSON.stringify(enrolledClasses));
  }
  
  // DOM elements
  let elements = {
    enrolledClassesContainer: null,
    enrolledEmptyState: null,
    modalOverlay: null,
    enrollBtn: null,
    profileDropdownBtn: null,
    profileDropdownMenu: null,
    settingsBtn: null,
    logoutBtn: null,
    enrollModal: null,
    settingsModal: null
  };
  
  function initDOMElements() {
    // Class containers
    elements.enrolledClassesContainer = document.getElementById('enrolledClassesContainer');
    elements.enrolledEmptyState = document.getElementById('enrolledEmptyState');
    
    // Modals
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.enrollModal = document.getElementById('enrollModal');
    elements.settingsModal = document.getElementById('settingsModal');
    
    // Buttons
    elements.enrollBtn = document.getElementById('enrollBtn');
    elements.emptyStateEnrollBtn = document.getElementById('emptyStateEnrollBtn');
    
    // Profile elements
    elements.profileDropdownBtn = document.getElementById('profileDropdownBtn');
    elements.profileDropdownMenu = document.getElementById('profileDropdownMenu');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.logoutBtn = document.getElementById('logoutBtn');
    
    // Settings elements
    elements.profilePictureInput = document.getElementById('profilePictureInput');
    elements.settingsProfileImage = document.getElementById('settingsProfileImage');
    elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
  }
  
  function initProfileElements() {
    // Set user profile data
    const userNameElement = document.getElementById('userName');
    const userInitialsElement = document.getElementById('userInitials');
    const profileImageElement = document.getElementById('profileImage');
    const studentIdElement = document.getElementById('studentId');
    
    if (userNameElement) userNameElement.textContent = userData.name;
    if (userInitialsElement) userInitialsElement.textContent = userData.initials;
    
    // Add error handling for profile image
    if (profileImageElement) {
      profileImageElement.onerror = function() {
        // If image fails to load, hide it and show initials instead
        this.style.display = 'none';
        if (userInitialsElement) userInitialsElement.style.display = 'block';
      };
      profileImageElement.src = userData.profilePicture;
    }
    
    if (studentIdElement) studentIdElement.textContent = userData.id;
    
    // Update profile image or show initials
    updateProfileImageDisplay();
  }
  
  function updateProfileImageDisplay() {
    const profileImage = document.getElementById('profileImage');
    const userInitials = document.getElementById('userInitials');
    const settingsProfileImage = document.getElementById('settingsProfileImage');
    
    // Profile image in header
    if (profileImage && userInitials) {
      if (userData.profilePicture && userData.profilePicture !== 'assets/default-avatar.png') {
        profileImage.src = userData.profilePicture;
        profileImage.style.display = 'block';
        userInitials.style.display = 'none';
      } else {
        profileImage.style.display = 'none';
        userInitials.style.display = 'block';
      }
    }
    
    // Profile image in settings
    if (settingsProfileImage) {
      settingsProfileImage.src = userData.profilePicture;
    }
  }
  
  function setupEventListeners() {
    // Dashboard buttons
    if (elements.enrollBtn) {
      elements.enrollBtn.addEventListener('click', openEnrollModal);
    }
    
    // Empty state buttons
    if (elements.emptyStateEnrollBtn) {
      elements.emptyStateEnrollBtn.addEventListener('click', openEnrollModal);
    }
    
    // Modal buttons
    setupModalButtons();
    
    // Settings related listeners
    setupSettingsListeners();
  }
  
  function setupModalButtons() {
    // Enroll modal
    const cancelEnrollBtn = document.getElementById('cancelEnrollBtn');
    const confirmEnrollBtn = document.getElementById('confirmEnrollBtn');
    
    if (cancelEnrollBtn) {
      cancelEnrollBtn.addEventListener('click', closeAllModals);
    }
    
    if (confirmEnrollBtn) {
      confirmEnrollBtn.addEventListener('click', enrollInClass);
    }
  }
  
  function setupSettingsListeners() {
    // Settings modal events
    if (elements.settingsBtn) {
      elements.settingsBtn.addEventListener('click', openSettingsModal);
    }
    
    if (elements.closeSettingsBtn) {
      elements.closeSettingsBtn.addEventListener('click', closeAllModals);
    }
    
    // Profile picture upload
    const profilePictureSection = document.querySelector('.profile-picture-upload');
    if (profilePictureSection) {
      profilePictureSection.addEventListener('click', () => {
        elements.profilePictureInput.click();
      });
    }
    
    if (elements.profilePictureInput) {
      elements.profilePictureInput.addEventListener('change', previewProfilePicture);
    }
    
    // Logout button
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', logout);
    }
  }
  
  function setupProfileDropdown() {
    if (elements.profileDropdownBtn && elements.profileDropdownMenu) {
      elements.profileDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        elements.profileDropdownMenu.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function() {
        elements.profileDropdownMenu.classList.remove('show');
      });
    }
  }
  
  function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-code-btn, .copy-btn');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Find the nearest code value to copy
        const codeElement = this.parentElement.querySelector('.code-value, #generatedClassCode, #studentId');
        
        if (codeElement) {
          // Copy the text
          navigator.clipboard.writeText(codeElement.textContent.trim())
            .then(() => {
              // Show feedback
              const originalIcon = this.innerHTML;
              this.innerHTML = '<i class="fas fa-check"></i>';
              
              // Reset icon after a delay
              setTimeout(() => {
                this.innerHTML = originalIcon;
              }, 1500);
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
            });
        }
      });
    });
  }
  
  function openEnrollModal() {
    // Clear any previous input
    const classCodeInput = document.getElementById('classCode');
    if (classCodeInput) {
      classCodeInput.value = '';
    }
    
    // Show modal
    elements.enrollModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
  }
  
  function openSettingsModal() {
    // Update settings with current user data
    const studentIdElement = document.getElementById('studentId');
    if (studentIdElement) {
      studentIdElement.textContent = userData.id;
    }
    
    // Update profile image
    const settingsProfileImage = document.getElementById('settingsProfileImage');
    if (settingsProfileImage) {
      settingsProfileImage.src = userData.profilePicture;
    }
    
    // Show modal
    elements.settingsModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
  }
  
  function closeAllModals() {
    // Hide all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
    
    // Hide overlay
    elements.modalOverlay.classList.remove('active');
  }
  
  function previewProfilePicture(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        elements.settingsProfileImage.src = event.target.result;
        
        // Save the new profile picture
        userData.profilePicture = event.target.result;
        saveData();
        
        // Update profile display
        updateProfileImageDisplay();
      };
      reader.readAsDataURL(file);
    }
  }
  
  function enrollInClass() {
    const classCodeInput = document.getElementById('classCode');
    
    if (classCodeInput) {
      const classCode = classCodeInput.value.trim();
      
      if (classCode === '') {
        alert('Please enter a class code');
        return;
      }
      
      // Check if already enrolled
      const alreadyEnrolled = enrolledClasses.some(cls => cls.code === classCode);
      
      if (alreadyEnrolled) {
        alert('You are already enrolled in this class');
        return;
      }
      
      // For demo purposes, create a mock class (in a real app, this would verify against a server)
      const newClass = {
        name: `Class ${classCode}`,
        code: classCode,
        attendance: {
          rate: Math.floor(Math.random() * 100),
          missed: Math.floor(Math.random() * 5)
        }
      };
      
      // Add to enrolled classes
      enrolledClasses.push(newClass);
      
      // Save data
      saveData();
      
      // Close modal
      closeAllModals();
      
      // Refresh class display
      renderEnrolledClasses();
    }
  }
  
  function renderEnrolledClasses() {
    if (!elements.enrolledClassesContainer) return;
    
    // Clear container
    elements.enrolledClassesContainer.innerHTML = '';
    
    // Show/hide empty state
    if (enrolledClasses.length === 0) {
      elements.enrolledEmptyState.style.display = 'flex';
      elements.enrolledClassesContainer.style.display = 'none';
    } else {
      elements.enrolledEmptyState.style.display = 'none';
      elements.enrolledClassesContainer.style.display = 'grid';
      
      // Add classes to container
      enrolledClasses.forEach(cls => {
        const classCard = createEnrolledClassCard(cls);
        elements.enrolledClassesContainer.appendChild(classCard);
      });
    }
  }
  
  function createEnrolledClassCard(classData) {
    const attendanceRate = classData.attendance?.rate || Math.floor(Math.random() * 100);
    const missedClasses = classData.attendance?.missed || Math.floor(Math.random() * 5);
    
    const card = document.createElement('div');
    card.className = 'class-card';
    card.innerHTML = `
      <div class="class-header">
        <h3 class="class-title">${classData.name}</h3>
        <div class="class-info">
          <div class="class-code">
            <span>Code:</span>
            <span class="code-value">${classData.code}</span>
          </div>
        </div>
      </div>
      <div class="class-attendance">
        <div class="attendance-rate">
          <span class="rate-number">${attendanceRate}%</span>
          <span class="rate-label">attendance</span>
        </div>
        <div class="attendance-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${missedClasses} missed classes</span>
        </div>
      </div>
      <div class="class-actions">
        <button class="action-btn view-students-btn" title="View Students" data-class-code="${classData.code}">
          <i class="fas fa-users"></i>
        </button>
        <button class="action-btn leave-class-btn" title="Leave Class" data-class-code="${classData.code}">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    `;
    
    // Add event listeners
    const viewStudentsBtn = card.querySelector('.view-students-btn');
    const leaveClassBtn = card.querySelector('.leave-class-btn');
    
    if (viewStudentsBtn) {
      viewStudentsBtn.addEventListener('click', () => {
        // Redirect to students page with class code
        window.location.href = `students.html?class=${classData.code}&role=student`;
      });
    }
    
    if (leaveClassBtn) {
      leaveClassBtn.addEventListener('click', () => {
        // Remove class from enrolled classes
        enrolledClasses = enrolledClasses.filter(cls => cls.code !== classData.code);
        
        // Save data
        saveData();
        
        // Refresh class display
        renderEnrolledClasses();
      });
    }
    
    return card;
  }
  
  function logout() {
    // Here we would normally clear authentication tokens
    // For this demo, we'll just redirect to index.html
    window.location.href = 'index.html';
  }
}); 