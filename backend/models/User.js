const bcrypt = require('bcryptjs');
const { users } = require('./storage');

class User {
    constructor(data) {
        this.id = data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.email = data.email.toLowerCase().trim();
        this.password = data.password;
        this.role = data.role || 'user';
        this.createdAt = data.createdAt || new Date();
    }

<<<<<<< HEAD
// Drop any existing indexes
userSchema.index({ email: 1 }, { unique: true });

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