document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const profileDropdownBtn = document.getElementById('profileDropdownBtn');
  const profileDropdownMenu = document.getElementById('profileDropdownMenu');
  const modalOverlay = document.getElementById('modalOverlay');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const successModal = document.getElementById('successModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  
  const webcamContainer = document.getElementById('webcamContainer');
  const webcam = document.getElementById('webcam');
  const faceCanvas = document.getElementById('faceCanvas');
  const webcamPlaceholder = document.querySelector('.webcam-placeholder');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const capturedCount = document.getElementById('capturedCount');
  const scanInstructions = document.getElementById('scanInstructions');
  
  const startScanBtn = document.getElementById('startScanBtn');
  const captureFaceBtn = document.getElementById('captureFaceBtn');
  const retryBtn = document.getElementById('retryBtn');
  const completeSetupBtn = document.getElementById('completeSetupBtn');
  
  const capturedFaces = document.getElementById('capturedFaces');
  const facesGrid = document.getElementById('facesGrid');
  
  const steps = document.querySelectorAll('.step');
  
  // Variables
  let mediaStream = null;
  let capturedImages = [];
  let currentStep = 1;
  
  // Profile dropdown toggle
  profileDropdownBtn.addEventListener('click', function() {
    profileDropdownMenu.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.profile-dropdown') && profileDropdownMenu.classList.contains('show')) {
      profileDropdownMenu.classList.remove('show');
    }
  });
  
  // Settings button
  settingsBtn.addEventListener('click', function() {
    showModal(settingsModal);
  });
  
  // Close Settings button
  closeSettingsBtn.addEventListener('click', function() {
    hideModals();
  });
  
  // Start Scan button
  startScanBtn.addEventListener('click', function() {
    initCamera();
    this.style.display = 'none';
    captureFaceBtn.style.display = 'inline-flex';
    
    // Update step
    updateStep(1);
  });
  
  // Capture Face button
  captureFaceBtn.addEventListener('click', function() {
    if (capturedImages.length < 5) {
      captureImage();
    }
    
    if (capturedImages.length >= 5) {
      this.disabled = true;
      completeSetupBtn.style.display = 'inline-flex';
    }
  });
  
  // Retry button
  retryBtn.addEventListener('click', function() {
    resetCapture();
  });
  
  // Complete Setup button
  completeSetupBtn.addEventListener('click', function() {
    // Simulate completing the face registration
    localStorage.setItem('faceRecognitionEnabled', 'true');
    
    // Stop camera
    stopCamera();
    
    // Show success modal
    showModal(successModal);
  });
  
  // Close modal when clicking on overlay
  modalOverlay.addEventListener('click', function(event) {
    if (event.target === modalOverlay) {
      hideModals();
    }
  });
  
  // Profile picture upload
  const profilePictureInput = document.getElementById('profilePictureInput');
  const currentPicture = document.querySelector('.current-picture');
  
  currentPicture.addEventListener('click', function() {
    profilePictureInput.click();
  });
  
  profilePictureInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        document.getElementById('settingsProfileImage').src = e.target.result;
        document.getElementById('profileImage').src = e.target.result;
        document.getElementById('profileImage').style.display = 'block';
        document.getElementById('userInitials').style.display = 'none';
        
        // Save profile image to localStorage
        localStorage.setItem('profileImage', e.target.result);
      };
      
      reader.readAsDataURL(this.files[0]);
    }
  });
  
  // Copy buttons functionality
  const copyButtons = document.querySelectorAll('.copy-btn');
  
  copyButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const textToCopy = this.previousElementSibling.textContent;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          // Show temporary "Copied!" tooltip
          const originalTitle = this.getAttribute('title');
          this.setAttribute('title', 'Copied!');
          
          setTimeout(() => {
            this.setAttribute('title', originalTitle);
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    });
  });
  
  // Load profile image if exists
  const savedProfileImage = localStorage.getItem('profileImage');
  if (savedProfileImage) {
    document.getElementById('settingsProfileImage').src = savedProfileImage;
    document.getElementById('profileImage').src = savedProfileImage;
    document.getElementById('profileImage').style.display = 'block';
    document.getElementById('userInitials').style.display = 'none';
  }
  
  // Helper Functions
  function showModal(modal) {
    modalOverlay.style.display = 'flex';
    
    // Hide all modals first
    const modals = modalOverlay.querySelectorAll('.modal');
    modals.forEach(function(m) {
      m.style.display = 'none';
    });
    
    // Show the specific modal
    modal.style.display = 'block';
    
    // Add animation classes
    modalOverlay.classList.add('show');
    setTimeout(function() {
      modal.classList.add('show');
    }, 10);
  }
  
  function hideModals() {
    modalOverlay.classList.remove('show');
    const modals = modalOverlay.querySelectorAll('.modal');
    modals.forEach(function(modal) {
      modal.classList.remove('show');
    });
    
    setTimeout(function() {
      modalOverlay.style.display = 'none';
    }, 300);
  }
  
  function initCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
          mediaStream = stream;
          webcam.srcObject = stream;
          webcam.style.display = 'block';
          webcamPlaceholder.style.display = 'none';
          
          // Enable capture button after camera is ready
          webcam.onloadedmetadata = function() {
            captureFaceBtn.disabled = false;
          };
        })
        .catch(function(error) {
          console.error('Camera access error:', error);
          scanInstructions.textContent = 'Camera access denied. Please check permissions and try again.';
        });
    } else {
      scanInstructions.textContent = 'Your browser does not support camera access.';
    }
  }
  
  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
      webcam.srcObject = null;
    }
  }
  
  function captureImage() {
    if (!mediaStream) return;
    
    // Setup canvas
    faceCanvas.width = webcam.videoWidth;
    faceCanvas.height = webcam.videoHeight;
    
    // Draw current frame to canvas
    const context = faceCanvas.getContext('2d');
    context.drawImage(webcam, 0, 0, faceCanvas.width, faceCanvas.height);
    
    // Convert to data URL and store
    const imageUrl = faceCanvas.toDataURL('image/png');
    capturedImages.push(imageUrl);
    
    // Update progress
    const progress = (capturedImages.length / 5) * 100;
    scanProgressBar.style.width = `${progress}%`;
    capturedCount.textContent = capturedImages.length;
    
    // Add thumbnail to grid
    addThumbnail(imageUrl);
    
    // Show captured faces container
    if (capturedImages.length === 1) {
      capturedFaces.classList.add('show');
    }
    
    // Update instructions
    if (capturedImages.length < 5) {
      scanInstructions.textContent = `Great! Now ${5 - capturedImages.length} more to go. Try a slightly different angle.`;
    } else {
      scanInstructions.textContent = 'All images captured! You can complete the setup now.';
      captureFaceBtn.disabled = true;
      updateStep(3);
    }
    
    // Update step
    if (capturedImages.length >= 2 && currentStep === 1) {
      updateStep(2);
    }
  }
  
  function addThumbnail(imageUrl) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'face-thumbnail';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    
    thumbnail.appendChild(img);
    facesGrid.appendChild(thumbnail);
  }
  
  function resetCapture() {
    // Clear captured images
    capturedImages = [];
    facesGrid.innerHTML = '';
    capturedFaces.classList.remove('show');
    
    // Reset progress
    scanProgressBar.style.width = '0%';
    capturedCount.textContent = '0';
    
    // Reset buttons
    captureFaceBtn.disabled = false;
    captureFaceBtn.style.display = 'inline-flex';
    completeSetupBtn.style.display = 'none';
    retryBtn.style.display = 'none';
    
    // Reset instructions
    scanInstructions.textContent = 'Position your face within the outline and remain still';
    
    // Reset steps
    updateStep(1);
  }
  
  function updateStep(step) {
    currentStep = step;
    
    // Remove active class from all steps
    steps.forEach(s => {
      s.classList.remove('active');
      s.classList.remove('completed');
    });
    
    // Add active class to current step
    steps[step - 1].classList.add('active');
    
    // Mark previous steps as completed
    for (let i = 0; i < step - 1; i++) {
      steps[i].classList.add('completed');
    }
  }
}); 