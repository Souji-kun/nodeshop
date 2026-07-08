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

const escapePdfText = (value) => String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildReceiptPdfBuffer = (order, customer) => {
    const orderItems = Array.isArray(order.OrderItems) ? order.OrderItems : [];
    const orderNumber = String(order.order_id || 'N/A');
    const customerName = customer.User?.name || customer.User?.email || 'Customer';
    const customerEmail = customer.User?.email || 'N/A';
    const datePlaced = new Date(order.date_placed || Date.now()).toLocaleString();
    const status = String(order.status || 'pending').toUpperCase();
    const subtotal = Number(order.subtotal || 0).toFixed(2);
    const shipping = Number(order.shipping || SHIPPING_FEE).toFixed(2);
    const total = Number(order.total_amount || 0).toFixed(2);

    const itemRows = orderItems.map((line) => {
        const name = line.Item?.name || line.Item?.description || `Item #${line.item_id}`;
        const qty = Number(line.quantity || 0);
        const unit = Number(line.unit_price || 0).toFixed(2);
        const lineTotal = (Number(line.unit_price || 0) * qty).toFixed(2);
        return {
            name,
            qty,
            unit,
            lineTotal
        };
    });

    const rowTexts = itemRows.map((row, index) => {
        const y = 560 - (index * 22);
        return [
            `BT /F1 10 Tf 55 ${y} Td (${escapePdfText(row.name)}) Tj ET`,
            `BT /F1 10 Tf 330 ${y} Td (${escapePdfText(String(row.qty))}) Tj ET`,
            `BT /F1 10 Tf 390 ${y} Td ($${escapePdfText(row.unit)}) Tj ET`,
            `BT /F1 10 Tf 470 ${y} Td ($${escapePdfText(row.lineTotal)}) Tj ET`
        ].join('\n');
    }).join('\n');

    const totalsBaseY = 120;
    const summaryLines = [
        `BT /F1 11 Tf 360 ${totalsBaseY + 45} Td (Subtotal) Tj ET`,
        `BT /F1 11 Tf 470 ${totalsBaseY + 45} Td ($${escapePdfText(subtotal)}) Tj ET`,
        `BT /F1 11 Tf 360 ${totalsBaseY + 25} Td (Shipping) Tj ET`,
        `BT /F1 11 Tf 470 ${totalsBaseY + 25} Td ($${escapePdfText(shipping)}) Tj ET`,
        `BT /F1 12 Tf 360 ${totalsBaseY} Td (TOTAL) Tj ET`,
        `BT /F1 12 Tf 470 ${totalsBaseY} Td ($${escapePdfText(total)}) Tj ET`
    ].join('\n');

    const contentLines = `
BT /F1 20 Tf 50 760 Td (PLUSH SHOP) Tj ET
BT /F1 10 Tf 50 742 Td (Official Receipt) Tj ET
BT /F1 10 Tf 420 760 Td (Receipt No: ${escapePdfText(orderNumber)}) Tj ET
BT /F1 10 Tf 420 742 Td (Date: ${escapePdfText(datePlaced)}) Tj ET
BT /F1 10 Tf 50 705 Td (Customer) Tj ET
BT /F1 10 Tf 50 688 Td (${escapePdfText(customerName)}) Tj ET
BT /F1 10 Tf 50 671 Td (${escapePdfText(customerEmail)}) Tj ET
BT /F1 10 Tf 420 705 Td (Status) Tj ET
BT /F1 12 Tf 420 686 Td (${escapePdfText(status)}) Tj ET
BT /F1 10 Tf 50 628 Td (Item) Tj ET
BT /F1 10 Tf 330 628 Td (Qty) Tj ET
BT /F1 10 Tf 390 628 Td (Unit) Tj ET
BT /F1 10 Tf 470 628 Td (Line Total) Tj ET
${rowTexts}
${summaryLines}
`.trim();

    const objects = [
        '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
        '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
        '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
        '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
        `5 0 obj << /Length ${Buffer.byteLength(contentLines, 'utf8')} >> stream\n${contentLines}\nendstream\nendobj\n`
    ];

    let output = '%PDF-1.4\n';
    const offsets = ['0000000000 65535 f \n'];
    objects.forEach((object) => {
        offsets.push(`${String(Buffer.byteLength(output, 'utf8')).padStart(10, '0')} 00000 n \n`);
        output += object;
    });

    const xrefOffset = Buffer.byteLength(output, 'utf8');
    output += `xref\n0 ${objects.length + 1}\n${offsets.join('')}trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(output, 'utf8');
};

const buildOrderEmailLines = (order, customer, messagePrefix = 'Transaction') => {
    const orderItems = Array.isArray(order.OrderItems) ? order.OrderItems : [];
    const lines = orderItems.map((line) => {
        const name = line.Item?.name || line.Item?.description || `Item #${line.item_id}`;
        const total = Number(line.unit_price || 0) * Number(line.quantity || 0);
        return `<li>${name} x ${line.quantity} - $${total.toFixed(2)}</li>`;
    }).join('');

    return `
        <h2>${messagePrefix} #${order.order_id}</h2>
        <p>Hello ${customer.User?.name || 'customer'},</p>
        <p>Your ${messagePrefix.toLowerCase()} was successful.</p>
        <ul>${lines || '<li>No items</li>'}</ul>
        <p>Subtotal: $${Number(order.subtotal || 0).toFixed(2)}</p>
        <p>Shipping: $${Number(order.shipping || SHIPPING_FEE).toFixed(2)}</p>
        <p>Total: $${Number(order.total_amount || 0).toFixed(2)}</p>
        <p>Status: ${order.status || 'pending'}</p>
    `;
};

