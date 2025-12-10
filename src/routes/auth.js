const validators = require('../ults/validators');

async function authRoutes(fastify, options) {
    const AuthController = require('../controllers/authController');
    const authController = new AuthController(fastify);

    // Đăng ký
    fastify.post('/register', {
        schema: validators.registerSchema,
        handler: authController.register.bind(authController)
    });

    // Đăng nhập
    fastify.post('/login', {
        schema: validators.loginSchema,
        handler: authController.login.bind(authController)
    });

    // Refresh token
    fastify.post('/refresh-token', {
        schema: validators.refreshTokenSchema,
        handler: authController.refreshToken.bind(authController)
    });

    // Đăng xuất - SỬA: dùng fastify.authenticate thay vì fastify.auth.user
    fastify.post('/logout', {
        preHandler: fastify.authenticate,
        schema: validators.refreshTokenSchema,
        handler: authController.logout.bind(authController)
    });

    // Đăng xuất tất cả thiết bị - SỬA
    fastify.post('/logout-all', {
        preHandler: fastify.authenticate,
        handler: authController.logoutAll.bind(authController)
    });

    // Lấy thông tin user hiện tại - SỬA
    fastify.get('/me', {
        preHandler: fastify.authenticate,
        handler: authController.getMe.bind(authController)
    });
}

module.exports = authRoutes;