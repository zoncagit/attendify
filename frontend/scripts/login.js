import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {//waiting until the entire html document is loaded

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const successMessage = document.getElementById('successMessage');
  const googleLoginButton = document.querySelector('.btn-google-login');
  const togglePassword = document.getElementById('togglePassword');

  // Setup password toggle functionality
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle the eye icon
    const icon = this.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  // Also toggle password when user presses Enter or Space on the toggle button
  togglePassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  });

  if (localStorage.getItem('rememberedEmail')){//3nd l user 
      emailInput.value = localStorage.getItem('rememberedEmail');
      rememberMeCheckbox.checked = true;
  }


  emailInput.addEventListener('input', function() {
      if (!utils.validateEmail(this.value) && this.value !== '') {
          this.classList.add('error');
      } else {
          this.classList.remove('error');
      }
  });

  loginForm.addEventListener('submit', async function(e) {//e: object automatically passed by the browser
      e.preventDefault();//lemme handle

      let isValid = true;

      if (!utils.validateEmail(emailInput.value)) {
          emailInput.classList.add('error');
          isValid = false;
      } else {
          emailInput.classList.remove('error');
      }

      if (passwordInput.value.trim() === '') {//trim: remove whitespaces from beginning and end
          passwordInput.classList.add('error');
          isValid = false;
      } else {
          passwordInput.classList.remove('error');
      }

      if (!isValid) return;

      if (rememberMeCheckbox.checked) {
          localStorage.setItem('rememberedEmail', emailInput.value);
      } else {
          localStorage.removeItem('rememberedEmail');
      }

      
      const button = this.querySelector('button[type="submit"]');//look for the BUTTON
      button.classList.add('loading');
      button.disabled = true;

      try  {
        // Prepare form data for FastAPI OAuth2PasswordRequestForm
        const formData = new URLSearchParams();
        formData.append('username', emailInput.value);
        formData.append('password', passwordInput.value);
    
        // Send POST request to FastAPI
        const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
    
        const data = await response.json();
    
        if (response.ok && data.access_token) {
            // Save token and user data using our new auth system
            window.auth.saveAuthData(data.access_token, data.user);
    
            utils.showNotification('Login successful! Redirecting...', 'success');
    
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            throw new Error(data.detail || 'Login failed');
        }
    
    } catch (error) {
        utils.showNotification(error.message || 'Login failed. Please try again.', 'error');
        button.classList.remove('loading');
        button.disabled = false;
    }
    
  });


});
