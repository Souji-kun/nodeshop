const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Item = db.Item;
const Stock = db.Stock;
const Cart = db.Cart;
const CartItem = db.CartItem;
const Customer = db.Customer;
const User = db.User;
const sendEmail = require('../utils/sendEmail');

const allowedAdminStatuses = ['processing', 'completed', 'cancelled'];
const SHIPPING_FEE = 100;

const getOrderTotals = (order) => {
    const plainOrder = order.get ? order.get({ plain: true }) : order;
    const orderItems = Array.isArray(plainOrder.OrderItems) ? plainOrder.OrderItems : [];
    const subtotal = orderItems.reduce((sum, line) => {
        const lineTotal = Number(line.unit_price) * Number(line.quantity);
        return sum + lineTotal;
    }, 0);

    return {
        ...plainOrder,
        subtotal: subtotal.toFixed(2),
        shipping: SHIPPING_FEE.toFixed(2),
        total_amount: (subtotal + SHIPPING_FEE).toFixed(2)
    };
};

const getReservedQuantity = async (itemId, transaction = null, excludeOrderId = null) => {
    const excludeSql = excludeOrderId ? 'AND oi.orderinfo_id <> :excludeOrderId' : '';
    const [rows] = await db.sequelize.query(
        `
            SELECT COALESCE(SUM(ol.quantity), 0) AS reserved
            FROM orderline ol
            INNER JOIN orderinfo oi ON oi.orderinfo_id = ol.orderinfo_id
            WHERE ol.item_id = :itemId
              AND oi.status = 'pending'
              ${excludeSql}
        `,
        {
            replacements: { itemId, excludeOrderId },
            transaction
        }
    );

    return Number(rows?.[0]?.reserved || 0);
};

const getAvailableForCheckout = async (itemId, transaction = null) => {
    const stock = await Stock.findOne({
        where: { item_id: itemId },
        transaction,
        lock: transaction ? db.Sequelize.Transaction.LOCK.UPDATE : undefined
    });
    const currentStock = Number(stock?.quantity || 0);
    const reserved = await getReservedQuantity(itemId, transaction);
    return {
        stock,
        currentStock,
        reserved,
        available: Math.max(0, currentStock - reserved)
    };
};

exports.createOrder = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    
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

            const requestedQuantity = Number(cartItem.quantity || 0);
            if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Invalid cart item quantity' });
            }

            const stockStatus = await getAvailableForCheckout(cartItem.item_id, transaction);
            if (!stockStatus.stock || requestedQuantity > stockStatus.available) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `${item.name || item.description || `Item ${cartItem.item_id}`} only has ${stockStatus.available} available after pending orders`,
                    item_id: cartItem.item_id,
                    available: stockStatus.available,
                    reserved: stockStatus.reserved,
                    stock: stockStatus.currentStock
                });
            }

            const subtotal = Number(item.sell_price) * requestedQuantity;
            totalAmount += subtotal;

            orderItems.push({
                item_id: cartItem.item_id,
                quantity: requestedQuantity,
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

        const ordersWithTotals = orders.map(getOrderTotals);
        
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

        const ordersWithTotals = orders.map(getOrderTotals);

        return res.status(200).json({
            success: true,
            orders: ordersWithTotals
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching admin orders', details: error.message });
    }
};

exports.updateMyOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, amount } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const customer = await Customer.findOne({ where: { user_id: userId } });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const order = await Order.findOne({
            where: {
                order_id: id,
                customer_id: customer.customer_id
            },
            include: [
                {
                    model: OrderItem,
                    include: [Item]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (action === 'cancel') {
            if (order.status !== 'pending') {
                return res.status(400).json({ error: 'Only pending orders can be cancelled' });
            }

            await order.update({ status: 'cancelled' });
            return res.status(200).json({
                success: true,
                message: 'Order cancelled',
                order: getOrderTotals(order)
            });
        }

        if (action === 'pay') {
            if (order.status !== 'pending') {
                return res.status(400).json({ error: 'Only pending orders can proceed to payment' });
            }

            const totals = getOrderTotals(order);
            const paidAmount = Number(amount);
            const orderTotal = Number(totals.total_amount);

            if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
                return res.status(400).json({ error: 'Please enter a positive payment amount' });
            }

            if (paidAmount < orderTotal) {
                return res.status(400).json({ error: 'Payment amount is lower than the order total' });
            }

            await db.sequelize.transaction(async (transaction) => {
                const lines = await OrderItem.findAll({
                    where: { orderinfo_id: order.order_id },
                    include: [Item],
                    transaction
                });

                for (const line of lines) {
                    const stock = await Stock.findOne({
                        where: { item_id: line.item_id },
                        transaction,
                        lock: db.Sequelize.Transaction.LOCK.UPDATE
                    });
                    const currentStock = Number(stock?.quantity || 0);
                    const needed = Number(line.quantity || 0);

                    if (!stock || currentStock < needed) {
                        const itemName = line.Item?.name || line.Item?.description || `Item #${line.item_id}`;
                        const error = new Error(`${itemName} only has ${currentStock} in stock`);
                        error.status = 400;
                        throw error;
                    }
                }

                for (const line of lines) {
                    await Stock.decrement(
                        { quantity: Number(line.quantity || 0) },
                        {
                            where: { item_id: line.item_id },
                            transaction
                        }
                    );
                }

                await order.update({ status: 'processing' }, { transaction });
            });

            return res.status(200).json({
                success: true,
                message: 'Payment accepted',
                change: (paidAmount - orderTotal).toFixed(2),
                order: {
                    ...totals,
                    status: 'processing'
                }
            });
        }

        return res.status(400).json({ error: 'Invalid order action' });
    } catch (error) {
        console.log(error);
        return res.status(error.status || 500).json({
            error: error.status ? error.message : 'Error updating order',
            details: error.status ? undefined : error.message
        });
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
