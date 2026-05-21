const Stadium = require('../models/Stadium');

async function getStadiums(req, res, next) {
  try {
    const stadiums = await Stadium.find().sort({ name: 1 });
    res.json(stadiums);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStadiums,
};
