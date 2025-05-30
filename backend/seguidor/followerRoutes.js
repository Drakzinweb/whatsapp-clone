const express = require('express');
const router = express.Router();
const auth = require('../login/authMiddleware');   // << caminho corrigido
const controller = require('./followerController');

// Todas as rotas de seguidores são protegidas
router.use(auth);

router.post('/follow', controller.followUser);
router.post('/unfollow', controller.unfollowUser);
router.get('/following', controller.listFollowing);
router.get('/followers', controller.listFollowers);

module.exports = router;
