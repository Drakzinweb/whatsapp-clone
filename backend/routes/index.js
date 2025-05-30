// backend/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const followerRoutes = require('../seguidor/followerRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/followers', followerRoutes);

module.exports = router;
