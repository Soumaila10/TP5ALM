const { getRedisClient } = require('../config/redis');
const AppError = require('../utils/AppError');

/**
 * Verrouille un siège dans Redis pour un utilisateur donné.
 * @param {string} seatId - L'ID du siège.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<boolean>}
 */
async function lockSeat(seatId, userId) {
  const redis = getRedisClient();
  const lockKey = `seat:${seatId}`;
  
  // Utilise le pattern NX EX 600 (10 minutes)
  const locked = await redis.set(lockKey, userId.toString(), 'NX', 'EX', 600);
  if (!locked) {
    throw new AppError(409, 'Ce siège est déjà réservé ou verrouillé par un autre utilisateur.', 'SEAT_ALREADY_LOCKED');
  }
  
  return true;
}

/**
 * Libère le verrou d'un siège dans Redis.
 * @param {string} seatId - L'ID du siège.
 * @returns {Promise<boolean>}
 */
async function unlockSeat(seatId) {
  const redis = getRedisClient();
  const lockKey = `seat:${seatId}`;
  await redis.del(lockKey);
  return true;
}

/**
 * Récupère l'utilisateur ayant verrouillé le siège.
 * @param {string} seatId - L'ID du siège.
 * @returns {Promise<string|null>}
 */
async function getSeatLockUser(seatId) {
  const redis = getRedisClient();
  const lockKey = `seat:${seatId}`;
  return redis.get(lockKey);
}

/**
 * Vérifie si un siège est actuellement verrouillé.
 * @param {string} seatId - L'ID du siège.
 * @returns {Promise<boolean>}
 */
async function isLocked(seatId) {
  const lockedBy = await getSeatLockUser(seatId);
  return !!lockedBy;
}

module.exports = {
  lockSeat,
  unlockSeat,
  getSeatLockUser,
  isLocked,
};
