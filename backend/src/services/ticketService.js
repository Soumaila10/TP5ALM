const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const Match = require('../models/Match');
const Seat = require('../models/Seat');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateQR } = require('../utils/qrGenerator');
const { generatePDF } = require('../utils/pdfGenerator');
const { uploadToBlobStorage } = require('../utils/blobStorage');
const { sendOrderConfirmationEmail } = require('./emailService');
const { unlockSeat } = require('./seatLockService');

/**
 * Génère les tickets pour une commande validée à partir des éléments du panier.
 * Suit l'ordre strict des 7 étapes décrites dans CLAUDE.md §3.5.
 * @param {object} order - Le document Order Mongoose créé.
 * @param {object} cart - Le document Cart Mongoose actif.
 * @returns {Promise<Array>} - La liste des tickets créés.
 */
async function createTicketsForOrder(order, cart) {
  const tickets = [];

  for (const item of cart.items) {
    // 1. Récupération des détails pour la génération du PDF
    const match = await Match.findById(item.matchId).populate('stadiumId');
    const seat = await Seat.findById(item.seatId);
    
    if (!match || !seat) {
      throw new AppError(404, 'Match ou siège introuvable pour la création du billet', 'TICKET_CREATION_FAILED');
    }

    // 2. Génération du UUID unique comme clé du QR Code
    const qrKey = uuidv4();

    // 3. Insertion du ticket en base de données
    const ticket = await Ticket.create({
      orderId: order._id,
      matchId: item.matchId,
      seatId: item.seatId,
      userId: order.userId,
      qrCode: qrKey,
      status: 'valid',
    });

    // 4. Génération du QR Code image (base64)
    const qrCodeDataUrl = await generateQR(ticket.qrCode);

    // 5. Génération du PDF de billet (buffer)
    const pdfBuffer = await generatePDF(ticket, match, seat, qrCodeDataUrl);

    // 6. Téléversement vers le stockage de fichiers
    const fileName = `ticket-${ticket._id}.pdf`;
    const pdfUrl = await uploadToBlobStorage(pdfBuffer, fileName);

    // Mise à jour de l'URL PDF du ticket
    ticket.pdfUrl = pdfUrl;
    await ticket.save();

    // 7. Mise à jour du statut du siège à 'sold' en base de données
    seat.status = 'sold';
    await seat.save();

    // 8. Libération du verrou Redis
    await unlockSeat(item.seatId);

    tickets.push(ticket);
  }

  // Envoi de l'email de confirmation après traitement de tous les billets
  const user = await User.findById(order.userId);
  if (user && tickets.length > 0) {
    // On envoie le PDF du premier billet de la commande
    await sendOrderConfirmationEmail(user.email, order._id.toString(), tickets[0].pdfUrl);
  }

  return tickets;
}

/**
 * Récupère un ticket par son ID et vérifie les droits d'accès.
 * @param {string} ticketId - L'ID du ticket.
 * @param {string} userId - L'ID de l'utilisateur demandeur.
 * @param {string} role - Le rôle de l'utilisateur demandeur ('user' ou 'admin').
 * @returns {Promise<object>}
 */
async function getTicketById(ticketId, userId, role) {
  const ticket = await Ticket.findById(ticketId).populate('matchId seatId');
  if (!ticket) {
    throw new AppError(404, 'Ticket non trouvé', 'TICKET_NOT_FOUND');
  }

  if (role !== 'admin' && ticket.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'Accès refusé à ce ticket', 'FORBIDDEN');
  }

  return ticket;
}

module.exports = {
  createTicketsForOrder,
  getTicketById,
};
