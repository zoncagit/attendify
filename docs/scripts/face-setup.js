document.addEventListener('DOMContentLoaded', function() {
    const setupContent = document.getElementById('setupContent');
    const scanComplete = document.getElementById('scanComplete');
    const webcamContainer = document.getElementById('webcamContainer');
    const webcam = document.getElementById('webcam');
    const faceCanvas = document.getElementById('faceCanvas');
    const scanProgressBar = document.getElementById('scanProgressBar');
    const skipBtn = document.getElementById('skipBtn');
    const startScanBtn = document.getElementById('startScanBtn');
    const continueBtn = document.getElementById('continueBtn');
    
    // Check if user is coming from signup
    const urlParams = new URLSearchParams(window.location.search);
    const fromSignup = urlParams.get('from') === 'signup';
    
    // Redirect to dashboard if not coming from signup and not set in localStorage
    if (!fromSignup && !localStorage.getItem('setupFaceScan')) {
      window.location.href = 'dashboard.html';
    }
    
    // Skip button redirects to dashboard
    skipBtn.addEventListener('click', function() {
      window.location.href = 'dashboard.html?new=true';
    });
    
    // Continue button after successful scan
    continueBtn.addEventListener('click', function() {
      window.location.href = 'dashboard.html?new=true';
    });
    
    // Start face scanning process
    startScanBtn.addEventListener('click', function() {
      startFaceScan();
    });
    
    function startFaceScan() {
      // Show webcam
      const webcamPlaceholder = document.querySelector('.webcam-placeholder');
      
      // Request camera access
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          webcam.srcObject = stream;
          webcam.style.display = 'block';
          webcamPlaceholder.style.display = 'none';
          
          // Disable start button during scanning
          startScanBtn.disabled = true;
          startScanBtn.textContent = 'Scanning...';
          
          // Simulate scanning process
          let progress = 0;
          const scanInterval = setInterval(() => {
            progress += 5;
            scanProgressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
              clearInterval(scanInterval);
              completeFaceScan();
            }
          }, 200);
        })
        .catch(error => {
          alert('Unable to access camera: ' + error.message);
          startScanBtn.disabled = false;
        });
    }
    
    function completeFaceScan() {
      // Take a "screenshot" for simulation purposes
      const context = faceCanvas.getContext('2d');
      
      // Set canvas dimensions to match video
      faceCanvas.width = webcam.videoWidth;
      faceCanvas.height = webcam.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(webcam, 0, 0, faceCanvas.width, faceCanvas.height);
      
      // Stop camera
      const tracks = webcam.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      
      // Store in localStorage
      localStorage.setItem('faceRecognitionEnabled', 'true');
      
      // Show success screen
      setupContent.style.display = 'none';
      scanComplete.style.display = 'block';
    }
  });
