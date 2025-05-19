document.addEventListener('DOMContentLoaded', function() {
  // Constants for local storage keys
  const STORAGE_KEYS = {
    USER_DATA: 'attendify_user_data',
    TUTORED_CLASSES: 'attendify_tutored_classes'
  };

  // State management
  let userData = {
    name: 'Sididris Meriem',
    id: 'STU123456',
    initials: 'SM',
    profilePicture: 'assets/default-avatar.png'
  };
  
  let tutoredClasses = [];
  
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
    renderTutoredClasses();
    
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
    
    // Load tutored classes
    const storedTutoredClasses = localStorage.getItem(STORAGE_KEYS.TUTORED_CLASSES);
    if (storedTutoredClasses) {
      tutoredClasses = JSON.parse(storedTutoredClasses);
    }
  }
  
  function saveData() {
    // Save user data to local storage
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    
    // Save tutored classes
    localStorage.setItem(STORAGE_KEYS.TUTORED_CLASSES, JSON.stringify(tutoredClasses));
  }
  
  // DOM elements
  let elements = {
    tutoredClassesContainer: null,
    tutoredEmptyState: null,
    modalOverlay: null,
    tutorBtn: null,
    profileDropdownBtn: null,
    profileDropdownMenu: null,
    settingsBtn: null,
    logoutBtn: null,
    createClassModal: null,
    addGroupModal: null,
    settingsModal: null
  };
  
  function initDOMElements() {
    // Class containers
    elements.tutoredClassesContainer = document.getElementById('tutoredClassesContainer');
    elements.tutoredEmptyState = document.getElementById('tutoredEmptyState');
    
    // Modals
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.createClassModal = document.getElementById('createClassModal');
    elements.addGroupModal = document.getElementById('addGroupModal');
    elements.settingsModal = document.getElementById('settingsModal');
    
    // Buttons
    elements.tutorBtn = document.getElementById('tutorBtn');
    elements.emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    
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
    if (elements.tutorBtn) {
      elements.tutorBtn.addEventListener('click', openCreateClassModal);
    }
    
    // Empty state buttons
    if (elements.emptyStateCreateBtn) {
      elements.emptyStateCreateBtn.addEventListener('click', openCreateClassModal);
    }
    
    // Modal buttons
    setupModalButtons();
    
    // Settings related listeners
    setupSettingsListeners();
  }
  
  function setupModalButtons() {
    // Create class modal
    const cancelCreateClassBtn = document.getElementById('cancelCreateClassBtn');
    const confirmCreateClassBtn = document.getElementById('confirmCreateClassBtn');
    
    if (cancelCreateClassBtn) {
      cancelCreateClassBtn.addEventListener('click', closeAllModals);
    }
    
    if (confirmCreateClassBtn) {
      confirmCreateClassBtn.addEventListener('click', createClass);
    }
    
    // Add Group modal
    const cancelAddGroupBtn = document.getElementById('cancelAddGroupBtn');
    const confirmAddGroupBtn = document.getElementById('confirmAddGroupBtn');
    
    if (cancelAddGroupBtn) {
      cancelAddGroupBtn.addEventListener('click', closeAllModals);
    }
    
    if (confirmAddGroupBtn) {
      confirmAddGroupBtn.addEventListener('click', addGroup);
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
  
  function openCreateClassModal() {
    // Generate a random class code
    const generatedCodeElement = document.getElementById('generatedClassCode');
    if (generatedCodeElement) {
      generatedCodeElement.textContent = generateClassCode();
    }
    
    // Clear any previous input
    const classNameInput = document.getElementById('className');
    if (classNameInput) {
      classNameInput.value = '';
    }
    
    // Show modal
    elements.createClassModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
  }
  
  function openAddGroupModal(classCode) {
    // Store the class code for reference when adding the group
    elements.addGroupModal.dataset.classCode = classCode;
    
    // Clear any previous input
    const groupNameInput = document.getElementById('groupName');
    if (groupNameInput) {
      groupNameInput.value = '';
    }
    
    // Show modal
    elements.addGroupModal.classList.add('active');
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
  
  function generateClassCode() {
    // Generate a random 5-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }
  
  function createClass() {
    const classNameInput = document.getElementById('className');
    const generatedCodeElement = document.getElementById('generatedClassCode');
    
    if (classNameInput && generatedCodeElement) {
      const className = classNameInput.value.trim();
      const classCode = generatedCodeElement.textContent.trim();
      
      if (className === '') {
        alert('Please enter a class name');
        return;
      }
      
      // Create new class object
      const newClass = {
        name: className,
        code: classCode,
        groups: [
          { name: 'Default Group', students: [] }
        ]
      };
      
      // Add to tutored classes
      tutoredClasses.push(newClass);
      
      // Save data
      saveData();
      
      // Close modal
      closeAllModals();
      
      // Refresh class display
      renderTutoredClasses();
    }
  }
  
  function addGroup() {
    const groupNameInput = document.getElementById('groupName');
    const classCode = elements.addGroupModal.dataset.classCode;
    
    if (groupNameInput && classCode) {
      const groupName = groupNameInput.value.trim();
      
      if (groupName === '') {
        alert('Please enter a group name');
        return;
      }
      
      // Find the class
      const classIndex = tutoredClasses.findIndex(cls => cls.code === classCode);
      
      if (classIndex !== -1) {
        // Add the new group
        tutoredClasses[classIndex].groups.push({
          name: groupName,
          students: []
        });
        
        // Save data
        saveData();
        
        // Close modal
        closeAllModals();
        
        // Refresh class display
        renderTutoredClasses();
      }
    }
  }
  
  function renderTutoredClasses() {
    if (!elements.tutoredClassesContainer) return;
    
    // Clear container
    elements.tutoredClassesContainer.innerHTML = '';
    
    // Show/hide empty state
    if (tutoredClasses.length === 0) {
      elements.tutoredEmptyState.style.display = 'flex';
      elements.tutoredClassesContainer.style.display = 'none';
    } else {
      elements.tutoredEmptyState.style.display = 'none';
      elements.tutoredClassesContainer.style.display = 'grid';
      
      // Add classes to container
      tutoredClasses.forEach(cls => {
        const classCard = createTutoredClassCard(cls);
        elements.tutoredClassesContainer.appendChild(classCard);
      });
    }
  }
  
  function createTutoredClassCard(classData) {
    const card = document.createElement('div');
    card.className = 'class-card';
    
    // Create groups HTML
    let groupsHTML = '';
    if (classData.groups && classData.groups.length > 0) {
      groupsHTML = classData.groups.map(group => `
        <div class="group-item" data-group-name="${group.name}">
          <span class="group-name">${group.name}</span>
          <span class="group-count">${group.students?.length || 0} students</span>
        </div>
      `).join('');
    }
    
    card.innerHTML = `
      <div class="class-header">
        <h3 class="class-title">${classData.name}</h3>
        <div class="class-info">
          <div class="class-code">
            <span>Code:</span>
            <span class="code-value">${classData.code}</span>
            <button class="copy-code-btn" title="Copy Code">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="class-groups">
        <h4 class="section-title">Groups</h4>
        <div class="groups-list">
          ${groupsHTML}
        </div>
        <button class="btn btn-secondary btn-sm add-group-btn" data-class-code="${classData.code}">
          <i class="fas fa-plus"></i> Add Group
        </button>
      </div>
      <div class="class-actions">
        <button class="action-btn view-students-btn" title="View Students" data-class-code="${classData.code}">
          <i class="fas fa-users"></i>
        </button>
        <button class="action-btn take-attendance-btn" title="Take Attendance" data-class-code="${classData.code}">
          <i class="fas fa-user-check"></i>
        </button>
        <button class="action-btn delete-class-btn" title="Delete Class" data-class-code="${classData.code}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    
    // Add event listeners
    const addGroupBtn = card.querySelector('.add-group-btn');
    const viewStudentsBtn = card.querySelector('.view-students-btn');
    const takeAttendanceBtn = card.querySelector('.take-attendance-btn');
    const deleteClassBtn = card.querySelector('.delete-class-btn');
    const copyCodeBtn = card.querySelector('.copy-code-btn');
    const groupItems = card.querySelectorAll('.group-item');
    
    if (addGroupBtn) {
      addGroupBtn.addEventListener('click', () => {
        openAddGroupModal(classData.code);
      });
    }
    
    if (viewStudentsBtn) {
      viewStudentsBtn.addEventListener('click', () => {
        // Redirect to students page with class code
        window.location.href = `students.html?class=${classData.code}&role=teacher`;
      });
    }
    
    if (takeAttendanceBtn) {
      takeAttendanceBtn.addEventListener('click', () => {
        // Redirect to attendance page with class code
        window.location.href = `attendance.html?class=${classData.code}`;
      });
    }
    
    if (deleteClassBtn) {
      deleteClassBtn.addEventListener('click', () => {
        // Remove class from tutored classes
        tutoredClasses = tutoredClasses.filter(cls => cls.code !== classData.code);
        
        // Save data
        saveData();
        
        // Refresh class display
        renderTutoredClasses();
      });
    }
    
    if (copyCodeBtn) {
      // Copy button handled by setupCopyButtons()
      setupCopyButtons();
    }
    
    // Add group item click handlers
    groupItems.forEach(item => {
      item.addEventListener('click', () => {
        const groupName = item.dataset.groupName;
        // Redirect to students page with class code and group name
        window.location.href = `students.html?class=${classData.code}&group=${groupName}&role=teacher`;
      });
    });
    
    return card;
  }
  
  function logout() {
    // Here we would normally clear authentication tokens
    // For this demo, we'll just redirect to index.html
    window.location.href = 'index.html';
  }
}); 