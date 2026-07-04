const app = require('./app')
const db = require('./models')

require('dotenv').config()

const PORT = process.env.PORT || 3000

const ensureItemSoftDeleteColumn = async () => {
    const [rows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'deleted_at'"
    );

    const columnCount = Number(rows?.[0]?.columnCount || 0);

    if (columnCount === 0) {
        await db.sequelize.query("ALTER TABLE item ADD COLUMN deleted_at DATETIME NULL AFTER img_path");
    }
};

const ensureItemCategoryColumn = async () => {
    const [rows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item' AND COLUMN_NAME = 'category'"
    );

    const columnCount = Number(rows?.[0]?.columnCount || 0);

    if (columnCount === 0) {
        await db.sequelize.query("ALTER TABLE item ADD COLUMN category VARCHAR(120) NOT NULL DEFAULT 'Uncategorized' AFTER item_id");
    }
};

const ensureUserRoleColumn = async () => {
    const [rows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'"
    );

    const columnCount = Number(rows?.[0]?.columnCount || 0);

    if (columnCount === 0) {
        await db.sequelize.query("ALTER TABLE users ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'customer' AFTER password");
    }
};

const ensureUserTokenColumn = async () => {
    const [rows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token'"
    );

    const columnCount = Number(rows?.[0]?.columnCount || 0);

    if (columnCount === 0) {
        await db.sequelize.query("ALTER TABLE users ADD COLUMN token TEXT NULL AFTER password");
    }
};

const ensureOrderStatusColumn = async () => {
    await db.sequelize.query("ALTER TABLE orderinfo MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'pending'");
};

const ensureAdminUser = async () => {
    const [rows] = await db.sequelize.query(
        "SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin' AND deleted_at IS NULL"
    );

    const adminCount = Number(rows?.[0]?.adminCount || 0);

    if (adminCount === 0) {
        const [candidateRows] = await db.sequelize.query(
            "SELECT id FROM users WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1"
        );

        const candidateId = candidateRows?.[0]?.id;

        if (candidateId) {
            await db.sequelize.query(
                "UPDATE users SET role = 'admin' WHERE id = ?",
                { replacements: [candidateId] }
            );
        }
    }
};

const dropDerivedOrderColumns = async () => {
    const [orderShippingRows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orderinfo' AND COLUMN_NAME = 'shipping'"
    );
    const [orderTotalRows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orderinfo' AND COLUMN_NAME = 'total_amount'"
    );
    const [orderSubtotalRows] = await db.sequelize.query(
        "SELECT COUNT(*) AS columnCount FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orderline' AND COLUMN_NAME = 'subtotal'"
    );

    if (Number(orderShippingRows?.[0]?.columnCount || 0) > 0) {
        await db.sequelize.query("ALTER TABLE orderinfo DROP COLUMN shipping");
    }

    if (Number(orderTotalRows?.[0]?.columnCount || 0) > 0) {
        await db.sequelize.query("ALTER TABLE orderinfo DROP COLUMN total_amount");
    }

    if (Number(orderSubtotalRows?.[0]?.columnCount || 0) > 0) {
        await db.sequelize.query("ALTER TABLE orderline DROP COLUMN subtotal");
    }
};

const startServer = async () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is required in your .env file');
    }

    await db.sequelize.authenticate();
    await ensureItemSoftDeleteColumn();
    await ensureItemCategoryColumn();
    await ensureUserRoleColumn();
    await ensureUserTokenColumn();
    await ensureOrderStatusColumn();
    await dropDerivedOrderColumns();
    await db.sequelize.sync();
    await ensureAdminUser();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

startServer().catch(error => {
    console.log('Unable to start server:', error.message)
    process.exit(1)
})
