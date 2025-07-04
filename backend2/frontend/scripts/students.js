// Initialize Socket.IO connection
const socket = io('http://localhost:8000', {
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
});

// Camera and attendance variables
let videoStream = null;
let isProcessingFrame = false;
let currentSessionId = null;
const videoElement = document.getElementById('cameraFeed');
const faceDetectionBox = document.querySelector('.face-detection-box');
const statusMessage = document.querySelector('.status-message');

// Function to get user ID from localStorage
function getUserId() {
    const userData = localStorage.getItem('user_data');
    console.log('Raw user data from localStorage:', userData);
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('Parsed user data:', user);
            return user.user_id;  // Changed from user.id to user.user_id
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

// Start camera
async function startCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        videoElement.srcObject = videoStream;
        document.getElementById('cameraPlaceholder').style.display = 'none';
        statusMessage.textContent = 'Camera active - Ready to scan';
    } catch (error) {
        console.error('Error accessing camera:', error);
        statusMessage.textContent = 'Error accessing camera';
    }
}

// Process video frames
async function processVideoFrame() {
    if (!videoStream || isProcessingFrame) return;

    isProcessingFrame = true;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    try {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        socket.emit('process_attendance_frame', {
            session_id: currentSessionId,
            image: imageData
        });
    } catch (error) {
        console.error('Error processing frame:', error);
    }

    isProcessingFrame = false;
}

// Function to initialize attendance session with server
function initializeAttendanceSession(classCode, userId) {
    socket.emit('start_attendance_session', {
        class_id: classCode,
        user_id: userId
    });
}

// Function to start attendance session
function startAttendanceSession(classCode) {
    if (!classCode) return;

    // Get the current user ID
    const userId = getUserId();
    if (!userId) {
        alert('Please log in to start an attendance session');
        window.location.href = 'login.html';
        return;
    }

    // Show scan options modal
    const scanModalOverlay = document.getElementById('scanModalOverlay');
    const scanOptionsModal = document.getElementById('scanOptionsModal');

    if (scanModalOverlay && scanOptionsModal) {
        scanModalOverlay.style.display = 'flex';
        scanOptionsModal.style.display = 'block';
        
        // Add active class after a small delay for animation
        setTimeout(() => {
            scanModalOverlay.classList.add('active');
            scanOptionsModal.classList.add('active');
        }, 10);

        // Set up event handlers for options
        const faceRecognitionOption = document.getElementById('faceRecognitionOption');
        const qrCodeOption = document.getElementById('qrCodeOption');
        const manualEntryOption = document.getElementById('manualEntryOption');
        const cancelScanBtn = document.getElementById('cancelScanBtn');

        // Remove any existing event listeners
        const newFaceOption = faceRecognitionOption.cloneNode(true);
        const newQROption = qrCodeOption.cloneNode(true);
        const newManualOption = manualEntryOption.cloneNode(true);
        const newCancelBtn = cancelScanBtn.cloneNode(true);

        faceRecognitionOption.parentNode.replaceChild(newFaceOption, faceRecognitionOption);
        qrCodeOption.parentNode.replaceChild(newQROption, qrCodeOption);
        manualEntryOption.parentNode.replaceChild(newManualOption, manualEntryOption);
        cancelScanBtn.parentNode.replaceChild(newCancelBtn, cancelScanBtn);

        // Add event listener for face recognition option
        newFaceOption.addEventListener('click', function() {
            // Get the current user ID
            const userId = getUserId();
            if (!userId) {
                alert('Please log in to start an attendance session');
                window.location.href = 'login.html';
                return;
            }

            // Close the scan options modal
            closeScanModal();

            // Start the face recognition session
            startFaceRecognitionSession(classCode);

            // Initialize the attendance session with the server
            initializeAttendanceSession(classCode, userId);
        });

        // Add event listener for QR code option
        newQROption.addEventListener('click', function() {
            closeScanModal();
            startQRCodeSession(classCode);
        });

        // Add event listener for manual entry option
        newManualOption.addEventListener('click', function() {
            closeScanModal();
            startManualEntrySession(classCode);
        });

        // Add event listener for cancel button
        newCancelBtn.addEventListener('click', closeScanModal);
    }
}

// End attendance session
function endAttendanceSession() {
    if (currentSessionId) {
        socket.emit('end_attendance_session', {
            session_id: currentSessionId
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Get class code from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const classCode = urlParams.get('class');

    // Set current date
    updateCurrentDate();

    // First make sure the class exists
    ensureClassExists(classCode);

    // First load the class data to ensure groups exist
    preloadClassData(classCode);

    // Then load class details for UI
    loadClassDetails(classCode);

    // Load groups list
    loadGroupsList(classCode);

    // Load students list
    loadStudents(classCode);

    // Handle profile dropdown
    setupProfileDropdown();

    // Group selection now handled by clickable group cards

    // Setup delete confirmation modal
    setupDeleteConfirmation();

    // Setup search functionality
    setupSearchFunctionality(classCode);

    // Setup Excel export button
    const logToExcelBtn = document.getElementById('logToExcelBtn');
    if (logToExcelBtn) {
        logToExcelBtn.addEventListener('click', function () {
            exportToExcel(classCode);
        });
    }

    // Setup Start Session button with attendance integration
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function () {
            // Get the current user ID
            const userId = getUserId();
            if (!userId) {
                alert('Please log in to start an attendance session');
                window.location.href = 'login.html';
                return;
            }
            startAttendanceSession(classCode, userId);
        });
    }

    // Setup add group button
    // Make sure classCode is passed to setupAddGroupButton
    const urlParamsForAddGroup = new URLSearchParams(window.location.search);
    const classCodeForAddGroup = urlParamsForAddGroup.get('class');
    setupAddGroupButton(classCodeForAddGroup);

    // Setup header copy ID button
    setupHeaderCopyButton();

    // Setup Settings Modal and its copy button
    setupSettingsModal();

    // Initialize attendance socket listeners
    initializeAttendanceSocketListeners();
});

// Add attendance socket listeners
function initializeAttendanceSocketListeners() {
    socket.on('attendance_session_started', (data) => {
        currentSessionId = data.session_id;
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = `Session started - ${data.student_count} students in class`;
        }
        // Start processing frames
        setInterval(processVideoFrame, 1000); // Process a frame every second
    });

    socket.on('attendance_marked', (data) => {
        const statusMessage = document.querySelector('.status-message');
        const faceDetectionBox = document.querySelector('.face-detection-box');
        if (statusMessage) {
            statusMessage.textContent = data.message;
        }
        if (faceDetectionBox) {
            faceDetectionBox.style.display = 'block';
            faceDetectionBox.style.borderColor = 'var(--success)';
            setTimeout(() => {
                faceDetectionBox.style.display = 'none';
            }, 2000);
        }
        // Refresh the students list to show updated attendance
        const urlParams = new URLSearchParams(window.location.search);
        const classCode = urlParams.get('class');
        loadStudents(classCode);
    });

    socket.on('attendance_already_marked', (data) => {
        const statusMessage = document.querySelector('.status-message');
        const faceDetectionBox = document.querySelector('.face-detection-box');
        if (statusMessage) {
            statusMessage.textContent = data.message;
        }
        if (faceDetectionBox) {
            faceDetectionBox.style.display = 'block';
            faceDetectionBox.style.borderColor = 'var(--warning)';
            setTimeout(() => {
                faceDetectionBox.style.display = 'none';
            }, 2000);
        }
    });

    socket.on('attendance_no_match', (data) => {
        const statusMessage = document.querySelector('.status-message');
        const faceDetectionBox = document.querySelector('.face-detection-box');
        if (statusMessage) {
            statusMessage.textContent = data.message;
        }
        if (faceDetectionBox) {
            faceDetectionBox.style.display = 'block';
            faceDetectionBox.style.borderColor = 'var(--error)';
            setTimeout(() => {
                faceDetectionBox.style.display = 'none';
            }, 2000);
        }
    });

    socket.on('attendance_error', (data) => {
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = data.message;
        }
    });

    socket.on('attendance_session_ended', (data) => {
        const statusMessage = document.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = data.message;
        }
        currentSessionId = null;
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
    });
}

// Setup search functionality
function setupSearchFunctionality(classCode) {
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterStudents(searchTerm, classCode);
        });

        // Clear search when changing groups
        const groupCards = document.querySelectorAll('.group-card');
        groupCards.forEach(card => {
            card.addEventListener('click', function () {
                searchInput.value = '';
            });
        });
    }
}

