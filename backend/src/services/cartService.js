const Cart = require('../models/Cart');
const Match = require('../models/Match');
const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');
const { lockSeat, unlockSeat } = require('./seatLockService');

/**
 * Crée un panier pour un utilisateur avec un match et un siège spécifique.
 * Verrouille également le siège dans Redis pour 10 minutes.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} matchId - L'ID du match.
 * @param {string} seatId - L'ID du siège.
 * @returns {Promise<object>}
 */
async function createCart(userId, matchId, seatId) {
  // 1. Récupération et vérification du match
  const match = await Match.findById(matchId).populate('stadiumId');
  if (!match) {
    throw new AppError(404, 'Match non trouvé', 'MATCH_NOT_FOUND');
  }
  if (!match.isActive) {
    throw new AppError(400, 'Ce match n\'est pas actif', 'MATCH_INACTIVE');
  }

  // 2. Récupération et vérification du siège
  const seat = await Seat.findById(seatId);
  if (!seat) {
    throw new AppError(404, 'Siège non trouvé', 'SEAT_NOT_FOUND');
  }
  if (seat.status === 'sold') {
    throw new AppError(409, 'Ce siège est déjà vendu', 'SEAT_ALREADY_SOLD');
  }
  if (seat.stadiumId.toString() !== match.stadiumId._id.toString()) {
    throw new AppError(400, 'Le siège ne correspond pas au stade de ce match', 'INVALID_SEAT_STADIUM');
  }

  // 3. Nettoyer les anciens paniers actifs de cet utilisateur pour éviter les verrous orphelins
  const activeCarts = await Cart.find({ userId, status: 'active' });
  for (const activeCart of activeCarts) {
    activeCart.status = 'expired';
    await activeCart.save();
    for (const item of activeCart.items) {
      await unlockSeat(item.seatId);
    }
  }

  // 4. Tenter d'acquérir le verrou Redis
  await lockSeat(seatId, userId);

  // 5. Créer le document Cart
  const expiresAt = new Date(Date.now() + 600000); // 10 minutes
  const cart = await Cart.create({
    userId,
    expiresAt,
    status: 'active',
    items: [{ matchId, seatId, price: seat.price }],
  });

  return cart;
}

/**
 * Récupère un panier par son ID et vérifie s'il appartient à l'utilisateur.
 * Gère également l'expiration et la libération des verrous si expiré.
 * @param {string} cartId - L'ID du panier.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>}
 */
async function getCart(cartId, userId) {
  const cart = await Cart.findById(cartId);
  if (!cart) {
    throw new AppError(404, 'Panier non trouvé', 'CART_NOT_FOUND');
  }

  if (cart.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'Accès refusé à ce panier', 'FORBIDDEN');
  }

  // Vérifier l'expiration temporelle
  if (cart.status === 'expired' || cart.expiresAt < new Date()) {
    if (cart.status === 'active') {
      cart.status = 'expired';
      await cart.save();
      for (const item of cart.items) {
        await unlockSeat(item.seatId);
      }
    }
    throw new AppError(410, 'Le panier a expiré', 'CART_EXPIRED');
  }

  return cart;
}

/**
 * Supprime/expire un panier et libère tous les verrous Redis associés.
 * @param {string} cartId - L'ID du panier.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<boolean>}
 */
async function deleteCart(cartId, userId) {
  const cart = await Cart.findById(cartId);
  if (!cart) {
    throw new AppError(404, 'Panier non trouvé', 'CART_NOT_FOUND');
  }

  if (cart.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'Accès refusé à ce panier', 'FORBIDDEN');
  }

  if (cart.status === 'active') {
    cart.status = 'expired';
    await cart.save();
    for (const item of cart.items) {
      await unlockSeat(item.seatId);
    }
  }

  return true;
}

module.exports = {
  createCart,
  getCart,
  deleteCart,
};
