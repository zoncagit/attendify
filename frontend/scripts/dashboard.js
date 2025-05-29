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
  const ENDPOINTS = {
    ENROLLED_CLASSES: `${CONFIG.API_URL}/api/v1/classes`,
    TUTORED_CLASSES: `${CONFIG.API_URL}/api/v1/classes`,
    ENROLL_CLASS: `${CONFIG.API_URL}/api/v1/classes/enroll`,
    CREATE_CLASS: `${CONFIG.API_URL}/api/v1/classes/`,
    GET_CLASS: (classId) => `${CONFIG.API_URL}/api/v1/classes/${classId}`,
    ADD_GROUP: `${CONFIG.API_URL}/api/v1/classes/groups/add`,
    DELETE_GROUP: `${CONFIG.API_URL}/api/v1/classes/groups/delete`,
    DELETE_CLASS: `${CONFIG.API_URL}/api/v1/classes/{class_id}`,
    QUIT_CLASS: `${CONFIG.API_URL}$/api/v1/classes/quit`,
    GET_CLASS_GROUPS: (classId) => `${CONFIG.API_URL}/api/v1/classes/${classId}/groups`,
    JOIN_GROUP: (groupCode) => `${CONFIG.API_URL}/api/v1/classes/groups/join/${groupCode}`,
    GET_CLASS_USERS: (classId) => `${CONFIG.API_URL}/api/v1/classes/${classId}/users`,
    GET_GROUP_USERS: (groupId) => `${CONFIG.API_URL}/api/v1/classes/groups/${groupId}/users`,
    REMOVE_USER_FROM_GROUP: (groupCode, userId) => `${CONFIG.API_URL}/api/v1/groups/groups/${groupCode}/members/${userId}`,
    GET_CLASS_GROUP_COUNT: (classId) => `${CONFIG.API_URL}/api/v1/groups/groups/class/${classId}/count`,
    GET_CLASS_USER_COUNT: (classId) => `${CONFIG.API_URL}/api/v1/groups/groups/class/${classId}/users/count`,
    USER_PROFILE: `${CONFIG.API_URL}/api/v1/users/profile`


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
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.TUTORED_CLASSES);
      
      if (ok) {
        const tutoredClassesList = document.getElementById('tutoredClassesList');
        if (!tutoredClassesList) {
          console.error('tutoredClassesList element not found');
          return;
        }
        
        if (!Array.isArray(data) || data.length === 0) {
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
        
        // Create cards asynchronously
        const cardPromises = data.map(cls => createTutoredClassCard(cls));
        const cards = await Promise.all(cardPromises);
        tutoredClassesList.innerHTML = cards.join('');
        setupTutoredClassEventListeners();
      } else {
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
    return `
      <div class="class-card enrolled-class" data-class-id="${classData.class_id}">
        <div class="class-header">
          <h3 class="class-name">${classData.class_name}</h3>
          <button class="open-class-btn" title="Open Class">
            <i class="fas fa-external-link-alt"></i>
          </button>
        </div>
        <div class="class-details">
          <div class="detail-row">
            <span class="detail-label">Group:</span>
            <span class="detail-value">${classData.group_name || 'Default Group'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Attendance:</span>
            <span class="detail-value ${getAttendanceColorClass(classData.attendance_percentage)}">
              ${classData.attendance_percentage || 0}%
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Group Code:</span>
            <div class="code-container">
              <span class="code-value">${classData.group_code || ''}</span>
              <button class="copy-code-btn" title="Copy Code">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getAttendanceColorClass(percentage) {
    if (percentage >= 90) return 'attendance-high';
    if (percentage >= 75) return 'attendance-medium';
    return 'attendance-low';
  }

  // Helper function to create tutored class card
  async function createTutoredClassCard(classData) {
    const groupCount = await getClassGroupCount(classData.class_id);
    const studentCount = await getClassUserCount(classData.class_id);
    
    return `
      <div class="class-card tutored-class" data-class-id="${classData.class_id}">
        <div class="class-header">
          <h3 class="class-name">${classData.class_name}</h3>
          <button class="delete-class-btn" data-class-id="${classData.class_id}" title="Delete Class">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="class-details">
          <div class="detail-row">
            <span class="detail-label">Groups:</span>
            <span class="detail-value">${groupCount}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Students:</span>
            <span class="detail-value">${studentCount}</span>
          </div>
        </div>
        <button class="view-students-btn" data-class-id="${classData.class_id}">
          Click to view students
        </button>
      </div>
    `;
  }

  // Setup event listeners for enrolled classes
  function setupEnrolledClassEventListeners() {
    // Open class button
    document.querySelectorAll('.open-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        window.location.href = `class.html?id=${classId}`;
      });
    });

    // Copy code button
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const codeValue = e.target.closest('.code-container').querySelector('.code-value').textContent;
        navigator.clipboard.writeText(codeValue).then(() => {
          utils.showNotification('Group code copied to clipboard', 'success');
        }).catch(() => {
          utils.showNotification('Failed to copy group code', 'error');
        });
      });
    });
  }

  // Setup event listeners for tutored classes
  function setupTutoredClassEventListeners() {
    // Delete class button
    document.querySelectorAll('.delete-class-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        const className = e.target.closest('.class-card').querySelector('.class-name').textContent;
        
        if (confirm(`Are you sure you want to delete the class "${className}"?`)) {
          deleteClass(classId).then(() => {
            e.target.closest('.class-card').remove();
            utils.showNotification('Class deleted successfully', 'success');
          }).catch(error => {
            utils.showNotification(error.message || 'Failed to delete class', 'error');
          });
        }
      });
    });

    // View students button
    document.querySelectorAll('.view-students-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const classId = e.target.dataset.classId;
        window.location.href = `students.html?class=${classId}`;
      });
    });
  }

  // Get a specific class
  async function getClass(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS(classId));
      if (ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to get class details');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get groups in a class
  async function getClassGroups(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS_GROUPS(classId));
      if (ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to get class groups');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Join a specific group
  async function joinGroup(groupCode) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.JOIN_GROUP(groupCode), {
        method: 'POST'
      });
      if (ok) {
        utils.showNotification('Successfully joined group', 'success');
        loadEnrolledClasses();
      } else {
        throw new Error(data.message || 'Failed to join group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get users in a class
  async function getClassUsers(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS_USERS(classId));
      if (ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to get class users');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get users in a group
  async function getGroupUsers(groupId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_GROUP_USERS(groupId));
      if (ok) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to get group users');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Remove a user from a group
  async function removeUserFromGroup(groupCode, userId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.REMOVE_USER_FROM_GROUP(groupCode, userId), {
        method: 'DELETE'
      });
      if (ok) {
        utils.showNotification('Successfully removed user from group', 'success');
      } else {
        throw new Error(data.message || 'Failed to remove user from group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get group count in a class
  async function getClassGroupCount(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS_GROUP_COUNT(classId));
      if (ok) {
        return data.count;
      } else {
        throw new Error(data.message || 'Failed to get group count');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get user count in a class
  async function getClassUserCount(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS_USER_COUNT(classId));
      if (ok) {
        return data.count;
      } else {
        throw new Error(data.message || 'Failed to get user count');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
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