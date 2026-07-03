const express = require('express');

const router = express.Router();


const { addressChart, salesChart, itemsChart } = require('../controllers/dashboard')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')
router.get('/address-chart', isAuthenticatedUser, authorizeRoles('admin'), addressChart)
router.get('/sales-chart', isAuthenticatedUser, authorizeRoles('admin'), salesChart)
router.get('/items-chart', isAuthenticatedUser, authorizeRoles('admin'), itemsChart)

module.exports = router;




