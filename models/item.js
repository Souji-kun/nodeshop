module.exports = (sequelize, DataTypes) => {
    const Item = sequelize.define('Item', {
        item_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cost_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        sell_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        img_path: {
            type: DataTypes.STRING,
            allowNull: true
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'item',
        timestamps: true,
        underscored: true
    });
    return Item;
};