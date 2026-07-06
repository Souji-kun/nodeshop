const db = require('../models');
const Cart = db.Cart;
const CartItem = db.CartItem;
const Item = db.Item;
const Stock = db.Stock;
const Customer = db.Customer;
const sequelize = db.sequelize;

// Helper function to get or create cart for customer/session
const getOrCreateCart = async (customerId = null, sessionId = null) => {
    let cart;
    
    if (customerId) {
        cart = await Cart.findOne({ where: { customer_id: customerId } });
        if (!cart) {
            cart = await Cart.create({ customer_id: customerId });
        }
    } else if (sessionId) {
        cart = await Cart.findOne({ where: { session_id: sessionId } });
        if (!cart) {
            cart = await Cart.create({ session_id: sessionId });
        }
    }
    
    return cart;
};

const buildCartResponse = (cart, cartItems) => {
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (Number(item.Item.sell_price) * Number(item.quantity));
    }, 0);

    const shipping = cartItems.length > 0 ? 100 : 0;
    const total = subtotal + shipping;

    return {
        cart_id: cart.cart_id,
        items: cartItems,
        itemCount: cartItems.length,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2)
    };
};

const loadCustomerCart = async (customerId, sessionId = null) => {
    const cart = await getOrCreateCart(customerId, sessionId);

    const cartItems = await CartItem.findAll({
        where: { cart_id: cart.cart_id },
        include: [
            {
                model: Item,
                attributes: ['item_id', 'name', 'description', 'sell_price', 'img_path'],
                include: [{ model: Stock, attributes: ['quantity'] }]
            }
        ],
        order: [['cartitem_id', 'ASC']]
    });

    return { cart, cartItems };
};

// Get cart with items
exports.getCart = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        const sessionId = req.sessionID;

        const { cart, cartItems } = await loadCustomerCart(customerId, sessionId);
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        return res.status(200).json({
            success: true,
            cart: buildCartResponse(cart, cartItems)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching cart', details: error.message });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const customerId = req.user?.customer_id;
        
        if (!itemId || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'Invalid item_id or quantity' });
        }
        
        // Check if item exists and has stock
        const item = await Item.findByPk(itemId, { include: [Stock] });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const availableQty = item.Stock?.quantity || 0;
        if (quantity > availableQty) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                available: availableQty
            });
        }
        
        const cart = await getOrCreateCart(customerId, null);
        
        // Check if item already in cart
        let cartItem = await CartItem.findOne({
            where: { cart_id: cart.cart_id, item_id: itemId }
        });
        
        if (cartItem) {
            // Update quantity
            const newQty = cartItem.quantity + Number(quantity);
            if (newQty > availableQty) {
                return res.status(400).json({
                    error: 'Quantity exceeds available stock',
                    available: availableQty,
                    currentInCart: cartItem.quantity
                });
            }
            cartItem.quantity = newQty;
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart_id: cart.cart_id,
                item_id: itemId,
                quantity: Number(quantity)
            });
        }
        
        // Update cart timestamp
        await cart.update({ updated_at: new Date() });
        
        return res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cartItem: cartItem,
            cart: (await loadCustomerCart(customerId)).cartItems
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error adding to cart', details: error.message });
    }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;
        const customerId = req.user?.customer_id;
        
        if (!cartItemId || quantity < 1) {
            return res.status(400).json({ error: 'Invalid cartitem_id or quantity' });
        }
        
        // Get cart
        const cart = await getOrCreateCart(customerId, null);
        
        // Find and update cart item
        const cartItem = await CartItem.findOne({
            where: { cartitem_id: cartItemId, cart_id: cart.cart_id }
        });
        
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        // Check stock
        const item = await Item.findByPk(cartItem.item_id, { include: [Stock] });
        const availableQty = item.Stock?.quantity || 0;
        
        if (quantity > availableQty) {
            return res.status(400).json({
                error: 'Quantity exceeds available stock',
                available: availableQty
            });
        }
        
        if (quantity === 0) {
            await cartItem.destroy();
        } else {
            cartItem.quantity = quantity;
            await cartItem.save();
        }
        
        // Update cart timestamp
        await cart.update({ updated_at: new Date() });
        
        return res.status(200).json({
            success: true,
            message: 'Cart item updated',
            cart: (await loadCustomerCart(customerId)).cartItems
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating cart', details: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.body;
        const customerId = req.user?.customer_id;
        
        if (!cartItemId) {
            return res.status(400).json({ error: 'cartitem_id is required' });
        }
        
        // Get cart
        const cart = await getOrCreateCart(customerId, null);
        
        // Find and delete cart item
        const cartItem = await CartItem.findOne({
            where: { cartitem_id: cartItemId, cart_id: cart.cart_id }
        });
        
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        
        await cartItem.destroy();
        
        // Update cart timestamp
        await cart.update({ updated_at: new Date() });
        
        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            cart: (await loadCustomerCart(customerId)).cartItems
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error removing from cart', details: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        
        // Get cart
        const cart = await getOrCreateCart(customerId, null);
        
        // Delete all cart items
        await CartItem.destroy({ where: { cart_id: cart.cart_id } });
        
        // Update cart timestamp
        await cart.update({ updated_at: new Date() });
        
        return res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart: []
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error clearing cart', details: error.message });
    }
};

// Merge session cart to customer cart (used after login)
exports.mergeCart = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        const sessionId = req.sessionID;
        
        if (!customerId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Get both carts
        const sessionCart = await Cart.findOne({ where: { session_id: sessionId } });
        const customerCart = await getOrCreateCart(customerId, null);
        
        if (sessionCart && sessionCart.cart_id !== customerCart.cart_id) {
            // Move session cart items to customer cart
            const sessionItems = await CartItem.findAll({
                where: { cart_id: sessionCart.cart_id }
            });
            
            for (let item of sessionItems) {
                const existing = await CartItem.findOne({
                    where: { cart_id: customerCart.cart_id, item_id: item.item_id }
                });
                
                if (existing) {
                    existing.quantity += item.quantity;
                    await existing.save();
                } else {
                    await CartItem.create({
                        cart_id: customerCart.cart_id,
                        item_id: item.item_id,
                        quantity: item.quantity
                    });
                }
            }
            
            // Delete session cart
            await sessionCart.destroy();
        }
        
        // Update customer cart timestamp
        await customerCart.update({ updated_at: new Date() });

        const { cartItems } = await loadCustomerCart(customerId);
        
        return res.status(200).json({
            success: true,
            message: 'Cart merged successfully',
            cart: buildCartResponse(customerCart, cartItems)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error merging cart', details: error.message });
    }
};
