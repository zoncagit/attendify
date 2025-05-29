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