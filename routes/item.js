const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
    restoreItem } = require('../controllers/item')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.get('/items', getAllItems)
router.get('/items/:id', getSingleItem)
router.post('/items', isAuthenticatedUser, authorizeRoles('admin'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 8 }]), createItem)
router.put('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 8 }]), updateItem)
router.delete('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteItem)
router.patch('/items/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), restoreItem)

module.exports = router;
