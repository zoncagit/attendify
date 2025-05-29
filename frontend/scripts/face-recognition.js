import CONFIG from './config.js';
import utils from './utils.js';

class FaceRecognition {
  constructor(options = {}) {
    this.videoElement = null;
    this.canvasElement = null;
    this.stream = null;
    this.websocket = null;
    this.isRecognizing = false;
    this.frameInterval = options.frameInterval || 200; // 5 FPS by default
    this.wsUrl = 'ws://127.0.0.1:8000/ws/face-recognition';
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
  }

  async initialize(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

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
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Initialize WebSocket connection
      this.initializeWebSocket();

      return true;
    } catch (error) {
      console.error('Error initializing face recognition:', error);
      this.onError('Failed to initialize camera. Please check permissions.');
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
      this.onError('Connection error occurred');
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed');
      if (this.isRecognizing) {
        this.onError('Connection lost. Please refresh the page.');
        this.stop();
      }
    };
  }

  handleRecognitionResponse(response) {
    if (response.error) {
      this.onError(response.error);
      return;
    }

    this.onResult(response);
  }

  start() {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.onError('No connection to server');
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

    const context = this.canvasElement.getContext('2d');
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    // Capture and send frame
    const sendFrame = () => {
      if (!this.isRecognizing) return;

      context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
      const frame = this.canvasElement.toDataURL('image/jpeg', 0.8);

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