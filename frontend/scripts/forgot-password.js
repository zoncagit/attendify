document.addEventListener('DOMContentLoaded', function() {
  const resetForm = document.getElementById('resetForm');
  const emailInput = document.getElementById('email');
  const successMessage = document.getElementById('successMessage');
  const verificationSection = document.getElementById('verification-section');
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  const verifyCodeBtn = document.getElementById('verifyCodeBtn');
  const verificationEmail = document.getElementById('verificationEmail');
  const verificationError = document.getElementById('verificationError');
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  const resendTimer = document.getElementById('resendTimer');
  const resendCountdown = document.getElementById('resendCountdown');

  // Handle digit code input behavior
  const codeDigits = document.querySelectorAll('.code-digit');
  codeDigits.forEach((digit, index) => {
    digit.addEventListener('input', function() {
      // Allow only numbers
      this.value = this.value.replace(/[^0-9]/g, '');

      if (this.value.length === 1) {
        if (index < codeDigits.length - 1) {
          codeDigits[index + 1].focus();
        } else {
          // Last digit entered, verify automatically
          verifyCode();
        }
      }
    });

    digit.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && this.value === '' && index > 0) {
        codeDigits[index - 1].focus();
      }
    });
  });

  // Store verification code (in real app, this would be generated server-side)
  let verificationCode = '';

  resetForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add('error');
      return;
    } else {
      emailInput.classList.remove('error');
    }
    
    // If verification section is already visible, don't proceed
    if (verificationSection.style.display === 'block') return;
    
    sendCodeBtn.classList.add('loading');
    sendCodeBtn.disabled = true;

    setTimeout(() => {
      // Show verification section
      sendVerificationCode();
    }, 1500);
  });

  // Generate and "send" verification code
  function sendVerificationCode() {
    // For testing only - in a real app, this would be generated and sent server-side
    verificationCode = '123456';
    console.log('Verification code:', verificationCode);

    // Display user email
    verificationEmail.textContent = emailInput.value;

    // Show verification section
    verificationSection.style.display = 'block';
    sendCodeBtn.style.display = 'none';
    verifyCodeBtn.style.display = 'block';

    // Reset verification UI
    codeDigits.forEach(digit => digit.value = '');
    codeDigits[0].focus();
    verificationError.style.display = 'none';

    // Start resend timer
    startResendTimer();

    // Remove loading state
    sendCodeBtn.classList.remove('loading');
    sendCodeBtn.disabled = false;
  }

  // Start the countdown timer for resend code option
  function startResendTimer() {
    let timeLeft = 60;
    resendCountdown.textContent = timeLeft;
    resendCodeBtn.disabled = true;
    resendTimer.style.display = 'block';

    const timer = setInterval(() => {
      timeLeft--;
      resendCountdown.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timer);
        resendCodeBtn.disabled = false;
        resendTimer.style.display = 'none';
      }
    }, 1000);
  }

  // Resend code button
  resendCodeBtn.addEventListener('click', function() {
    sendVerificationCode();
  });

  // Verify code button
  verifyCodeBtn.addEventListener('click', function() {
    verifyCode();
  });

  // Process verification code submission
  function verifyCode() {
    // Get the entered code
    let enteredCode = '';
    codeDigits.forEach(digit => {
      enteredCode += digit.value;
    });

    // Check if code is complete
    if (enteredCode.length !== 6) {
      verificationError.textContent = 'Please enter all 6 digits';
      verificationError.style.display = 'block';
      return;
    }

    // Add loading state to verify button
    verifyCodeBtn.classList.add('loading');
    verifyCodeBtn.disabled = true;

    // Simulate verification process
    setTimeout(() => {
      if (enteredCode === verificationCode) {
        // Code is correct
        successMessage.classList.add('show');
        
        // Redirect to reset password page after a delay
        setTimeout(() => {
          window.location.href = 'reset-password.html?email=' + encodeURIComponent(emailInput.value);
        }, 1500);
      } else {
        // Code is incorrect
        verificationError.textContent = 'Incorrect verification code. Please try again.';
        verificationError.style.display = 'block';
        verifyCodeBtn.classList.remove('loading');
        verifyCodeBtn.disabled = false;
      }
    }, 1000);
  }
});