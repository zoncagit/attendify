document.addEventListener('DOMContentLoaded', function() {
  const resetForm = document.getElementById('resetForm');
  const emailInput = document.getElementById('email');
  const successMessage = document.getElementById('successMessage');

  resetForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      emailInput.classList.add('error');
      return;
    } else {
      emailInput.classList.remove('error');
    }
    
    const button = this.querySelector('button[type="submit"]');
    button.classList.add('loading');
    button.disabled = true;

    setTimeout(() => {
      successMessage.classList.add('show');
      setTimeout(() => {
        //in a real app redirect or clear the form here
        successMessage.classList.remove('show');
        button.classList.remove('loading');
        button.disabled = false;
      }, 3000); //message visible for 3 seconds
    }, 1500);
  });
});