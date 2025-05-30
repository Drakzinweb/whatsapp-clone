import { create, findOneAndDelete, find } from './follow';
import User from '../usuarios/User';
import { asyncHandler, sendSuccess, sendError, AppError } from '../utils/helpers';

export const followUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const { userIdToFollow } = req.body;

  if (followerId === userIdToFollow) throw new AppError('Você não pode seguir a si mesmo', 400);

  await create({ follower: followerId, following: userIdToFollow });
  sendSuccess(res, null, 'Usuário seguido com sucesso');
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const { userIdToUnfollow } = req.body;

  await findOneAndDelete({ follower: followerId, following: userIdToUnfollow });
  sendSuccess(res, null, 'Deixou de seguir o usuário');
});

export const listFollowing = asyncHandler(async (req, res) => {
  const follows = await find({ follower: req.userId }).populate('following', 'name email');
  const followingUsers = follows.map(f => f.following);
  sendSuccess(res, followingUsers, 'Usuários que você segue');
});

export const listFollowers = asyncHandler(async (req, res) => {
  const followers = await find({ following: req.userId }).populate('follower', 'name email');
  const followerUsers = followers.map(f => f.follower);
  sendSuccess(res, followerUsers, 'Seus seguidores');
});
