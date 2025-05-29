const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
}); 