// Filter students based on search term
function filterStudents(searchTerm, classCode) {
    const studentCards = document.querySelectorAll('.student-card');
    let visibleCount = 0;

    studentCards.forEach(card => {
        const studentName = card.querySelector('.student-name').textContent.toLowerCase();
        const studentId = card.querySelector('.student-id').textContent.toLowerCase();
        const studentGroup = card.querySelector('.student-group') ?
            card.querySelector('.student-group').textContent.toLowerCase() : '';

        if (searchTerm === '' ||
            studentName.includes(searchTerm) ||
            studentId.includes(searchTerm) ||
            studentGroup.includes(searchTerm)) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Handle no results message
    const studentsContainer = document.getElementById('studentsContainer');
    let noResultsMsg = document.getElementById('noResultsMsg');

    if (visibleCount === 0 && searchTerm !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.id = 'noResultsMsg';
            noResultsMsg.className = 'no-results';
            noResultsMsg.innerHTML = `
      <i class="fas fa-search"></i>
      <p>No students match your search</p>
    `;
            studentsContainer.appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Setup add group button
// Make sure classCode is passed to setupAddGroupButton
const urlParamsForAddGroup = new URLSearchParams(window.location.search);
const classCodeForAddGroup = urlParamsForAddGroup.get('class');
setupAddGroupButton(classCodeForAddGroup);

// Function to setup add group button
function setupAddGroupButton(currentClassCode) { // Renamed parameter to avoid conflict
    const addGroupBtn = document.getElementById('addGroupBtn');
    const addGroupModal = document.getElementById('addGroupModal');
    // Ensure you're selecting the correct overlay for this modal.
    // If confirmOverlay is for a different modal, this might be an issue.
    // Let's assume mini-modal-overlay is the generic one for mini-modals for now.
    const miniModalOverlay = document.getElementById('confirmOverlay'); // Assuming this is the correct overlay for addGroupModal
    const cancelAddGroupBtn = document.getElementById('cancelAddGroupBtn');
    const confirmAddGroupBtn = document.getElementById('confirmAddGroupBtn');
    const groupNameInput = document.getElementById('groupName');

    if (!addGroupBtn || !addGroupModal || !miniModalOverlay || !cancelAddGroupBtn || !confirmAddGroupBtn || !groupNameInput) {
        console.error('One or more elements for Add Group functionality are missing.');
        return;
    }

    // Function to show modal
    function showAddGroupModal() {
        addGroupModal.style.display = 'block';
        miniModalOverlay.style.display = 'block'; // Use the correct overlay
        setTimeout(() => addGroupModal.classList.add('active'), 10);
        groupNameInput.value = ''; // Clear previous input
        groupNameInput.focus();
    }

    // Function to hide modal
    function hideAddGroupModal() {
        addGroupModal.classList.remove('active');
        setTimeout(() => {
            addGroupModal.style.display = 'none';
            miniModalOverlay.style.display = 'none'; // Use the correct overlay
        }, 300);
    }

    // Show modal when add group button is clicked
    addGroupBtn.addEventListener('click', showAddGroupModal);

    // Hide modal when cancel button is clicked
    cancelAddGroupBtn.addEventListener('click', hideAddGroupModal);

    // Also hide when clicking on the overlay
    miniModalOverlay.addEventListener('click', function (e) {
        if (e.target === miniModalOverlay) { // Ensure click is directly on overlay
            hideAddGroupModal();
        }
    });

    // Handle group creation when confirm button is clicked
    confirmAddGroupBtn.addEventListener('click', function () {
        const groupName = groupNameInput.value.trim();

        if (!groupName) {
            groupNameInput.style.borderColor = 'var(--error)';
            // Optionally, add an error message next to the input
            let errorMsg = groupNameInput.parentNode.querySelector('.error-message-inline');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message-inline'; // Add a class for styling
                errorMsg.style.color = 'var(--error)';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '5px';
                groupNameInput.parentNode.appendChild(errorMsg);
            }
            errorMsg.textContent = 'Group name cannot be empty.';
            return;
        } else {
            let errorMsg = groupNameInput.parentNode.querySelector('.error-message-inline');
            if (errorMsg) errorMsg.textContent = ''; // Clear error
            groupNameInput.style.borderColor = 'rgba(255, 255, 255, 0.2)'; // Reset border
        }

        // Get class data
        const storedClasses = localStorage.getItem('attendify_tutored_classes');
        if (!storedClasses) {
            console.error("No 'attendify_tutored_classes' found in localStorage.");
            return;
        }

        const classes = JSON.parse(storedClasses);
        const classIndex = classes.findIndex(cls => cls.code === currentClassCode); // Use currentClassCode

        if (classIndex === -1) {
            console.error(`Class with code ${currentClassCode} not found.`);
            // Handle class not found (e.g., show error to user)
            return;
        }

        let targetClass = classes[classIndex];

        // Ensure groups array exists
        if (!targetClass.groups) {
            targetClass.groups = [];
        }

        // Check if group name already exists
        if (targetClass.groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
            groupNameInput.style.borderColor = 'var(--error)';
            let errorMsg = groupNameInput.parentNode.querySelector('.error-message-inline');
            if (!errorMsg) { // Create if doesn't exist
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message-inline';
                errorMsg.style.color = 'var(--error)';
                errorMsg.style.fontSize = '12px';
                errorMsg.style.marginTop = '5px';
                groupNameInput.parentNode.appendChild(errorMsg);
            }
            errorMsg.textContent = 'A group with this name already exists.';
            return;
        } else {
            let errorMsg = groupNameInput.parentNode.querySelector('.error-message-inline');
            if (errorMsg) errorMsg.textContent = ''; // Clear error
            groupNameInput.style.borderColor = 'rgba(255, 255, 255, 0.2)'; // Reset border
        }

        // Generate a unique group code (can reuse existing or adapt)
        function generateUniqueGroupCodeForStudentPage() {
            const prefix = 'GRP';
            let code;
            let isUnique = false;
            const allGroupCodes = classes.flatMap(c => c.groups ? c.groups.map(g => g.code) : []);

            while (!isUnique) {
                const randomNum = Math.floor(100000 + Math.random() * 900000);
                code = `${prefix}${randomNum}`;
                isUnique = !allGroupCodes.includes(code);
            }
            return code;
        }

        // Create new group
        const newGroup = {
            name: groupName,
            code: generateUniqueGroupCodeForStudentPage(), // Use a robust unique code generator
            students: [] // New groups start with no students
        };

        // Add group to class
        targetClass.groups.push(newGroup);

        // Save updated class data
        classes[classIndex] = targetClass;
        localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));

        // Show success message (reuse existing notification system if available, or simple alert)
        // This is the refined success message from your original code
        const successToast = document.createElement('div');
        successToast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(16, 185, 129, 0.9); /* More opaque for visibility */
    color: white; /* Ensure text is white for contrast */
    padding: 12px 20px;
    border-radius: 8px;
    /* border: 1px solid rgba(16, 185, 129, 0.2); */ /* Border might be redundant with solid background */
    font-size: 14px;
    z-index: 10000; /* Higher z-index */
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* Stronger shadow */
    opacity: 0; /* Start hidden for animation */
    transform: translateX(100%); /* Start off-screen for animation */
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
        successToast.innerHTML = `
    <i class="fas fa-check-circle"></i>
    Group "${groupName}" created (Code: ${newGroup.code})
  `;
        document.body.appendChild(successToast);
        // Animate in
        setTimeout(() => {
            successToast.style.opacity = '1';
            successToast.style.transform = 'translateX(0)';
        }, 10);
        // Animate out and remove
        setTimeout(() => {
            successToast.style.opacity = '0';
            successToast.style.transform = 'translateX(100%)';
            setTimeout(() => successToast.remove(), 300);
        }, 5000);


        // Refresh the groups list and UI elements
        loadGroupsList(currentClassCode); // Pass the correct class code
        // Potentially loadClassDetails if it affects UI related to groups
        // loadClassDetails(currentClassCode); // Uncomment if needed

        // Hide modal
        hideAddGroupModal();
    });

    // Reset input style on focus
    groupNameInput.addEventListener('focus', function () {
        this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        let errorMsg = this.parentNode.querySelector('.error-message-inline');
        if (errorMsg) errorMsg.textContent = ''; // Clear error on focus
    });

    // Handle Enter key in input
    groupNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if it's in a form
            confirmAddGroupBtn.click();
        }
    });
}

// Function to update the current date
function updateCurrentDate() {
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

// Helper function to make sure the class exists
function ensureClassExists(classCode) {
    if (!classCode) return;

    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    if (!storedClasses) {
        // No classes exist, create a default array with this class
        const defaultClasses = [{
            name: `Class ${classCode}`,
            code: classCode,
            createdAt: new Date().toISOString(),
            groups: [
                { name: 'Group A', code: 'GRP101', students: [] },
                { name: 'Group B', code: 'GRP102', students: [] },
                { name: 'Group C', code: 'GRP103', students: [] },
                { name: 'Default Group', code: 'GRP000', students: [] }
            ]
        }];

        localStorage.setItem('attendify_tutored_classes', JSON.stringify(defaultClasses));
        console.log('Created default class with code:', classCode);
        return;
    }

    // Check if this specific class exists
    const classes = JSON.parse(storedClasses);
    if (!classes.some(cls => cls.code === classCode)) {
        // Class doesn't exist, add it
        classes.push({
            name: `Class ${classCode}`,
            code: classCode,
            createdAt: new Date().toISOString(),
            groups: [
                { name: 'Group A', code: 'GRP101', students: [] },
                { name: 'Group B', code: 'GRP102', students: [] },
                { name: 'Group C', code: 'GRP103', students: [] },
                { name: 'Default Group', code: 'GRP000', students: [] }
            ]
        });

        localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));
        console.log('Added new class with code:', classCode);
    }
}

