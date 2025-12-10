const userSchema = {
    schema: {
        body: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
                name: { type: 'string', minLength: 3 },
                email: { type: 'string', format: 'email' },
                age: { type: 'number', minimum: 0 }
            }
        }
    }
}

async function userRoutesWithValidation(fastify, options) {
    // POST với validation
    fastify.post('/', userSchema, async (request, reply) => {
        const newUser = {
            id: users.length + 1,
            ...request.body
        }

        users.push(newUser)
        reply.code(201)
        return newUser
    })
}
