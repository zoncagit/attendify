import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener('DOMContentLoaded', function() {
  const resetForm = document.getElementById('resetForm');
  const emailInput = document.getElementById('email');
  const successMessage = document.getElementById('successMessage');
  const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');
  const errorMessage = emailInput.parentElement.querySelector('.error-message');

  emailInput.addEventListener('input', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value) && this.value !== '') {
      this.classList.add('error');
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';
    } else {
      this.classList.remove('error');
      errorMessage.style.display = 'none';
    }
  });

  resetForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add('error');
      errorMessage.textContent = 'Please enter a valid email address';
      errorMessage.style.display = 'block';
      return;
    }
    
    //add loading state to button
    sendResetLinkBtn.classList.add('loading');
    sendResetLinkBtn.disabled = true;
    
    try {
      const { ok, data } = await utils.fetchWithAuth(`http://127.0.0.1:8000/api/v1/auth/request-password-reset`, {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value.trim()
        })
      });

      if (ok) {
        //show success message
        successMessage.classList.add('show');
        resetForm.style.opacity = '0.5';
        sendResetLinkBtn.style.display = 'none';

        //redirect to reset password page with both email and token
        if (data && data.resetToken) {
          setTimeout(() => {
            window.location.href = `reset-password.html?email=${encodeURIComponent(emailInput.value)}&token=${encodeURIComponent(data.resetToken)}`;
          }, 2000);
        } else {
          throw new Error('Reset token not received from server');
        }
      } else {
        throw new Error(data.message || 'Failed to send reset link');
      }
    } catch (error) {
      emailInput.classList.add('error');
      errorMessage.textContent = error.message || 'An error occurred. Please try again.';
      errorMessage.style.display = 'block';
    } finally {
        //remove loading state
      sendResetLinkBtn.classList.remove('loading');
      sendResetLinkBtn.disabled = false;
    }
  });
});