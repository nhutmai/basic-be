// Dữ liệu mẫu
let users = [
    { id: 1, name: 'Nguyễn Văn A', email: 'a@example.com' },
    { id: 2, name: 'Trần Thị B', email: 'b@example.com' }
]

async function userRoutes(fastify, options) {
    // GET /users - Lấy tất cả users
    fastify.get('/', async (request, reply) => {
        return users
    })

    // GET /users/:id - Lấy user theo ID
    fastify.get('/:id', async (request, reply) => {
        const id = parseInt(request.params.id)
        const user = users.find(u => u.id === id)

        if (!user) {
            reply.code(404)
            return { error: 'Không tìm thấy user' }
        }

        return user
    })

    // POST /users - Tạo user mới
    fastify.post('/', async (request, reply) => {
        const newUser = {
            id: users.length + 1,
            ...request.body
        }

        users.push(newUser)
        reply.code(201)
        return newUser
    })

    // PUT /users/:id - Cập nhật user
    fastify.put('/:id', async (request, reply) => {
        const id = parseInt(request.params.id)
        const index = users.findIndex(u => u.id === id)

        if (index === -1) {
            reply.code(404)
            return { error: 'Không tìm thấy user' }
        }

        users[index] = { id, ...request.body }
        return users[index]
    })

    // DELETE /users/:id - Xóa user
    fastify.delete('/:id', async (request, reply) => {
        const id = parseInt(request.params.id)
        const initialLength = users.length
        users = users.filter(u => u.id !== id)

        if (users.length === initialLength) {
            reply.code(404)
            return { error: 'Không tìm thấy user' }
        }

        return { success: true, message: 'Đã xóa user' }
    })
}

module.exports = userRoutes