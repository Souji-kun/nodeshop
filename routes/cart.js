const express = require('express');
const router = express.Router();

const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    mergeCart 
} = require('../controllers/cart');
const { isAuthenticatedUser, attachCustomer } = require('../middlewares/auth')

// Get cart
router.get('/cart', isAuthenticatedUser, attachCustomer, getCart);

// Add item to cart
router.post('/cart/add', isAuthenticatedUser, attachCustomer, addToCart);

// Update cart item quantity
router.put('/cart/item', isAuthenticatedUser, attachCustomer, updateCartItem);

// Remove item from cart
router.delete('/cart/item', isAuthenticatedUser, attachCustomer, removeFromCart);

// Clear entire cart
router.delete('/cart', isAuthenticatedUser, attachCustomer, clearCart);

// Merge session cart to customer cart (after login)
router.post('/cart/merge', isAuthenticatedUser, attachCustomer, mergeCart);

module.exports = router;
