document.addEventListener('DOMContentLoaded', function () {
  // Constants for local storage keys
  const STORAGE_KEYS = {
    USER_DATA: 'attendify_user_data',
    ENROLLED_CLASSES: 'attendify_enrolled_classes',
    TUTORED_CLASSES: 'attendify_tutored_classes'
  };

  // DOM Elements
  const elements = {
    backBtn: document.getElementById('backBtn'),
    className: document.getElementById('className'),
    classCode: document.getElementById('classCode'),
    groupFilter: document.getElementById('groupFilter'),
    groupSelect: document.getElementById('groupSelect'),
    studentsList: document.getElementById('studentsList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateMessage: document.getElementById('emptyStateMessage'),
    modalOverlay: document.getElementById('modalOverlay'),
    addStudentModal: document.getElementById('addStudentModal'),
    removeStudentModal: document.getElementById('removeStudentModal'),
    exportAttendanceModal: document.getElementById('exportAttendanceModal'),
    exportBtn: document.getElementById('exportBtn'),
    profileDropdownBtn: document.getElementById('profileDropdownBtn'),
    profileDropdownMenu: document.getElementById('profileDropdownMenu'),
    settingsBtn: document.getElementById('settingsBtn'),
    logoutBtn: document.getElementById('logoutBtn')
  };

  // State
  let userData = {};
  let classData = null;
  let currentClassCode = '';
  let currentGroupName = '';
  let userRole = ''; // 'teacher' or 'student'

  // Initialize the page
  initPage();

  function initPage() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentClassCode = urlParams.get('class') || '';
    currentGroupName = urlParams.get('group') || 'all';
    userRole = urlParams.get('role') || 'student';

    // Load data from localStorage
    loadData();

    // Ensure all groups have unique codes
    ensureGroupCodes();

    // Ensure all students are assigned to at least one group
    ensureAllStudentsInGroups();

    // Set up event listeners
    setupEventListeners();

    // Set up profile dropdown
    setupProfileDropdown();

    // Initialize the UI
    initializeUI();

    // Setup copy buttons
    setupCopyButtons();
  }

  function loadData() {
    // Load user data
    const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (storedUserData) {
      userData = JSON.parse(storedUserData);
    }

    // Find the class data based on the class code
    const storedEnrolledClasses = localStorage.getItem(STORAGE_KEYS.ENROLLED_CLASSES);
    const storedTutoredClasses = localStorage.getItem(STORAGE_KEYS.TUTORED_CLASSES);

    let enrolledClasses = [];
    let tutoredClasses = [];

    if (storedEnrolledClasses) {
      enrolledClasses = JSON.parse(storedEnrolledClasses);
    }

    if (storedTutoredClasses) {
      tutoredClasses = JSON.parse(storedTutoredClasses);
    }

    // Look for the class in enrolled classes first
    classData = enrolledClasses.find(cls => cls.code === currentClassCode);

    // If not found, look in tutored classes
    if (!classData) {
      classData = tutoredClasses.find(cls => cls.code === currentClassCode);
    }

    // If we still don't have class data, create a default one for demo purposes
    if (!classData) {
      classData = {
        name: `Class ${currentClassCode}`,
        code: currentClassCode,
        groups: [
          { name: 'Default Group', students: [] }
        ],
        students: []
      };
    }

    // Make sure we have a students array and groups array
    if (!classData.students) {
      classData.students = [];
    }

    if (!classData.groups) {
      classData.groups = [{ name: 'Default Group', students: [] }];
    }

    // For demo purposes, add some dummy students if there are none
    if (classData.students.length === 0) {
      addDummyStudents();
    }
  }

  function setupEventListeners() {
    // Back button
    if (elements.backBtn) {
      elements.backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
      });
    }

    // Group filter
    if (elements.groupSelect) {
      elements.groupSelect.addEventListener('change', (e) => {
        currentGroupName = e.target.value;
        renderStudentsList();
      });
    }

    // Export button
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', openExportModal);
    }

    // Modal buttons
    setupModalButtons();

    // Settings
    if (elements.settingsBtn) {
      elements.settingsBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
      });
    }

    // Logout
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', logout);
    }
  }

  function setupModalButtons() {
    // Add Student Modal
    const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
    const confirmAddStudentBtn = document.getElementById('confirmAddStudentBtn');

    if (cancelAddStudentBtn) {
      cancelAddStudentBtn.addEventListener('click', closeAllModals);
    }

    if (confirmAddStudentBtn) {
      confirmAddStudentBtn.addEventListener('click', addStudent);
    }

    // Remove Student Modal
    const cancelRemoveStudent = document.getElementById('cancelRemoveStudent');
    const confirmRemoveStudent = document.getElementById('confirmRemoveStudent');

    if (cancelRemoveStudent) {
      cancelRemoveStudent.addEventListener('click', closeAllModals);
    }

    if (confirmRemoveStudent) {
      confirmRemoveStudent.addEventListener('click', removeStudent);
    }

    // Export Modal
    const cancelExportBtn = document.getElementById('cancelExportBtn');
    const confirmExportBtn = document.getElementById('confirmExportBtn');

    if (cancelExportBtn) {
      cancelExportBtn.addEventListener('click', closeAllModals);
    }

    if (confirmExportBtn) {
      confirmExportBtn.addEventListener('click', exportAttendance);
    }
  }

  function setupProfileDropdown() {
    const profileBtn = document.querySelector('.user-profile');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');

    if (profileBtn && dropdownMenu) {
      // Toggle dropdown on profile button click
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove('active');
        }
      });

      // Close dropdown when pressing Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdownMenu.classList.remove('active');
        }
      });
    }
  }

  function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-student-id');

    copyButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const studentId = button.getAttribute('data-id');

        try {
          await navigator.clipboard.writeText(studentId);

          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'notification success';
          notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Student ID copied to clipboard!</span>
          `;

          document.body.appendChild(notification);

          // Remove notification after 3 seconds
          setTimeout(() => {
            notification.remove();
          }, 3000);
        } catch (err) {
          console.error('Failed to copy student ID:', err);

          // Show error notification
          const notification = document.createElement('div');
          notification.className = 'notification error';
          notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Failed to copy student ID</span>
          `;

          document.body.appendChild(notification);

          // Remove notification after 3 seconds
          setTimeout(() => {
            notification.remove();
          }, 3000);
        }
      });
    });

    // Set up copy button for header student ID
    const headerCopyIdBtn = document.getElementById('headerCopyIdBtn');
    if (headerCopyIdBtn) {
      headerCopyIdBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const idElement = document.getElementById('headerStudentId');
        const copySuccess = document.getElementById('headerCopySuccess');

        if (idElement) {
          const studentId = idElement.textContent.trim();
          navigator.clipboard.writeText(studentId)
            .then(() => {
              console.log('Student ID copied from header:', studentId);
              if (copySuccess) {
                copySuccess.style.display = 'inline';
                setTimeout(() => {
                  copySuccess.style.display = 'none';
                }, 2000);
              }
            })
            .catch(err => {
              console.error('Copy failed:', err);
              alert('Failed to copy student ID: ' + studentId);
            });
        }
      });
    }
  }

  function initializeUI() {
    // Set user profile data
    const userNameElement = document.getElementById('userName');
    const userInitialsElement = document.getElementById('userInitials');

    if (userNameElement) userNameElement.textContent = userData.name || 'User';
    if (userInitialsElement) userInitialsElement.textContent = userData.initials || 'U';

    // Set class name and code
    if (elements.className) elements.className.textContent = classData.name;
    if (elements.classCode) elements.classCode.textContent = classData.code;

    // Set up group filter
    if (elements.groupSelect) {
      // Clear existing options
      elements.groupSelect.innerHTML = '<option value="all">All Students</option>';

      // Add options for each group
      if (classData.groups && classData.groups.length > 0) {
        classData.groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.name;
          option.textContent = group.name;
          elements.groupSelect.appendChild(option);
        });
      }

      // Set the selected group
      elements.groupSelect.value = currentGroupName;
    }

    // Show/hide elements based on user role
    if (userRole === 'student') {
      // Hide group filter and add student functionality for students
      if (elements.groupFilter) elements.groupFilter.style.display = 'none';
      if (elements.exportBtn) elements.exportBtn.style.display = 'none';
    }

    // Render the students list
    renderStudentsList();
  }

  function renderStudentsList() {
    if (!elements.studentsList) return;

    // Clear the list
    elements.studentsList.innerHTML = '';

    // Get the students to display based on the selected group
    let studentsToDisplay = [];

    if (currentGroupName === 'all') {
      // Show all students
      studentsToDisplay = classData.students;
    } else {
      // Show only students from the selected group
      const group = classData.groups.find(g => g.name === currentGroupName);
      if (group && group.students) {
        // Get student details for each student ID in the group
        studentsToDisplay = group.students.map(studentId => {
          const student = classData.students.find(s => s.id === studentId);
          return student || { id: studentId, name: 'Unknown Student', attendance: 0 };
        });
      }
    }

    // Show empty state if there are no students
    if (studentsToDisplay.length === 0) {
      if (elements.emptyState) elements.emptyState.style.display = 'flex';
      if (elements.emptyStateMessage) {
        if (userRole === 'teacher') {
          elements.emptyStateMessage.textContent = 'Add students to this class to see them here.';
        } else {
          elements.emptyStateMessage.textContent = 'No students in this class yet.';
        }
      }
      if (elements.studentsList.parentElement) {
        elements.studentsList.parentElement.style.display = 'none';
      }
      return;
    }

    // Hide empty state and show students
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.studentsList.parentElement) {
      elements.studentsList.parentElement.style.display = 'block';
    }

    // Add each student to the list
    studentsToDisplay.forEach(student => {
      const studentItem = createStudentItem(student);
      elements.studentsList.appendChild(studentItem);
    });
  }

  function createStudentItem(student) {
    const item = document.createElement('div');
    item.className = 'student-item';

    // Determine attendance class
    let attendanceClass = 'attendance-low';
    if (student.attendance >= 80) {
      attendanceClass = 'attendance-high';
    } else if (student.attendance >= 60) {
      attendanceClass = 'attendance-medium';
    }

    // Generate avatar initials
    const nameParts = student.name.split(' ');
    const initials = nameParts.map(part => part.charAt(0)).join('').toUpperCase();

    // Find which group(s) the student belongs to with their codes
    let studentGroups = [];
    if (classData.groups && classData.groups.length > 0) {
      studentGroups = classData.groups
        .filter(group => group.students && group.students.includes(student.id))
        .map(group => {
          return {
            name: group.name,
            code: group.code || ''
          };
        });
    }

    // Default to "Default Group" if no group is assigned
    if (studentGroups.length === 0) {
      // Find Default Group code if it exists
      const defaultGroup = classData.groups.find(g => g.name === 'Default Group');
      const defaultGroupCode = defaultGroup ? defaultGroup.code || '' : '';

      studentGroups = [{
        name: 'Default Group',
        code: defaultGroupCode
      }];
    }

    // Create group badges HTML with tooltips showing codes
    const groupBadgesHTML = studentGroups.map(group =>
      `<span class="group-badge" title="${group.code ? 'Code: ' + group.code : ''}">
        ${group.name}
       </span>`
    ).join('');

    item.innerHTML = `
      <div class="student-name">
        <div class="student-avatar">
          <span class="initials">${initials}</span>
        </div>
        <div class="student-info">
          <span class="student-full-name">${student.name}</span>
          <span class="student-id-display">${student.id}</span>
        </div>
      </div>
      <div class="student-groups">
        ${groupBadgesHTML}
      </div>
      <div class="student-attendance">
        <span class="attendance-badge ${attendanceClass}">${student.attendance}%</span>
      </div>
      <div class="student-actions">
        <button class="action-btn view-history-btn" title="View History" data-student-id="${student.id}">
          <i class="fas fa-history"></i>
        </button>
        ${userRole === 'teacher' ? `
        <button class="action-btn remove-student-btn" title="Remove Student" data-student-id="${student.id}">
          <i class="fas fa-user-minus"></i>
        </button>
        ` : ''}
      </div>
    `;

    // Add event listeners
    const viewHistoryBtn = item.querySelector('.view-history-btn');
    const removeStudentBtn = item.querySelector('.remove-student-btn');

    if (viewHistoryBtn) {
      viewHistoryBtn.addEventListener('click', () => {
        // View student history (not implemented for this demo)
        alert(`View attendance history for ${student.name}`);
      });
    }

    if (removeStudentBtn) {
      removeStudentBtn.addEventListener('click', () => {
        openRemoveStudentModal(student);
      });
    }

    return item;
  }

  function addDummyStudents() {
    // Add 14 dummy students for demonstration purposes
    const dummyStudents = [
      { id: 'STU001', name: 'John Doe', attendance: 95 },
      { id: 'STU002', name: 'Jane Smith', attendance: 87 },
      { id: 'STU003', name: 'Robert Johnson', attendance: 75 },
      { id: 'STU004', name: 'Emily Wilson', attendance: 92 },
      { id: 'STU005', name: 'Michael Brown', attendance: 68 },
      { id: 'STU006', name: 'Sarah Davis', attendance: 79 },
      { id: 'STU007', name: 'David Miller', attendance: 83 },
      { id: 'STU008', name: 'Emma Garcia', attendance: 90 },
      { id: 'STU009', name: 'James Taylor', attendance: 88 },
      { id: 'STU010', name: 'Olivia Martinez', attendance: 93 },
      { id: 'STU011', name: 'William Anderson', attendance: 81 },
      { id: 'STU012', name: 'Sophia Thomas', attendance: 76 },
      { id: 'STU013', name: 'Benjamin Jackson', attendance: 85 },
      { id: 'STU014', name: 'Ava Harris', attendance: 91 }
    ];

    // Add students to the class
    classData.students = dummyStudents;

    // Define standard groups with unique codes
    const standardGroups = [
      { name: 'Group A', code: 'GRP101' },
      { name: 'Group B', code: 'GRP102' },
      { name: 'Group C', code: 'GRP103' },
      { name: 'Default Group', code: 'GRP000' },
      { name: 'Morning Session', code: 'GRP201' },
      { name: 'Evening Session', code: 'GRP202' },
      { name: 'Beginners', code: 'GRP301' },
      { name: 'Advanced', code: 'GRP302' }
    ];

    // Clear existing groups array
    classData.groups = [];

    // Add the standard groups with codes
    standardGroups.forEach(groupInfo => {
      // Ensure the code is set
      if (!groupInfo.code) {
        groupInfo.code = 'GRP' + Math.floor(100000 + Math.random() * 900000);
      }

      classData.groups.push({
        name: groupInfo.name,
        code: groupInfo.code,
        students: []
      });
    });

    // Verify no duplicate codes - just to be safe
    const codeMap = new Map();
    classData.groups.forEach((group, index) => {
      if (codeMap.has(group.code)) {
        // Generate a new unique code if duplicate found
        classData.groups[index].code = 'GRP' + Math.floor(100000 + Math.random() * 900000);
      }
      codeMap.set(group.code, group.name);
    });

    // Distribute students across the groups more evenly
    // Group A: 2 students
    const groupA = classData.groups.find(g => g.name === 'Group A');
    if (groupA) {
      groupA.students = [dummyStudents[0].id, dummyStudents[8].id];
    }

    // Group B: 2 students
    const groupB = classData.groups.find(g => g.name === 'Group B');
    if (groupB) {
      groupB.students = [dummyStudents[1].id, dummyStudents[9].id];
    }

    // Group C: 2 students
    const groupC = classData.groups.find(g => g.name === 'Group C');
    if (groupC) {
      groupC.students = [dummyStudents[2].id, dummyStudents[10].id];
    }

    // Default Group: 2 students
    const defaultGroup = classData.groups.find(g => g.name === 'Default Group');
    if (defaultGroup) {
      defaultGroup.students = [dummyStudents[3].id, dummyStudents[11].id];
    }

    // Morning Session: 2 students
    const morningSession = classData.groups.find(g => g.name === 'Morning Session');
    if (morningSession) {
      morningSession.students = [dummyStudents[4].id, dummyStudents[12].id];
    }

    // Evening Session: 1 student
    const eveningSession = classData.groups.find(g => g.name === 'Evening Session');
    if (eveningSession) {
      eveningSession.students = [dummyStudents[5].id];
    }

    // Beginners: 1 student
    const beginners = classData.groups.find(g => g.name === 'Beginners');
    if (beginners) {
      beginners.students = [dummyStudents[6].id];
    }

    // Advanced: 2 students
    const advanced = classData.groups.find(g => g.name === 'Advanced');
    if (advanced) {
      advanced.students = [dummyStudents[7].id, dummyStudents[13].id];
    }

    // Ensure all students are assigned to at least one group
    // If a student isn't in any group, add them to the Default Group
    dummyStudents.forEach(student => {
      const isAssigned = classData.groups.some(group =>
        group.students && group.students.includes(student.id)
      );

      if (!isAssigned && defaultGroup) {
        defaultGroup.students.push(student.id);
      }
    });

    // Save the updated class data
    saveClassData();
    console.log('Added dummy students with properly coded groups');
  }

  function openAddStudentModal() {
    // Populate the groups dropdown
    const studentGroupSelect = document.getElementById('studentGroup');

    if (studentGroupSelect) {
      // Clear existing options
      studentGroupSelect.innerHTML = '';

      // Add options for each group
      if (classData.groups && classData.groups.length > 0) {
        classData.groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.name;
          option.textContent = group.name;
          studentGroupSelect.appendChild(option);
        });
      }
    }

    // Clear form fields
    const studentNameInput = document.getElementById('studentName');
    const studentIdInput = document.getElementById('studentId');

    if (studentNameInput) studentNameInput.value = '';
    if (studentIdInput) studentIdInput.value = '';

    // Show modal
    elements.addStudentModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
  }

  function openRemoveStudentModal(student) {
    // Set student details in the modal
    const removeStudentName = document.getElementById('removeStudentName');
    const removeStudentId = document.getElementById('removeStudentId');
    const removeStudentClass = document.getElementById('removeStudentClass');

    if (removeStudentName) removeStudentName.textContent = student.name;
    if (removeStudentId) removeStudentId.textContent = student.id;
    if (removeStudentClass) removeStudentClass.textContent = classData.name;

    // Store the student ID for the remove operation
    elements.removeStudentModal.dataset.studentId = student.id;

    // Show modal
    elements.removeStudentModal.classList.add('active');
    elements.modalOverlay.classList.add('active');
  }

  function openExportModal() {
    // Show modal
    elements.exportAttendanceModal.classList.add('active');
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

  function addStudent() {
    // Get form values
    const studentNameInput = document.getElementById('studentName');
    const studentIdInput = document.getElementById('studentId');
    const studentGroupSelect = document.getElementById('studentGroup');

    if (studentNameInput && studentIdInput && studentGroupSelect) {
      const name = studentNameInput.value.trim();
      const id = studentIdInput.value.trim();
      const groupName = studentGroupSelect.value;

      // Validate inputs
      if (name === '' || id === '') {
        alert('Please enter both name and ID');
        return;
      }

      // Check if ID already exists
      if (classData.students.some(student => student.id === id)) {
        alert('Student ID already exists');
        return;
      }

      // Create new student object
      const newStudent = {
        id: id,
        name: name,
        attendance: 100 // New student starts with 100% attendance
      };

      // Add student to the class
      classData.students.push(newStudent);

      // Find the selected group
      let targetGroup = classData.groups.find(group => group.name === groupName);

      // If the selected group doesn't exist, find or create the Default Group
      if (!targetGroup) {
        targetGroup = classData.groups.find(group => group.name === 'Default Group');

        // If Default Group doesn't exist, create it with a unique code
        if (!targetGroup) {
          // Generate a unique group code for Default Group
          const groupCode = 'GRP000';
          targetGroup = {
            name: 'Default Group',
            code: groupCode,
            students: []
          };
          classData.groups.push(targetGroup);
        }
      }

      // Make sure the group has a students array
      if (!targetGroup.students) {
        targetGroup.students = [];
      }

      // Add student to the group
      targetGroup.students.push(id);

      // Save the updated class data
      saveClassData();

      // Close modal
      closeAllModals();

      // Update the UI
      renderStudentsList();
    }
  }

  function removeStudent() {
    // Get the student ID to remove
    const studentId = elements.removeStudentModal.dataset.studentId;

    if (studentId) {
      // Remove student from the class
      classData.students = classData.students.filter(student => student.id !== studentId);

      // Remove student from all groups
      if (classData.groups) {
        classData.groups.forEach(group => {
          if (group.students) {
            group.students = group.students.filter(id => id !== studentId);
          }
        });
      }

      // Save the updated class data
      saveClassData();

      // Close modal
      closeAllModals();

      // Update the UI
      renderStudentsList();
    }
  }

  function exportAttendance() {
    // Get export options
    const exportFormat = document.getElementById('exportFormat').value;
    const dateRange = document.getElementById('dateRange').value;

    // In a real app, this would generate and download a file
    alert(`Exporting attendance data in ${exportFormat} format for ${dateRange} range`);

    // Close modal
    closeAllModals();
  }

  function saveClassData() {
    // In a real app, this would save to a server
    // For this demo, we'll update the local storage

    // Check if this is an enrolled class or tutored class
    const storedEnrolledClasses = localStorage.getItem(STORAGE_KEYS.ENROLLED_CLASSES);
    const storedTutoredClasses = localStorage.getItem(STORAGE_KEYS.TUTORED_CLASSES);

    let enrolledClasses = [];
    let tutoredClasses = [];

    if (storedEnrolledClasses) {
      enrolledClasses = JSON.parse(storedEnrolledClasses);
    }

    if (storedTutoredClasses) {
      tutoredClasses = JSON.parse(storedTutoredClasses);
    }

    // Update the class in the appropriate array
    let updated = false;

    // Check enrolled classes
    const enrolledIndex = enrolledClasses.findIndex(cls => cls.code === classData.code);
    if (enrolledIndex !== -1) {
      enrolledClasses[enrolledIndex] = classData;
      localStorage.setItem(STORAGE_KEYS.ENROLLED_CLASSES, JSON.stringify(enrolledClasses));
      updated = true;
    }

    // Check tutored classes
    const tutoredIndex = tutoredClasses.findIndex(cls => cls.code === classData.code);
    if (tutoredIndex !== -1) {
      tutoredClasses[tutoredIndex] = classData;
      localStorage.setItem(STORAGE_KEYS.TUTORED_CLASSES, JSON.stringify(tutoredClasses));
      updated = true;
    }

    // If not found in either, add to tutored classes (default)
    if (!updated) {
      tutoredClasses.push(classData);
      localStorage.setItem(STORAGE_KEYS.TUTORED_CLASSES, JSON.stringify(tutoredClasses));
    }
  }

  function logout() {
    // Here we would normally clear authentication tokens
    // For this demo, we'll just redirect to index.html
    window.location.href = 'index.html';
  }

  // Function to ensure all groups have unique codes
  function ensureGroupCodes() {
    if (!classData || !classData.groups) return;

    let hasChanges = false;

    // Check if any group is missing a code
    classData.groups.forEach((group, index) => {
      if (!group.code) {
        // Generate a unique code for this group
        // Use a deterministic code for standard groups, random for others
        let groupCode;

        switch (group.name) {
          case 'Group A':
            groupCode = 'GRP101';
            break;
          case 'Group B':
            groupCode = 'GRP102';
            break;
          case 'Group C':
            groupCode = 'GRP103';
            break;
          case 'Default Group':
            groupCode = 'GRP000';
            break;
          case 'Morning Session':
            groupCode = 'GRP201';
            break;
          case 'Evening Session':
            groupCode = 'GRP202';
            break;
          case 'Beginners':
            groupCode = 'GRP301';
            break;
          case 'Advanced':
            groupCode = 'GRP302';
            break;
          default:
            // Generate a random code for non-standard groups
            groupCode = 'GRP' + Math.floor(100000 + Math.random() * 900000);
        }

        // Check if this code is already used by another group
        let isDuplicate = false;
        let attempt = 0;

        do {
          isDuplicate = classData.groups.some((g, i) =>
            i !== index && g.code === groupCode
          );

          if (isDuplicate) {
            // If it's a duplicate, generate a new random code
            groupCode = 'GRP' + Math.floor(100000 + Math.random() * 900000);
            attempt++;
          }
        } while (isDuplicate && attempt < 10);

        // Assign the code to the group
        classData.groups[index].code = groupCode;
        hasChanges = true;
      }
    });

    // If any changes were made, save the updated class data
    if (hasChanges) {
      saveClassData();
      console.log('Updated missing group codes');
    }
  }

  // Function to ensure all students are assigned to at least one group
  function ensureAllStudentsInGroups() {
    if (!classData || !classData.students || !classData.groups) return;

    // Find the Default Group
    let defaultGroup = classData.groups.find(group => group.name === 'Default Group');

    // If Default Group doesn't exist, create it
    if (!defaultGroup) {
      defaultGroup = {
        name: 'Default Group',
        code: 'GRP000',
        students: []
      };
      classData.groups.push(defaultGroup);
    }

    // Make sure the Default Group has a valid students array
    if (!defaultGroup.students) {
      defaultGroup.students = [];
    }

    // Check if each student is in at least one group
    let hasChanges = false;

    classData.students.forEach(student => {
      const isAssigned = classData.groups.some(group =>
        group.students && group.students.includes(student.id)
      );

      // If student is not assigned to any group, add them to Default Group
      if (!isAssigned) {
        defaultGroup.students.push(student.id);
        console.log(`Assigned student ${student.name} (${student.id}) to Default Group`);
        hasChanges = true;
      }
    });

    // Validate and update student group property to match their actual group assignments
    classData.students.forEach(student => {
      // Find which group(s) this student is actually in
      const studentGroups = classData.groups
        .filter(group => group.students && group.students.includes(student.id))
        .map(group => group.name);

      // If student has no group property or their group doesn't match any actual assignment
      if (!student.group || !studentGroups.includes(student.group)) {
        // Assign the first group they're in, or Default Group if none
        student.group = studentGroups.length > 0 ? studentGroups[0] : 'Default Group';
        hasChanges = true;
      }
    });

    // Save changes if needed
    if (hasChanges) {
      saveClassData();
      console.log('Updated student group assignments');
    }
  }
});