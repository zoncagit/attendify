//BACKGROUND MOVEMENTS
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;

  document.querySelector('.background-animation').style.background = `
      radial-gradient(circle at ${x * 100}% ${y * 100}%, var(--primary) 0%, transparent 50%),
      radial-gradient(circle at ${(1 - x) * 100}% ${(1 - y) * 100}%, var(--secondary) 0%, transparent 50%)
  `;
});