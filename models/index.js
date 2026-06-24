const sequelize = require('../config/database');
const Item = require('./item');
const Stock = require('./stock');
const User = require('./user');
const Customer = require('./customer');
const Cart = require('./cart');
const CartItem = require('./cartItem');
const Order = require('./order');
const OrderItem = require('./orderItem');

// Initialize models
const db = {};
db.Item = Item(sequelize, require('sequelize').DataTypes);
db.Stock = Stock(sequelize, require('sequelize').DataTypes);
db.User = User(sequelize, require('sequelize').DataTypes);
db.Customer = Customer(sequelize, require('sequelize').DataTypes);
db.Cart = Cart(sequelize, require('sequelize').DataTypes);
db.CartItem = CartItem(sequelize, require('sequelize').DataTypes);
db.Order = Order(sequelize, require('sequelize').DataTypes);
db.OrderItem = OrderItem(sequelize, require('sequelize').DataTypes);

// Define Item & Stock associations
db.Item.hasOne(db.Stock, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.Stock.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

// Define User & Customer associations
db.User.hasOne(db.Customer, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
});
db.Customer.belongsTo(db.User, {
    foreignKey: 'user_id'
});

// Define Cart associations (2NF: Separate cart and cartitem)
db.Customer.hasMany(db.Cart, {
    foreignKey: 'customer_id',
    onDelete: 'CASCADE'
});
db.Cart.belongsTo(db.Customer, {
    foreignKey: 'customer_id'
});

db.Cart.hasMany(db.CartItem, {
    foreignKey: 'cart_id',
    onDelete: 'CASCADE'
});
db.CartItem.belongsTo(db.Cart, {
    foreignKey: 'cart_id'
});

db.Item.hasMany(db.CartItem, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.CartItem.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

// Define Order associations (2NF: Separate order and orderitem)
db.Customer.hasMany(db.Order, {
    foreignKey: 'customer_id',
    onDelete: 'CASCADE'
});
db.Order.belongsTo(db.Customer, {
    foreignKey: 'customer_id'
});

db.Order.hasMany(db.OrderItem, {
    foreignKey: 'orderinfo_id',
    onDelete: 'CASCADE'
});
db.OrderItem.belongsTo(db.Order, {
    foreignKey: 'orderinfo_id'
});

db.Item.hasMany(db.OrderItem, {
    foreignKey: 'item_id',
    onDelete: 'CASCADE'
});
db.OrderItem.belongsTo(db.Item, {
    foreignKey: 'item_id'
});

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;