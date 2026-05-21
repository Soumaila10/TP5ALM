const express = require('express');
const authRoutes = require('./authRoutes');
const matchRoutes = require('./matchRoutes');
const cartRoutes = require('./cartRoutes');
const paymentRoutes = require('./paymentRoutes');
const orderRoutes = require('./orderRoutes');
const ticketRoutes = require('./ticketRoutes');
const adminRoutes = require('./adminRoutes');
const userRoutes = require('./userRoutes');
const stadiumRoutes = require('./stadiumRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/cart', cartRoutes);
router.use('/payment', paymentRoutes);
router.use('/orders', orderRoutes);
router.use('/tickets', ticketRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/stadiums', stadiumRoutes);

module.exports = router;
