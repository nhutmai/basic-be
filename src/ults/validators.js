const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validators = {
    // Validation cho register
    registerSchema: {
        body: {
            type: 'object',
            required: ['username', 'email', 'password', 'confirmPassword'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[a-zA-Z0-9_]+$'
                },
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 6
                },
                confirmPassword: {
                    type: 'string'
                },
                full_name: {
                    type: 'string',
                    maxLength: 100
                }
            }
        }
    },

    // Validation cho login
    loginSchema: {
        body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string'
                }
            }
        }
    },

    // Validation cho refresh token
    refreshTokenSchema: {
        body: {
            type: 'object',
            required: ['refreshToken'],
            properties: {
                refreshToken: { type: 'string' }
            }
        }
    },

    // Validation cho đổi mật khẩu
    changePasswordSchema: {
        body: {
            type: 'object',
            required: ['currentPassword', 'newPassword', 'confirmPassword'],
            properties: {
                currentPassword: { type: 'string' },
                newPassword: { type: 'string', minLength: 6 },
                confirmPassword: { type: 'string' }
            }
        }
    },

    // Custom validation functions
    validateEmail: (email) => {
        return emailRegex.test(email);
    },

    validatePassword: (password) => {
        return password.length >= 6;
    },

    validateRegisterData: (data) => {
        const errors = [];

        if (!validators.validateEmail(data.email)) {
            errors.push('Email không hợp lệ');
        }

        if (!validators.validatePassword(data.password)) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        }

        if (data.password !== data.confirmPassword) {
            errors.push('Mật khẩu xác nhận không khớp');
        }

        if (data.username.length < 3) {
            errors.push('Username phải có ít nhất 3 ký tự');
        }

        return errors;
    }
};

module.exports = validators;