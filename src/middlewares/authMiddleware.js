const User = require('../models/User');

async function authMiddleware(fastify) {
    fastify.decorate('auth', {
        // Middleware xác thực user thông thường
        user: async function(request, reply) {
            try {
                await request.jwtVerify();

                // Kiểm tra user có tồn tại không
                const user = await User.findById(request.user.id);
                if (!user) {
                    reply.code(401).send({
                        error: 'Unauthorized',
                        message: 'User không tồn tại'
                    });
                    return;
                }

                // Lưu thông tin user vào request
                request.user = user;
            } catch (err) {
                reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Token không hợp lệ'
                });
            }
        },

        // Middleware xác thực admin
        admin: async function(request, reply) {
            try {
                await request.jwtVerify();

                const user = await User.findById(request.user.id);
                if (!user || user.role !== 'admin') {
                    reply.code(403).send({
                        error: 'Forbidden',
                        message: 'Không có quyền truy cập'
                    });
                    return;
                }

                request.user = user;
            } catch (err) {
                reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Token không hợp lệ'
                });
            }
        },

        // Middleware kiểm tra quyền
        checkRole: (roles) => {
            return async function(request, reply) {
                try {
                    await request.jwtVerify();

                    const user = await User.findById(request.user.id);
                    if (!user || !roles.includes(user.role)) {
                        reply.code(403).send({
                            error: 'Forbidden',
                            message: 'Không có quyền truy cập'
                        });
                        return;
                    }

                    request.user = user;
                } catch (err) {
                    reply.code(401).send({
                        error: 'Unauthorized',
                        message: 'Token không hợp lệ'
                    });
                }
            };
        }
    });
}

module.exports = authMiddleware;