const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('./followerController');

// Todas as rotas são protegidas por autenticação
router.use(auth);

router.post('/follow', controller.followUser);
router.post('/unfollow', controller.unfollowUser);
router.get('/following', controller.listFollowing);
router.get('/followers', controller.listFollowers);

module.exports = router;
