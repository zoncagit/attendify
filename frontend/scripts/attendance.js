import CONFIG from './config.js';
import utils from './utils.js';

class AttendanceSystem {
    constructor() {
        this.webcam = document.getElementById('webcam');
        this.canvas = document.getElementById('attendanceCanvas');
        this.startBtn = document.getElementById('startAttendanceBtn');
        this.stopBtn = document.getElementById('stopAttendanceBtn');
        this.statusDiv = document.getElementById('attendanceStatus');
        this.classSelect = document.getElementById('classSelect');
        this.groupSelect = document.getElementById('groupSelect');
        this.sessionTopic = document.getElementById('sessionTopic');
        
        this.stream = null;
        this.ws = null;
        this.isRunning = false;
        this.currentSessionId = null;
        
        this.initializeEventListeners();
    }
    
    async initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startAttendance());
        this.stopBtn.addEventListener('click', () => this.stopAttendance());
        
        // Load classes when page loads
        await this.loadClasses();
        
        // Update groups when class selection changes
        this.classSelect.addEventListener('change', () => this.loadGroups());
    }
    
    async loadClasses() {
        try {
            const { ok, data } = await utils.fetchWithAuth(`${CONFIG.API_URL}/api/v1/classes`);
            if (ok) {
                this.classSelect.innerHTML = '<option value="">Select a class</option>';
                data.forEach(cls => {
                    this.classSelect.innerHTML += `
                        <option value="${cls.class_id}">${cls.class_name}</option>
                    `;
                });
            }
        } catch (error) {
            utils.showNotification('Error loading classes', 'error');
        }
    }
    
    async loadGroups() {
        const classId = this.classSelect.value;
        if (!classId) return;
        
        try {
            const { ok, data } = await utils.fetchWithAuth(
                `${CONFIG.API_URL}/api/v1/classes/${classId}/groups`
            );
            if (ok) {
                this.groupSelect.innerHTML = '<option value="">Select a group</option>';
                data.forEach(group => {
                    this.groupSelect.innerHTML += `
                        <option value="${group.group_id}">${group.group_name}</option>
                    `;
                });
            }
        } catch (error) {
            utils.showNotification('Error loading groups', 'error');
        }
    }
    
    async startAttendance() {
        const classId = this.classSelect.value;
        const groupId = this.groupSelect.value;
        const topic = this.sessionTopic.value;
        
        if (!classId || !groupId || !topic) {
            utils.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        try {
            // Start attendance session
            const { ok, data } = await utils.fetchWithAuth(
                `${CONFIG.API_URL}/api/v1/attendance/start-session`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        class_id: parseInt(classId),
                        group_id: parseInt(groupId),
                        session_topic: topic
                    })
                }
            );
            
            if (ok) {
                this.currentSessionId = data.session_id;
                await this.startWebcam();
                this.connectWebSocket();
                this.isRunning = true;
                this.updateUI(true);
            }
        } catch (error) {
            utils.showNotification('Error starting attendance session', 'error');
        }
    }
    
    async startWebcam() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            this.webcam.srcObject = this.stream;
            this.webcam.style.display = 'block';
        } catch (error) {
            utils.showNotification('Error accessing webcam', 'error');
            throw error;
        }
    }
    
    connectWebSocket() {
        this.ws = new WebSocket(
            `ws://${CONFIG.API_URL.replace('http://', '')}/api/v1/attendance/ws/${this.currentSessionId}`
        );
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateStatus(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            utils.showNotification('WebSocket connection error', 'error');
        };
        
        this.ws.onclose = () => {
            if (this.isRunning) {
                utils.showNotification('WebSocket connection closed', 'error');
                this.stopAttendance();
            }
        };
        
        // Start sending frames
        this.startFrameCapture();
    }
    
    startFrameCapture() {
        const captureFrame = () => {
            if (!this.isRunning) return;
            
            const context = this.canvas.getContext('2d');
            this.canvas.width = this.webcam.videoWidth;
            this.canvas.height = this.webcam.videoHeight;
            context.drawImage(this.webcam, 0, 0, this.canvas.width, this.canvas.height);
            
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    image: imageData
                }));
            }
            
            requestAnimationFrame(captureFrame);
        };
        
        captureFrame();
    }
    
    updateStatus(data) {
        if (data.status === 'success') {
            this.statusDiv.innerHTML = `
                <div class="alert alert-success">
                    ${data.message}
                </div>
            `;
        } else {
            this.statusDiv.innerHTML = `
                <div class="alert alert-warning">
                    ${data.message}
                </div>
            `;
        }
    }
    
    updateUI(isRunning) {
        this.startBtn.disabled = isRunning;
        this.stopBtn.disabled = !isRunning;
        this.classSelect.disabled = isRunning;
        this.groupSelect.disabled = isRunning;
        this.sessionTopic.disabled = isRunning;
    }
    
    stopAttendance() {
        this.isRunning = false;
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.webcam.srcObject = null;
        }
        
        this.updateUI(false);
        this.statusDiv.innerHTML = '';
    }
}

// Initialize attendance system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttendanceSystem();
}); 