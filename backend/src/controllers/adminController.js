const adminService = require('../services/adminService');

async function getMatches(req, res, next) {
  try {
    const matches = await adminService.getAllMatches();
    res.json(matches);
  } catch (err) {
    next(err);
  }
}

async function createMatch(req, res, next) {
  try {
    const match = await adminService.createMatch(req.body);
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
}

async function updateMatch(req, res, next) {
  try {
    const { id } = req.params;
    const match = await adminService.updateMatch(id, req.body);
    res.json(match);
  } catch (err) {
    next(err);
  }
}

async function deleteMatch(req, res, next) {
  try {
    const { id } = req.params;
    const match = await adminService.deleteMatch(id);
    res.json({ message: 'Match désactivé avec succès', match });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function exportSales(req, res, next) {
  try {
    const csvContent = await adminService.exportSalesCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getStats,
  exportSales,
};
