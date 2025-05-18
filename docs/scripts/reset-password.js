passwordInput.addEventListener("input", function () {
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

  // Validation part (combine here)
  const errorMessage = this.parentElement.querySelector(".error-message");
  if (password.length > 0 && password.length < 8) {
    this.classList.add("error");
    if (errorMessage) errorMessage.style.display = "block";
  } else {
    this.classList.remove("error");
    if (errorMessage) errorMessage.style.display = "none";
  }
});
