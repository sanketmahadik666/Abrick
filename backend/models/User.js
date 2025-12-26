<<<<<<< HEAD
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
=======
>>>>>>> master
const bcrypt = require('bcryptjs');
const { users } = require('./storage');

<<<<<<< HEAD
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
=======
class User {
    constructor(data) {
        this.id = data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.email = data.email.toLowerCase().trim();
        this.password = data.password;
        this.role = data.role || 'user';
        this.createdAt = data.createdAt || new Date();
>>>>>>> master
    }

<<<<<<< HEAD
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
=======
    async save() {
        // Hash password if modified
        if (this.password && !this.password.startsWith('$2a$')) { // check if already hashed
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        // Check unique email
        const existing = users.find(u => u.email === this.email && u.id !== this.id);
        if (existing) {
            throw new Error('Email already exists');
        }
        // Add or update
        const index = users.findIndex(u => u.id === this.id);
        if (index > -1) {
            users[index] = this;
        } else {
            users.push(this);
        }
        return this;
>>>>>>> master
    }

    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

<<<<<<< HEAD
module.exports = mongoose.model('User', userSchema);  
=======
    toObject() {
        return {
            id: this.id,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt
        };
    }

    static async findOne(query) {
        return users.find(u => {
            for (let key in query) {
                if (u[key] !== query[key]) return false;
            }
            return true;
        });
    }

    static async findById(id) {
        return users.find(u => u.id === id);
    }

    static async findByIdAndUpdate(id, update) {
        const user = users.find(u => u.id === id);
        if (user) {
            Object.assign(user, update);
            return user;
        }
        return null;
    }
}

module.exports = User;
>>>>>>> master
