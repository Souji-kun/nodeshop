const express = require('express');

const router = express.Router();

const { createOrder, getAllOrders, getOrders, updateOrderStatus } = require('../controllers/order')
const { isAuthenticatedUser, authorizeRoles, attachCustomer } = require('../middlewares/auth')

router.get('/my-orders', isAuthenticatedUser, attachCustomer, getOrders)

router.post('/create-order', isAuthenticatedUser, createOrder)
router.get('/orders', isAuthenticatedUser, authorizeRoles('admin'), getAllOrders)
router.patch('/orders/:id/status', isAuthenticatedUser, authorizeRoles('admin'), updateOrderStatus)

module.exports = router;