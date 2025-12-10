const User = require('../models/User');
const db = require('../config/database');
const validators = require('../ults/validators');

class AuthController {
    constructor(fastify) {
        this.fastify = fastify;
    }

    // Đăng ký user mới
    async register(request, reply) {
        try {
            const { username, email, password, confirmPassword, full_name } = request.body;

            // Validate input
            const validationErrors = validators.validateRegisterData(request.body);
            if (validationErrors.length > 0) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    messages: validationErrors
                });
            }

            // Kiểm tra email đã tồn tại
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return reply.code(400).send({
                    error: 'Bad Request',
                    message: 'Email đã được sử dụng'
                });
            }

            // Kiểm tra username đã tồn tại
            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return reply.code(400).send({
                    error: 'Bad Request',
                    message: 'Username đã được sử dụng'
                });
            }

            // Tạo user mới
            const userData = {
                username,
                email,
                password,
                full_name: full_name || username
            };

            const user = await User.create(userData);

            // Tạo tokens
            const tokens = this.fastify.generateTokens(user);

            // Lưu refresh token vào database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
            await db.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

            // Cập nhật last login
            await User.updateLastLogin(user.id);

            reply.code(201).send({
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role
                    },
                    tokens
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Đã xảy ra lỗi khi đăng ký'
            });
        }
    }

    // Đăng nhập
    async login(request, reply) {
        try {
            const { email, password } = request.body;

            // Tìm user bằng email
            const user = await User.findByEmail(email);
            if (!user) {
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await User.comparePassword(password, user.password);
            if (!isPasswordValid) {
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Email hoặc mật khẩu không đúng'
                });
            }

            // Kiểm tra tài khoản có bị khóa không
            if (user.is_active === 0) {
                return reply.code(403).send({
                    error: 'Forbidden',
                    message: 'Tài khoản đã bị khóa'
                });
            }

            // Tạo tokens
            const tokens = this.fastify.generateTokens(user);

            // Lưu refresh token vào database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
            await db.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

            // Cập nhật last login
            await User.updateLastLogin(user.id);

            reply.send({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role
                    },
                    tokens
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Đã xảy ra lỗi khi đăng nhập'
            });
        }
    }

    // Refresh token
    async refreshToken(request, reply) {
        try {
            const { refreshToken } = request.body;

            // Xác thực refresh token
            const decoded = await this.fastify.verifyRefreshToken(refreshToken);

            // Kiểm tra refresh token trong database
            const tokenData = await db.findRefreshToken(refreshToken);
            if (!tokenData) {
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Refresh token không hợp lệ'
                });
            }

            // Lấy thông tin user
            const user = await User.findById(tokenData.user_id);
            if (!user) {
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'User không tồn tại'
                });
            }

            // Tạo access token mới
            const accessToken = this.fastify.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            );

            reply.send({
                success: true,
                data: {
                    accessToken
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            reply.code(401).send({
                error: 'Unauthorized',
                message: 'Refresh token không hợp lệ'
            });
        }
    }

    // Đăng xuất
    async logout(request, reply) {
        try {
            const { refreshToken } = request.body;

            if (refreshToken) {
                // Thu hồi refresh token
                await db.revokeRefreshToken(refreshToken);
            }

            reply.send({
                success: true,
                message: 'Đăng xuất thành công'
            });

        } catch (error) {
            console.error('Logout error:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Đã xảy ra lỗi khi đăng xuất'
            });
        }
    }

    // Đăng xuất tất cả thiết bị
    async logoutAll(request, reply) {
        try {
            const userId = request.user.id;

            // Thu hồi tất cả refresh tokens của user
            await db.revokeAllUserTokens(userId);

            reply.send({
                success: true,
                message: 'Đã đăng xuất khỏi tất cả thiết bị'
            });

        } catch (error) {
            console.error('Logout all error:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Đã xảy ra lỗi'
            });
        }
    }

    // Lấy thông tin user hiện tại
    async getMe(request, reply) {
        try {
            const user = await User.findById(request.user.id);

            if (!user) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'User không tồn tại'
                });
            }

            reply.send({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role,
                        created_at: user.created_at,
                        last_login: user.last_login
                    }
                }
            });

        } catch (error) {
            console.error('Get me error:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Đã xảy ra lỗi'
            });
        }
    }
}

module.exports = AuthController;