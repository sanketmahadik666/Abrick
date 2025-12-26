const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        console.log('[AUTH] Register attempt with email:', req.body.email);
        const { email, password } = req.body;

<<<<<<< HEAD
        // Validate input
        if (!email || !password) {
=======
        // Validate required fields
        if (!email || !password) {
            console.log('[AUTH] Register failed: Missing email or password');
>>>>>>> master
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('[AUTH] Register failed: User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            email,
            password,
            role: 'admin' // For now, all registrations create admin users
        });

        await user.save();
<<<<<<< HEAD
        console.log('User saved successfully:', user.email);
=======
        console.log('[AUTH] Register successful: New user created:', email);
>>>>>>> master

        // Create token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
<<<<<<< HEAD
        console.error('Registration error details:', err);
        res.status(500).json({ 
            message: 'Error in user registration',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
=======
        console.error('[AUTH] Registration error:', err.message);
        res.status(500).json({ message: 'Error in user registration' });
>>>>>>> master
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        console.log('[AUTH] Login attempt with email:', req.body.email);
        const { email, password } = req.body;

<<<<<<< HEAD
        // Validate input
        if (!email || !password) {
=======
        // Validate required fields
        if (!email || !password) {
            console.log('[AUTH] Login failed: Missing email or password');
>>>>>>> master
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('[AUTH] Login failed: User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('[AUTH] Login failed: Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('[AUTH] Login successful:', email);
        // Create token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
<<<<<<< HEAD
        console.error('Login error details:', err);
        res.status(500).json({ 
            message: 'Error in user login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
=======
        console.error('[AUTH] Login error:', err.message);
        res.status(500).json({ message: 'Error in user login' });
>>>>>>> master
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        console.log('[AUTH] /me request for user ID:', req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('[AUTH] User not found:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('[AUTH] /me successful for:', user.email);
        res.json(user.toObject());
    } catch (err) {
        console.error('[AUTH] Get user error:', err.message);
        res.status(500).json({ message: 'Error getting user data' });
    }
});

module.exports = router; 



// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { protect } = require('../middleware/auth');

// // Admin registration
// router.post('/admin/register', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ message: 'Email and password are required' });
//         }

//         let user = await User.findOne({ email });
//         if (user) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         user = new User({
//             email,
//             password,
//             role: 'admin'
//         });

//         await user.save();

//         const token = jwt.sign(
//             { id: user._id },
//             process.env.JWT_SECRET,
//             { expiresIn: '30d' }
//         );

//         res.status(201).json({
//             token,
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 role: user.role
//             }
//         });
//     } catch (err) {
//         console.error('Registration error:', err);
//         res.status(500).json({ 
//             message: 'Error in registration',
//             error: process.env.NODE_ENV === 'development' ? err.message : undefined
//         });
//     }
// });

// // // User login
// // router.post('/login', async (req, res) => {
// //     try {
// //         const { email, password } = req.body;

// //         if (!email || !password) {
// //             return res.status(400).json({ message: 'Email and password are required' });
// //         }

// //         const user = await User.findOne({ email });
// //         if (!user) {
// //             return res.status(401).json({ message: 'Invalid credentials' });
// //         }

// //         const isMatch = await user.comparePassword(password);
// //         if (!isMatch) {
// //             return res.status(401).json({ message: 'Invalid credentials' });
// //         }

// //         const token = jwt.sign(
// //             { id: user._id },
// //             process.env.JWT_SECRET,
// //             { expiresIn: '30d' }
// //         );

// //         res.json({
// //             token,
// //             user: {
// //                 id: user._id,
// //                 email: user.email,
// //                 role: user.role
// //             }
// //         });
// //     } catch (err) {
// //         console.error('Login error:', err);
// //         res.status(500).json({ 
// //             message: 'Error in login',
// //             error: process.env.NODE_ENV === 'development' ? err.message : undefined
// //         });
// //     }
// // });

// // // Get current user
// // router.get('/me', protect, async (req, res) => {
// //     try {
// //         const user = await User.findById(req.user.id).select('-password');
// //         res.json(user);
// //     } catch (err) {
// //         console.error('Get user error:', err);
// //         res.status(500).json({ message: 'Error getting user data' });
// //     }
// // });

// // module.exports = router;