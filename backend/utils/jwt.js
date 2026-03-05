const jwt = require('jsonwebtoken');

// Sign a JWT
const signToken = (payload, expiresIn = '1d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: expiresIn,
    });
};

// Verify a JWT
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        // Token is invalid or expired
        return null;
    }
};

module.exports = {
    signToken,
    verifyToken,
};
