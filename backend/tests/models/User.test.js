const User = require('../../models/User');
const { users } = require('../../models/storage');

describe('User Model', () => {
    beforeEach(() => {
        users.length = 0; // Clear users array
    });

    describe('User Constructor', () => {
        test('should create user with provided data', () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            };

            const user = new User(userData);

            expect(user.email).toBe('test@example.com');
            expect(user.password).toBe('password123');
            expect(user.role).toBe('admin');
            expect(user.id).toBeDefined();
            expect(user.createdAt).toBeInstanceOf(Date);
        });

        test('should set default role to user', () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(user.role).toBe('user');
        });

        test('should generate unique ID', () => {
            const user1 = new User({ email: 'test1@example.com', password: 'pass1' });
            const user2 = new User({ email: 'test2@example.com', password: 'pass2' });

            expect(user1.id).not.toBe(user2.id);
            expect(typeof user1.id).toBe('string');
        });
    });

    describe('User.save()', () => {
        test('should hash password and save user', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();

            expect(user.password).not.toBe('password123'); // Should be hashed
            expect(user.password.startsWith('$2a$')).toBe(true); // bcrypt hash
            expect(users).toHaveLength(1);
            expect(users[0]).toBe(user);
        });

        test('should not re-hash already hashed password', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();
            const firstHash = user.password;

            // Try to save again
            await user.save();

            expect(user.password).toBe(firstHash); // Should remain the same
        });

        test('should prevent duplicate emails', async () => {
            const user1 = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user1.save();

            const user2 = new User({
                email: 'test@example.com', // Same email
                password: 'password456'
            });

            await expect(user2.save()).rejects.toThrow('Email already exists');
        });

        test('should update existing user', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();
            user.role = 'admin';
            await user.save();

            expect(users).toHaveLength(1);
            expect(users[0].role).toBe('admin');
        });
    });

    describe('User.comparePassword()', () => {
        test('should return true for correct password', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();

            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);
        });

        test('should return false for incorrect password', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();

            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('User.toObject()', () => {
        test('should return user data without password', () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });

            const obj = user.toObject();

            expect(obj.id).toBe(user.id);
            expect(obj.email).toBe('test@example.com');
            expect(obj.role).toBe('admin');
            expect(obj.createdAt).toBe(user.createdAt);
            expect(obj.password).toBeUndefined();
        });
    });

    describe('User.findOne()', () => {
        test('should find user by email', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();

            const found = await User.findOne({ email: 'test@example.com' });
            expect(found).toBe(user);
        });

        test('should return undefined for non-existent user', async () => {
            const found = await User.findOne({ email: 'nonexistent@example.com' });
            expect(found).toBeUndefined();
        });
    });

    describe('User.findById()', () => {
        test('should find user by ID', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123'
            });

            await user.save();

            const found = await User.findById(user.id);
            expect(found).toBe(user);
        });

        test('should return undefined for non-existent ID', async () => {
            const found = await User.findById('nonexistent-id');
            expect(found).toBeUndefined();
        });
    });
});