const orderService = require('../services/orderService');

/**
 * Contrôleur pour récupérer l'historique des commandes de l'utilisateur.
 */
async function getOrders(req, res, next) {
  try {
    const userId = req.user.userId;
    const orders = await orderService.getOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
}

/**
 * Contrôleur pour récupérer le détail d'une commande (avec ses tickets).
 */
async function getOrderById(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const orderId = req.params.id;
    
    const result = await orderService.getOrderById(orderId, userId, role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrders,
  getOrderById,
};
