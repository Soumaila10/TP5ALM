const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const AppError = require('../utils/AppError');

/**
 * Récupère toutes les commandes d'un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<Array>}
 */
async function getOrders(userId) {
  return Order.find({ userId }).sort({ createdAt: -1 });
}

/**
 * Récupère une commande par son ID, vérifie les droits d'accès et renvoie les détails
 * ainsi que les tickets associés peuplés.
 * @param {string} orderId - L'ID de la commande.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} role - Le rôle de l'utilisateur ('user' ou 'admin').
 * @returns {Promise<object>}
 */
async function getOrderById(orderId, userId, role) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(404, 'Commande non trouvée', 'ORDER_NOT_FOUND');
  }

  if (role !== 'admin' && order.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'Accès refusé à cette commande', 'FORBIDDEN');
  }

  // Récupère tous les billets associés
  const tickets = await Ticket.find({ orderId }).populate({
    path: 'matchId',
    populate: { path: 'stadiumId' },
  }).populate('seatId');

  return {
    order,
    tickets,
  };
}

module.exports = {
  getOrders,
  getOrderById,
};
