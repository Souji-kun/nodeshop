const jwt = require("jsonwebtoken");
const db = require('../models');
const User = db.User;

exports.isAuthenticatedUser = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        req.body = req.body || {};
        req.body.user = req.user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findOne({
                where: {
                    id: req.user.id,
                    deleted_at: null
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Forbidden: admin access required' });
            }

            req.user.role = user.role;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Failed to verify role', error: error.message });
        }
    };
};

