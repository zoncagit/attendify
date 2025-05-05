document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");
  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const successMessage = document.getElementById("successMessage");
  const progressFill = document.getElementById("progressFill");
  const passwordStrengthBar = document.getElementById(
    "passwordStrengthBar"
  );
  const passwordStrengthText = document.getElementById(
    "passwordStrengthText"
  );

  // Modal elements
  const emailVerificationModal = document.getElementById('emailVerificationModal');
  const verificationEmail = document.getElementById('verificationEmail');
  const closeVerificationModal = document.getElementById('closeVerificationModal');
  const codeDigits = document.querySelectorAll(".code-digit");
  const verificationError = document.getElementById('verificationError');
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  const resendTimer = document.getElementById('resendTimer');
  const resendCountdown = document.getElementById('resendCountdown');
  const verifyCodeBtn = document.getElementById('verifyCodeBtn');

  const formInputs = [
    firstNameInput,
    lastNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
  ];
  let filledInputs = 0;
  let verificationCode = ""; 

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
  });

  passwordInput.addEventListener("input", function () {
    const password = this.value;
    let strength = 0;
    let strengthText = "Weak";
    let strengthColor = "#ef4444"; //red

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
    if (this.value !== passwordInput.value && this.value !== "") {
      this.classList.add("error");
    } else {
      this.classList.remove("error");
    }
  });

  emailInput.addEventListener("input", function () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value) && this.value !== "") {
      this.classList.add("error");
    } else {
      this.classList.remove("error");
    }
  });

   //set up code digit input fields for automatic focus
    codeDigits.forEach((digit, index) => {
      digit.addEventListener("input", function () { 
        //allow only numbers
        this.value = this.value.replace(/[^0-9]/g, "");

        if (this.value.length === 1) {
          if (index < codeDigits.length - 1) {
            codeDigits[index + 1].focus();
          } else if (index === codeDigits.length - 1) {
            //confirm the code automatically if it's the last digit
            
            verifyCodeBtn.focus();
          }
        }
      });

      digit.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && this.value === "" && index > 0) {
          codeDigits[index - 1].focus();
        }
      });
    });

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let isValid = true;

    if (firstNameInput.value.trim() === "") {
      firstNameInput.classList.add("error");
      isValid = false;
    } else {
      firstNameInput.classList.remove("error");
    }

    if (lastNameInput.value.trim() === "") {
      lastNameInput.classList.add("error");
      isValid = false;
    } else {
      lastNameInput.classList.remove("error");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add("error");
      isValid = false;
    } else {
      emailInput.classList.remove("error");
    }

    if (passwordInput.value.length < 8) {
      passwordInput.classList.add("error");
      isValid = false;
    } else {
      passwordInput.classList.remove("error");
    }

    if (confirmPasswordInput.value !== passwordInput.value) {
      confirmPasswordInput.classList.add("error");
      isValid = false;
    } else {
      confirmPasswordInput.classList.remove("error");
    }

    if (!isValid) return;


    const button = this.querySelector('button[type="submit"]');
    button.classList.add("loading");
    button.disabled = true;

    setTimeout(() => {
      sendVerificationCode();
  },500);
}); 

  const profilePicture = document.getElementById("profilePicture");
  const previewImage = document.getElementById("previewImage");
  const profileIcon = document.querySelector(
    ".profile-picture-preview i"
  );

  profilePicture.addEventListener("change", function (e) {
    if (this.files && this.files[0]) {
      //makes sure that the user selected a file
      const reader = new FileReader();

      reader.onload = function (e) {
        previewImage.src = e.target.result; //takes the Data URL string and sets it as the src attribure of previewImage
        previewImage.style.display = "block";
        profileIcon.style.display = "none";
      };

      reader.readAsDataURL(this.files[0]); //convert the image file contents into a Data URL format
    }
  });

//generate and send verification code
function sendVerificationCode(){
 verificationCode="123456";//for testing only
 const signupButton = signupForm.querySelector('button[type="submit"]'); 
 verificationEmail.textContent=emailInput.value;
 emailVerificationModal.classList.add("active");
 codeDigits.forEach((digit) => (digit.value =""));
 codeDigits[0].focus();
 verificationError.style.display="none";
 startResendTimer();
 //remove loading state from signup button
 signupButton.classList.remove("loading");
 signupButton.disabled=false;
}

let timer; // Declare timer globally

function startResendTimer() {
  clearInterval(timer); // Clear any existing timer

  let timeLeft = 60;
  resendCountdown.textContent = timeLeft;
  resendCodeBtn.disabled = true;
  resendTimer.style.display = "block";

  timer = setInterval(() => {
    timeLeft--;
    resendCountdown.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      resendCodeBtn.disabled = false;
      resendTimer.style.display = "none";
    }
  }, 1000);
}

//close verification modal 
closeVerificationModal.addEventListener("click", function(){
  emailVerificationModal.classList.remove("active");
});

resendCodeBtn.addEventListener("click", function(){
  sendVerificationCode();
});

verifyCodeBtn.addEventListener("click", function(){ // Corrected typo
  verifyCode();
});

function verifyCode(){
  let enteredCode ="";
  codeDigits.forEach((digit) =>{
    enteredCode+= digit.value;
  });

  if(enteredCode.length !== 6){
    verificationError.textContent="Please enter all 6 digits";
    verificationError.style.display="block";
    return;
  }

  verifyCodeBtn.classList.add("loading");
  verifyCodeBtn.disabled=true;

  setTimeout(() => {
    if(enteredCode === verificationCode){
      completeSignup();
    }
    else{
      verificationError.textContent="Incorrect verification code. Please try again.";
      verificationError.style.display="block";
      verifyCodeBtn.classList.remove("loading");
      verifyCodeBtn.disabled=false;
    }
  }, 1000);
}
function completeSignup(){
  emailVerificationModal.classList.remove("active");

  localStorage.setItem(
    "userName",
    `${firstNameInput.value} ${lastNameInput.value}`
  );
  localStorage.setItem("setupFaceScan", "true");
  window.location.href="face-setup.html?from=signup"
}

});