// Preload and sync class data
function preloadClassData(classCode) {
    if (!classCode) return;
    console.log('Preloading class data for:', classCode);

    // Generate dummy students if none exist
    if (!localStorage.getItem(`attendify_class_students_${classCode}`)) {
        console.log('No students found, generating dummy students');
        const dummyStudents = generateDummyStudents();
        localStorage.setItem(`attendify_class_students_${classCode}`, JSON.stringify(dummyStudents));
    }

    // Get class from localStorage
    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    if (!storedClasses) return;

    const classes = JSON.parse(storedClasses);
    const classIndex = classes.findIndex(cls => cls.code === classCode);

    if (classIndex === -1) {
        console.warn('Class not found in tutored classes');
        return;
    }

    let currentClass = classes[classIndex];

    // Ensure the class has a groups array
    if (!currentClass.groups || !Array.isArray(currentClass.groups)) {
        currentClass.groups = [];
    }

    // Ensure standard groups exist
    const standardGroups = [
        { name: 'Group A', code: 'GRP101' },
        { name: 'Group B', code: 'GRP102' },
        { name: 'Group C', code: 'GRP103' },
        { name: 'Default Group', code: 'GRP000' }
    ];

    let hasChanges = false;

    standardGroups.forEach(standardGroup => {
        if (!currentClass.groups.some(g => g.name === standardGroup.name)) {
            currentClass.groups.push({
                name: standardGroup.name,
                code: standardGroup.code,
                students: []
            });
            hasChanges = true;
        }
    });

    // Sync students from localStorage to class groups
    const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);

    if (storedStudents) {
        const students = JSON.parse(storedStudents);
        console.log('Syncing', students.length, 'students with class groups');

        // Map to track which students are assigned to which groups
        const studentGroupMap = new Map();

        // First, collect current group assignments
        if (currentClass.groups) {
            currentClass.groups.forEach(group => {
                if (group.students) {
                    group.students.forEach(studentId => {
                        studentGroupMap.set(studentId, group.name);
                    });
                }
            });
        }

        // Now ensure all students have their groups in sync
        let studentsModified = false;

        students.forEach(student => {
            // If student is already assigned to a group in the class data
            if (studentGroupMap.has(student.id)) {
                const assignedGroup = studentGroupMap.get(student.id);

                // If student.group doesn't match their actual assignment, update it
                if (student.group !== assignedGroup) {
                    student.group = assignedGroup;
                    studentsModified = true;
                }
            }
            // If student is not in any group, add them to their current group or Default Group
            else {
                const targetGroupName = student.group || 'Default Group';
                const targetGroup = currentClass.groups.find(g => g.name === targetGroupName);

                if (targetGroup) {
                    if (!targetGroup.students) targetGroup.students = [];
                    targetGroup.students.push(student.id);
                    hasChanges = true;
                } else {
                    // If target group doesn't exist, add to Default Group
                    const defaultGroup = currentClass.groups.find(g => g.name === 'Default Group') ||
                        currentClass.groups[0]; // Fallback to first group

                    if (defaultGroup) {
                        if (!defaultGroup.students) defaultGroup.students = [];
                        defaultGroup.students.push(student.id);
                        student.group = defaultGroup.name;
                        studentsModified = true;
                        hasChanges = true;
                    }
                }
            }
        });

        // Save changes to students if needed
        if (studentsModified) {
            localStorage.setItem(`attendify_class_students_${classCode}`, JSON.stringify(students));
            console.log('Updated student group assignments in localStorage');
        }
    }

    // Save class changes if needed
    if (hasChanges) {
        classes[classIndex] = currentClass;
        localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));
        console.log('Updated class data with synchronized groups');
    }
}

// Load class details
function loadClassDetails(classCode) {
    if (!classCode) {
        document.getElementById('classTitle').textContent = 'No Class Selected';
        return;
    }

    console.log('Loading class details for:', classCode);

    // Get class from localStorage
    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    if (storedClasses) {
        const classes = JSON.parse(storedClasses);
        const classIndex = classes.findIndex(cls => cls.code === classCode);

        if (classIndex !== -1) {
            const currentClass = classes[classIndex];
            console.log('Found class:', currentClass.name, 'with groups:', currentClass.groups);

            // Set class title with proper formatting and no class code
            document.getElementById('classTitle').textContent = currentClass.name;

            // Ensure all groups have codes
            let hasChanges = false;

            if (currentClass.groups && currentClass.groups.length > 0) {
                currentClass.groups.forEach((group, index) => {
                    if (!group.code) {
                        // Generate a unique code for this group
                        const randomCode = 'GRP' + Math.floor(100000 + Math.random() * 900000);
                        currentClass.groups[index].code = randomCode;
                        hasChanges = true;
                    }

                    // Debug group names
                    console.log(`Group: ${group.name}, Code: ${group.code}, Students: ${group.students ? group.students.length : 0}`);
                });

                // Save changes if needed
                if (hasChanges) {
                    classes[classIndex] = currentClass;
                    localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));
                    console.log('Updated group codes in loadClassDetails');
                }
            }

            // Group selector dropdown removed - groups are now clickable cards
        }
    }
}

