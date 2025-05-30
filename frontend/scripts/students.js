import CONFIG from './config.js';
import utils from './utils.js';
import * as groupManagement from './group-management.js';
import * as studentManagement from './student-management.js';
import UserProfile from './user-profile.js';
import { initializeAttendance } from './attendance.js';

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
        utils.showNotification('No class selected', 'error');
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
    
    // Add Group button event listener
    const addGroupBtn = document.getElementById('addGroupBtn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', showAddGroupModal);
    }
    
    // Initialize attendance tracking
    initializeAttendance();
    
    // Initialize modals
    initializeModals();
    initializeGroupModal();
    initializeDeleteModal();
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
        utils.showNotification('Failed to load data', 'error');
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
            <button class="btn btn-danger small-btn" onclick="showDeleteConfirmation('${student.id}', '${student.name}')">
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
        utils.showNotification('Group deleted successfully', 'success');
        await loadData(classId); // Reload all data
    } catch (error) {
        console.error('Error deleting group:', error);
        utils.showNotification('Failed to delete group', 'error');
    }
}

async function handleStudentDelete(studentId) {
    const classId = new URLSearchParams(window.location.search).get('class');
    if (!classId) return;

    try {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
        }

        await studentManagement.deleteStudent(classId, studentId);
        await loadData(classId);
        utils.showNotification('Student removed successfully', 'success');
    } catch (error) {
        console.error('Error deleting student:', error);
        utils.showNotification('Failed to remove student', 'error');
    } finally {
        hideDeleteModal();
    }
}

function showAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
    
    if (modal) {
        modal.classList.add('active');
        overlay.classList.add('active');
        
        // Populate groups in the select
        populateGroupSelect();
        
        // Focus on the name input
        document.getElementById('studentName')?.focus();
    }
}

function hideAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    const overlay = document.querySelector('.modal-overlay');
    
    if (modal) {
        modal.classList.remove('active');
        overlay?.classList.remove('active');
        setTimeout(() => {
            overlay?.remove();
        }, 300);
    }
}

async function populateGroupSelect() {
    const select = document.getElementById('studentGroup');
    const classId = new URLSearchParams(window.location.search).get('class');
    
    if (select && classId) {
        try {
            const groups = await groupManagement.getGroups(classId);
            select.innerHTML = '<option value="">Select a group</option>' +
                groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading groups:', error);
            utils.showNotification('Failed to load groups', 'error');
        }
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
        utils.showNotification('Attendance log exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting attendance log:', error);
        utils.showNotification('Failed to export attendance log', 'error');
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

            const studentName = document.getElementById('studentName')?.value.trim();
            const groupId = document.getElementById('studentGroup')?.value;

            if (!studentName || !groupId) {
                utils.showNotification('Please fill in all fields', 'error');
                return;
            }

            try {
                const submitButton = addStudentForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                }

                await studentManagement.addStudent(classId, {
                    name: studentName,
                    groupId: groupId
                });

                hideAddStudentModal();
                addStudentForm.reset();
                await loadData(classId);
                utils.showNotification('Student added successfully', 'success');
            } catch (error) {
                console.error('Error adding student:', error);
                utils.showNotification(error.message || 'Failed to add student', 'error');
            } finally {
                const submitButton = addStudentForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Add Student';
                }
            }
        });
    }

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                hideAddStudentModal();
            }
        });
    });
}

function initializeGroupModal() {
    // Add Group Modal Event Handlers
    const confirmAddGroupBtn = document.getElementById('confirmAddGroupBtn');
    const cancelAddGroupBtn = document.getElementById('cancelAddGroupBtn');
    const addGroupModal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('confirmOverlay');

    if (confirmAddGroupBtn) {
        confirmAddGroupBtn.addEventListener('click', async () => {
            const groupName = document.getElementById('groupName')?.value.trim();
            const classId = new URLSearchParams(window.location.search).get('class');
            
            if (!groupName || !classId) {
                utils.showNotification('Please enter a group name', 'error');
                return;
            }

            try {
                // Show loading state
                confirmAddGroupBtn.disabled = true;
                confirmAddGroupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                
                await groupManagement.addGroup(classId, groupName);
                document.getElementById('groupName').value = '';
                hideGroupModal();
                await loadData(classId);
                utils.showNotification('Group added successfully', 'success');
            } catch (error) {
                utils.showNotification(error.message || 'Failed to add group', 'error');
            } finally {
                // Reset loading state
                confirmAddGroupBtn.disabled = false;
                confirmAddGroupBtn.innerHTML = 'Create Group';
            }
        });
    }

    if (cancelAddGroupBtn) {
        cancelAddGroupBtn.addEventListener('click', hideGroupModal);
    }
}

function showAddGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('confirmOverlay');
    
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
            overlay.classList.add('active');
        }, 10);
        document.getElementById('groupName')?.focus();
    }
}

function hideGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('confirmOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.getElementById('groupName').value = '';
        }, 300);
    }
}

function initializeDeleteModal() {
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideDeleteModal);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const studentId = confirmBtn.dataset.studentId;
            if (studentId) {
                await handleStudentDelete(studentId);
                hideDeleteModal();
            }
        });
    }
}

function showDeleteModal(studentId, studentName) {
    const modal = document.getElementById('deleteConfirmModal');
    const overlay = document.getElementById('deleteConfirmOverlay');
    const nameSpan = document.getElementById('studentNameToDelete');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (modal && overlay && nameSpan && confirmBtn) {
        nameSpan.textContent = studentName;
        confirmBtn.dataset.studentId = studentId;
        
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
            overlay.classList.add('active');
        }, 10);
    }
}

function hideDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    const overlay = document.getElementById('deleteConfirmOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }
}

// Export functions for use in HTML
window.showDeleteConfirmation = (studentId, studentName) => {
    showDeleteModal(studentId, studentName);
};

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