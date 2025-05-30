const express = require('express');
const router = express.Router();
const auth = require('../login/authMiddleware');
const controller = require('./storyController');

// Todas as rotas de stories são protegidas
router.use(auth);

// POST /api/stories
router.post('/', controller.postStory);

// GET /api/stories[?userId=...] 
router.get('/', controller.listStories);

module.exports = router;
