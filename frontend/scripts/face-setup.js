import CONFIG from './config.js';
import utils from './utils.js';

class FaceSetup {
    constructor() {
        this.webcam = document.getElementById('webcam');
        this.canvas = document.getElementById('canvas');
        this.startBtn = document.getElementById('startBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.statusDiv = document.getElementById('status');
        this.progressDiv = document.getElementById('progress');
        
        this.stream = null;
        this.ws = null;
        this.isRunning = false;
        this.maxSamples = 10;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.startRegistration());
        this.skipBtn.addEventListener('click', () => this.skipRegistration());
    }
    
    async startRegistration() {
        try {
            // Get authentication token
            const token = localStorage.getItem('token');
            if (!token) {
                utils.showNotification('Please log in first', 'error');
                return;
            }
            
            // Start webcam
            await this.startWebcam();
            
            // Connect to WebSocket
            this.connectWebSocket(token);
            
            this.isRunning = true;
            this.updateUI(true);
            this.progressDiv.innerHTML = '<div class="progress"><div class="progress-bar" role="progressbar" style="width: 0%"></div></div>';
            
        } catch (error) {
            utils.showNotification('Error starting registration', 'error');
            console.error(error);
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
    
    connectWebSocket(token) {
        this.ws = new WebSocket(
            `ws://${CONFIG.API_URL.replace('http://', '')}/api/v1/face-registration/ws/register`
        );
        
        this.ws.onopen = () => {
            // Send authentication token
            this.ws.send(JSON.stringify({ token }));
            // Start sending frames
            this.startFrameCapture();
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.status === 'progress') {
                const progress = (data.count / this.maxSamples) * 100;
                this.progressDiv.innerHTML = `
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: ${progress}%">
                            ${data.count}/${this.maxSamples}
                        </div>
                    </div>
                `;

                // Update status message
                this.statusDiv.textContent = `Collecting sample ${data.count} of ${this.maxSamples}...`;
                
                // Check if we've reached max samples
                if (data.count >= this.maxSamples) {
                    this.statusDiv.textContent = 'Processing face data...';
                }
            } else if (data.status === 'frame') {
                // Update preview with face detection rectangle
                const img = new Image();
                img.onload = () => {
                    const context = this.canvas.getContext('2d');
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                };
                img.src = data.image;
            } else if (data.status === 'success') {
                utils.showNotification('Face registered successfully', 'success');
                this.cleanup();
                this.redirectToDashboard();
            } else if (data.status === 'error') {
                utils.showNotification(data.message, 'error');
                this.cleanup();
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            utils.showNotification('WebSocket connection error', 'error');
            this.cleanup();
        };
        
        this.ws.onclose = () => {
            if (this.isRunning) {
                utils.showNotification('WebSocket connection closed', 'error');
                this.cleanup();
            }
        };
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
    
    updateUI(isRunning) {
        this.startBtn.disabled = isRunning;
        this.skipBtn.disabled = isRunning;
    }
    
    cleanup() {
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
        this.progressDiv.innerHTML = '';
        this.statusDiv.textContent = '';
    }

    skipRegistration() {
        utils.showNotification('Face registration skipped. You can set it up later from your profile settings.', 'info');
        this.redirectToDashboard();
    }

    redirectToDashboard() {
        setTimeout(() => {
            window.location.href = `${window.location.origin}/dashboard.html`;
        }, 1500);
    }
}

// Initialize face setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FaceSetup();
});