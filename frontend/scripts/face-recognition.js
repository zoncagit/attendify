import CONFIG from './config.js';
import utils from './utils.js';
import io from 'socket.io-client';

class FaceRecognition {
  constructor(options = {}) {
    this.options = {
      onResult: () => {},
      onError: () => {},
      ...options
    };
    
    // Initialize Socket.IO with proper configuration
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Socket.IO event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.options.onError('Failed to connect to server. Please try again.');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.options.onError('Connection error. Please try again.');
    });

    // Initialize other properties
    this.isRecognizing = false;
    this.video = null;
    this.canvas = null;
    this.stream = null;
    this.frameInterval = options.frameInterval || 200; // 5 FPS by default
    this.wsUrl = 'ws://127.0.0.1:8000/ws/face-recognition';
  }

  async initialize(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;

    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      // Set up video stream
      this.video.srcObject = this.stream;
      await this.video.play();

      // Initialize WebSocket connection
      this.initializeWebSocket();

      return true;
    } catch (error) {
      console.error('Error initializing face recognition:', error);
      this.options.onError('Failed to initialize camera. Please check permissions.');
      return false;
    }
  }

  initializeWebSocket() {
    // Add authentication token to WebSocket URL
    const token = utils.getAuthToken();
    const wsUrlWithAuth = `${this.wsUrl}?token=${token}`;

    this.websocket = new WebSocket(wsUrlWithAuth);

    this.websocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.websocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        this.handleRecognitionResponse(response);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.options.onError('Connection error occurred');
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed');
      if (this.isRecognizing) {
        this.options.onError('Connection lost. Please refresh the page.');
        this.stop();
      }
    };
  }

  handleRecognitionResponse(response) {
    if (response.error) {
      this.options.onError(response.error);
      return;
    }

    this.options.onResult(response);
  }

  start() {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.options.onError('No connection to server');
      return;
    }

    this.isRecognizing = true;
    this.captureAndSendFrames();
  }

  stop() {
    this.isRecognizing = false;
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  captureAndSendFrames() {
    if (!this.isRecognizing) return;

    const context = this.canvas.getContext('2d');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    // Capture and send frame
    const sendFrame = () => {
      if (!this.isRecognizing) return;

      context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      const frame = this.canvas.toDataURL('image/jpeg', 0.8);

      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          frame: frame,
          timestamp: Date.now()
        }));
      }

      // Schedule next frame
      setTimeout(sendFrame, this.frameInterval);
    };

    sendFrame();
  }

  // Utility method to check if the browser supports required features
  static checkBrowserSupport() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.WebSocket
    );
  }
}

export default FaceRecognition; 