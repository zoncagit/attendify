/**
 * Attendance tracking module for Attendify
 * Handles face recognition, QR code and manual attendance tracking
 */

// Keep track of the current attendance session
let currentSession = {
    classId: null,
    groupId: null,
    method: null, // 'face', 'qr', 'manual'
    students: [],
    startTime: null,
    endTime: null
};

// Initialize the module
export function initializeAttendance() {
    console.log('Initializing attendance module');
    setupEventListeners();
}

// Set up event listeners for attendance tracking
function setupEventListeners() {
    // Start Session button
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', startAttendanceSession);
    }

    // Scan Options Modal event listeners
    const scanOptionsCards = document.querySelectorAll('.scan-option-card');
    scanOptionsCards.forEach(card => {
        card.addEventListener('click', handleAttendanceMethodSelect);
    });

    // Cancel buttons for all modals
    document.getElementById('cancelScanOptionsBtn')?.addEventListener('click', closeScanOptionsModal);
    document.getElementById('cancelFaceRecognitionBtn')?.addEventListener('click', closeFaceRecognitionModal);
    document.getElementById('cancelQrCodeBtn')?.addEventListener('click', closeQrCodeModal);
    document.getElementById('cancelManualEntryBtn')?.addEventListener('click', closeManualEntryModal);
    
    // Complete buttons for attendance methods
    document.getElementById('completeFaceRecognitionBtn')?.addEventListener('click', completeFaceRecognition);
    document.getElementById('completeQrCodeBtn')?.addEventListener('click', completeQrCode);
    
    // Manual attendance entry
    const studentIdInput = document.getElementById('studentIdInput');
    if (studentIdInput) {
        studentIdInput.addEventListener('input', handleStudentIdInput);
    }

    document.getElementById('markPresentBtn')?.addEventListener('click', markStudentPresent);
}

// Start the attendance session
function startAttendanceSession() {
    // Get class ID and group ID
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class');

    // Display loading state on button
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        startSessionBtn.disabled = true;
        startSessionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
    
    // Initialize the current session
    currentSession = {
        classId,
        groupId: null, // Could be set based on currently selected group
        method: null,
        students: [],
        startTime: new Date().toISOString(),
        endTime: null
    };
    
    // Show the scan options modal after a brief delay
    setTimeout(() => {
        showScanOptionsModal();
        
        // Reset button state
        if (startSessionBtn) {
            startSessionBtn.disabled = false;
            startSessionBtn.innerHTML = '<i class="fas fa-play-circle"></i> Start Session';
        }
    }, 500);
}

// Show the scan options modal
function showScanOptionsModal() {
    const modal = document.getElementById('scanOptionsModal');
    const overlay = document.getElementById('scanOptionsModalOverlay');
    
    if (modal && overlay) {
        overlay.style.display = 'block';
        modal.style.display = 'block';
        
        // Force reflow before adding transition classes
        void modal.offsetHeight;
        
        modal.classList.add('active');
        overlay.classList.add('active');
    }
}

// Close the scan options modal
function closeScanOptionsModal() {
    const modal = document.getElementById('scanOptionsModal');
    const overlay = document.getElementById('scanOptionsModalOverlay');
    
    if (modal && overlay) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }
}

// Handle attendance method selection
function handleAttendanceMethodSelect(event) {
    const optionId = event.currentTarget.id;
    closeScanOptionsModal();
    
    switch (optionId) {
        case 'faceRecognitionOption':
            currentSession.method = 'face';
            startFaceRecognition();
            break;
        case 'qrCodeOption':
            currentSession.method = 'qr';
            startQrCodeAttendance();
            break;
        case 'manualEntryOption':
            currentSession.method = 'manual';
            startManualAttendance();
            break;
    }
}

// Face Recognition Mode
function startFaceRecognition() {
    const modal = document.getElementById('faceRecognitionModal');
    
    if (modal) {
        modal.style.display = 'block';
        
        // Force reflow before adding transition classes
        void modal.offsetHeight;
        
        modal.classList.add('active');
        
        // TODO: Initialize webcam and face recognition here
        // This is a placeholder - actual implementation would connect to the camera
        console.log('Face recognition mode started');
    }
}