// Load groups list
function loadGroupsList(classCode) {
    if (!classCode) return;

    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;

    // Get class from localStorage
    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    if (storedClasses) {
        const classes = JSON.parse(storedClasses);
        const currentClass = classes.find(cls => cls.code === classCode);

        if (currentClass && currentClass.groups && currentClass.groups.length > 0) {
            // First, ensure all groups have codes
            let hasChanges = false;
            currentClass.groups.forEach((group, index) => {
                if (!group.code) {
                    // Generate a unique code for this group
                    group.code = 'GRP' + Math.floor(100000 + Math.random() * 900000);
                    hasChanges = true;
                }
            });

            // Save changes if needed
            if (hasChanges) {
                const classIndex = classes.findIndex(cls => cls.code === classCode);
                if (classIndex !== -1) {
                    classes[classIndex] = currentClass;
                    localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));
                    console.log('Updated group codes in loadGroupsList');
                }
            }

            groupsList.innerHTML = ''; // Clear the list

            // Add "All Students" option first
            const allStudentsCard = document.createElement('div');
            allStudentsCard.className = 'group-card active';
            allStudentsCard.setAttribute('data-group', 'all');
            allStudentsCard.style.cursor = 'pointer';
            allStudentsCard.innerHTML = `
      <div class="group-name">All Students</div>
      <div class="group-students-count">
        <i class="fas fa-users"></i> View all students from all groups
</div>
    `;

            // Make the All Students card clickable
            allStudentsCard.addEventListener('click', function () {
                // Set current group title
                document.getElementById('currentGroupTitle').textContent = 'All Students';

                // Highlight selected card
                document.querySelectorAll('.group-card').forEach(card => {
                    card.classList.remove('active');
                });
                this.classList.add('active');

                // Load all students
                loadStudents(classCode, 'all');
            });

            groupsList.appendChild(allStudentsCard);

            currentClass.groups.forEach(group => {
                // Count students in this group
                const studentCount = group.students ? group.students.length : 0;

                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                groupCard.setAttribute('data-group', group.name);
                groupCard.style.cursor = 'pointer';
                groupCard.innerHTML = `
        <div class="group-name">${group.group_name}</div>
        <div class="group-code-display">
          <span class="group-code-label">Code:</span>
          <span class="group-code-value">${group.group_Code || 'N/A'}</span>
          <button class="group-code-copy-btn" title="Copy Code" data-code="${group.code || ''}">
            <i class="fas fa-copy"></i>
          </button>
          <span class="group-code-copy-success">Copied!</span>
</div>
        <div class="group-students-count">
          <i class="fas fa-user-graduate"></i> ${studentCount} student${studentCount !== 1 ? 's' : ''}
</div>
      `;

                // Make the group card clickable
                groupCard.addEventListener('click', function (e) {
                    // Prevent click on copy button from triggering group selection
                    if (e.target.closest('.group-code-copy-btn')) return;

                    // Set current group title
                    document.getElementById('currentGroupTitle').textContent =
                        group.name === 'Default Group' ? 'Default Group' : `${group.name}`;

                    // Highlight selected group
                    document.querySelectorAll('.group-card').forEach(card => {
                        card.classList.remove('active');
                    });
                    this.classList.add('active');

                    // Load students for this group
                    loadStudents(classCode, group.name);
                });

                groupsList.appendChild(groupCard);
            });

            // Add event listeners to the copy code buttons
            setupGroupCodeCopyButtons();
        } else {
            groupsList.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 20px;">
        <i class="fas fa-users-slash" style="font-size: 24px; margin-bottom: 10px; color: var(--text-secondary);"></i>
        <p>No groups available for this class.</p>
  </div>
    `;
        }
    }
}

// Setup copy buttons for group codes
function setupGroupCodeCopyButtons() {
    const copyButtons = document.querySelectorAll('.group-code-copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const code = this.getAttribute('data-code');
            if (!code) return;

            const successMsg = this.nextElementSibling;

            navigator.clipboard.writeText(code)
                .then(() => {
                    // Show success message
                    successMsg.style.display = 'block';

                    // Hide after 2 seconds
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                });
        });
    });
}

// Load students list
function loadStudents(classCode, groupFilter = 'all') {
    const studentsContainer = document.getElementById('studentsContainer');
    console.log('Loading students for class:', classCode, 'with group filter:', groupFilter);

    if (!classCode) {
        studentsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-users-slash"></i>
</div>
      <h4>No Class Selected</h4>
      <p>Please go back to the dashboard and select a class.</p>
</div>
  `;
        return;
    }

    // Generate dummy students if none exist
    if (!localStorage.getItem(`attendify_class_students_${classCode}`)) {
        // Create dummy students with various groups
        const dummyStudents = generateDummyStudents();
        localStorage.setItem(`attendify_class_students_${classCode}`, JSON.stringify(dummyStudents));
    }

    // Get class data to access groups
    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    let currentClass = null;
    let classIndex = -1;

    if (storedClasses) {
        const classes = JSON.parse(storedClasses);
        classIndex = classes.findIndex(cls => cls.code === classCode);
        if (classIndex !== -1) {
            currentClass = classes[classIndex];
            console.log('Found class:', currentClass.name, 'with groups:', currentClass.groups);
        }
    }

    // Get students from localStorage
    const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);
    if (storedStudents) {
        let students = JSON.parse(storedStudents);
        console.log('Total students before filtering:', students.length);

        // Validate and ensure all students have a group
        let studentsModified = false;
        students = students.map(student => {
            if (!student.group || student.group.trim() === '') {
                student.group = 'Default Group';
                studentsModified = true;
            }
            return student;
        });

        // Also ensure students are in their respective groups in class data
        if (currentClass && currentClass.groups) {
            let classModified = false;

            // Find or create Default Group
            let defaultGroup = currentClass.groups.find(g => g.name === 'Default Group');
            if (!defaultGroup) {
                defaultGroup = {
                    name: 'Default Group',
                    code: 'GRP000',
                    students: []
                };
                currentClass.groups.push(defaultGroup);
                classModified = true;
            }

            // Ensure all students are in a group in the class data
            students.forEach(student => {
                // Check if student is in any group
                const isInGroup = currentClass.groups.some(group =>
                    group.students && group.students.includes(student.id)
                );

                if (!isInGroup) {
                    // If not in any group, add to the group matching their 'group' property
                    const matchingGroup = currentClass.groups.find(g => g.name === student.group);

                    if (matchingGroup) {
                        if (!matchingGroup.students) matchingGroup.students = [];
                        matchingGroup.students.push(student.id);
                        classModified = true;
                    } else {
                        // If no matching group, add to Default Group
                        if (!defaultGroup.students) defaultGroup.students = [];
                        defaultGroup.students.push(student.id);
                        classModified = true;
                    }
                }
            });

            // Save class data changes if needed
            if (classModified && classIndex !== -1) {
                const classes = JSON.parse(storedClasses);
                classes[classIndex] = currentClass;
                localStorage.setItem('attendify_tutored_classes', JSON.stringify(classes));
                console.log('Updated student group assignments in class data');
            }
        }

        // If any students were modified, save the changes back to localStorage
        if (studentsModified) {
            localStorage.setItem(`attendify_class_students_${classCode}`, JSON.stringify(students));
            console.log('Fixed students missing group assignment');
        }

        // Apply group filter if needed
        if (groupFilter !== 'all') {
            if (groupFilter === 'unassigned') {
                // Show only students not in any group
                students = students.filter(student => {
                    const isAssignedToGroup = currentClass && currentClass.groups &&
                        currentClass.groups.some(group =>
                            group.students && group.students.includes(student.id)
                        );
                    return !isAssignedToGroup;
                });
            } else {
                // Debug: log each student's group compared to the filter
                console.log('Filtering students for group:', groupFilter);
                students.forEach(student => {
                    console.log(`Student ${student.name} is in group '${student.group}', match: ${student.group === groupFilter}`);
                });

                // Filter by exact group name match
                students = students.filter(student => student.group === groupFilter);
            }
            console.log('Students after filtering:', students.length);
        }

        // Display students or empty state
        if (students.length > 0) {
            studentsContainer.innerHTML = '';

            students.forEach((student, index) => {
                const studentCard = document.createElement('div');
                studentCard.className = 'student-card';

                // Get initials for avatar
                const nameParts = student.name.split(' ');
                const initials = nameParts.length > 1
                    ? nameParts[0][0] + nameParts[1][0]
                    : nameParts[0][0];

                // Get group code if available
                let groupCode = '';
                if (currentClass && currentClass.groups) {
                    const studentGroup = currentClass.groups.find(g => g.name === student.group);
                    if (studentGroup && studentGroup.code) {
                        groupCode = ` (${studentGroup.code})`;
                    }
                }

                studentCard.innerHTML = `
<div class="student-info">
          <div class="student-avatar">${initials}</div>
  <div class="student-details">
    <div class="student-name">
      ${student.name}
              ${(() => {
                        const todayAttendance = getStudentAttendanceStatus(student.id);
                        return `<div class="today-status">
                  <span class="today-status-label">Today:</span>
                  <span class="${todayAttendance.statusClass}">${todayAttendance.status}</span>
                </div>`;
                    })()}
            </div>
            <div class="student-id">
              ${student.id}
              <button class="copy-student-id" data-id="${student.id}" title="Copy ID">
                <i class="fas fa-copy"></i>
      </button>
      <span class="copy-success">Copied!</span>
    </div>
            <div class="student-group" style="margin-top: 8px;">
              <strong>Group: </strong>
              <span class="group-badge" style="background: rgba(79, 70, 229, 0.2); padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: var(--primary); border: 1px solid rgba(79, 70, 229, 0.3);" title="${student.group}${groupCode}">
                ${student.group}
              </span>
  </div>
</div>
</div>
        
                        <div class="middle-container">
<div class="attendance-row">
            <div class="attendance-counter small">
              <div class="attendance-count">
                <span class="attended">${Math.floor(Math.random() * 3 + 5)}</span><span class="slash">/</span><span class="total">8</span>
  </div>
              <div class="attendance-label">Classes</div>
</div>

            <div class="checkmarks-container small">
              <div class="absence-label">Justified Absences:</div>
    <div class="checkmarks-row">
                <div class="checkmark" data-student="${student.id}" data-checkpoint="1" title="Absence 1"></div>
                <div class="checkmark" data-student="${student.id}" data-checkpoint="2" title="Absence 2"></div>
                <div class="checkmark" data-student="${student.id}" data-checkpoint="3" title="Absence 3"></div>
                <div class="checkmark" data-student="${student.id}" data-checkpoint="4" title="Absence 4"></div>
    </div>
  </div>
            
            <button class="btn btn-delete delete-student-btn small-btn" data-index="${index}" data-name="${student.name}">
              <i class="fas fa-user-minus"></i> Remove
            </button>
</div>
      `;

                studentsContainer.appendChild(studentCard);
            });

            // Add event listeners for copy buttons
            setupCopyButtons();

            // Add event listeners for delete buttons
            setupDeleteButtons(classCode);

            // Setup checkmarks
            setupCheckmarks(classCode);

            // Initialize random attendance values for demonstration
            initializeAttendanceCounters();
        } else {
            studentsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-user-slash"></i>
</div>
        <h4>No Students Found</h4>
        <p>There are no students in ${groupFilter === 'all' ? 'this class' : 'the selected group'}.</p>
</div>
`;
        }
    }
}

// Function to setup checkmark toggling and saved state
function setupCheckmarks(classCode) {
    const checkmarks = document.querySelectorAll('.checkmark');

    // Create audio element for click sound feedback
    const clickSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAoDAwMDAwMEREUFBQUGBgbGxscHB8fHx8jIyYmJiYpKSsrLCwvLy8vMzM2NjY2ODg7Ozs7P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jOMAAAAX0K1M/45NiqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMQQA/MK5ndMYmaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/4zjELQP4AlaITGMgiqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//M4xCQDwAAGkAAAAIqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=');
    clickSound.volume = 0.5;

    // Load saved checkmark states from localStorage
    const storedCheckmarks = localStorage.getItem(`attendify_justified_absences_${classCode}`);
    const checkmarkStates = storedCheckmarks ? JSON.parse(storedCheckmarks) : {};

    // Apply saved states to checkmarks
    checkmarks.forEach(checkmark => {
        const studentId = checkmark.getAttribute('data-student');
        const checkpointId = checkmark.getAttribute('data-checkpoint');
        const stateKey = `${studentId}_${checkpointId}`;

        if (checkmarkStates[stateKey]) {
            checkmark.classList.add('checked');
        }

        // Add click event listener for toggling
        checkmark.addEventListener('click', function (e) {
            // Create and add ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);

            // Play sound
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log('Audio play failed:', e));

            // Toggle checked state
            this.classList.toggle('checked');

            // Update localStorage
            const isChecked = this.classList.contains('checked');
            const updatedStates = storedCheckmarks ? JSON.parse(storedCheckmarks) : {};
            updatedStates[stateKey] = isChecked;

            localStorage.setItem(`attendify_justified_absences_${classCode}`, JSON.stringify(updatedStates));

            // Remove ripple after animation completes
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Initialize random attendance values for demonstration
function initializeAttendanceCounters() {
    const attendanceCounters = document.querySelectorAll('.attendance-counter');

    // Add this only if it doesn't exist yet
    if (!document.querySelector('#pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
    @keyframes pulse-subtle {
      0% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
      50% { box-shadow: 0 3px 8px rgba(79, 70, 229, 0.2); }
      100% { transform: scale(1.02); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    }
  `;
        document.head.appendChild(style);
    }

    attendanceCounters.forEach(counter => {
        const attendedSpan = counter.querySelector('.attended');
        const totalSpan = counter.querySelector('.total');
        const attended = parseInt(attendedSpan.textContent);
        const total = parseInt(totalSpan.textContent);

        // Update colors based on attendance percentage
        const attendanceCount = attendedSpan.parentElement;
        const percentage = (attended / total) * 100;
        let color = '';

        if (percentage >= 90) {
            color = 'var(--success)';
            attendanceCount.style.color = color;
            counter.style.borderColor = color;
        } else if (percentage >= 75) {
            color = 'var(--primary)';
            attendanceCount.style.color = color;
            counter.style.borderColor = color;
        } else if (percentage >= 60) {
            color = 'var(--warning)';
            attendanceCount.style.color = color;
            counter.style.borderColor = color;
        } else {
            color = 'var(--error)';
            attendanceCount.style.color = color;
            counter.style.borderColor = color;
        }

        // Different styling based on if it's small or not
        if (counter.classList.contains('small')) {
            // Lighter styling for small counters
            counter.style.backgroundColor = `${color}15`;
            counter.style.borderColor = `${color}50`;
            counter.style.boxShadow = `0 2px 8px ${color}30`;
        } else {
            // Add glow effect for regular sized counters
            counter.style.boxShadow = `0 4px 12px ${color}40, 0 0 20px ${color}20`;
            counter.style.animation = 'pulse-subtle 2s infinite alternate ease-in-out';
        }
    });
}

