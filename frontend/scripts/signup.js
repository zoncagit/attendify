import CONFIG from './config.js';
import utils from './utils.js';

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded");
  
  const signupForm = document.getElementById("signupForm");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const progressFill = document.getElementById("progressFill");
  const passwordStrengthBar = document.getElementById("passwordStrengthBar");
  const passwordStrengthText = document.getElementById("passwordStrengthText");

  // Password toggle functionality
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

  setupPasswordToggle("password", "togglePassword");
  setupPasswordToggle("confirmPassword", "toggleConfirmPassword");

  // Email verification elements
  const emailVerificationModal = document.getElementById("emailVerificationModal");
  const closeVerificationModal = document.getElementById("closeVerificationModal");
  const verificationEmail = document.getElementById("verificationEmail");
  const verifyCodeBtn = document.getElementById("verifyCodeBtn");
  const resendCodeBtn = document.getElementById("resendCodeBtn");
  const resendTimer = document.getElementById("resendTimer");
  const resendCountdown = document.getElementById("resendCountdown");
  const verificationError = document.getElementById("verificationError");
  const codeDigits = document.querySelectorAll(".code-digit");

  // Handle code digit input
  codeDigits.forEach((digit, index) => {
    digit.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");

      if (this.value.length === 1) {
        if (index < codeDigits.length - 1) {
          codeDigits[index + 1].focus();
        } else {
          verifyCode();
        }
      }
    });

    digit.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        codeDigits[index - 1].focus();
      }
    });
  });

  // Progress tracking
  const formInputs = [firstNameInput, lastNameInput, emailInput, passwordInput, confirmPasswordInput];
  
  function updateProgress() {
    const filledInputs = formInputs.filter(input => input.value.trim() !== "").length;
    const progress = (filledInputs / formInputs.length) * 100;
    progressFill.style.width = `${progress}%`;
  }

  formInputs.forEach(input => {
    input.addEventListener("input", updateProgress);
    input.addEventListener("change", updateProgress);
  });

  // Password strength indicator
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    let strength = 0;
    let strengthText = "Weak";
    let strengthColor = "#ef4444";
   
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
   
    if (strength === 100) {
      strengthText = "Strong";
      strengthColor = "#10b981";
    } else if (strength === 75) {
      strengthText = "Good";
      strengthColor = "#10b981";
    } else if (strength === 50) {
      strengthText = "Fair";
      strengthColor = "#f59e0b";
    }
   
    passwordStrengthBar.style.width = `${strength}%`;
    passwordStrengthBar.style.backgroundColor = strengthColor;
    passwordStrengthText.textContent = `Password strength: ${strengthText}`;
    passwordStrengthText.style.color = strengthColor;
  });

  // Form validation
  confirmPasswordInput.addEventListener("input", function () {
    const errorMessage = this.parentElement.querySelector(".error-message");
    if (this.value !== passwordInput.value && this.value !== "") {
      this.classList.add("error");
      if (errorMessage) errorMessage.style.display = "block";
    } else {
      this.classList.remove("error");
      if (errorMessage) errorMessage.style.display = "none";
    }
  });

  emailInput.addEventListener("input", function () {
    const errorMessage = this.parentElement.querySelector(".error-message");
    if (!utils.validateEmail(this.value) && this.value !== "") {
      this.classList.add("error");
      if (errorMessage) errorMessage.style.display = "block";
    } else {
      this.classList.remove("error");
      if (errorMessage) errorMessage.style.display = "none";
    }
  });

  passwordInput.addEventListener("input", function() {
    const errorMessage = this.parentElement.querySelector(".error-message");
    if (this.value.length > 0 && this.value.length < 8) {
      this.classList.add("error");
      if (errorMessage) errorMessage.style.display = "block";
    } else {
      this.classList.remove("error");
      if (errorMessage) errorMessage.style.display = "none";
    }
  });

  // Form submission
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    let isValid = true;
    const validations = [
      { input: firstNameInput, condition: firstNameInput.value.trim() === "" },
      { input: lastNameInput, condition: lastNameInput.value.trim() === "" },
      { input: emailInput, condition: !utils.validateEmail(emailInput.value) },
      { input: passwordInput, condition: passwordInput.value.length < 8 },
      { input: confirmPasswordInput, condition: confirmPasswordInput.value !== passwordInput.value }
    ];

    validations.forEach(({ input, condition }) => {
      const errorMessage = input.parentElement.querySelector(".error-message");
      if (condition) {
        input.classList.add("error");
        if (errorMessage) errorMessage.style.display = "block";
        isValid = false;
      } else {
        input.classList.remove("error");
        if (errorMessage) errorMessage.style.display = "none";
      }
    });

    if (!isValid) return;

    const button = this.querySelector('button[type="submit"]');
    button.classList.add("loading");
    button.disabled = true;

    try {
      // Send signup request to backend
      const { ok, data } = await utils.fetchWithAuth(CONFIG.API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        body: JSON.stringify({
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      if (ok) {
        // Show verification modal
        verificationEmail.textContent = emailInput.value;
        emailVerificationModal.classList.add("active");
        codeDigits[0].focus();
        startResendTimer();
      } else {
        throw new Error(data.message || 'Signup failed');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
    } finally {
      button.classList.remove("loading");
      button.disabled = false;
    }
  });

  // Verification code handling
  async function verifyCode() {
    let enteredCode = "";
    codeDigits.forEach(digit => {
      enteredCode += digit.value;
    });

    if (enteredCode.length !== 6) {
      verificationError.textContent = "Please enter all 6 digits";
      verificationError.style.display = "block";
      return;
    }

    verifyCodeBtn.classList.add("loading");
    verifyCodeBtn.disabled = true;

    try {
      const { ok, data } = await utils.fetchWithAuth(CONFIG.API_ENDPOINTS.VERIFY_EMAIL, {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value,
          code: enteredCode
        })
      });

      if (ok) {
        utils.setAuthToken(data.token);
        utils.setUser(data.user);
        completeSignup();
      } else {
        verificationError.textContent = data.message || "Verification failed. Please try again.";
        verificationError.style.display = "block";
      }
    } catch (error) {
      verificationError.textContent = "An error occurred. Please try again.";
      verificationError.style.display = "block";
    } finally {
      verifyCodeBtn.classList.remove("loading");
      verifyCodeBtn.disabled = false;
    }
  }

  function startResendTimer() {
    let timeLeft = 60;
    resendCountdown.textContent = timeLeft;
    resendCodeBtn.disabled = true;
    resendTimer.style.display = "block";

    const timer = setInterval(() => {
      timeLeft--;
      resendCountdown.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timer);
        resendCodeBtn.disabled = false;
        resendTimer.style.display = "none";
      }
    }, 1000);
  }

  closeVerificationModal.addEventListener("click", () => {
    emailVerificationModal.classList.remove("active");
  });

  resendCodeBtn.addEventListener("click", async function () {
    try {
      const { ok, data } = await utils.fetchWithAuth(CONFIG.API_ENDPOINTS.RESEND_CODE, {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value
        })
      });

      if (ok) {
        utils.showNotification('Verification code resent successfully');
        startResendTimer();
      } else {
        throw new Error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      utils.showNotification(error.message, 'error');
    }
  });

  verifyCodeBtn.addEventListener("click", verifyCode);

  function completeSignup() {
    emailVerificationModal.classList.remove("active");
    utils.showNotification('Account created successfully! Redirecting...');
    
    setTimeout(() => {
      window.location.href = "face-setup.html?from=signup";
    }, 1500);
  }
});