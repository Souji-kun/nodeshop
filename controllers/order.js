const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Item = db.Item;
const Cart = db.Cart;
const CartItem = db.CartItem;
const Customer = db.Customer;
const User = db.User;
const sendEmail = require('../utils/sendEmail');

const allowedAdminStatuses = ['processing', 'completed', 'cancelled'];

exports.createOrder = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    const SHIPPING_FEE = 100;
    
    try {
        const { cart } = req.body;
        const userId = req.user?.id;
        
        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Get customer
        const customer = await Customer.findOne({
            where: { user_id: userId },
            include: [User]
        });
        
        if (!customer) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        if (!cart || cart.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        // Validate all items exist and calculate total
        let totalAmount = 0;
        const orderItems = [];
        
        for (let cartItem of cart) {
            const item = await Item.findByPk(cartItem.item_id, { transaction });
            
            if (!item) {
                await transaction.rollback();
                return res.status(404).json({ error: `Item ${cartItem.item_id} not found` });
            }

            const subtotal = Number(item.sell_price) * Number(cartItem.quantity);
            totalAmount += subtotal;

            orderItems.push({
                item_id: cartItem.item_id,
                quantity: cartItem.quantity,
                unit_price: item.sell_price
            });
        }

        const grandTotal = totalAmount + SHIPPING_FEE;
        
        // Create order
        const order = await Order.create({
            customer_id: customer.customer_id,
            date_placed: new Date(),
            status: 'pending'
        }, { transaction });
        
        // Create order items
        for (let orderItem of orderItems) {
            await OrderItem.create({
                orderinfo_id: order.order_id,
                ...orderItem
            }, { transaction });
        }
        
        // Clear the session/customer cart
        const userCart = await Cart.findOne({
            where: { customer_id: customer.customer_id }
        });
        
        if (userCart) {
            await CartItem.destroy({
                where: { cart_id: userCart.cart_id }
            }, { transaction });
        }
        
        await transaction.commit();
        
        // Send confirmation email
        try {
            const message = `Your order #${order.order_id} has been placed successfully. Total amount: $${grandTotal.toFixed(2)}`;
            await sendEmail({
                email: customer.User.email,
                subject: 'Order Confirmation',
                message
            });
        } catch (emailErr) {
            console.log('Email error:', emailErr);
        }
        
        return res.status(201).json({
            success: true,
            order_id: order.order_id,
            date_placed: order.date_placed,
            subtotal: totalAmount.toFixed(2),
            shipping: SHIPPING_FEE.toFixed(2),
            total_amount: grandTotal.toFixed(2),
            message: 'Order placed successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error creating order', details: error.message });
    }
};

// Get customer orders
exports.getOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // Get customer
        const customer = await Customer.findOne({ where: { user_id: userId } });
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get orders with items
        const orders = await Order.findAll({
            where: { customer_id: customer.customer_id },
            include: [
                {
                    model: OrderItem,
                    include: [Item]
                }
            ],
            order: [['date_placed', 'DESC']]
        });

        const ordersWithTotals = orders.map((order) => {
            const plainOrder = order.get({ plain: true });
            const subtotal = plainOrder.OrderItems.reduce((sum, line) => {
                const lineTotal = Number(line.unit_price) * Number(line.quantity);
                return sum + lineTotal;
            }, 0);

            return {
                ...plainOrder,
                subtotal: subtotal.toFixed(2),
                shipping: '100.00',
                total_amount: (subtotal + 100).toFixed(2)
            };
        });
        
        return res.status(200).json({
            success: true,
            orders: ordersWithTotals
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching orders', details: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: Customer,
                    include: [User]
                },
                {
                    model: OrderItem,
                    include: [Item]
                }
            ],
            order: [['date_placed', 'DESC']]
        });

        const ordersWithTotals = orders.map((order) => {
            const plainOrder = order.get({ plain: true });
            const subtotal = plainOrder.OrderItems.reduce((sum, line) => {
                const lineTotal = Number(line.unit_price) * Number(line.quantity);
                return sum + lineTotal;
            }, 0);

            return {
                ...plainOrder,
                subtotal: subtotal.toFixed(2),
                shipping: '100.00',
                total_amount: (subtotal + 100).toFixed(2)
            };
        });

        return res.status(200).json({
            success: true,
            orders: ordersWithTotals
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching admin orders', details: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!allowedAdminStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await order.update({
            status,
            date_shipped: status === 'completed' ? new Date() : order.date_shipped
        });

        return res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: order.get({ plain: true })
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating order status', details: error.message });
    }
};
