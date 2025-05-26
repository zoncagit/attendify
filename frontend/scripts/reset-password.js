document.addEventListener('DOMContentLoaded', function() {
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
  const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
  const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');
  const successMessage = document.getElementById('successMessage');
  const passwordStrengthBar = document.getElementById('passwordStrengthBar');
  const passwordStrengthText = document.getElementById('passwordStrengthText');
  
  // Get email from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  
  // Check password strength
  newPasswordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    let strengthText = "Weak";
    let strengthColor = "#ef4444"; // Red
    
    // Calculate strength
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
    
    // Show error if password is too short
    if (this.value.length > 0 && this.value.length < 8) {
      this.classList.add('error');
    } else {
      this.classList.remove('error');
    }
  });
  
  // Check if passwords match
  confirmNewPasswordInput.addEventListener('input', function() {
    if (this.value !== newPasswordInput.value && this.value !== '') {
      this.classList.add('error');
    } else {
      this.classList.remove('error');
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
  
  resetPasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate password length
    if (newPasswordInput.value.length < 8) {
      newPasswordInput.classList.add('error');
      isValid = false;
    } else {
      newPasswordInput.classList.remove('error');
    }
    
    // Validate password match
    if (confirmNewPasswordInput.value !== newPasswordInput.value) {
      confirmNewPasswordInput.classList.add('error');
      isValid = false;
    } else {
      confirmNewPasswordInput.classList.remove('error');
    }
    
    if (!isValid) return;
    
    // Add loading state
    const button = document.getElementById('resetPasswordBtn');
    button.classList.add('loading');
    button.disabled = true;
    
    // Simulate password reset process
    setTimeout(() => {
      // In a real app, you would send the new password to the server here
      // along with the email or a token
      console.log('Reset password for:', email);
      console.log('New password set successfully');
      
      // Show success message
      successMessage.classList.add('show');
      
      // Redirect to login page after delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    }, 1500);
  });
}); 