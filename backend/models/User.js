// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//     email: {
//         type: String,
//         required: true,
        
//         trim: true,
//         lowercase: true
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     role: {
//         type: String,
//         enum: ['user', 'admin'] || 'admin',
//         default: 'user'
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// // Drop any existing indexes
// userSchema.index({ email: 1 }, { unique: true });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (error) {
//         next(error);
//     }
// });

// // Method to compare password
// userSchema.methods.comparePassword = async function(candidatePassword) {
//     return bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema); 




const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Drop any existing indexes
userSchema.index({ email: 1 }, { unique: true });

// Drop the username index if it exists
mongoose.connection.on('connected', async () => {
    try {
        const collection = mongoose.connection.db.collection('users');
        const indexes = await collection.indexes();
        const usernameIndex = indexes.find(index => index.name === 'username_1');
        
        if (usernameIndex) {
            await collection.dropIndex('username_1');
            console.log('Successfully dropped username index');
        }
    } catch (error) {
        console.log('Error handling indexes:', error);
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);  