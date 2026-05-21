const matchService = require('../services/matchService');

async function getMatches(req, res, next) {
  try {
    const { teamA, teamB, stadiumId, date } = req.query;
    const matches = await matchService.getMatches({ teamA, teamB, stadiumId, date });
    res.json(matches);
  } catch (err) {
    next(err);
  }
}

async function getMatchById(req, res, next) {
  try {
    const { id } = req.params;
    const match = await matchService.getMatchById(id);
    res.json(match);
  } catch (err) {
    next(err);
  }
}

async function getMatchSeats(req, res, next) {
  try {
    const { id } = req.params;
    const seats = await matchService.getMatchSeats(id);
    res.json(seats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMatches,
  getMatchById,
  getMatchSeats,
};
