const express = require('express');
const stadiumController = require('../controllers/stadiumController');

const router = express.Router();

router.get('/', stadiumController.getStadiums);

module.exports = router;
