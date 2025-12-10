const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor() {
        this.db = new sqlite3.Database(
            process.env.DATABASE_URL || './database.sqlite',
            (err) => {
                if (err) {
                    console.error('Không thể kết nối database:', err.message);
                } else {
                    console.log('Đã kết nối SQLite database');
                    this.initDatabase();
                }
            }
        );

        // Promisify các method
        // this.run = promisify(this.db.run.bind(this.db));
        this.get = promisify(this.db.get.bind(this.db));
        this.all = promisify(this.db.all.bind(this.db));
    }
    // Sửa method run để trả về Promise với lastID
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Trả về object chứa lastID và changes
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    async initDatabase() {
        try {
            // Tạo bảng users
            await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'user',
          is_active INTEGER DEFAULT 1,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Tạo bảng refresh_tokens
            await this.run(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          is_revoked INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

            console.log('Database đã được khởi tạo');
        } catch (error) {
            console.error('Lỗi khởi tạo database:', error);
        }
    }

    async createUser(userData) {
        const { username, email, password, full_name } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await this.run(
            `INSERT INTO users (username, email, password, full_name) 
       VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name]
        );

        return this.getUserById(result.lastID);
    }

    async getUserById(id) {
        return this.get('SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?', [id]);
    }

    async getUserByEmail(email) {
        return this.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    async getUserByUsername(username) {
        return this.get('SELECT * FROM users WHERE username = ?', [username]);
    }

    async updateUser(id, userData) {
        const fields = [];
        const values = [];

        Object.keys(userData).forEach(key => {
            fields.push(`${key} = ?`);
            values.push(userData[key]);
        });

        values.push(id);
        await this.run(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.getUserById(id);
    }

    async saveRefreshToken(userId, token, expiresAt) {
        await this.run(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
    }

    async findRefreshToken(token) {
        return this.get(
            `SELECT rt.*, u.id as user_id, u.username, u.email, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.is_revoked = 0 AND rt.expires_at > datetime('now')`,
            [token]
        );
    }

    async revokeRefreshToken(token) {
        await this.run(
            'UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?',
            [token]
        );
    }

    async revokeAllUserTokens(userId) {
        await this.run(
            'UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?',
            [userId]
        );
    }
}

module.exports = new Database();