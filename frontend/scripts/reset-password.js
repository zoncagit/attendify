import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
  const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');
  const successMessage = document.getElementById('successMessage');
  const passwordStrengthBar = document.getElementById('passwordStrengthBar');
  const passwordStrengthText = document.getElementById('passwordStrengthText');
  
  // get email and token
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Only show error if coming from forgot password page (check referrer)
  const isFromForgotPassword = document.referrer.includes('forgot-password.html');
  
  if (!token && isFromForgotPassword) {
    utils.showNotification('Invalid reset password link. Please request a new password reset.', 'error');
    // Hide the reset password form
    if (resetPasswordForm) {
      resetPasswordForm.style.display = 'none';
    }
    // Show a message in the container
    const container = document.querySelector('.reset-password-container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-link-message';
      errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h2>Invalid Reset Link</h2>
        <p>The password reset link is invalid or has expired.</p>
        <a href="forgot-password.html" class="btn-reset">Request New Reset Link</a>
      `;
      container.appendChild(errorDiv);
    }
    return;
  }
  
  // check password strength
  newPasswordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    let strengthText = "Weak";
    let strengthColor = "#ef4444"; // Red
    
    // calculate strength
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    
    if (strength === 100) {
      strengthText = "Strong";
      strengthColor = "#10b981"; // Green
    } else if (strength >= 75) {
      strengthText = "Good";
      strengthColor = "#10b981"; // Green
    } else if (strength >= 50) {
      strengthText = "Fair";
      strengthColor = "#f59e0b"; // Yellow
    }
    
    passwordStrengthBar.style.width = `${strength}%`;
    passwordStrengthBar.style.backgroundColor = strengthColor;
    passwordStrengthText.textContent = `Password strength: ${strengthText}`;
    passwordStrengthText.style.color = strengthColor;
    
    // show error if password is too short
    const errorMessage = this.parentElement.querySelector('.error-message');
    if (this.value.length > 0 && this.value.length < 8) {
      this.classList.add('error');
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'Password must be at least 8 characters';
    } else {
      this.classList.remove('error');
      errorMessage.style.display = 'none';
    }
  });
  
  // check if passwords match
  confirmNewPasswordInput.addEventListener('input', function() {
    const errorMessage = this.parentElement.querySelector('.error-message');
    if (this.value !== newPasswordInput.value && this.value !== '') {
      this.classList.add('error');
      errorMessage.style.display = 'block';
      errorMessage.textContent = 'Passwords do not match';
    } else {
      this.classList.remove('error');
      errorMessage.style.display = 'none';
    }
  });
  
  function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;
    function toggleVisibility() {
      const icon = toggle.querySelector('i');
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      }
    }
    toggle.addEventListener("click", toggleVisibility);
    toggle.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggleVisibility();
      }
    });
  }
  setupPasswordToggle("newPassword", "toggleNewPassword");
  setupPasswordToggle("confirmNewPassword", "toggleConfirmNewPassword");
  
  resetPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate password length (matching backend validation)
    if (newPasswordInput.value.length < 8) {
      newPasswordInput.classList.add('error');
      const errorMessage = newPasswordInput.parentElement.querySelector('.error-message');
      errorMessage.textContent = 'Password must be at least 8 characters long';
      errorMessage.style.display = 'block';
      isValid = false;
    } else {
      newPasswordInput.classList.remove('error');
      newPasswordInput.parentElement.querySelector('.error-message').style.display = 'none';
    }
    
    // Validate password match
    if (confirmNewPasswordInput.value !== newPasswordInput.value) {
      confirmNewPasswordInput.classList.add('error');
      const errorMessage = confirmNewPasswordInput.parentElement.querySelector('.error-message');
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
      isValid = false;
    } else {
      confirmNewPasswordInput.classList.remove('error');
      confirmNewPasswordInput.parentElement.querySelector('.error-message').style.display = 'none';
    }
    
    if (!isValid) return;
    
    // add loading state
    const button = document.getElementById('resetPasswordBtn');
    button.classList.add('loading');
    button.disabled = true;
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('token', token);
      formData.append('new_password', newPasswordInput.value);
      formData.append('confirm_password', confirmNewPasswordInput.value);

      const response = await fetch(`${CONFIG.API_URL}${CONFIG.API_ENDPOINTS.RESET_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        },
        body: formData
      });

      if (response.ok) {
        // Hide any error messages
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.style.display = 'none');
        
        // Remove error classes
        newPasswordInput.classList.remove('error');
        confirmNewPasswordInput.classList.remove('error');
        
        // Show success message
        successMessage.classList.add('show');
        
        // Redirect to login page after delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        const contentType = response.headers.get('content-type');
        let errorMessage;
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.detail || 'Password reset failed. Please try again.';
        } else {
          errorMessage = 'Password reset failed. Please try again.';
        }

        // Handle specific error cases
        switch (response.status) {
          case 400:
            // Handle validation errors
            if (errorMessage.includes('token')) {
              window.location.href = 'forgot-password.html';
              return;
            }
            break;
          case 500:
            errorMessage = 'An error occurred on the server. Please try again later.';
            break;
        }
        
        utils.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      utils.showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      button.classList.remove('loading');
      button.disabled = false;
    }
  });
}); 