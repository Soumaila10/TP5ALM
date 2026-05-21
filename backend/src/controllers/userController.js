const userService = require('../services/userService');

async function updateProfile(req, res, next) {
  try {
    const { userId } = req.user;
    const user = await userService.updateProfile(userId, req.body);
    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const { userId } = req.user;
    const user = await userService.getUserById(userId);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateProfile,
  getProfile,
};
