// Initialize Socket.IO connection
const socket = io();

// Camera and attendance variables
let videoStream = null;
let isProcessingFrame = false;
let currentSessionId = null;
const videoElement = document.getElementById('cameraFeed');
const faceDetectionBox = document.querySelector('.face-detection-box');
const statusMessage = document.querySelector('.status-message');

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

// Start attendance session
function startAttendanceSession(classId, userId) {
    socket.emit('start_attendance_session', {
        class_id: classId,
        user_id: userId
    });
}

// End attendance session
function endAttendanceSession() {
    if (currentSessionId) {
        socket.emit('end_attendance_session', {
            session_id: currentSessionId
        });
    }
}

// Socket.IO event handlers
socket.on('attendance_session_started', (data) => {
    currentSessionId = data.session_id;
    statusMessage.textContent = `Session started - ${data.student_count} students in class`;
    // Start processing frames
    setInterval(processVideoFrame, 1000); // Process a frame every second
});

socket.on('attendance_marked', (data) => {
    statusMessage.textContent = data.message;
    faceDetectionBox.style.display = 'block';
    faceDetectionBox.style.borderColor = 'var(--success)';
    setTimeout(() => {
        faceDetectionBox.style.display = 'none';
    }, 2000);
});

socket.on('attendance_already_marked', (data) => {
    statusMessage.textContent = data.message;
    faceDetectionBox.style.display = 'block';
    faceDetectionBox.style.borderColor = 'var(--warning)';
    setTimeout(() => {
        faceDetectionBox.style.display = 'none';
    }, 2000);
});

socket.on('attendance_no_match', (data) => {
    statusMessage.textContent = data.message;
    faceDetectionBox.style.display = 'block';
    faceDetectionBox.style.borderColor = 'var(--error)';
    setTimeout(() => {
        faceDetectionBox.style.display = 'none';
    }, 2000);
});

socket.on('attendance_error', (data) => {
    statusMessage.textContent = data.message;
});

socket.on('attendance_session_ended', (data) => {
    statusMessage.textContent = data.message;
    currentSessionId = null;
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
});

// Start camera when page loads
document.addEventListener('DOMContentLoaded', startCamera);

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    if (currentSessionId) {
        endAttendanceSession();
    }
}); 