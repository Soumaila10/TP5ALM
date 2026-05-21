const eventBus = require('../utils/eventBus');
const Ticket = require('../models/Ticket');
const emailService = require('../services/emailService');
const { logger } = require('../utils/logger');

function initMatchListener() {
  eventBus.on('match:updated', async (match) => {
    try {
      logger.info({ matchId: match._id }, '[matchListener] Match updated, sending notifications...');
      const tickets = await Ticket.find({ matchId: match._id, status: 'valid' }).populate('userId');
      
      const emailedUsers = new Set();
      
      for (const ticket of tickets) {
        if (ticket.userId && ticket.userId.email && !emailedUsers.has(ticket.userId.email)) {
          emailedUsers.add(ticket.userId.email);
          emailService.sendMatchUpdateEmail(ticket.userId.email, match, ticket.userId.firstName)
            .catch((err) => logger.error({ err, email: ticket.userId.email }, '[matchListener] Error sending match update email'));
        }
      }
      
      logger.info({ count: emailedUsers.size }, '[matchListener] Notifications sent successfully');
    } catch (err) {
      logger.error({ err }, '[matchListener] Error processing match:updated event');
    }
  });
}

module.exports = { initMatchListener };
