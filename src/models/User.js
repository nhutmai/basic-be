const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        return db.createUser(userData);
    }

    static async findByEmail(email) {
        return db.getUserByEmail(email);
    }

    static async findByUsername(username) {
        return db.getUserByUsername(username);
    }

    static async findById(id) {
        return db.getUserById(id);
    }

    static async update(id, userData) {
        return db.updateUser(id, userData);
    }

    static async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    static async updateLastLogin(id) {
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }
}

module.exports = User;