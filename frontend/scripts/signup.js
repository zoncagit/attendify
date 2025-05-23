document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const progressFill = document.getElementById("progressFill");
  const passwordStrengthBar = document.getElementById(
    "passwordStrengthBar"
  );
  const passwordStrengthText = document.getElementById(
    "passwordStrengthText"
  );
  const googleSignupButton = document.querySelector(".btn-google-signup");

  //email verification elements
  const emailVerificationModal = document.getElementById(
    "emailVerificationModal"
  );
  const closeVerificationModal = document.getElementById(
    "closeVerificationModal"
  );
  const verificationEmail = document.getElementById("verificationEmail");
  const verifyCodeBtn = document.getElementById("verifyCodeBtn");
  const resendCodeBtn = document.getElementById("resendCodeBtn");
  const resendTimer = document.getElementById("resendTimer");
  const resendCountdown = document.getElementById("resendCountdown");
  const verificationError = document.getElementById("verificationError");

  //automatic focus
  const codeDigits = document.querySelectorAll(".code-digit");
  codeDigits.forEach((digit, index) => {
    digit.addEventListener("input", function () {
      //allow only numbers
      this.value = this.value.replace(/[^0-9]/g, "");

      if (this.value.length === 1) {
        if (index < codeDigits.length - 1) {
          codeDigits[index + 1].focus();
        } else {
          //digit=last: verify automatically
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

  let verificationCode = "";

  //progress tracking
  const formInputs = [
    firstNameInput,
    lastNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
  ];
  let filledInputs = 0;

  function updateProgress() {
    filledInputs = 0;

    formInputs.forEach((input) => {
      if (input.value.trim() !== "") filledInputs++;
    });

    const progress = (filledInputs / formInputs.length) * 100;
    progressFill.style.width = `${progress}%`;
  }

  formInputs.forEach((input) => {
    input.addEventListener("input", updateProgress);
    input.addEventListener("change", updateProgress);
  });

  passwordInput.addEventListener('input', function(){
    const password=this.value;
    let strength=0;
    let strengthText= "Weak";
    let strengthColor= "#ef4444";
   
    if (password.length >= 8) strength += 25;
       if (password.match(/[a-z]+/)) strength += 25;
       if (password.match(/[A-Z]+/)) strength += 25;
       if (password.match(/[0-9]+/)) strength += 25;
   
       if (strength === 100) {
         strengthText = "Strong";
         strengthColor = "#10b981"; //green
       } else if (strength === 75) {
         strengthText = "Good";
         strengthColor = "#10b981"; //green
       } else if (strength === 50) {
         strengthText = "Fair";
         strengthColor = "#f59e0b"; //yellow
       }
   
       passwordStrengthBar.style.width = `${strength}%`;
       passwordStrengthBar.style.backgroundColor = strengthColor;
       passwordStrengthText.textContent = `Password strength: ${strengthText}`;
       passwordStrengthText.style.color = strengthColor;
   });

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorMessage = this.parentElement.querySelector(".error-message");
    
    if (!emailRegex.test(this.value) && this.value !== "") {
      this.classList.add("error");
      if (errorMessage) errorMessage.style.display = "block";
    } else {
      this.classList.remove("error");
      if (errorMessage) errorMessage.style.display = "none";
    }
  });

//verify pswrd length
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

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let isValid = true;

    if (firstNameInput.value.trim() === "") {
      firstNameInput.classList.add("error");
      firstNameInput.parentElement.querySelector(".error-message").style.display = "block";
      isValid = false;
    } else {
      firstNameInput.classList.remove("error");
      firstNameInput.parentElement.querySelector(".error-message").style.display = "none";
    }

    if (lastNameInput.value.trim() === "") {
      lastNameInput.classList.add("error");
      if (lastNameInput.parentElement.querySelector(".error-message")) {
        lastNameInput.parentElement.querySelector(".error-message").style.display = "block";
      }
      isValid = false;
    } else {
      lastNameInput.classList.remove("error");
      if (lastNameInput.parentElement.querySelector(".error-message")) {
        lastNameInput.parentElement.querySelector(".error-message").style.display = "none";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add("error");
      emailInput.parentElement.querySelector(".error-message").style.display = "block";
      isValid = false;
    } else {
      emailInput.classList.remove("error");
      emailInput.parentElement.querySelector(".error-message").style.display = "none";
    }

    if (passwordInput.value.length < 8) {
      passwordInput.classList.add("error");
      passwordInput.parentElement.querySelector(".error-message").style.display = "block";
      isValid = false;
    } else {
      passwordInput.classList.remove("error");
      passwordInput.parentElement.querySelector(".error-message").style.display = "none";
    }

    if (confirmPasswordInput.value !== passwordInput.value) {
      confirmPasswordInput.classList.add("error");
      confirmPasswordInput.parentElement.querySelector(".error-message").style.display = "block";
      isValid = false;
    } else {
      confirmPasswordInput.classList.remove("error");
      confirmPasswordInput.parentElement.querySelector(".error-message").style.display = "none";
    }

    if (!isValid) return;

    const button = this.querySelector('button[type="submit"]');
    button.classList.add("loading");
    button.disabled = true;

    setTimeout(() => {
      // Generate a verification code and show the verification modal
      sendVerificationCode();
    }, 500);
  });

  // Generate and "send" verification code
  function sendVerificationCode() {
    //for testing only
    verificationCode = "123456";

    console.log("Verification code:", verificationCode);

    verificationEmail.textContent = emailInput.value;

    //show the verification modal
    emailVerificationModal.classList.add("active");

    // Reset verification UI
    codeDigits.forEach((digit) => (digit.value = ""));
    codeDigits[0].focus();
    verificationError.style.display = "none";

    // Start the resend timer
    startResendTimer();

    // Remove loading state from signup button
    const button = signupForm.querySelector('button[type="submit"]');
    button.classList.remove("loading");
    button.disabled = false;
  }

  // Start the countdown timer for resend code option
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

  // Close verification modal button
  closeVerificationModal.addEventListener("click", function () {
    emailVerificationModal.classList.remove("active");
  });

  // Resend code button
  resendCodeBtn.addEventListener("click", function () {
    sendVerificationCode();
  });

  // Verify code button
  verifyCodeBtn.addEventListener("click", function () {
    verifyCode();
  });

  // Process verification code submission
  function verifyCode() {
    // Get the entered code
    let enteredCode = "";
    codeDigits.forEach((digit) => {
      enteredCode += digit.value;
    });

    // Check if code is complete
    if (enteredCode.length !== 6) {
      verificationError.textContent = "Please enter all 6 digits";
      verificationError.style.display = "block";
      return;
    }

    // Add loading state to verify button
    verifyCodeBtn.classList.add("loading");
    verifyCodeBtn.disabled = true;

    // Simulate verification process
    setTimeout(() => {
      if (enteredCode === verificationCode) {
        // Code is correct
        completeSignup();
      } else {
        // Code is incorrect
        verificationError.textContent =
          "Incorrect verification code. Please try again.";
        verificationError.style.display = "block";
        verifyCodeBtn.classList.remove("loading");
        verifyCodeBtn.disabled = false;
      }
    }, 1000);
  }

  // Complete signup after successful verification
  function completeSignup() {
    // Close verification modal
    emailVerificationModal.classList.remove("active");

    // Store user info in localStorage
    localStorage.setItem(
      "userName",
      `${firstNameInput.value} ${lastNameInput.value}`
    );
    localStorage.setItem("setupFaceScan", "true"); // Flag to indicate face scan setup is needed

    window.location.href = "face-setup.html?from=signup";
  }

  const profilePicture = document.getElementById("profilePicture");
  const previewImage = document.getElementById("previewImage");
  const profileIcon = document.querySelector(
    ".profile-picture-preview i"
  );

  profilePicture.addEventListener("change", function (e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        profileIcon.style.display = "none";
      };

      reader.readAsDataURL(this.files[0]);
    }
  });

  // Google Sign-Up functionality
  googleSignupButton.addEventListener('click', function() {
    // Initialize Google Sign-In
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
      callback: handleGoogleSignUp
    });

    google.accounts.id.prompt();
  });

  function handleGoogleSignUp(response) {
    // Handle the sign-up response from Google
    if (response.credential) {
      // User successfully authenticated with Google
      // We can skip email verification here since Google already verified the email

      try {
        // Parse the JWT token to get user info
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        
        // Store user info in localStorage
        localStorage.setItem('userName', payload.name || 'Google User');
        localStorage.setItem('userEmail', payload.email);
        localStorage.setItem('googleAuth', 'true');
        
        // Show success message if possible
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message show';
        successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Sign up successful! Redirecting...';
        document.querySelector('.signup-container').prepend(successMessage);
        
        // Redirect to dashboard after a delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } catch (error) {
        console.error('Error processing Google sign-up:', error);
        // Fallback to simple redirect
        window.location.href = 'dashboard.html';
      }
    }
  }
});