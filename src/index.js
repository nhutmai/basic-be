const fastify = require('fastify')({
    logger: true
})
const dbPlugin = require('./plugins/jwt')
fastify.register(dbPlugin)
// Import routes
const homeRoutes = require('./routes/home')
const userRoutes = require('./routes/user')

// Đăng ký routes
fastify.register(homeRoutes)
fastify.register(userRoutes, { prefix: '/api/users' })

// Khởi động server
const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
        console.log('Server đang chạy tại http://localhost:3000')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()