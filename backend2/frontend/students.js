function showAddGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const overlay = document.querySelector('.mini-modal-overlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        modal.classList.add('active');
        overlay.classList.add('active');
        document.getElementById('groupName')?.focus();
    }
}

// Add Group Modal Event Handlers
document.getElementById('confirmAddGroupBtn')?.addEventListener('click', async () => {
    const groupName = document.getElementById('groupName')?.value.trim();
    const classId = new URLSearchParams(window.location.search).get('class');
    const button = document.getElementById('confirmAddGroupBtn');
    const modal = document.getElementById('addGroupModal');
    const overlay = document.querySelector('.mini-modal-overlay');
    
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
        modal.style.display = 'none';
        modal.classList.remove('active');
        overlay.style.display = 'none';
        overlay.classList.remove('active');
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
    const modal = document.getElementById('addGroupModal');
    const overlay = document.querySelector('.mini-modal-overlay');
    modal.style.display = 'none';
    modal.classList.remove('active');
    overlay.style.display = 'none';
    overlay.classList.remove('active');
    document.getElementById('groupName').value = '';
}); 

let groupIdToDelete = null;

function showDeleteGroupModal(groupId) {
    groupIdToDelete = groupId;
    const modal = document.getElementById('deleteGroupModal');
    const overlay = document.getElementById('deleteGroupOverlay');
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
            overlay.classList.add('active');
        }, 10);
    }
}

function hideDeleteGroupModal() {
    const modal = document.getElementById('deleteGroupModal');
    const overlay = document.getElementById('deleteGroupOverlay');
    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }
    groupIdToDelete = null;
}

// Initialize delete group modal events
function initializeDeleteGroupModal() {
    const cancelBtn = document.getElementById('cancelDeleteGroupBtn');
    const confirmBtn = document.getElementById('confirmDeleteGroupBtn');
    const overlay = document.getElementById('deleteGroupOverlay');
    if (cancelBtn) cancelBtn.addEventListener('click', hideDeleteGroupModal);
    if (overlay) overlay.addEventListener('click', hideDeleteGroupModal);
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!groupIdToDelete) return;
            await handleGroupDelete(groupIdToDelete);
            hideDeleteGroupModal();
        });
    }
}

// Call this in your DOMContentLoaded or initialization code:
document.addEventListener('DOMContentLoaded', () => {
    initializeDeleteGroupModal();
});