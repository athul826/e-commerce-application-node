// 3. server.js - Main application file
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { pool, initDatabase } = require('./database');

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize database
initDatabase();

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into database
    const [result] = await pool.promise().query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Get user from database
    const [rows] = await pool.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const match = await bcrypt.compare(password, rows[0].password);
    
    if (match) {
      req.session.userId = rows[0].id;
      req.session.username = username;
      res.json({ 
          success: true, 
          message: 'Login successful',
          username: username,
          redirectUrl: '/homepage.html'
      });
  } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
} catch (error) {
  res.status(500).json({ success: false, message: 'Login failed' });
}
});

// Logout endpoint
app.post('/logout', (req, res) => {
req.session.destroy();
res.json({ success: true, message: 'Logged out successfully' });
});

app.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
});
