import CONFIG from './config.js';
import utils from './utils.js';
import * as groupManagement from './group-management.js';
import * as studentManagement from './student-management.js';
import UserProfile from './user-profile.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const token = utils.getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user profile
    const userProfile = new UserProfile();
    await userProfile.loadUserProfile();

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
    
    // Update current date
    updateCurrentDate();
    
    // Load initial data
    await loadData(classId);
});

function updateCurrentDate() {
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
}

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
        // Load groups and students
        const [groups, students] = await Promise.all([
            groupManagement.getGroups(classId),
            studentManagement.getStudents(classId)
        ]);

        displayGroups(groups);
        displayStudents(students);
    } catch (error) {
        console.error('Error loading data:', error);
        utils.showToast('Error loading data', 'error');
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

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <p>No students found</p>
            </div>
        `;
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
                            <span>${student.attendanceCount || 0}</span>
                            <span class="slash">/</span>
                            <span>${student.totalSessions || 0}</span>
                        </div>
                        <div class="attendance-label">Attendance</div>
                    </div>
                </div>
            </div>
            <button class="delete-student-btn small-btn" onclick="deleteStudent('${student.id}')">
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
        // Show loading state
        document.querySelectorAll('.group-card').forEach(card => {
            card.style.opacity = '0.7';
            card.style.pointerEvents = 'none';
        });
        
        const students = await studentManagement.getStudents(classId, groupId);
        displayStudents(students);

        // Update active state
        document.querySelectorAll('.group-card').forEach(card => {
            card.style.opacity = '';
            card.style.pointerEvents = '';
            card.classList.toggle('active', card.dataset.groupId === groupId);
        });
    } catch (error) {
        console.error('Error loading group students:', error);
        // Reset loading state
        document.querySelectorAll('.group-card').forEach(card => {
            card.style.opacity = '';
            card.style.pointerEvents = '';
        });
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
        // Show loading state
        const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
        if (studentCard) {
            studentCard.style.opacity = '0.7';
            studentCard.style.pointerEvents = 'none';
            const deleteBtn = studentCard.querySelector('.delete-student-btn');
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
            }
        }

        await studentManagement.deleteStudent(classId, studentId);
        await loadData(classId); // Reload all data
        utils.showToast('Student removed successfully', 'success');
    } catch (error) {
        console.error('Error deleting student:', error);
        utils.showToast('Failed to remove student', 'error');
        
        // Reset loading state if error occurs
        const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
        if (studentCard) {
            studentCard.style.opacity = '';
            studentCard.style.pointerEvents = '';
            const deleteBtn = studentCard.querySelector('.delete-student-btn');
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
            }
        }
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

async function handleExport() {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    try {
        const button = document.getElementById('exportStudentsBtn');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
        }

        await studentManagement.exportStudents(classId);
        utils.showToast('Attendance log exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting attendance log:', error);
        utils.showToast('Failed to export attendance log', 'error');
    } finally {
        const button = document.getElementById('exportStudentsBtn');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-file-excel"></i> Export to Excel';
        }
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

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
}

function showAddGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const overlay = document.querySelector('.mini-modal-overlay');
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.classList.add('active');
        document.getElementById('groupName')?.focus();
    }
}

// Add Group Modal Event Handlers
document.getElementById('confirmAddGroupBtn')?.addEventListener('click', async () => {
    const groupName = document.getElementById('groupName')?.value.trim();
    const classId = new URLSearchParams(window.location.search).get('class');
    const button = document.getElementById('confirmAddGroupBtn');
    
    if (!groupName || !classId) {
        utils.showToast('Please enter a group name', 'error');
        return;
    }

    try {
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        await groupManagement.addGroup(classId, groupName);
        document.getElementById('groupName').value = '';
        document.getElementById('addGroupModal').classList.remove('active');
        document.querySelector('.mini-modal-overlay').style.display = 'none';
        await loadData(classId);
        utils.showToast('Group added successfully', 'success');
    } catch (error) {
        utils.showToast(error.message || 'Failed to add group', 'error');
    } finally {
        // Reset loading state
        button.disabled = false;
        button.innerHTML = 'Add Group';
    }
});

document.getElementById('cancelAddGroupBtn')?.addEventListener('click', () => {
    document.getElementById('addGroupModal').classList.remove('active');
    document.querySelector('.mini-modal-overlay').style.display = 'none';
    document.getElementById('groupName').value = '';
});

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