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
    
    // Add Group button event listener
    const addGroupBtn = document.getElementById('addGroupBtn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', showAddGroupModal);
    }
    
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
        utils.showToast('Error loading data', 'error');
    }
}

function displayGroups(groups) {
    console.log('Displaying groups:', groups);
    const groupsList = document.querySelector('.groups-list');
    if (!groupsList) {
        console.error('Groups list container not found in the DOM');
        return;
    }

    // Ensure groups is an array
    if (!Array.isArray(groups)) {
        console.error('Expected an array of groups but got:', groups);
        groups = [];
    }

    // Log each group's structure
    groups.forEach((group, index) => {
        console.log(`Processing group ${index}:`, {
            id: group?.group_id,
            name: group?.group_name,
            studentCount: group?.student_count || 0, // Default to 0 if not provided
            rawGroup: group
        });
    });

    try {
        groupsList.innerHTML = groups.map(group => {
            // Map API response fields to expected properties
            const groupId = group?.group_id || 'unknown';
            const groupName = group?.group_name || 'Unnamed Group';
            const studentCount = group?.student_count || 0;
            const isDefaultGroup = groupName === 'Default Group';

            return `
                <div class="group-card" data-group-id="${groupId}">
                    <div class="group-name-container">
                        <div class="group-name" title="${groupName}">${groupName}</div>
                        ${!isDefaultGroup ? `
                            <button class="delete-group-btn" title="Delete group" data-group-id="${groupId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="group-students-count">
                        <i class="fas fa-user-graduate"></i> 
                        ${studentCount} student${studentCount !== 1 ? 's' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers for group cards
        groupsList.querySelectorAll('.group-card').forEach(card => {
            const groupId = card.dataset.groupId;
            if (groupId && groupId !== 'unknown') {
                card.addEventListener('click', () => handleGroupSelect(groupId));
            }
        });

        // Add click handlers for delete buttons
        groupsList.querySelectorAll('.delete-group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const groupId = btn.dataset.groupId;
                console.log('Delete button clicked. Group ID:', groupId, 'Type:', typeof groupId);
                if (!groupId || groupId === 'unknown') {
                    console.error('Error: Invalid group ID for deletion');
                    return;
                }
                handleGroupDelete(groupId);
            });
        });

        // Log if no groups were found
        if (groups.length === 0) {
            console.log('No groups to display');
            groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No groups found</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error rendering groups:', error);
        groupsList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading groups</p>
            </div>
        `;
    }
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
    console.log('handleGroupDelete called with groupId:', groupId, 'Type:', typeof groupId);
    
    const classId = new URLSearchParams(window.location.search).get('class');
    console.log('Class ID from URL:', classId);
    
    if (!classId) {
        console.error('Error: No class ID found in URL');
        return;
    }

    if (!groupId) {
        console.error('Error: groupId is undefined or empty in handleGroupDelete');
        return;
    }

    if (!confirm('Are you sure you want to delete this group? All students in this group will be removed.')) {
        return;
    }

    try {
        console.log('Calling groupManagement.deleteGroup with:', { classId, groupId });
        await groupManagement.deleteGroup(classId, groupId);
        await loadData(classId); // Reload all data
    } catch (error) {
        console.error('Error in handleGroupDelete:', error);
        utils.showToast('Error deleting group: ' + error.message, 'error');
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
        utils.showToast('Student removed successfully', 'success');
    } catch (error) {
        console.error('Error deleting student:', error);
        utils.showToast('Failed to remove student', 'error');
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
            utils.showToast('Failed to load groups', 'error');
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

            const studentName = document.getElementById('studentName')?.value.trim();
            const groupId = document.getElementById('studentGroup')?.value;

            if (!studentName || !groupId) {
                utils.showToast('Please fill in all fields', 'error');
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
                utils.showToast('Student added successfully', 'success');
            } catch (error) {
                console.error('Error adding student:', error);
                utils.showToast(error.message || 'Failed to add student', 'error');
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
    console.log('Initializing group modal...');
    
    const addGroupBtn = document.getElementById('addGroupBtn');
    const confirmAddGroupBtn = document.getElementById('confirmAddGroupBtn');
    const cancelAddGroupBtn = document.getElementById('cancelAddGroupBtn');
    const groupNameInput = document.getElementById('groupName');
    const groupModal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('confirmOverlay');
    
    if (!addGroupBtn) {
        console.error('Add Group button not found!');
        return;
    }
    
    // Remove any existing event listeners first
    const newAddGroupBtn = addGroupBtn.cloneNode(true);
    addGroupBtn.parentNode.replaceChild(newAddGroupBtn, addGroupBtn);
    
    const newConfirmBtn = confirmAddGroupBtn.cloneNode(true);
    confirmAddGroupBtn.parentNode.replaceChild(newConfirmBtn, confirmAddGroupBtn);
    
    // Add click event listener for the Add Group button
    newAddGroupBtn.addEventListener('click', showAddGroupModal);
    
    // Add click event for confirm button
    newConfirmBtn.addEventListener('click', async () => {
        const groupName = document.getElementById('groupName')?.value.trim();
        const classId = new URLSearchParams(window.location.search).get('class');
        
        if (!groupName) {
            utils.showToast('Please enter a group name', 'error');
            return;
        }
        
        if (!classId) {
            utils.showToast('No class ID found', 'error');
            return;
        }

        try {
            // Show loading state
            newConfirmBtn.disabled = true;
            newConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            
            await groupManagement.addGroup(classId, groupName);
            document.getElementById('groupName').value = '';
            hideGroupModal();
            await loadData(classId);
            utils.showToast('Group added successfully', 'success');
        } catch (error) {
            console.error('Error adding group:', error);
            utils.showToast(error.message || 'Failed to add group', 'error');
        } finally {
            // Reset loading state
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerHTML = 'Create Group';
        }
    });

    // Add cancel button handler
    if (cancelAddGroupBtn) {
        const newCancelBtn = cancelAddGroupBtn.cloneNode(true);
        cancelAddGroupBtn.parentNode.replaceChild(newCancelBtn, cancelAddGroupBtn);
        newCancelBtn.addEventListener('click', hideGroupModal);
    }
}

function showAddGroupModal() {
    console.log('showAddGroupModal called');
    const modal = document.getElementById('addGroupModal');
    const overlay = document.getElementById('confirmOverlay');
    
    console.log('Modal element:', modal);
    console.log('Overlay element:', overlay);
    
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    
    if (!overlay) {
        console.error('Overlay element not found!');
        return;
    }
    
    console.log('Showing modal and overlay');
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    // Force reflow
    void modal.offsetHeight;
    
    // Add active class with a small delay
    setTimeout(() => {
        console.log('Adding active class to modal and overlay');
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
    
    // Debug: Check styles after adding
    setTimeout(() => {
        console.log('Modal display style:', window.getComputedStyle(modal).display);
        console.log('Modal opacity:', window.getComputedStyle(modal).opacity);
        console.log('Modal visibility:', window.getComputedStyle(modal).visibility);
    }, 100);
    
    document.getElementById('groupName')?.focus();
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

// Initialize modals when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeGroupModal();
    initializeDeleteModal();
    initializeModals();
});

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