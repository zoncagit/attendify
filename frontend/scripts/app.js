document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (!email || !password) {
      alert("Please fill in both email and password.");
      return;
    }
  
    // Simulate login
    alert("Logged in successfully!");
  });