// Function to generate dummy students with proper group assignments
function generateDummyStudents() {
    return [
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Adour Serine Khaoula',
            group: 'Group A',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: true },
                { date: '2023-10-19', justified: false },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Bersali Sirine Selma',
            group: 'Group A',
            justifications: [
                { date: '2023-10-05', justified: false },
                { date: '2023-10-12', justified: true },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Mellak Nour El Houda',
            group: 'Group B',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: false },
                { date: '2023-10-19', justified: false },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Keddar Ilhem',
            group: 'Group B',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: true },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Khedari Mohamed',
            group: 'Group C',
            justifications: [
                { date: '2023-10-05', justified: false },
                { date: '2023-10-12', justified: false },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: false }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Hamani Fouad Mohamed',
            group: 'Group C',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: true },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: false }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Bencherchali Iyad',
            group: 'Default Group',
            justifications: [
                { date: '2023-10-05', justified: false },
                { date: '2023-10-12', justified: false },
                { date: '2023-10-19', justified: false },
                { date: '2023-10-26', justified: false }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Dif Iyad',
            group: 'Default Group',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: false },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'Hamida Fouad',
            group: 'Group A',
            justifications: [
                { date: '2023-10-05', justified: false },
                { date: '2023-10-12', justified: true },
                { date: '2023-10-19', justified: false },
                { date: '2023-10-26', justified: true }
            ]
        },
        {
            id: 'STU' + Math.floor(100000 + Math.random() * 900000),
            name: 'ElArouci Abdel',
            group: 'Group B',
            justifications: [
                { date: '2023-10-05', justified: true },
                { date: '2023-10-12', justified: false },
                { date: '2023-10-19', justified: true },
                { date: '2023-10-26', justified: false }
            ]
        }
    ];
}

// Setup copy buttons for student IDs
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-student-id');
    copyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const studentId = this.getAttribute('data-id');
            navigator.clipboard.writeText(studentId)
                .then(() => {
                    const successMsg = this.nextElementSibling;
                    successMsg.style.display = 'inline';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                });
        });
    });
}

// Setup delete buttons
function setupDeleteButtons(classCode) {
    const deleteButtons = document.querySelectorAll('.delete-student-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function () {
            const studentIndex = this.getAttribute('data-index');
            const studentName = this.getAttribute('data-name');

            // Store data for confirmation
            document.getElementById('studentNameToDelete').textContent = studentName;
            document.getElementById('confirmDeleteBtn').setAttribute('data-index', studentIndex);
            document.getElementById('confirmDeleteBtn').setAttribute('data-class', classCode);

            // Show confirmation modal
            document.getElementById('confirmOverlay').style.display = 'block';
            document.getElementById('confirmDeleteModal').style.display = 'block';

            // Add active class for animation
            setTimeout(() => {
                document.getElementById('confirmDeleteModal').classList.add('active');
            }, 10);
        });
    });
}

// Setup delete confirmation modal
function setupDeleteConfirmation() {
    const confirmOverlay = document.getElementById('confirmOverlay');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Function to close modal with animation
    function closeConfirmModal() {
        // Remove active class first for animation
        confirmDeleteModal.classList.remove('active');

        // Hide elements after animation
        setTimeout(() => {
            confirmOverlay.style.display = 'none';
            confirmDeleteModal.style.display = 'none';
        }, 300);
    }

    // Close modal on cancel with animation
    cancelDeleteBtn.addEventListener('click', closeConfirmModal);

    // Close modal when clicking outside
    confirmOverlay.addEventListener('click', closeConfirmModal);

    // Handle delete confirmation
    confirmDeleteBtn.addEventListener('click', function () {
        const studentIndex = parseInt(this.getAttribute('data-index'));
        const classCode = this.getAttribute('data-class');

        // Get students from localStorage
        const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);

        if (storedStudents) {
            let students = JSON.parse(storedStudents);

            // Remove the student
            students.splice(studentIndex, 1);

            // Save back to localStorage
            localStorage.setItem(`attendify_class_students_${classCode}`, JSON.stringify(students));

            // Close modal
            closeConfirmModal();

            // Reload students with current active group
            const activeGroup = document.querySelector('.group-card.active');
            const groupName = activeGroup ? activeGroup.getAttribute('data-group') : 'all';
            loadStudents(classCode, groupName);
        }
    });
}

// Setup profile dropdown
function setupProfileDropdown() {
    const profileDropdownBtn = document.getElementById('profileDropdownBtn');
    const profileDropdownMenu = document.getElementById('profileDropdownMenu');
    const settingsBtn = document.getElementById('settingsBtn');

    // Handle profile dropdown button click
    if (profileDropdownBtn && profileDropdownMenu) {
        profileDropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent click from bubbling to document
            profileDropdownMenu.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!profileDropdownBtn.contains(e.target) && !profileDropdownMenu.contains(e.target)) {
                profileDropdownMenu.classList.remove('active');
            }
        });
    }
}

// Function to determine if a student would be present today (for demo purposes)
function getStudentAttendanceStatus(studentId) {
    // Get current date
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // For demo purposes, use student ID to deterministically generate attendance status
    // This ensures the same student always gets the same status on the same day

    // If today is weekend, no class
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { status: '-', statusClass: 'status-na' };
    }

    // Use a hash of studentId + day of week to determine status
    const hash = studentId.split('').reduce((a, b) => {
        return a + b.charCodeAt(0);
    }, 0) + dayOfWeek;

    // 80% chance of being present (for demo)
    const isPresent = hash % 10 < 8;

    if (isPresent) {
        return { status: 'Present', statusClass: 'status-present' };
    } else {
        return { status: 'Absent', statusClass: 'status-absent' };
    }
}

