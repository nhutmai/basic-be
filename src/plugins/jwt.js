const fp = require('fastify-plugin')

async function dbConnector(fastify, options) {
    // Giả lập kết nối database
    const mockDb = {
        query: async (sql) => {
            console.log(`Query: ${sql}`)
            return { rows: [] }
        },
        connect: async () => {
            console.log('Đã kết nối database')
            return true
        },
        disconnect: async () => {
            console.log('Đã ngắt kết nối database')
            return true
        }
    }

    // Thêm db vào fastify instance
    fastify.decorate('db', mockDb)

    // Kết nối database khi server khởi động
    fastify.addHook('onReady', async () => {
        await mockDb.connect()
    })

    // Đóng kết nối khi server dừng
    fastify.addHook('onClose', async () => {
        await mockDb.disconnect()
    })
}

module.exports = fp(dbConnector)