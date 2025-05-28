import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const token = utils.getAuthToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Elements
  const webcam = document.getElementById('webcam');
  const canvas = document.getElementById('faceCanvas');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const startScanBtn = document.getElementById('startScanBtn');
  const skipBtn = document.getElementById('skipBtn');
  const setupContent = document.getElementById('setupContent');
  const scanComplete = document.getElementById('scanComplete');
  const continueBtn = document.getElementById('continueBtn');

  let stream = null;
  let scanning = false;
  let scanProgress = 0;
  let capturedImages = [];
  const requiredImages = 5;

  // API endpoints
  const API_URL = 'http://127.0.0.1:8000';
  const ENDPOINTS = {
    UPLOAD_FACE: `${API_URL}/api/v1/users/face-recognition/upload`,
    VERIFY_FACE: `${API_URL}/api/v1/users/face-recognition/verify`
  };

  // Start webcam
  async function startWebcam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      webcam.srcObject = stream;
      webcam.style.display = 'block';
      document.querySelector('.webcam-placeholder').style.display = 'none';
    } catch (error) {
      console.error('Error accessing webcam:', error);
      utils.showNotification('Unable to access webcam. Please check permissions.', 'error');
    }
  }

  // Stop webcam
  function stopWebcam() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      webcam.srcObject = null;
      webcam.style.display = 'none';
      document.querySelector('.webcam-placeholder').style.display = 'flex';
    }
  }

  // Capture face image
  function captureFace() {
    const context = canvas.getContext('2d');
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    context.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // Start face scanning
  async function startScanning() {
    if (!stream) {
      await startWebcam();
    }

    scanning = true;
    scanProgress = 0;
    capturedImages = [];
    updateScanProgress();

    const scanInterval = setInterval(async () => {
      if (!scanning || capturedImages.length >= requiredImages) {
        clearInterval(scanInterval);
        if (capturedImages.length >= requiredImages) {
          await uploadFaceImages();
        }
        return;
      }

      const image = captureFace();
      capturedImages.push(image);
      scanProgress = (capturedImages.length / requiredImages) * 100;
      updateScanProgress();
    }, 1000);
  }

  // Update scan progress bar
  function updateScanProgress() {
    scanProgressBar.style.width = `${scanProgress}%`;
  }

  // Upload face images to backend
  async function uploadFaceImages() {
    try {
      const { ok, data } = await utils.fetchWithAuth(ENDPOINTS.UPLOAD_FACE, {
        method: 'POST',
        body: JSON.stringify({
          face_images: capturedImages
        })
      });

      if (ok) {
        showSetupComplete();
      } else {
        throw new Error(data.message || 'Failed to upload face images');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
      resetScan();
    }
  }

  // Show setup complete screen
  function showSetupComplete() {
    stopWebcam();
    setupContent.style.display = 'none';
    scanComplete.style.display = 'block';
    localStorage.setItem('faceScanComplete', 'true');
  }

  // Reset scan
  function resetScan() {
    scanning = false;
    scanProgress = 0;
    capturedImages = [];
    updateScanProgress();
  }

  // Event Listeners
  startScanBtn.addEventListener('click', () => {
    startScanBtn.disabled = true;
    startScanning();
  });

  skipBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  continueBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    stopWebcam();
  });
});