// Function to export attendance data to Excel
function exportToExcel(classCode) {
    if (!classCode) return;

    // Get class data
    const storedClasses = localStorage.getItem('attendify_tutored_classes');
    if (!storedClasses) return;

    const classes = JSON.parse(storedClasses);
    const currentClass = classes.find(cls => cls.code === classCode);
    if (!currentClass) return;

    // Get students data
    const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);
    if (!storedStudents) return;

    const students = JSON.parse(storedStudents);

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Add title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${currentClass.name} - Attendance Report`;
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: '4F46E5' }
    };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E6E6FA' } // Light lavender
    };

    // Add date
    worksheet.mergeCells('A2:E2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    dateCell.font = {
        name: 'Arial',
        size: 12,
        italic: true
    };
    dateCell.alignment = { horizontal: 'center' };

    // Add headers (row 4)
    const headers = [
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Group', key: 'group', width: 15 },
        { header: 'Attendance Rate', key: 'attendanceRate', width: 18 },
        { header: 'Status Today', key: 'statusToday', width: 15 }
    ];

    worksheet.columns = headers;

    // Style headers
    const headerRow = worksheet.getRow(4);
    headerRow.eachCell((cell) => {
        cell.font = {
            name: 'Arial',
            size: 12,
            bold: true,
            color: { argb: 'FFFFFF' }
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F46E5' } // Purple
        };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Add student data
    students.forEach(student => {
        // Calculate random attendance rate for demo
        const attendanceRate = Math.floor(Math.random() * 30 + 70);
        const attendanceRateStr = attendanceRate + '%';

        // Get today's status
        const todayStatus = getStudentAttendanceStatus(student.id);

        // Add row with data
        worksheet.addRow({
            studentId: student.id,
            studentName: student.name,
            group: student.group || 'Default Group',
            attendanceRate: attendanceRateStr,
            statusToday: todayStatus.status
        });
    });

    // Style data rows
    for (let i = 5; i < 5 + students.length; i++) {
        const row = worksheet.getRow(i);

        // Add zebra striping
        const fillColor = i % 2 === 0 ? 'F5F5F5' : 'FFFFFF';

        row.eachCell((cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Center specific columns
            if (colNumber === 3 || colNumber === 4 || colNumber === 5) {
                cell.alignment = { horizontal: 'center' };
            }

            // Apply zebra striping to cells
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fillColor }
            };

            // Format attendance rate column
            if (colNumber === 4) {
                const rate = parseInt(cell.value.replace('%', ''));
                let color;

                if (rate >= 90) {
                    color = '10B981'; // Green
                } else if (rate >= 75) {
                    color = '4F46E5'; // Purple
                } else if (rate >= 60) {
                    color = 'F59E0B'; // Yellow
                } else {
                    color = 'EF4444'; // Red
                }

                cell.font = {
                    name: 'Arial',
                    size: 12,
                    bold: true,
                    color: { argb: color }
                };
            }

            // Format status column
            if (colNumber === 5) {
                if (cell.value === 'Present') {
                    cell.font = {
                        name: 'Arial',
                        size: 12,
                        bold: true,
                        color: { argb: '10B981' } // Green
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E6FFEA' } // Light green
                    };
                } else if (cell.value === 'Absent') {
                    cell.font = {
                        name: 'Arial',
                        size: 12,
                        bold: true,
                        color: { argb: 'EF4444' } // Red
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F2' } // Light red
                    };
                }
            }
        });
    }

    // Add summary section
    const summaryRow = 5 + students.length + 2;
    worksheet.mergeCells(`A${summaryRow}:B${summaryRow}`);
    worksheet.getCell(`A${summaryRow}`).value = 'Summary';
    worksheet.getCell(`A${summaryRow}`).font = {
        name: 'Arial',
        size: 14,
        bold: true
    };

    // Calculate attendance stats
    const presentCount = students.filter(s =>
        getStudentAttendanceStatus(s.id).status === 'Present'
    ).length;
    const absentCount = students.filter(s =>
        getStudentAttendanceStatus(s.id).status === 'Absent'
    ).length;
    const attendancePercent = Math.round((presentCount / (presentCount + absentCount)) * 100);

    // Add stats rows
    worksheet.getCell(`A${summaryRow + 1}`).value = 'Present:';
    worksheet.getCell(`B${summaryRow + 1}`).value = presentCount;
    worksheet.getCell(`B${summaryRow + 1}`).font = { bold: true, color: { argb: '10B981' } };

    worksheet.getCell(`A${summaryRow + 2}`).value = 'Absent:';
    worksheet.getCell(`B${summaryRow + 2}`).value = absentCount;
    worksheet.getCell(`B${summaryRow + 2}`).font = { bold: true, color: { argb: 'EF4444' } };

    worksheet.getCell(`A${summaryRow + 3}`).value = 'Attendance Rate:';
    worksheet.getCell(`B${summaryRow + 3}`).value = `${attendancePercent}%`;
    worksheet.getCell(`B${summaryRow + 3}`).font = { bold: true };

    // Set column widths
    worksheet.getColumn('A').width = 15;
    worksheet.getColumn('B').width = 25;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 18;
    worksheet.getColumn('E').width = 15;

    // Save Excel file
    workbook.xlsx.writeBuffer().then(function (buffer) {
        // Use FileSaver.js to save the file
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${currentClass.name}_attendance_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);

        // Show notification
        alert('Attendance data exported successfully!');
    }).catch(function (error) {
        console.error('Error generating Excel file:', error);
        alert('Failed to export attendance data. Please try again.');
    });
}

// Function to start face recognition session
function startFaceRecognitionSession(classCode) {
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        // Update button state
        startSessionBtn.classList.add('active');
        startSessionBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Session';
        startSessionBtn.classList.replace('btn-primary', 'btn-danger');

        // Create camera simulation container if it doesn't exist
        let cameraContainer = document.getElementById('cameraSimulationContainer');
        if (!cameraContainer) {
            cameraContainer = document.createElement('div');
            cameraContainer.id = 'cameraSimulationContainer';
            cameraContainer.className = 'camera-container';
            cameraContainer.innerHTML = `
      <div class="camera-header">
        <h3>Face Recognition Camera</h3>
        <div class="camera-status active">Camera Active</div>
      </div>
      <div class="camera-view">
        <video id="cameraFeed" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"></video>
        <div id="cameraPlaceholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">
          <i class="fas fa-camera"></i>
        </div>
        <div class="scanning-indicator">
          <div class="scanning-line"></div>
        </div>
        <div class="face-detection-box"></div>
      </div>
      <div class="camera-info">
        <p>Please have students stand in front of the camera one at a time.</p>
        <div class="status-message">Requesting camera access...</div>
      </div>
    `;

            // Add the camera container after the groups section
            const groupsInfoSection = document.querySelector('.groups-info-section');
            if (groupsInfoSection && groupsInfoSection.nextElementSibling) {
                groupsInfoSection.parentNode.insertBefore(cameraContainer, groupsInfoSection.nextElementSibling);
            }
        } else {
            cameraContainer.style.display = 'block';
        }

        // Request access to the device's camera
        const videoElement = document.getElementById('cameraFeed');
        const cameraPlaceholder = document.getElementById('cameraPlaceholder');
        const statusMessage = cameraContainer.querySelector('.status-message');

        if (statusMessage) {
            statusMessage.textContent = 'Requesting camera access...';
        }

        // Check if the browser supports getUserMedia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.log('Requesting camera access...');
            alert('The browser will now request camera access permission. Please click "Allow" when prompted.');

            // Request access to the user's camera - force a specific permission request
            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
                .then(function (stream) {
                    // Set the video source to the camera stream
                    if (videoElement) {
                        videoElement.srcObject = stream;
                        videoElement.onloadedmetadata = function () {
                            // Hide the placeholder when video is ready
                            if (cameraPlaceholder) {
                                cameraPlaceholder.style.display = 'none';
                            }
                            if (statusMessage) {
                                statusMessage.textContent = 'Camera active - Ready to detect faces';
                            }

                            // Start the simulation for face detection
                            simulateStudentDetection(cameraContainer);
                        }
                    }
                })
                .catch(function (error) {
                    console.error('Error accessing camera:', error);
                    if (statusMessage) {
                        statusMessage.innerHTML = `<span style="color: var(--error);">
          Error accessing camera: ${error.name === 'NotAllowedError' ? 'Permission denied' : error.message}
        </span>
        <p style="font-size: 12px; margin-top: 5px;">
          Please ensure you've granted camera permissions and try again.
        </p>`;
                    }

                    // Show the placeholder with error message
                    if (cameraPlaceholder) {
                        cameraPlaceholder.innerHTML = `<div style="text-align: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 24px; color: var(--warning); margin-bottom: 10px;"></i>
          <p>Camera access denied or unavailable</p>
        </div>`;
                    }
                });
        } else {
            // Browser doesn't support getUserMedia
            console.error('Browser does not support getUserMedia API');
            alert('Your browser doesn\'t support camera access. Please try using Chrome, Firefox or Edge.');

            if (statusMessage) {
                statusMessage.innerHTML = `<span style="color: var(--error);">
         Your browser doesn't support camera access
       </span>
       <p style="font-size: 12px; margin-top: 5px;">
         Please try using a modern browser like Chrome or Firefox.
       </p>`;
            }
        }

        // Fallback message for better error reporting
        const cameraInfo = cameraContainer.querySelector('.camera-info');
        if (cameraInfo && statusMessage) {
            statusMessage.innerHTML += `
        <p style="margin-top: 10px; color: var(--warning);">
          <i class="fas fa-info-circle"></i> 
          If camera doesn't start, please check your browser settings and make sure camera permissions are enabled.
        </p>
      `;
        }

        // Add click handler to end session
        startSessionBtn.onclick = function () {
            endAttendanceSession();

            // Stop the camera stream if it's active
            stopCameraStream();

            // Hide camera container
            if (cameraContainer) {
                cameraContainer.style.display = 'none';
            }
        };
    }
}

// Function to stop the camera stream
function stopCameraStream() {
    const videoElement = document.getElementById('cameraFeed');
    if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const tracks = stream.getTracks();

        tracks.forEach(function (track) {
            track.stop();
        });

        videoElement.srcObject = null;
    }
}

// Function to end attendance session
function endAttendanceSession() {
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        // Reset button state
        startSessionBtn.classList.remove('active');
        startSessionBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Session';
        startSessionBtn.classList.replace('btn-danger', 'btn-primary');

        // Stop camera if active
        stopCameraStream();

        // Show session ended notification
        alert('Attendance session ended!');

        // Reset click handler
        const classCode = new URLSearchParams(window.location.search).get('class');
        startSessionBtn.onclick = function () {
            startAttendanceSession(classCode);
        };
    }
}

// Function to start manual attendance entry session
function startManualEntrySession(classCode) {
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        // Update button state
        startSessionBtn.classList.add('active');
        startSessionBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Session';
        startSessionBtn.classList.replace('btn-primary', 'btn-danger');

        // Show manual attendance modal
        const manualAttendanceModalOverlay = document.getElementById('manualAttendanceModalOverlay');
        const manualAttendanceModal = document.getElementById('manualAttendanceModal');

        if (manualAttendanceModalOverlay && manualAttendanceModal) {
            manualAttendanceModalOverlay.classList.add('active');
            setTimeout(() => {
                manualAttendanceModal.classList.add('active');
            }, 10);

            // Clear previous entries
            const studentIdInput = document.getElementById('studentIdInput');
            const manualEntryError = document.getElementById('manualEntryError');
            const studentFoundInfo = document.getElementById('studentFoundInfo');

            if (studentIdInput) {
                studentIdInput.value = '';
                studentIdInput.focus();
            }

            if (manualEntryError) {
                manualEntryError.style.display = 'none';
            }

            if (studentFoundInfo) {
                studentFoundInfo.style.display = 'none';
            }

            // Set up event handlers
            const cancelManualEntryBtn = document.getElementById('cancelManualEntryBtn');
            const markPresentBtn = document.getElementById('markPresentBtn');

            // Remove existing event listeners
            const newCancelBtn = cancelManualEntryBtn.cloneNode(true);
            const newMarkPresentBtn = markPresentBtn.cloneNode(true);

            cancelManualEntryBtn.parentNode.replaceChild(newCancelBtn, cancelManualEntryBtn);
            markPresentBtn.parentNode.replaceChild(newMarkPresentBtn, markPresentBtn);

            // Add key down event listener for Enter key
            if (studentIdInput) {
                studentIdInput.addEventListener('keyup', function (e) {
                    if (e.key === 'Enter') {
                        findStudent(classCode, this.value.trim());
                    }
                });

                // Also add input event to check as user types
                studentIdInput.addEventListener('input', function () {
                    const studentId = this.value.trim();
                    if (studentId.length >= 5) {  // Only start checking when we have enough characters
                        findStudent(classCode, studentId);
                    } else {
                        // Clear previous results if input is too short
                        document.getElementById('studentFoundInfo').style.display = 'none';
                        document.getElementById('manualEntryError').style.display = 'none';
                    }
                });
            }

            // Cancel button closes the modal
            newCancelBtn.addEventListener('click', function () {
                closeManualEntryModal();
            });

            // Mark present button marks the student as present
            newMarkPresentBtn.addEventListener('click', function () {
                const studentId = document.getElementById('studentIdInput').value.trim();
                markStudentPresent(classCode, studentId);
            });
        }

        // Add click handler to end session when button is clicked
        startSessionBtn.onclick = function () {
            endAttendanceSession();
            closeManualEntryModal();
        };
    }
}

// Function to close manual entry modal
function closeManualEntryModal() {
    const manualAttendanceModalOverlay = document.getElementById('manualAttendanceModalOverlay');
    const manualAttendanceModal = document.getElementById('manualAttendanceModal');

    if (manualAttendanceModalOverlay && manualAttendanceModal) {
        manualAttendanceModal.classList.remove('active');
        setTimeout(() => {
            manualAttendanceModalOverlay.classList.remove('active');
        }, 300);
    }
}

// Function to find student by ID
function findStudent(classCode, studentId) {
    if (!studentId) return;

    // Get students from localStorage
    const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);
    if (!storedStudents) return;

    const students = JSON.parse(storedStudents);
    const student = students.find(s => s.id === studentId);

    const manualEntryError = document.getElementById('manualEntryError');
    const studentFoundInfo = document.getElementById('studentFoundInfo');
    const foundStudentName = document.getElementById('foundStudentName');
    const foundStudentGroup = document.getElementById('foundStudentGroup');
    const markPresentBtn = document.getElementById('markPresentBtn');

    if (student) {
        // Student found
        if (manualEntryError) manualEntryError.style.display = 'none';
        if (studentFoundInfo) studentFoundInfo.style.display = 'block';
        if (foundStudentName) foundStudentName.textContent = student.name;
        if (foundStudentGroup) foundStudentGroup.textContent = student.group || 'Default Group';
        if (markPresentBtn) markPresentBtn.disabled = false;
    } else {
        // Student not found
        if (studentFoundInfo) studentFoundInfo.style.display = 'none';
        if (manualEntryError) {
            manualEntryError.textContent = 'Student ID not found';
            manualEntryError.style.display = 'block';
        }
        if (markPresentBtn) markPresentBtn.disabled = true;
    }
}

// Function to mark student as present
function markStudentPresent(classCode, studentId) {
    // Get students from localStorage
    const storedStudents = localStorage.getItem(`attendify_class_students_${classCode}`);
    if (!storedStudents) return;

    const students = JSON.parse(storedStudents);
    const student = students.find(s => s.id === studentId);

    if (student) {
        // In a real app, we would update attendance records in a database
        // For this demo, we'll just show a success message

        // Find the student card to highlight
        const studentCards = document.querySelectorAll('.student-card');
        let studentCard = null;

        studentCards.forEach(card => {
            const cardStudentId = card.querySelector('.student-id').textContent.trim();
            if (cardStudentId === studentId) {
                studentCard = card;
            }
        });

        // Show success message
        alert(`${student.name} marked present successfully!`);

        // Highlight the student card if found
        if (studentCard) {
            studentCard.style.border = '2px solid var(--success)';
            studentCard.style.boxShadow = '0 0 15px var(--success)';

            // Return to normal after a delay
            setTimeout(() => {
                studentCard.style.border = '';
                studentCard.style.boxShadow = '';
            }, 3000);
        }

        // Clear the input and info for next entry
        document.getElementById('studentIdInput').value = '';
        document.getElementById('studentIdInput').focus();
        document.getElementById('studentFoundInfo').style.display = 'none';
    }
}

// Function to simulate student face detection
function simulateStudentDetection(cameraContainer) {
    const statusMessage = cameraContainer.querySelector('.status-message');
    const faceBox = cameraContainer.querySelector('.face-detection-box');
    const studentCards = document.querySelectorAll('.student-card');

    if (statusMessage && faceBox && studentCards.length > 0) {
        // Start the simulation after a short delay
        setTimeout(() => {
            let index = 0;

            // Function to simulate scanning a single student
            const scanNextStudent = () => {
                if (index >= studentCards.length || !document.getElementById('cameraSimulationContainer')) {
                    return;
                }

                // Get the current student
                const studentCard = studentCards[index];
                const studentName = studentCard.querySelector('.student-name').textContent.trim().split('\n')[0];

                // Simulate detection steps
                statusMessage.textContent = 'Detecting face...';
                faceBox.style.display = 'block';

                // Show scanning animation
                setTimeout(() => {
                    statusMessage.textContent = `Identified: ${studentName}`;
                    faceBox.classList.add('detected');

                    // Highlight the corresponding student card
                    studentCard.style.border = '2px solid var(--success)';
                    studentCard.style.boxShadow = '0 0 15px var(--success)';

                    // Update the "Today" status to Present
                    const todayStatus = studentCard.querySelector('.today-status');
                    if (todayStatus) {
                        const statusSpan = todayStatus.querySelector('.status-absent, .status-na');
                        if (statusSpan) {
                            // Remove old status classes
                            statusSpan.classList.remove('status-absent', 'status-na');
                            // Add present class
                            statusSpan.classList.add('status-present');
                            // Update text
                            statusSpan.textContent = 'Present';
                        }
                    }


                    // Return to normal after a delay
                    setTimeout(() => {
                        statusMessage.textContent = 'Ready to scan';
                        faceBox.classList.remove('detected');
                        faceBox.style.display = 'none';

                        // Return card to normal
                        setTimeout(() => {
                            studentCard.style.border = '';
                            studentCard.style.boxShadow = '';

                            // Move to next student
                            index++;

                            // Continue simulation if session is still active
                            const startSessionBtn = document.getElementById('startSessionBtn');
                            if (startSessionBtn && startSessionBtn.classList.contains('active')) {
                                setTimeout(scanNextStudent, Math.random() * 3000 + 2000); // Random time between 2-5 seconds
                            }
                        }, 1000);
                    }, 2000);
                }, 1500);
            };

            // Start the simulation cycle
            scanNextStudent();
        }, 1000);
    }
}

// Function to start QR code session
function startQRCodeSession(classCode) {
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        // Update button state
        startSessionBtn.classList.add('active');
        startSessionBtn.innerHTML = '<i class="fas fa-stop-circle"></i> End Session';
        startSessionBtn.classList.replace('btn-primary', 'btn-danger');

        // Generate a session code
        const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create QR code container if it doesn't exist
        let qrContainer = document.getElementById('qrCodeContainer');
        if (!qrContainer) {
            qrContainer = document.createElement('div');
            qrContainer.id = 'qrCodeContainer';
            qrContainer.className = 'qr-container';
            qrContainer.innerHTML = `
        <div class="qr-header">
          <h3>QR Code Attendance</h3>
          <div class="qr-session active">Session Active</div>
        </div>
        <div class="qr-content">
          <div class="qr-instruction">
            <p>Have students scan this code to mark attendance:</p>
          </div>
          <div class="qr-code-display" id="qrCodeDisplay"></div>
        </div>
        <div class="qr-info">
          <p>Students can scan this QR code to mark themselves present.</p>
          <div class="status-message">Waiting for students to scan...</div>
        </div>
      `;

            // Add styles for QR code container
            const styleTag = document.createElement('style');
            styleTag.textContent = `
        .qr-container {
          background: rgba(30, 41, 59, 0.8);
          border: 2px solid rgba(79, 70, 229, 0.4);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: fadeIn 0.5s ease;
          max-width: 600px;
          margin: 20px auto 30px;
        }
        
        .qr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }
        
        .qr-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        
        .qr-session {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .qr-session.active::before {
          content: '';
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          animation: blink 1.5s infinite;
        }
        
        .qr-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .qr-instruction {
          text-align: center;
          color: var(--text);
          font-size: 16px;
        }
        
        .qr-code-display {
          background: white;
          padding: 15px;
          border-radius: 10px;
          display: inline-block;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .session-info {
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 15px;
          border-radius: 8px;
          width: 100%;
          max-width: 350px;
          justify-content: center;
          margin-top: 15px;
        }
        
        .session-info p {
          margin: 0;
          color: var(--text);
        }
        
        .qr-info {
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .status-message {
          font-weight: 600;
          color: var(--primary);
          font-size: 16px;
          margin-top: 10px;
        }
      `;
            document.head.appendChild(styleTag);

            // Add the QR code container after the groups section
            const groupsInfoSection = document.querySelector('.groups-info-section');
            if (groupsInfoSection && groupsInfoSection.nextElementSibling) {
                groupsInfoSection.parentNode.insertBefore(qrContainer, groupsInfoSection.nextElementSibling);
            } else {
                // Fallback to adding at the end of the dashboard content
                const dashboardContent = document.querySelector('.dashboard-content');
                if (dashboardContent) {
                    dashboardContent.appendChild(qrContainer);
                }
            }

            // No need to set up copy button anymore as session code display is removed
        } else {
            // If container exists, just show it
            qrContainer.style.display = 'block';
        }

        // Generate the QR code
        const qrCodeDisplay = document.getElementById('qrCodeDisplay');
        if (qrCodeDisplay && window.QRCode) {
            // Clear previous QR code if any
            qrCodeDisplay.innerHTML = '';

            // Create QR code data that includes class code and session code
            const qrData = `attendify:${classCode}:${sessionCode}`;

            // Generate new QR code
            new QRCode(qrCodeDisplay, {
                text: qrData,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            console.log('QR code generated with data:', qrData);
        }

        // Simulate occasional student check-ins
        simulateQrCheckIns();

        // Add click handler to end session
        startSessionBtn.onclick = function () {
            // Hide QR code container
            if (qrContainer) {
                qrContainer.style.display = 'none';
            }

            // End the session
            endAttendanceSession();
        };
    }
}

// Function to simulate student check-ins via QR code
function simulateQrCheckIns() {
    const studentCards = document.querySelectorAll('.student-card');
    if (!studentCards.length) return;

    // Create an array of indices to randomly select students
    const indices = Array.from({ length: studentCards.length }, (_, i) => i);
    // Shuffle the array
    indices.sort(() => Math.random() - 0.5);

    // Take only the first few students (randomly)
    const numStudents = Math.min(5, studentCards.length);
    const selectedIndices = indices.slice(0, numStudents);

    // Update status message
    const statusMessage = document.querySelector('.qr-container .status-message');
    if (statusMessage) {
        statusMessage.textContent = 'Waiting for students to scan...';
    }

    // Simulate students scanning at random intervals
    let delay = 3000; // Start after 3 seconds
    selectedIndices.forEach(index => {
        setTimeout(() => {
            const studentCard = studentCards[index];
            if (studentCard) {
                // Get student name
                const studentName = studentCard.querySelector('.student-name').textContent.trim().split('\n')[0];

                // Update status message
                if (statusMessage) {
                    statusMessage.textContent = `${studentName} marked present`;
                }

                // Highlight the student card
                studentCard.style.border = '2px solid var(--success)';
                studentCard.style.boxShadow = '0 0 15px var(--success)';

                // Update the "Today" status to Present
                const todayStatus = studentCard.querySelector('.today-status');
                if (todayStatus) {
                    const statusSpan = todayStatus.querySelector('.status-absent, .status-na');
                    if (statusSpan) {
                        // Remove old status classes
                        statusSpan.classList.remove('status-absent', 'status-na');
                        // Add present class
                        statusSpan.classList.add('status-present');
                        // Update text
                        statusSpan.textContent = 'Present';
                    }
                }


                // Return to normal after a delay
                setTimeout(() => {
                    studentCard.style.border = '';
                    studentCard.style.boxShadow = '';

                    // Reset status message
                    if (statusMessage && index === selectedIndices[selectedIndices.length - 1]) {
                        statusMessage.textContent = 'Waiting for students to scan...';
                    }
                }, 2000);
            }
        }, delay);

        // Increase delay for next student (random between 4-10 seconds)
        delay += Math.random() * 6000 + 4000;
    });
}

// Function to handle copying ID to clipboard
function copyIdToClipboard(buttonId, idElementId, successElementId) {
    const copyBtn = document.getElementById(buttonId);
    const idElement = document.getElementById(idElementId);
    const successMessage = document.getElementById(successElementId);

    if (copyBtn && idElement && successMessage) {
        copyBtn.addEventListener('click', function () {
            const idToCopy = idElement.textContent.trim();
            navigator.clipboard.writeText(idToCopy)
                .then(() => {
                    successMessage.style.display = 'inline';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy ID: ', err);
                    alert('Failed to copy ID.');
                });
        });
    } else {
        console.error('Missing elements for copy functionality:', buttonId, idElementId, successElementId);
    }
}

// Setup header copy ID button
function setupHeaderCopyButton() {
    const headerCopyIdBtn = document.getElementById('headerCopyIdBtn');
    const headerStudentId = document.getElementById('headerStudentId');
    const headerCopySuccess = document.getElementById('headerCopySuccess');

    if (headerCopyIdBtn && headerStudentId) {
        headerCopyIdBtn.addEventListener('click', function () {
            const studentId = headerStudentId.textContent;
            navigator.clipboard.writeText(studentId)
                .then(() => {
                    if (headerCopySuccess) {
                        headerCopySuccess.style.display = 'inline';
                        setTimeout(() => {
                            headerCopySuccess.style.display = 'none';
                        }, 2000);
                    }
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                });
        });
    }
}

// Setup Settings Modal
function setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsCopyIdBtn = document.getElementById('settingsCopyIdBtn');
    const settingsCopySuccess = document.getElementById('settingsCopySuccess');
    const settingsStudentId = document.getElementById('settingsStudentId');
    const settingsUserName = document.getElementById('settingsUserName');
    const profileDropdownMenu = document.getElementById('profileDropdownMenu');

    // Show settings modal when settings button is clicked
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Hide profile dropdown
            if (profileDropdownMenu) {
                profileDropdownMenu.classList.remove('active');
            }

            // Show settings modal and overlay
            if (settingsModalOverlay && settingsModal) {
                settingsModalOverlay.style.display = 'flex';
                settingsModal.style.display = 'block';

                // Add active class after a small delay for animation
                setTimeout(() => {
                    settingsModalOverlay.classList.add('active');
                    settingsModal.classList.add('active');
                }, 10);
            }
        });
    }

    // Close settings modal when close button is clicked
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function () {
            // Remove active class first
            settingsModal.classList.remove('active');
            settingsModalOverlay.classList.remove('active');

            // Hide elements after animation
            setTimeout(() => {
                settingsModal.style.display = 'none';
                settingsModalOverlay.style.display = 'none';
            }, 300);
        });
    }

    // Close settings modal when clicking outside
    if (settingsModalOverlay) {
        settingsModalOverlay.addEventListener('click', function (e) {
            if (e.target === settingsModalOverlay) {
                // Remove active class first
                settingsModal.classList.remove('active');
                settingsModalOverlay.classList.remove('active');

                // Hide elements after animation
                setTimeout(() => {
                    settingsModal.style.display = 'none';
                    settingsModalOverlay.style.display = 'none';
                }, 300);
            }
        });
    }

    // Handle copy student ID functionality
    if (settingsCopyIdBtn && settingsStudentId && settingsCopySuccess) {
        settingsCopyIdBtn.addEventListener('click', function () {
            const studentId = settingsStudentId.textContent;

            navigator.clipboard.writeText(studentId)
                .then(() => {
                    settingsCopySuccess.style.display = 'inline';
                    setTimeout(() => {
                        settingsCopySuccess.style.display = 'none';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                });
        });
    }

    // Update settings modal with user info
    if (settingsUserName && settingsStudentId) {
        // Get user info from header
        const headerUserName = document.getElementById('userName');
        const headerStudentId = document.getElementById('headerStudentId');

        if (headerUserName && headerStudentId) {
            settingsUserName.textContent = headerUserName.textContent;
            settingsStudentId.textContent = headerStudentId.textContent;
        }
    }
}

// Function to close the scan options modal
function closeScanModal() {
    // Hide the modal
    const scanOptionsModal = document.getElementById('scanOptionsModal');
    if (scanOptionsModal) {
        scanOptionsModal.style.display = 'none';
    }

    // Hide the overlay
    const scanModalOverlay = document.getElementById('scanModalOverlay');
    if (scanModalOverlay) {
        scanModalOverlay.classList.remove('active');
        scanModalOverlay.style.display = 'none';
    }
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    if (currentSessionId) {
        endAttendanceSession();
    }
});