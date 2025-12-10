require('dotenv').config();
const path = require('path');
const fs = require('fs');


// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
const fastify = require('fastify')({
    logger: true // Đơn giản nhất
});
// Import các thành phần
const db = require('./config/database');
const jwtPlugin = require('./plugins/jwt');
const authMiddleware = require('./middlewares/authMiddleware');

// Đăng ký plugins
fastify.register(jwtPlugin);
fastify.register(authMiddleware);

// Đăng ký routes
fastify.register(require('./routes/auth'), { prefix: '/api/auth' });

// Route mặc định
fastify.get('/', async (request, reply) => {
    return {
        message: 'Auth API đang hoạt động',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                refreshToken: 'POST /api/auth/refresh-token',
                logout: 'POST /api/auth/logout',
                me: 'GET /api/auth/me'
            }
        }
    };
});

// Route 404 handler
fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
        error: 'Not Found',
        message: 'Route không tồn tại'
    });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = process.env.NODE_ENV === 'development'
        ? error.message
        : 'Đã xảy ra lỗi';

    reply.code(statusCode).send({
        error: error.name || 'Internal Server Error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Khởi động server
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';

        await fastify.listen({ port, host });
        console.log(`Server đang chạy tại http://${host}:${port}`);
        console.log(`Môi trường: ${process.env.NODE_ENV || 'development'}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Xử lý shutdown
process.on('SIGINT', async () => {
    console.log('Đang tắt server...');
    await fastify.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Đang tắt server...');
    await fastify.close();
    process.exit(0);
});

start();