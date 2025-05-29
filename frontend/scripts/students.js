import CONFIG from './config.js';
import utils from './utils.js';
import * as groupManagement from './group-management.js';
import * as studentManagement from './student-management.js';
import UserProfile from './user-profile.js';

document.addEventListener('DOMContentLoaded', async function() {
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
});

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
    try {
        await groupManagement.deleteGroup(classId, groupId);
        await deleteGroup(classId, groupId);
        await loadData(classId); // Reload all data
    } catch (error) {
        console.error('Error deleting group:', error);
    }
}

async function handleStudentDelete(studentId) {
    try {
        await studentManagement.deleteStudent(classId, studentId);
        await deleteStudent(classId, studentId);
        await loadData(classId);
        utils.showToast('Student removed successfully', 'success');
    } catch (error) {
        console.error('Error deleting student:', error);
        utils.showToast('Error deleting student', 'error');
    }
}

async function populateGroupSelect() {
    if (select && classId) {
        try {
            const groups = await groupManagement.getGroups(classId);
            select.innerHTML = '<option value="">Select a group</option>' +
                groups.map(group => `<option value="${group.id}">${group.name}</option>`).join('');
        } catch (error) {
            console.error('Error populating group select:', error);
            utils.showToast('Error populating group select', 'error');
        }
    }
}

async function handleExport() {
    try {
        await studentManagement.exportStudents(classId);
        await exportStudents(classId);
        utils.showToast('Attendance log exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting attendance log:', error);
        utils.showToast('Error exporting attendance log', 'error');
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
                utils.showToast('Please enter a group name', 'error');
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
                utils.showToast('Group added successfully', 'success');
            } catch (error) {
                utils.showToast(error.message || 'Failed to add group', 'error');
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