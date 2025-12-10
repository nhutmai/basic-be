async function homeRoutes(fastify, options) {
    // Route GET /
    fastify.get('/', async (request, reply) => {
        return {
            message: 'Chào mừng đến với Fastify API',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        }
    })

    // Route GET /health
    fastify.get('/health', async (request, reply) => {
        return {
            status: 'OK',
            uptime: process.uptime()
        }
    })

    // Route POST /echo
    fastify.post('/echo', async (request, reply) => {
        return {
            received: request.body,
            headers: request.headers
        }
    })
}

module.exports = homeRoutes