const getOrderTotals = (order) => {
    const plainOrder = order.get ? order.get({ plain: true }) : order;
    const orderItems = Array.isArray(plainOrder.OrderItems) ? plainOrder.OrderItems : [];
    const subtotal = orderItems.reduce((sum, line) => {
        const lineTotal = Number(line.unit_price) * Number(line.quantity);
        return sum + lineTotal;
    }, 0);

    return {
        ...plainOrder,
        status: plainOrder.status || 'pending',
        subtotal: subtotal.toFixed(2),
        shipping: SHIPPING_FEE.toFixed(2),
        total_amount: (subtotal + SHIPPING_FEE).toFixed(2)
    };
};

const withOrderStatus = (order, status) => ({
    ...getOrderTotals(order),
    status: status || 'pending'
});

const loadOrderReceiptContext = async (orderId, status = null) => {
    const order = await Order.findByPk(orderId, {
        include: [
            {
                model: Customer,
                include: [User]
            },
            {
                model: OrderItem,
                include: [Item]
            }
        ]
    });

    if (!order) {
        return null;
    }

    const receiptOrder = withOrderStatus(order, status || order.status || 'pending');
    return {
        order,
        receiptOrder,
        customer: order.Customer
    };
};

const getReservedQuantity = async (itemId, transaction = null, excludeOrderId = null) => {
    const excludeSql = excludeOrderId ? 'AND oi.order_id <> :excludeOrderId' : '';
    const [rows] = await db.sequelize.query(
        `
            SELECT COALESCE(SUM(ol.quantity), 0) AS reserved
            FROM orderline ol
            INNER JOIN orderinfo oi ON oi.order_id = ol.orderinfo_id
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
            const receiptContext = await loadOrderReceiptContext(order.order_id, 'pending');
            const receiptOrder = receiptContext?.receiptOrder || withOrderStatus(order, 'pending');
            const receiptCustomer = receiptContext?.customer || customer;

            await sendEmail({
                email: customer.User.email,
                subject: `Order Confirmation #${order.order_id}`,
                html: buildOrderEmailLines(receiptOrder, receiptCustomer, 'Order'),
                attachments: [{
                    filename: `receipt-order-${order.order_id}.pdf`,
                    content: buildReceiptPdfBuffer(receiptOrder, receiptCustomer),
                    contentType: 'application/pdf'
                }]
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
        const customerWithUser = await Customer.findOne({
            where: { user_id: userId },
            include: [User]
        });

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

            try {
                const receiptContext = await loadOrderReceiptContext(order.order_id, 'processing');
                const receiptOrder = receiptContext?.receiptOrder || withOrderStatus(order, 'processing');
                const receiptCustomer = receiptContext?.customer || customerWithUser || customer;

                await sendEmail({
                    email: customerWithUser?.User?.email || customer.User?.email,
                    subject: `Payment Receipt #${order.order_id}`,
                    html: buildOrderEmailLines(receiptOrder, receiptCustomer, 'Payment'),
                    attachments: [{
                        filename: `receipt-payment-${order.order_id}.pdf`,
                        content: buildReceiptPdfBuffer(receiptOrder, receiptCustomer),
                        contentType: 'application/pdf'
                    }]
                });
            } catch (emailErr) {
                console.log('Email error:', emailErr);
            }

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

        try {
            const receiptContext = await loadOrderReceiptContext(id, status);
            if (receiptContext?.customer?.User?.email) {
                await sendEmail({
                    email: receiptContext.customer.User.email,
                    subject: `Order Status Updated #${id}`,
                    html: buildOrderEmailLines(receiptContext.receiptOrder, receiptContext.customer, 'Order Update'),
                    attachments: [{
                        filename: `receipt-order-${id}-${status}.pdf`,
                        content: buildReceiptPdfBuffer(receiptContext.receiptOrder, receiptContext.customer),
                        contentType: 'application/pdf'
                    }]
                });
            }
        } catch (emailErr) {
            console.log('Email error:', emailErr);
        }

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
