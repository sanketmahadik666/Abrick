const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    // try {
    //     let token;

    //     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //         token = req.headers.authorization.split(' ')[1];
    //     }

    //     if (!token) {
    //         return res.status(401).json({ message: 'Not authorized to access this route' });
    //     }

<<<<<<< HEAD
    //     try {
    //         const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //         req.user = await User.findById(decoded.id).select('-password');
    //         next();
    //     } catch (err) {
    //         return res.status(401).json({ message: 'Not authorized to access this route' });
    //     }
    // } catch (err) {
    //     res.status(500).json({ message: 'Server error in auth middleware' });
    // }


    next() ;
=======
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized to access this route' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error in auth middleware' });
    }
>>>>>>> master
};

exports.admin = async (req, res, next) => {
    // try {
    //     if (req.user && req.user.role === 'admin') {
    //         next();
    //     } else {
    //         res.status(403).json({ message: 'Admin access required' });
    //     }
    // } catch (err) {
    //     res.status(500).json({ message: 'Server error in admin middleware' });
    // }

    if(req.User && req.User.role === 'admin'){
        next() ;
    }
    else{
        res.status(403).json({
            message : 'user might have under the admin preveleges'
        })
    }


    next() ;
}; 