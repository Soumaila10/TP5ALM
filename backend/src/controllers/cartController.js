const cartService = require('../services/cartService');

/**
 * Contrôleur pour la création d'un panier.
 */
async function createCart(req, res, next) {
  try {
    const userId = req.user.userId;
    const { matchId, seatId } = req.body;
    
    const cart = await cartService.createCart(userId, matchId, seatId);
    
    res.status(201).json({
      cartId: cart._id,
      expiresAt: cart.expiresAt,
      items: cart.items,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Contrôleur pour la récupération d'un panier.
 */
async function getCart(req, res, next) {
  try {
    const userId = req.user.userId;
    const cartId = req.params.id;
    
    const cart = await cartService.getCart(cartId, userId);
    
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
}

/**
 * Contrôleur pour la suppression/expiration d'un panier.
 */
async function deleteCart(req, res, next) {
  try {
    const userId = req.user.userId;
    const cartId = req.params.id;
    
    await cartService.deleteCart(cartId, userId);
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCart,
  getCart,
  deleteCart,
};
