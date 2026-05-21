const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { loadEnv } = require('../config/env');

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Jeton d\'accès manquant ou invalide', 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded; // Contains { userId, role, email }
    next();
  } catch (err) {
    next(new AppError(401, 'Jeton d\'accès expiré ou invalide', 'INVALID_ACCESS_TOKEN'));
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, 'Non authentifié', 'UNAUTHORIZED'));
  }
  if (req.user.role !== 'admin') {
    return next(new AppError(403, 'Accès interdit — Rôle administrateur requis', 'FORBIDDEN'));
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware,
};
