const Match = require('../models/Match');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');
const eventBus = require('../utils/eventBus');

async function getAllMatches() {
  return Match.find().populate('stadiumId').sort({ date: 1 });
}

async function createMatch(matchData) {
  const match = new Match({
    ...matchData,
    availableSeats: matchData.totalSeats || 50,
  });
  return match.save();
}

async function updateMatch(id, matchData) {
  const match = await Match.findById(id);
  if (!match) {
    throw new AppError(404, 'Match non trouvé', 'MATCH_NOT_FOUND');
  }

  // Detect if key details changed to trigger notification
  const keyDetailsChanged =
    match.teamA !== matchData.teamA ||
    match.teamB !== matchData.teamB ||
    new Date(match.date).getTime() !== new Date(matchData.date).getTime();

  Object.assign(match, matchData);
  const updatedMatch = await match.save();

  if (keyDetailsChanged) {
    eventBus.emit('match:updated', updatedMatch);
  }

  return updatedMatch;
}

async function deleteMatch(id) {
  const match = await Match.findById(id);
  if (!match) {
    throw new AppError(404, 'Match non trouvé', 'MATCH_NOT_FOUND');
  }
  match.isActive = false;
  return match.save();
}

async function getStats() {
  const orders = await Order.find({ status: 'confirmed' });
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const ticketsCount = await Ticket.countDocuments({ status: 'valid' });

  // Group tickets by match
  const matchStats = await Ticket.aggregate([
    { $match: { status: 'valid' } },
    {
      $group: {
        _id: '$matchId',
        ticketsSold: { $sum: 1 },
      },
    },
  ]);

  const statsPerMatch = [];
  for (const stat of matchStats) {
    const match = await Match.findById(stat._id).populate('stadiumId');
    if (match) {
      const tickets = await Ticket.find({ matchId: stat._id, status: 'valid' }).populate('seatId');
      const revenue = tickets.reduce((sum, t) => sum + (t.seatId?.price || 0), 0);

      statsPerMatch.push({
        matchId: match._id,
        teamA: match.teamA,
        teamB: match.teamB,
        date: match.date,
        stadiumName: match.stadiumId?.name || 'N/A',
        ticketsSold: stat.ticketsSold,
        revenue,
      });
    }
  }

  return {
    totalRevenue,
    ticketsSold: ticketsCount,
    statsPerMatch,
  };
}

async function exportSalesCSV() {
  const tickets = await Ticket.find({ status: 'valid' })
    .populate('userId')
    .populate({
      path: 'matchId',
      populate: { path: 'stadiumId' },
    })
    .populate('seatId')
    .populate('orderId');

  const headers = [
    'Ticket ID',
    'Order ID',
    'User Email',
    'User Name',
    'Match',
    'Stadium',
    'Seat Section',
    'Seat Row',
    'Seat Number',
    'Price',
    'Purchase Date',
  ];

  const rows = tickets.map((t) => {
    const userEmail = t.userId?.email || 'N/A';
    const userName = t.userId ? `${t.userId.firstName} ${t.userId.lastName}` : 'N/A';
    const matchName = t.matchId ? `${t.matchId.teamA} vs ${t.matchId.teamB}` : 'N/A';
    const stadiumName = t.matchId?.stadiumId?.name || 'N/A';
    const section = t.seatId?.section || 'N/A';
    const row = t.seatId?.row || 'N/A';
    const seatNumber = t.seatId?.number || 'N/A';
    const price = t.seatId?.price || 0;
    const purchaseDate = t.createdAt ? new Date(t.createdAt).toISOString() : 'N/A';

    return [
      t._id,
      t.orderId?._id || 'N/A',
      userEmail,
      userName,
      matchName,
      stadiumName,
      section,
      row,
      seatNumber,
      price,
      purchaseDate,
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

module.exports = {
  getAllMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getStats,
  exportSalesCSV,
};
