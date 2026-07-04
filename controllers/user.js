const db = require('../models');
const User = db.User;
const Customer = db.Customer;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const allowedRoles = ['admin', 'customer'];

const signToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const formatUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'customer',
    deleted_at: user.deleted_at || null,
    token: user.token || null
});

const formatCustomer = (customer) => {
    if (!customer) {
        return null;
    }

    const plainCustomer = customer.get ? customer.get({ plain: true }) : customer;

    return {
        customer_id: plainCustomer.customer_id,
        fname: plainCustomer.fname || '',
        lname: plainCustomer.lname || '',
        addressline: plainCustomer.addressline || '',
        zipcode: plainCustomer.zipcode || '',
        phone: plainCustomer.phone || '',
        image_path: plainCustomer.image_path || '',
        user_id: plainCustomer.user_id
    };
};

const registerUser = async (req, res) => {
    try {
        const { name, password, email } = req.body;

        // Validate required fields
        if (!name || !password || !email) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'customer'
        });

        const token = signToken(user);
        await user.update({ token });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: formatUser(user),
            token
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find active user (not deleted)
        const user = await User.findOne({
            where: { 
                email,
                deleted_at: null 
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare passwords
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = signToken(user);
        await user.update({ token });

        return res.status(200).json({
            success: true,
            message: 'Welcome back',
            user: formatUser(user),
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error logging in', details: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fname, lname, addressline, zipcode, phone } = req.body;
        const userId = req.user?.id || req.body.userId;

        // Validate required field
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        // Find or create customer record
        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: userId },
            defaults: {
                fname,
                lname,
                addressline,
                zipcode,
                phone,
                image_path: imagePath,
                user_id: userId
            }
        });

        // Update if already exists
        if (!created) {
            await customer.update({
                fname: fname || customer.fname,
                lname: lname || customer.lname,
                addressline: addressline || customer.addressline,
                zipcode: zipcode || customer.zipcode,
                phone: phone || customer.phone,
                image_path: imagePath || customer.image_path
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            customer: formatCustomer(customer)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating profile', details: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id,
                deleted_at: null
            },
            attributes: ['id', 'name', 'email', 'role', 'token', 'created_at', 'updated_at']
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const [customer] = await Customer.findOrCreate({
            where: { user_id: req.user.id },
            defaults: { user_id: req.user.id }
        });

        return res.status(200).json({
            success: true,
            user,
            customer: formatCustomer(customer)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching profile', details: error.message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const timestamp = new Date();
        await user.update({ deleted_at: timestamp, token: null });

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            email: user.email,
            deleted_at: timestamp
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id,
                deleted_at: null
            },
            attributes: ['id', 'name', 'email', 'role', 'token', 'created_at', 'updated_at']
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching user', details: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.user.id, deleted_at: null } });

        if (user) {
            await user.update({ token: null });
        }

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error logging out', details: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['id', 'DESC']],
            attributes: ['id', 'name', 'email', 'role', 'deleted_at', 'created_at', 'updated_at']
        });

        return res.status(200).json({
            success: true,
            rows: users.map(formatUser)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ role });

        return res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user: formatUser(user)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user role', details: error.message });
    }
};

const adminDeactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.deleted_at) {
            return res.status(400).json({ error: 'User is already deactivated' });
        }

        const timestamp = new Date();
        await user.update({ deleted_at: timestamp });

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            user: formatUser(user),
            deleted_at: timestamp
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({ deleted_at: null });

        return res.status(200).json({
            success: true,
            message: 'User recovered successfully',
            user: formatUser(user)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error restoring user', details: error.message });
    }
};

module.exports = {
    registerUser,
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
};
// const connection = require('../config/_database');
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')

// const registerUser = async (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body)
//     const { name, password, email, } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userSql = 'INSERT INTO users (name, password, email) VALUES (?, ?, ?)';
//     try {
//         connection.execute(userSql, [name, hashedPassword, email], (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const loginUser = (req, res) => {
//     const { email, password } = req.body;
//     const sql = 'SELECT id, name, email, password FROM users WHERE email = ? AND deleted_at IS NULL';
//     connection.execute(sql, [email], async (err, results) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error logging in', details: err });
//         }
//         if (results.length === 0) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         const user = results[0];

//         const match = await bcrypt.compare(password, user.password);
//         if (!match) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         // Remove password from response
//         delete user.password;
//         const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,);

//         return res.status(200).json({
//             success: "welcome back",
//             user: results[0],
//             token
//         });
//     });
// };

// const updateUser = (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body, req.file)
//     const { fname, lname, addressline, town, zipcode, phone, userId, } = req.body;

//     if (req.file) {
//         image = req.file.path.replace(/\\/g, "/");
//     }
//     //     INSERT INTO users(user_id, username, email)
//     //   VALUES(1, 'john_doe', 'john@example.com')
//     // ON DUPLICATE KEY UPDATE email = 'john@example.com';
//     const userSql = `
//   INSERT INTO customer 
//     (fname, lname, addressline,  zipcode, phone, image_path, user_id)
//   VALUES (?, ?, ?, ?, ?, ?, ?)
//   ON DUPLICATE KEY UPDATE 
//     fname = VALUES(fname),
//     lname = VALUES(lname),
//     addressline = VALUES(addressline),
   
//     zipcode = VALUES(zipcode),
//     phone = VALUES(phone),
//     image_path = VALUES(image_path)`;
//     const params = [fname, lname, addressline, zipcode, phone, image, userId];

//     try {
//         connection.execute(userSql, params, (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 message: 'profile updated',
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const deactivateUser = (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json({ error: 'Email is required' });
//     }

//     const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
//     const timestamp = new Date();

//     connection.execute(sql, [timestamp, email], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error deactivating user', details: err });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         return res.status(200).json({
//             success: true,
//             message: 'User deactivated successfully',
//             email,
//             deleted_at: timestamp
//         });
//     });
// };

// module.exports = { registerUser, loginUser, updateUser, deactivateUser };
