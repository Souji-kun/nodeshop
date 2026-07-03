module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        orderline_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        orderinfo_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'orderline',
        timestamps: false
    });

    return OrderItem;
};
