const express = require('express');
const router = express.Router();
const auth = require('../login/authMiddleware');
const controller = require('./callController');

// Todas as rotas de chamadas são protegidas
router.use(auth);

// Iniciar uma chamada
// POST /api/calls/initiate
router.post('/initiate', controller.initiateCall);

// Encerrar uma chamada
// POST /api/calls/end
router.post('/end', controller.endCall);

// Histórico de chamadas
// GET /api/calls/history
router.get('/history', controller.getCallHistory);

module.exports = router;
