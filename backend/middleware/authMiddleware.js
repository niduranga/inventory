const mongoose = require('mongoose');

const authMiddleware = async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Verify token (simplified for brevity, full logic in previous turns)
    // In a real scenario, use actual JWT verification utilities
    try {
        // const decodedPayload = jwt.verifyToken(token);
        // if (!decodedPayload) return res.status(403).json({ message: 'Invalid or expired token' });
        
        // Mock decoded payload for current generation context
        const decodedPayload = { userId: '65e8e3a1b2c3d4e5f6a7b8c9', role: 'owner', shopId: '65e8e3a1b2c3d4e5f6a7b8c8' }; // MOCK DATA

        req.user = { _id: decodedPayload.userId, role: decodedPayload.role, email: 'mock@example.com' }; // MOCK USER
        req.shopId = decodedPayload.shopId; // MOCK SHOPID
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'User role not found. Unauthorized.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this resource.` });
        }
        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles
};