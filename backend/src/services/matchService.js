const Match = require('../models/Match');
const Seat = require('../models/Seat');
const AppError = require('../utils/AppError');
const { getRedisClient } = require('../config/redis');
const eventBus = require('../utils/eventBus');

const cache = new Map();
const CACHE_TTL_MS = 60000; // 60s

// Clear match cache on updates
eventBus.on('match:updated', () => {
  cache.clear();
});

async function getMatches(filters = {}) {
  const cacheKey = JSON.stringify(filters);
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.data;
  }

  const query = { isActive: true };

  if (filters.teamA) {
    query.teamA = { $regex: filters.teamA, $options: 'i' };
  }
  if (filters.teamB) {
    query.teamB = { $regex: filters.teamB, $options: 'i' };
  }
  if (filters.stadiumId) {
    query.stadiumId = filters.stadiumId;
  }
  if (filters.date) {
    const startDate = new Date(filters.date);
    const endDate = new Date(filters.date);
    endDate.setDate(endDate.getDate() + 1);
    query.date = { $gte: startDate, $lt: endDate };
  }

  const matches = await Match.find(query).populate('stadiumId').sort({ date: 1 });
  cache.set(cacheKey, { data: matches, timestamp: now });
  return matches;
}

async function getMatchById(id) {
  const match = await Match.findById(id).populate('stadiumId');
  if (!match) {
    throw new AppError(404, 'Match non trouvé', 'MATCH_NOT_FOUND');
  }
  return match;
}

async function getMatchSeats(matchId) {
  const match = await getMatchById(matchId);
  const seats = await Seat.find({ stadiumId: match.stadiumId }).sort({ section: 1, row: 1, number: 1 });

  let redis = null;
  try {
    redis = getRedisClient();
  } catch (err) {
    // If Redis is disabled, we fallback to database seat status only
  }

  const mappedSeats = [];
  for (const seat of seats) {
    let status = seat.status; // default from database ('available' or 'sold')
    
    if (status !== 'sold' && redis) {
      // Check if locked in Redis
      const lockKey = `seat:${seat._id}`;
      const lockedBy = await redis.get(lockKey);
      if (lockedBy) {
        status = 'locked';
      }
    }

    mappedSeats.push({
      _id: seat._id,
      stadiumId: seat.stadiumId,
      section: seat.section,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      price: seat.price,
      status,
    });
  }

  return mappedSeats;
}

module.exports = {
  getMatches,
  getMatchById,
  getMatchSeats,
};
