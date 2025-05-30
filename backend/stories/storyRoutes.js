const express = require('express');
const router = express.Router();
const auth = require('../login/authMiddleware');
const controller = require('./storyController');

// Todas as rotas são protegidas
router.use(auth);

// Criar story
router.post('/', controller.createStory);

// Listar stories ativos
router.get('/', controller.getActiveStories);

module.exports = router;
