const db = require('../models');
const Item = db.Item;
const Stock = db.Stock;
const sequelize = db.sequelize;

const DEFAULT_IMAGE_PATH = 'images/default-product.svg';

const toImageArray = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean);
            }
        } catch {
            // fall through to legacy single path support
        }

        return trimmed
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);
    }

    return [];
};

const toStoredImages = (paths) => {
    const unique = [...new Set((paths || []).filter(Boolean))];
    return JSON.stringify(unique);
};

const getRequestImages = (req) => {
    const combined = [];
    const single = req.files?.image || [];
    const multi = req.files?.images || [];

    [...single, ...multi].forEach((file) => {
        if (file?.path) {
            combined.push(file.path.replace(/\\/g, '/'));
        }
    });

    if (req.file?.path) {
        combined.push(req.file.path.replace(/\\/g, '/'));
    }

    return [...new Set(combined)];
};

const serializeItem = (item) => {
    if (!item) {
        return null;
    }

    const plainItem = item.get ? item.get({ plain: true }) : item;
    const images = toImageArray(plainItem.img_path);

    return {
        ...plainItem,
        images,
        img_path: images.length ? images[0] : plainItem.img_path || DEFAULT_IMAGE_PATH,
        isDisabled: Boolean(plainItem.deleted_at),
        isActive: !plainItem.deleted_at
    };
};

// Get all items with stock
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.findAll({
            order: [['category', 'ASC'], ['item_id', 'DESC']],
            include: [{ model: Stock }]
        });
        return res.status(200).json({ rows: items.map(serializeItem) });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching items' });
    }
};

// Get single item with stock
exports.getSingleItem = async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id, {
            include: [{ model: Stock }]
        });

        if (!item || item.deleted_at) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        return res.status(200).json({ success: true, result: serializeItem(item) });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching item' });
    }
};

// Create item with stock
exports.createItem = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { category, description, cost_price, sell_price, quantity } = req.body;
        const uploadedImages = getRequestImages(req);
        const storedImages = uploadedImages.length ? toStoredImages(uploadedImages) : toStoredImages([DEFAULT_IMAGE_PATH]);
        const stockQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
        const itemCategory = String(category || '').trim() || 'Uncategorized';

        if (!description || !cost_price || !sell_price) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const item = await Item.create(
            {
                category: itemCategory,
                description,
                cost_price,
                sell_price,
                img_path: storedImages
            },
            { transaction }
        );

        const stock = await Stock.create({
            item_id: item.item_id,
            quantity: stockQuantity
        }, { transaction });

        await transaction.commit();

        const createdItem = await Item.findByPk(item.item_id, {
            include: [{ model: Stock }]
        });

        return res.status(201).json({
            success: true,
            itemId: item.item_id,
            images: uploadedImages.length ? uploadedImages : [DEFAULT_IMAGE_PATH],
            quantity: stock.quantity,
            item: serializeItem(createdItem || item)
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error creating item', details: error.message });
    }
};

// Update item
exports.updateItem = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { category, description, cost_price, sell_price, quantity } = req.body;
        const existingItem = await Item.findByPk(id);

        if (!existingItem || existingItem.deleted_at) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        const uploadedImages = getRequestImages(req);
        const existingImages = toImageArray(existingItem.img_path);
        const finalImages = uploadedImages.length ? uploadedImages : existingImages;
        const storedImages = toStoredImages(finalImages.length ? finalImages : [DEFAULT_IMAGE_PATH]);
        const stockQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
        const itemCategory = String(category || existingItem.category || '').trim() || 'Uncategorized';

        if (!description || !cost_price || !sell_price) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await Item.update(
            {
                category: itemCategory,
                description,
                cost_price,
                sell_price,
                img_path: storedImages
            },
            { where: { item_id: id }, transaction }
        );

        await Stock.update(
            { quantity: stockQuantity },
            { where: { item_id: id }, transaction }
        );

        await transaction.commit();

        const updatedItem = await Item.findByPk(id, {
            include: [{ model: Stock }]
        });

        return res.status(200).json({
            success: true,
            item: serializeItem(updatedItem || existingItem)
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

// Delete item
exports.deleteItem = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        const item = await Item.findByPk(id);

        if (!item || item.deleted_at) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        const timestamp = new Date();

        await Item.update(
            { deleted_at: timestamp },
            { where: { item_id: id }, transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Item disabled successfully',
            deleted_at: timestamp
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error deleting item', details: error.message });
    }
};

exports.restoreItem = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const item = await Item.findByPk(id);

        if (!item) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        if (!item.deleted_at) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Item is already active' });
        }

        await Item.update(
            { deleted_at: null },
            { where: { item_id: id }, transaction }
        );

        await transaction.commit();

        const restoredItem = await Item.findByPk(id, {
            include: [{ model: Stock }]
        });

        return res.status(200).json({
            success: true,
            message: 'Item restored successfully',
            item: serializeItem(restoredItem || item)
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error restoring item', details: error.message });
    }
};
