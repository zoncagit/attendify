document.addEventListener('DOMContentLoaded', function() {
  const resetForm = document.getElementById('resetForm');
  const emailInput = document.getElementById('email');
  const successMessage = document.getElementById('successMessage');
  const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');

  resetForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add('error');
      emailInput.parentElement.querySelector('.error-message').style.display = 'block';
      return;
    } else {
      emailInput.classList.remove('error');
      emailInput.parentElement.querySelector('.error-message').style.display = 'none';
    }
    
    // Add loading state to button
    sendResetLinkBtn.classList.add('loading');
    sendResetLinkBtn.disabled = true;
    
    // Simulate sending reset link
    setTimeout(() => {
      // In a real application, this would make an API call to your backend
      // The backend would:
      // 1. Generate a secure token
      // 2. Store the token with an expiration time
      // 3. Send an email with a link containing the token
      
      // For demo purposes, we'll create a reset link with the email parameter
      const resetLink = `reset-password.html?email=${encodeURIComponent(emailInput.value)}&token=demo-token`;
      console.log('Reset link generated:', resetLink);

      // Show success message
      successMessage.classList.add('show');

    // Remove loading state
      sendResetLinkBtn.classList.remove('loading');
      sendResetLinkBtn.disabled = false;
      
      // In a real application, you might want to hide the form after success
      resetForm.style.opacity = '0.5';
      sendResetLinkBtn.style.display = 'none';
    }, 1500);
  });
});