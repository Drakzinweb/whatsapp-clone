const express = require('express');
const router = express.Router();
const auth = require('../login/authMiddleware');
const controller = require('./messageController');

// Todas as rotas de mensagens são protegidas
router.use(auth);

// Enviar mensagem
// POST /api/messages
router.post('/', controller.sendMessage);

// Buscar conversa com um usuário específico
// GET /api/messages/:userId
router.get('/:userId', controller.getConversation);

// Listar todas as mensagens do usuário (com paginação)
// GET /api/messages?page=1&limit=20
router.get('/', controller.listMessages);

module.exports = router;
