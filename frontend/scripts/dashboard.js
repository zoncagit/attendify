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
  const API_URL = 'http://127.0.0.1:8000/api/v1';
  const ENDPOINTS = {
    ENROLLED_CLASSES: `${API_URL}/classes/api/v1/classes`,
    TUTORED_CLASSES: `${API_URL}/classes/api/v1/classes`,
    CREATE_CLASS: `${API_URL}/classes/api/v1/classes`,
    GET_CLASS: (classId) => `${API_URL}/classes/api/v1/classes/${classId}`,
    CREATE_GROUP: (classId) => `${API_URL}/classes/api/v1/classes/${classId}/groups`,
    LIST_CLASS_GROUPS: (classId) => `${API_URL}/classes/api/v1/classes/${classId}/groups`,
    JOIN_GROUP: (groupCode) => `${API_URL}/classes/api/v1/classes/groups/join/${groupCode}`,
    LEAVE_CLASS: (classId) => `${API_URL}/classes/api/v1/classes/${classId}/leave`,
    GET_CLASS_USERS: (classId) => `${API_URL}/classes/api/v1/classes/${classId}/users`,
    GET_GROUP_USERS: (groupId) => `${API_URL}/classes/api/v1/classes/groups/${groupId}/users`,
    REMOVE_USER_FROM_GROUP: (groupCode, userId) => `${API_URL}/groups/groups/${groupCode}/members/${userId}`,
    GET_CLASS_GROUPS: (classId) => `${API_URL}/groups/groups/class/${classId}`,
    GET_GROUP_COUNT: (classId) => `${API_URL}/groups/groups/class/${classId}/count`,
    GET_USER_COUNT: (classId) => `${API_URL}/groups/groups/class/${classId}/users/count`,
    USER_PROFILE: `${API_URL}/users/profile`
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
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.JOIN_GROUP(groupCode), {
        method: 'POST'
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
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.CREATE_GROUP(classId), {
        method: 'POST',
        body: JSON.stringify({ name: groupName })
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
      const { ok, data, status } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS(classId), {
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
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.LEAVE_CLASS(classId), {
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
    await joinGroup(groupCode);
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
  async function createTutoredClassCard(classData) {
    const groupCount = await getGroupCount(classData.class_id);
    const userCount = await getUserCount(classData.class_id);
    
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
            <span class="detail-value">${groupCount}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Students:</span>
            <span class="detail-value">${userCount}</span>
          </div>
        </div>
        <div class="class-actions">
          <a href="students.html?class=${classData.class_id}" class="btn btn-primary view-students-btn">
            <i class="fas fa-users"></i> View Students
          </a>
          <button class="btn btn-secondary add-group-btn" data-class-id="${classData.class_id}">
            <i class="fas fa-layer-group"></i> Add Group
          </button>
        </div>
      </div>
    `;
  }

  // Setup event listeners for enrolled classes
  function setupEnrolledClassEventListeners() {
    document.querySelectorAll('.leave-class-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        const className = e.target.closest('.class-card').querySelector('.class-name').textContent;
        const groupCode = e.target.closest('.class-card').querySelector('.detail-value').textContent;
        
        document.getElementById('quitClassName').textContent = className;
        document.getElementById('quitClassCode').textContent = groupCode;
        document.getElementById('confirmQuitBtn').dataset.classId = classId;
        
        const modalOverlay = document.getElementById('modalOverlay');
        const quitModal = document.getElementById('quitClassModal');
        modalOverlay.classList.add('active');
        quitModal.classList.add('active');
      });
    });
  }

  // Setup event listeners for tutored classes
  function setupTutoredClassEventListeners() {
    // Delete class buttons
    document.querySelectorAll('.delete-class-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        const className = e.target.closest('.class-card').querySelector('.class-name').textContent;
        
        document.getElementById('deleteClassName').textContent = className;
        document.getElementById('confirmDeleteBtn').dataset.classId = classId;
        
        const modalOverlay = document.getElementById('modalOverlay');
        const deleteModal = document.getElementById('deleteClassModal');
        modalOverlay.classList.add('active');
        deleteModal.classList.add('active');
      });
    });

    // Add group buttons
    document.querySelectorAll('.add-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const classId = e.target.closest('.class-card').dataset.classId;
        const className = e.target.closest('.class-card').querySelector('.class-name').textContent;
        
        document.getElementById('addGroupClassName').textContent = className;
        document.getElementById('confirmAddGroupBtn').dataset.classId = classId;
        
        const modalOverlay = document.getElementById('modalOverlay');
        const addGroupModal = document.getElementById('addGroupModal');
        modalOverlay.classList.add('active');
        addGroupModal.classList.add('active');
      });
    });
  }

  // Add group modal event listeners
  document.getElementById('confirmAddGroupBtn')?.addEventListener('click', async () => {
    const classId = document.getElementById('confirmAddGroupBtn').dataset.classId;
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
      utils.showNotification('Please enter a group name', 'error');
      return;
    }
    
    await createGroup(classId, groupName);
    closeAllModals();
    loadTutoredClasses();
  });

  // Get class details
  async function getClass(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS(classId));
      if (!ok) {
        throw new Error(data.message || 'Failed to get class details');
      }
      return data;
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Create group in class
  async function createGroup(classId, groupName) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.CREATE_GROUP(classId), {
        method: 'POST',
        body: JSON.stringify({ name: groupName })
      });

      if (ok) {
        utils.showNotification('Group created successfully', 'success');
        return data;
      } else {
        throw new Error(data.message || 'Failed to create group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // List groups in a class
  async function listClassGroups(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.LIST_CLASS_GROUPS(classId));
      if (!ok) {
        throw new Error(data.message || 'Failed to list class groups');
      }
      return data;
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Join a group
  async function joinGroup(groupCode) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.JOIN_GROUP(groupCode), {
        method: 'POST'
      });

      if (ok) {
        utils.showNotification('Successfully joined group', 'success');
        loadEnrolledClasses();
        return data;
      } else {
        throw new Error(data.message || 'Failed to join group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get class users
  async function getClassUsers(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_CLASS_USERS(classId));
      if (!ok) {
        throw new Error(data.message || 'Failed to get class users');
      }
      return data;
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get group users
  async function getGroupUsers(groupId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_GROUP_USERS(groupId));
      if (!ok) {
        throw new Error(data.message || 'Failed to get group users');
      }
      return data;
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Remove user from group
  async function removeUserFromGroup(groupCode, userId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.REMOVE_USER_FROM_GROUP(groupCode, userId), {
        method: 'DELETE'
      });

      if (ok) {
        utils.showNotification('User removed from group successfully', 'success');
        return true;
      } else {
        throw new Error(data.message || 'Failed to remove user from group');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get class groups count
  async function getGroupCount(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_GROUP_COUNT(classId));
      if (!ok) {
        throw new Error(data.message || 'Failed to get group count');
      }
      return data.count;
    } catch (error) {
      utils.showNotification(error.message, 'error');
      throw error;
    }
  }

  // Get class users count
  async function getUserCount(classId) {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.GET_USER_COUNT(classId));
      if (!ok) {
        throw new Error(data.message || 'Failed to get user count');
      }
      return data.count;
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