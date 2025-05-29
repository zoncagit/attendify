import CONFIG from './config.js';
import { getToken, redirectToLogin } from './auth.js';

class FaceSetup {
    constructor() {
        try {
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.statusMessage = document.getElementById('statusMessage');
            this.progressFill = document.getElementById('progressFill');
            this.progressText = document.getElementById('progressText');
            this.startButton = document.getElementById('startButton');
            this.skipButton = document.getElementById('skipButton');
            
            if (!this.video || !this.canvas || !this.ctx || !this.statusMessage || 
                !this.progressFill || !this.progressText || !this.startButton || !this.skipButton) {
                throw new Error('Required DOM elements not found');
            }
            
            this.stream = null;
            this.ws = null;
            this.isProcessing = false;
            this.progress = 0;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 3;
            
            // Set canvas dimensions to match video
            this.canvas.width = 640;
            this.canvas.height = 480;
            
            this.initializeWebSocket();
            this.setupEventListeners();
            
            console.log('FaceSetup initialized successfully');
        } catch (error) {
            console.error('Error initializing FaceSetup:', error);
            this.updateStatus('Error initializing face setup. Please refresh the page.', 'error');
        }
    }
    
    initializeWebSocket() {
        try {
            const token = getToken();
            if (!token) {
                redirectToLogin();
                return;
            }
            
            // Use CONFIG.API_URL for WebSocket connection
            const wsUrl = CONFIG.API_URL.replace(/^http/, 'ws');
            console.log('Connecting to WebSocket at:', wsUrl);
            this.ws = new WebSocket(`${wsUrl}/ws/face-registration`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.ws.send(JSON.stringify({
                    type: 'auth',
                    token: token
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                    this.updateStatus('Error processing server response', 'error');
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('Connection error. Please try again.', 'error');
                this.startButton.disabled = false;
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => this.initializeWebSocket(), 2000);
                } else {
                    this.updateStatus('Connection lost. Please refresh the page.', 'error');
                    this.startButton.disabled = false;
                }
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            this.updateStatus('Error connecting to server', 'error');
        }
    }
    
    setupEventListeners() {
        try {
            this.startButton.addEventListener('click', () => this.startFaceRegistration());
            this.skipButton.addEventListener('click', () => this.skipFaceRegistration());
            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }
    
    async startFaceRegistration() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                } 
            });
            this.video.srcObject = this.stream;
            await this.video.play();
            
            this.startButton.disabled = true;
            this.updateStatus('Position your face in the circle', 'info');
            this.startProcessing();
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.updateStatus('Error accessing camera. Please check permissions.', 'error');
            this.startButton.disabled = false;
        }
    }
    
    startProcessing() {
        this.isProcessing = true;
        this.progress = 0;
        this.updateProgress();
        
        const processFrame = () => {
            if (!this.isProcessing) return;
            
            try {
                // Draw video frame to canvas
                this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Get image data and send to server
                const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
                
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'face_registration',
                        image: imageData
                    }));
                }
                
                requestAnimationFrame(processFrame);
            } catch (error) {
                console.error('Error processing frame:', error);
                this.handleRegistrationError('Error processing video frame');
            }
        };
        
        processFrame();
    }
    
    handleWebSocketMessage(data) {
        try {
            switch (data.type) {
                case 'face_registration_status':
                    this.handleRegistrationStatus(data);
                    break;
                case 'error':
                    this.updateStatus(data.message, 'error');
                    this.startButton.disabled = false;
                    break;
                default:
                    console.warn('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.updateStatus('Error processing server response', 'error');
        }
    }
    
    handleRegistrationStatus(data) {
        try {
            if (data.status === 'processing') {
                this.progress = data.progress;
                this.updateProgress();
                this.updateStatus(data.message, 'info');
            } else if (data.status === 'success') {
                this.handleRegistrationSuccess();
            } else if (data.status === 'error') {
                this.handleRegistrationError(data.message);
            }
        } catch (error) {
            console.error('Error handling registration status:', error);
            this.handleRegistrationError('Error processing registration status');
        }
    }
    
    updateProgress() {
        try {
            this.progressFill.style.width = `${this.progress}%`;
            this.progressText.textContent = `${Math.round(this.progress)}%`;
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }
    
    handleRegistrationSuccess() {
        this.isProcessing = false;
        this.updateStatus('Face registration successful!', 'success');
        this.stopCamera();
        setTimeout(() => this.redirectToDashboard(), 2000);
    }
    
    handleRegistrationError(message) {
        this.isProcessing = false;
        this.updateStatus(message, 'error');
        this.startButton.disabled = false;
    }
    
    skipFaceRegistration() {
        if (confirm('Are you sure you want to skip face registration? You can set it up later in your profile settings.')) {
            this.redirectToDashboard();
        }
    }
    
    stopCamera() {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.video.srcObject = null;
            }
        } catch (error) {
            console.error('Error stopping camera:', error);
        }
    }
    
    updateStatus(message, type = 'info') {
        try {
            this.statusMessage.textContent = message;
            this.statusMessage.className = `status-message ${type}`;
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }
    
    redirectToDashboard() {
        window.location.href = '/dashboard.html';
    }
}

// Initialize face setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        new FaceSetup();
    } catch (error) {
        console.error('Error initializing FaceSetup:', error);
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = 'Error initializing face setup. Please refresh the page.';
            statusMessage.className = 'status-message error';
        }
    }
});