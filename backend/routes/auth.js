// routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  // ... seu código de registro ...
});

// Login
router.post('/login', async (req, res) => {
  // ... seu código de login ...
});

module.exports = router;
