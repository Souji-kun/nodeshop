const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { registerUser,
    loginUser,
    updateUser,
    deactivateUser,
    getCurrentUser,
    getProfile,
    logoutUser,
    getAllUsers,
    updateUserRole,
    adminDeactivateUser,
    restoreUser


} = require('../controllers/user')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', isAuthenticatedUser, getCurrentUser)
router.get('/profile', isAuthenticatedUser, getProfile)
router.post('/logout', isAuthenticatedUser, logoutUser)
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser)
router.delete('/deactivate', isAuthenticatedUser, deactivateUser)
router.get('/users', isAuthenticatedUser, authorizeRoles('admin'), getAllUsers)
router.patch('/users/:id/role', isAuthenticatedUser, authorizeRoles('admin'), updateUserRole)
router.patch('/users/:id/deactivate', isAuthenticatedUser, authorizeRoles('admin'), adminDeactivateUser)
router.patch('/users/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), restoreUser)
module.exports = router
