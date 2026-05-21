const User = require('../models/User');
const AppError = require('../utils/AppError');

async function updateProfile(userId, { firstName, lastName, phone }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;

  return user.save();
}

async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
  }
  return user;
}

module.exports = {
  updateProfile,
  getUserById,
};
