import CONFIG from './config.js';
import utils from './utils.js';
import * as groupManagement from './group-management.js';
import * as studentManagement from './student-management.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const token = utils.getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Get class ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class');
    if (!classId) {
        utils.showToast('No class selected', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    // Initialize UI
    initializeUI();
    
    // Load initial data
    await loadData(classId);
});

function initializeUI() {
    // Add event listeners for various UI interactions
    document.getElementById('addStudentBtn')?.addEventListener('click', showAddStudentModal);
    document.getElementById('importStudentsBtn')?.addEventListener('click', showImportModal);
    document.getElementById('exportStudentsBtn')?.addEventListener('click', handleExport);
    document.getElementById('addGroupBtn')?.addEventListener('click', showAddGroupModal);
    
    // Initialize modals
    initializeModals();
}

async function loadData(classId) {
    try {
        // Show loading state
        const container = document.querySelector('.students-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading data...</p>
                </div>
            `;
        }

        // Load groups and students
        const [groups, students] = await Promise.all([
            groupManagement.getGroups(classId),
            studentManagement.getStudents(classId)
        ]);

        // Validate response data
        if (!Array.isArray(groups)) {
            console.error('Invalid groups data:', groups);
            throw new Error('Invalid groups data received from server');
        }

        if (!Array.isArray(students)) {
            console.error('Invalid students data:', students);
            throw new Error('Invalid students data received from server');
        }

        // Display data
        displayGroups(groups);
        displayStudents(students);

    } catch (error) {
        console.error('Error loading data:', error);
        utils.showToast(error.message || 'Error loading data', 'error');
        
        // Show error state
        const container = document.querySelector('.students-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load data. Please try again.</p>
                    <button onclick="window.location.reload()" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

function displayGroups(groups) {
    const groupsList = document.querySelector('.groups-list');
    if (!groupsList) return;

    groupsList.innerHTML = groups.map(group => `
        <div class="group-card" data-group-id="${group.id}">
            <div class="group-name-container">
                <div class="group-name">${group.name}</div>
                ${group.name !== 'Default Group' ? `
                    <button class="delete-group-btn" title="Delete group" data-group-id="${group.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
            <div class="group-students-count">
                <i class="fas fa-user-graduate"></i> ${group.studentCount || 0} student${group.studentCount !== 1 ? 's' : ''}
            </div>
        </div>
    `).join('');

    // Add event listeners
    groupsList.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', () => handleGroupSelect(card.dataset.groupId));
    });

    groupsList.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleGroupDelete(btn.dataset.groupId);
        });
    });
}

function displayStudents(students) {
    const container = document.querySelector('.students-container');
    if (!container) return;

    if (!Array.isArray(students) || students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <p>No students found</p>
                <button id="addFirstStudentBtn" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add First Student
                </button>
            </div>
        `;
        
        // Add event listener for the new button
        document.getElementById('addFirstStudentBtn')?.addEventListener('click', showAddStudentModal);
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <div class="student-info">
                <div class="student-avatar">${getInitials(student.name)}</div>
                <div class="student-details">
                    <div class="student-name">${student.name}</div>
                    <div class="student-id">
                        ID: ${student.id}
                        <button class="copy-student-id" onclick="copyStudentId('${student.id}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <span class="copy-success">Copied!</span>
                    </div>
                </div>
            </div>
            <div class="middle-container">
                <div class="attendance-row">
                    <div class="attendance-counter small">
                        <div class="attendance-count">
                            <span>${student.attendance_count || 0}</span>
                            <span class="slash">/</span>
                            <span>${student.total_sessions || 0}</span>
                        </div>
                        <div class="attendance-label">Attendance</div>
                    </div>
                </div>
            </div>
            <button class="delete-student-btn small-btn" onclick="handleStudentDelete('${student.id}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `).join('');
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

async function handleGroupSelect(groupId) {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    try {
        const students = await studentManagement.getStudents(classId, groupId);
        displayStudents(students);

        // Update active state
        document.querySelectorAll('.group-card').forEach(card => {
            card.classList.toggle('active', card.dataset.groupId === groupId);
        });
    } catch (error) {
        console.error('Error loading group students:', error);
    }
}

async function handleGroupDelete(groupId) {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    if (!confirm('Are you sure you want to delete this group? All students in this group will be removed.')) {
        return;
    }

    try {
        await groupManagement.deleteGroup(classId, groupId);
        await loadData(classId); // Reload all data
    } catch (error) {
        console.error('Error deleting group:', error);
    }
}

async function handleStudentDelete(studentId) {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    if (!confirm('Are you sure you want to remove this student?')) {
        return;
    }

    try {
        await studentManagement.deleteStudent(classId, studentId);
        await loadData(classId); // Reload all data
    } catch (error) {
        console.error('Error deleting student:', error);
    }
}

function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('studentName')?.focus();
    }
}

function showImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function showAddGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('addGroupModalOverlay');
    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.getElementById('groupName')?.focus();
    }
}

async function handleExport() {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    try {
        await studentManagement.exportStudents(classId);
    } catch (error) {
        console.error('Error exporting students:', error);
    }
}

function initializeModals() {
    // Add Student Modal
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classId = new URLSearchParams(window.location.search).get('class');
            if (!classId) return;

            const studentData = {
                name: document.getElementById('studentName').value,
                groupId: document.getElementById('studentGroup').value
            };

            try {
                await studentManagement.addStudent(classId, studentData);
                addStudentForm.reset();
                document.getElementById('addStudentModal').style.display = 'none';
                await loadData(classId);
            } catch (error) {
                console.error('Error adding student:', error);
            }
        });
    }

    // Add Group Modal
    const addGroupForm = document.getElementById('addGroupForm');
    if (addGroupForm) {
        addGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classId = new URLSearchParams(window.location.search).get('class');
            if (!classId) return;

            const groupName = document.getElementById('groupName').value.trim();
            const errorElement = document.getElementById('groupNameError');

            if (!groupName) {
                if (errorElement) {
                    errorElement.textContent = 'Please enter a group name';
                    errorElement.style.display = 'block';
                }
                return;
            }

            try {
                await groupManagement.addGroup(classId, groupName);
                addGroupForm.reset();
                const modal = document.getElementById('addGroupModal');
                const overlay = document.getElementById('addGroupModalOverlay');
                if (modal && overlay) {
                    modal.classList.remove('active');
                    overlay.classList.remove('active');
                }
                await loadData(classId);
            } catch (error) {
                console.error('Error adding group:', error);
                if (errorElement) {
                    errorElement.textContent = error.message || 'Failed to add group';
                    errorElement.style.display = 'block';
                }
            }
        });
    }

    // Cancel Add Group
    document.getElementById('cancelAddGroupBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('addGroupModal');
        const overlay = document.getElementById('addGroupModalOverlay');
        if (modal && overlay) {
            modal.classList.remove('active');
            overlay.classList.remove('active');
            document.getElementById('addGroupForm')?.reset();
            document.getElementById('groupNameError').style.display = 'none';
        }
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const modal = overlay.querySelector('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    overlay.classList.remove('active');
                }
            }
        });
    });

    // Import Modal
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classId = new URLSearchParams(window.location.search).get('class');
            if (!classId) return;

            const fileInput = document.getElementById('importFile');
            if (fileInput?.files?.length) {
                try {
                    await studentManagement.importStudents(classId, fileInput.files[0]);
                    importForm.reset();
                    document.getElementById('importModal').style.display = 'none';
                    await loadData(classId);
                } catch (error) {
                    console.error('Error importing students:', error);
                }
            }
        });
    }
}

// Export functions for use in HTML
window.deleteStudent = handleStudentDelete;
window.copyStudentId = (studentId) => {
    navigator.clipboard.writeText(studentId).then(() => {
        const successElement = document.querySelector(`[data-student-id="${studentId}"] .copy-success`);
        if (successElement) {
            successElement.style.display = 'inline';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 2000);
        }
    });
}; 