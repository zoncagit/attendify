const { useCallback } = require("react");

document.addEventListener('DOMContentLoaded', function() {//waiting until the entire html document is loaded

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const successMessage = document.getElementById('successMessage');
    const googleLoginButton = document.querySelector('.btn-google-login');


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

 //google log in
 googleLoginButton.addEventListener('click', function(){
    //crucial for GIS library
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', //replace with google client id
        callback: handleGoogleSignIn //function that gets called after the user signed in
    })
    google.accounts.id.prompt();//show the gg interface
 });

 function handleGoogleSignIn(response) {
    if(response.credential){
        try{
            //parse the jwt token to get user info
            const payload= JSON.parse(atob(response.credential.split(".")[1]));//decode the JWT to access the user's info

            localStorage.setItem('userName', payload.name || 'Google User');
            localStorage.setItem('userEmail', payload.email);
            localStorage.setItem('googleAuth', 'true');
            successMessage.classList.add('show');

            setTimeout(() => {
                window.location.href = 'dashboard.html';   
            }, 1500);
        } catch(error) {
            console.error('Error processing Google sign-in: ', error);
            successMessage.classList.add('show');
        }
    }
 }
});