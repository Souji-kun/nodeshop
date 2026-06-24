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

// Get cart
router.get('/cart', getCart);

// Add item to cart
router.post('/cart/add', addToCart);

// Update cart item quantity
router.put('/cart/item', updateCartItem);

// Remove item from cart
router.delete('/cart/item', removeFromCart);

// Clear entire cart
router.delete('/cart', clearCart);

// Merge session cart to customer cart (after login)
router.post('/cart/merge', mergeCart);

module.exports = router;
