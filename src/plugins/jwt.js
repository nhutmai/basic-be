const fp = require('fastify-plugin');
const fastifyJwt = require('@fastify/jwt');

async function jwtPlugin(fastify, options) {
    // Đăng ký fastify-jwt
    fastify.register(fastifyJwt, {
        secret: {
            private: process.env.JWT_SECRET,
            public: process.env.JWT_SECRET
        },
        sign: {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        },
        verify: {
            maxAge: process.env.JWT_EXPIRES_IN || '24h'
        }
    });

    // Decorate fastify instance với các helper methods
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.decorate('generateTokens', function(user) {
        const accessToken = fastify.jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            }
        );

        const refreshToken = fastify.jwt.sign(
            {
                id: user.id,
                type: 'refresh'
            },
            {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
            }
        );

        return { accessToken, refreshToken };
    });

    fastify.decorate('verifyRefreshToken', async function(token) {
        try {
            const decoded = fastify.jwt.verify(token, {
                secret: process.env.JWT_REFRESH_SECRET
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (err) {
            throw new Error('Invalid refresh token');
        }
    });
}

module.exports = fp(jwtPlugin);