function closeFaceRecognitionModal() {
    const modal = document.getElementById('faceRecognitionModal');
    
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            // TODO: Stop any running webcam/face recognition processes
        }, 300);
    }
}

function completeFaceRecognition() {
    // TODO: Complete the face recognition session, process results
    alert('Face recognition attendance session completed!');
    closeFaceRecognitionModal();
}

// QR Code Mode
function startQrCodeAttendance() {
    const modal = document.getElementById('qrCodeModal');
    
    if (modal) {
        modal.style.display = 'block';
        
        // Force reflow before adding transition classes
        void modal.offsetHeight;
        
        modal.classList.add('active');
        
        // Generate the QR code
        generateQRCode();
    }
}

function closeQrCodeModal() {
    const modal = document.getElementById('qrCodeModal');
    
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function generateQRCode() {
    // Get container
    const container = document.getElementById('qrCodeContainer');
    if (!container) return;
    
    // Clear any existing QR code
    container.innerHTML = '';
    
    // Generate a session token (could be from server in real implementation)
    const sessionToken = `attendance_${currentSession.classId}_${Date.now()}`;
    
    // Create the attendance URL which students would scan
    const attendanceUrl = `https://attendify.com/check-in?token=${sessionToken}`;
    
    // Generate QR code using the qrcode.js library
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: attendanceUrl,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        container.innerHTML = '<p>QR Code library not loaded.</p>';
    }
}

function completeQrCode() {
    // TODO: Complete the QR code attendance session, process results
    alert('QR code attendance session completed!');
    closeQrCodeModal();
}

// Manual Entry Mode
function startManualAttendance() {
    const modal = document.getElementById('manualAttendanceModal');
    
    if (modal) {
        modal.style.display = 'block';
        
        // Force reflow before adding transition classes
        void modal.offsetHeight;
        
        modal.classList.add('active');
        
        // Focus on the input field
        setTimeout(() => {
            document.getElementById('studentIdInput')?.focus();
        }, 300);
    }
}

function closeManualEntryModal() {
    const modal = document.getElementById('manualAttendanceModal');
    
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            resetManualEntryForm();
        }, 300);
    }
}

function handleStudentIdInput(event) {
    const studentId = event.target.value.trim();
    const errorElement = document.getElementById('studentIdError');
    const studentFoundInfo = document.getElementById('studentFoundInfo');
    const markPresentBtn = document.getElementById('markPresentBtn');
    
    // Reset states
    errorElement.style.display = 'none';
    studentFoundInfo.style.display = 'none';
    markPresentBtn.disabled = true;
    
    if (studentId.length < 3) return;
    
    // Simulating student lookup - in real implementation, this would query the backend
    setTimeout(() => {
        if (studentId === '12345') {
            // Student found - show info
            document.getElementById('foundStudentName').textContent = 'John Doe';
            document.getElementById('foundStudentId').textContent = 'ID: 12345';
            document.getElementById('studentInitials').textContent = 'JD';
            studentFoundInfo.style.display = 'block';
            markPresentBtn.disabled = false;
        } else {
            // Student not found
            errorElement.textContent = 'No student found with this ID';
            errorElement.style.display = 'block';
        }
    }, 500);
}

function markStudentPresent() {
    const studentId = document.getElementById('studentIdInput')?.value.trim();
    const studentName = document.getElementById('foundStudentName')?.textContent;
    
    if (!studentId) return;
    
    // Add the student to the current session
    currentSession.students.push({
        id: studentId,
        name: studentName,
        markedAt: new Date().toISOString()
    });
    
    // Show success message
    alert(`${studentName} marked as present!`);
    
    // Reset form for next entry
    resetManualEntryForm();
}

function resetManualEntryForm() {
    const studentIdInput = document.getElementById('studentIdInput');
    const errorElement = document.getElementById('studentIdError');
    const studentFoundInfo = document.getElementById('studentFoundInfo');
    const markPresentBtn = document.getElementById('markPresentBtn');
    
    if (studentIdInput) studentIdInput.value = '';
    if (errorElement) errorElement.style.display = 'none';
    if (studentFoundInfo) studentFoundInfo.style.display = 'none';
    if (markPresentBtn) markPresentBtn.disabled = true;
}
