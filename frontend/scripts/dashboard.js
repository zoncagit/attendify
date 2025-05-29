import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const token = utils.getAuthToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // API endpoints
  const API_URL = 'http://127.0.0.1:8000/api/v1/classes';
  const ENDPOINTS = {
    ENROLLED_CLASSES: `${API_URL}/api/v1/classes`,
    TUTORED_CLASSES: `${API_URL}/api/v1/classes`,
    ENROLL_CLASS: `${API_URL}/api/v1/classes/enroll`,
    CREATE_CLASS: `${API_URL}/api/v1/classes/`,  // POST to root of classes
    ADD_GROUP: `${API_URL}/api/v1/classes/groups/add`,
    DELETE_GROUP: `${API_URL}/api/v1/classes/groups/delete`,
    DELETE_CLASS: `${API_URL}/api/v1/classes/{class_id}`,

    QUIT_CLASS: `${API_URL}/api/v1/classes/quit`,

    USER_PROFILE: `${API_URL}/api/v1/users/profile`
  };

  // Tab switching functionality
  function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Update button states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update tab pane visibility
        tabPanes.forEach(pane => {
          if (pane.id === `${targetTab}ClassesTab`) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });
    });
  }

  // Modal functionality
  function initializeModals() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modals = document.querySelectorAll('.modal');
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeAllModals();
      }
    });

    // Close buttons
    document.querySelectorAll('.btn-secondary').forEach(btn => {
      if (btn.id.startsWith('cancel') || btn.id.startsWith('close')) {
        btn.addEventListener('click', closeAllModals);
      }
    });

    // Quit class confirmation
    document.getElementById('confirmQuitBtn')?.addEventListener('click', async () => {
      const classId = document.getElementById('confirmQuitBtn').dataset.classId;
      await quitClass(classId);
      closeAllModals();
    });

    // Delete class confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
      const classId = document.getElementById('confirmDeleteBtn').dataset.classId;
      await deleteClass(classId);
      closeAllModals();
    });
  }

  function closeAllModals() {
    const modalOverlay = document.getElementById('modalOverlay');
    const modals = document.querySelectorAll('.modal');
    
    modalOverlay.classList.remove('active');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });

    // Clear any input fields
    document.querySelectorAll('.modal input').forEach(input => {
      input.value = '';
    });
  }

  // Profile dropdown functionality
  function initializeProfileDropdown() {
    const dropdownBtn = document.getElementById('profileDropdownBtn');
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
    });

    // Settings button
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      dropdownMenu.classList.remove('show');
      const settingsModal = document.getElementById('settingsModal');
      const modalOverlay = document.getElementById('modalOverlay');
      modalOverlay.classList.add('active');
      settingsModal.classList.add('active');
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      utils.clearAuthToken();
      window.location.href = 'login.html';
    });
  }

  // Date display functionality
  function updateCurrentDate() {
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  // Load user profile
  async function loadUserProfile() {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.USER_PROFILE);
      if (ok) {
        document.getElementById('userName').textContent = `${data.name} ${data.prenom}`;
        document.getElementById('headerStudentId').textContent = data.student_id;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  // Load enrolled classes
  async function loadEnrolledClasses() {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.ENROLLED_CLASSES);
      if (ok) {
        const enrolledClassesList = document.getElementById('enrolledClassesList');
        if (data.length === 0) {
          enrolledClassesList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-book-reader"></i>
              </div>
              <h4>No Enrolled Classes</h4>
              <p>You haven't enrolled in any classes yet.</p>
            </div>`;
          return;
        }
        
        enrolledClassesList.innerHTML = data.map(cls => createEnrolledClassCard(cls)).join('');
        setupEnrolledClassEventListeners();
      }
    } catch (error) {
      console.error('Failed to load enrolled classes:', error);
      utils.showNotification('Failed to load enrolled classes', 'error');
    }
  }

  // Load tutored classes
  async function loadTutoredClasses() {
    try {
      console.log('Fetching tutored classes from:', ENDPOINTS.TUTORED_CLASSES);
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.TUTORED_CLASSES);
      console.log('API Response - ok:', ok, 'data:', data);
      
      if (ok) {
        const tutoredClassesList = document.getElementById('tutoredClassesList');
        if (!tutoredClassesList) {
          console.error('tutoredClassesList element not found');
          return;
        }
        
        console.log('Received classes data:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log('No classes found or data is not an array');
          tutoredClassesList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-chalkboard"></i>
              </div>
              <h4>No Tutored Classes</h4>
              <p>You haven't created any classes yet.</p>
            </div>`;
          return;
        }
        
        // Log the first class to see its structure
        if (data.length > 0) {
          console.log('First class data:', data[0]);
        }
        
        tutoredClassesList.innerHTML = data.map(cls => createTutoredClassCard(cls)).join('');
        setupTutoredClassEventListeners();
      } else {
        console.error('API request failed:', data);
        throw new Error(data.message || 'Failed to load classes');
      }
    } catch (error) {
      console.error('Error in loadTutoredClasses:', error);
      utils.showNotification(error.message || 'Failed to load tutored classes', 'error');
    }
  }

  // Enroll in class
  async function enrollInClass(groupCode) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.ENROLL_CLASS, {
        method: 'POST',
        body: JSON.stringify({ group_code: groupCode })
      });

      if (ok) {
        utils.showNotification('Successfully enrolled in class', 'success');
        loadEnrolledClasses();
      } else {
        throw new Error(data.message || 'Failed to enroll in class');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
    }
  }

  // Create new class
  async function createClass(className) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.CREATE_CLASS, {
        method: 'POST',
        body: JSON.stringify({
          class_name: className 
        })
      });

      if (ok) {  

        utils.showNotification(`Class "${data.class_name}" created successfully with code: ${data.class_code}`, 'success');
        loadTutoredClasses();
      } else {
        throw new Error(data.detail || 'Failed to create class');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      console.error('Error creating class:', error);
    }
  }

  // Add group to class
  async function addGroup(classId, groupName) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.ADD_GROUP, {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          name: groupName
        })
      });

      if (ok) {
        utils.showNotification('Group added successfully', 'success');
        loadTutoredClasses();
      } else {
        throw new Error(data.message || 'Failed to add group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
    }
  }

  // Delete class
  async function deleteClass(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_ENDPOINTS.DELETE_CLASS}/${classId}/`, {

        method: 'DELETE'
      });

      if (ok || status === 204) { // Check for 204 No Content status
        utils.showNotification('Class deleted successfully', 'success');
        loadTutoredClasses();
      } else {
        throw new Error(data?.detail || 'Failed to delete class');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      console.error('Error deleting class:', error);
    }
  }

  // Quit class
  async function quitClass(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(`${ENDPOINTS.QUIT_CLASS}/${classId}`, {
        method: 'POST'
      });

      if (ok) {
        utils.showNotification('Successfully left the class', 'success');
        loadEnrolledClasses();
      } else {
        throw new Error(data.message || 'Failed to leave class');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
    }
  }

  // Event Listeners
  document.getElementById('dashboardEnrollClassBtn').addEventListener('click', () => {
    const enrollModal = document.getElementById('enrollModal');
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.add('active');
    enrollModal.classList.add('active');
  });

  document.getElementById('confirmEnrollBtn').addEventListener('click', async () => {
    const groupCode = document.getElementById('groupCode').value.trim();
    if (!groupCode) {
      utils.showNotification('Please enter a group code', 'error');
      return;
    }
    await enrollInClass(groupCode);
    closeAllModals();
  });

  document.getElementById('dashboardCreateClassBtn').addEventListener('click', () => {
    const createClassModal = document.getElementById('createClassModal');
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.add('active');
    createClassModal.classList.add('active');
  });

  document.getElementById('confirmCreateClassBtn').addEventListener('click', async () => {
    const className = document.getElementById('className').value.trim();
    if (!className) {
      utils.showNotification('Please enter a class name', 'error');
      return;
    }
    await createClass(className);
    closeAllModals();
  });

  // Helper function to create enrolled class card
  function createEnrolledClassCard(classData) {
    const attendancePercentage = ((classData.attendance_count || 0) / (classData.total_sessions || 1) * 100).toFixed(1);
    
    return `
      <div class="class-card" data-class-id="${classData.class_id}">
        <div class="class-header">
          <h3 class="class-name">${classData.class_name}</h3>
          <button class="leave-class-icon" data-class-id="${classData.class_id}" title="Leave Class">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
        <div class="class-details">
          <div class="detail-row">
            <span class="detail-label">Group:</span>
            <span class="detail-value">${classData.group_name || 'Default Group'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Group Code:</span>
            <span class="detail-value">${classData.group_code}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Attendance:</span>
            <span class="detail-value">${attendancePercentage}%</span>
          </div>
          <div class="attendance-counter">
            <div class="attendance-count">
              <span>${classData.attendance_count || 0}</span>
              <span class="slash">/</span>
              <span>${classData.total_sessions || 0}</span>
            </div>
            <div class="attendance-label">Sessions</div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper function to create tutored class card
  function createTutoredClassCard(classData) {
    return `
      <div class="class-card" data-class-id="${classData.class_id}">
        <div class="class-header">
          <h3 class="class-name">${classData.class_name}</h3>
          <button class="delete-class-icon" data-class-id="${classData.class_id}" title="Delete Class">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="class-details">
          <div class="detail-row">
            <span class="detail-label">Groups:</span>
            <span class="detail-value">${classData.group_count || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Students:</span>
            <span class="detail-value">${classData.student_count || 0}</span>
          </div>
        </div>
        <a href="students.html?class=${classData.class_id}" class="btn btn-primary view-students-btn">
          <i class="fas fa-users"></i> View Students
        </a>
      </div>
    `;
  }

  // Setup event listeners for enrolled classes
  function setupEnrolledClassEventListeners() {
    document.querySelectorAll('.leave-class-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        const groupCode = e.target.closest('.class-card').querySelector('.detail-value').textContent;
        
        // Update quit modal content
        document.getElementById('quitClassName').textContent = className;
        document.getElementById('confirmQuitBtn').dataset.classId = classId;
        
        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const quitModal = document.getElementById('quitClassModal');
        modalOverlay.classList.add('active');
        quitModal.classList.add('active');
      });
    });
  }

  // Setup event listeners for tutored classes
  function setupTutoredClassEventListeners() {
    document.querySelectorAll('.delete-class-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        
        // Update delete modal content
        document.getElementById('deleteClassName').textContent = className;
        
        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const deleteModal = document.getElementById('deleteClassModal');
        modalOverlay.classList.add('active');
        deleteModal.classList.add('active');
      });
    });
  }

  // Initialize all functionality
  initializeTabs();
  initializeModals();
  initializeProfileDropdown();
  updateCurrentDate();
  loadUserProfile();
  loadEnrolledClasses();
  loadTutoredClasses();
}); 