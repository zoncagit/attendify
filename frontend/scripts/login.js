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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;//regular expression
      if (!emailRegex.test(this.value) && this.value !== '') {
          this.classList.add('error');
      } else {
          this.classList.remove('error');
      }
  });

  loginForm.addEventListener('submit', function(e) {//e: object automatically passed by the browser
      e.preventDefault();//lemme handle

      let isValid = true;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value)) {
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

      //simulate login process
      setTimeout(() => {
          //show success message
          successMessage.classList.add('show');

          //redirect after a delay
          setTimeout(() => {
              window.location.href = 'dashboard.html';
          }, 1500);
      }, 1500);//1500: 1.5s (changes with fetch)
  });

  // Google Sign-In functionality
  googleLoginButton.addEventListener('click', function() {
    // Initialize Google Sign-In
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
      callback: handleGoogleSignIn
    });

    google.accounts.id.prompt();
  });

  function handleGoogleSignIn(response) {
    // Handle the sign-in response from Google
    if (response.credential) {
      try {
        // Parse the JWT token to get user info
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        
        // Store user info in localStorage
        localStorage.setItem('userName', payload.name || 'Google User');
        localStorage.setItem('userEmail', payload.email);
        localStorage.setItem('googleAuth', 'true');
        
        // Show success message
        successMessage.classList.add('show');

        // Redirect to dashboard after a delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } catch (error) {
        console.error('Error processing Google sign-in:', error);
        // Fallback to simple redirect
        successMessage.classList.add('show');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }
    }
  }
});