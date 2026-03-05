const express = require('express');
const {
    getNotifications,
    markNotificationsAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizeRoles('owner', 'manager', 'staff'), getNotifications);
router.post('/mark-read', authorizeRoles('owner', 'manager', 'staff'), (req, res, next) => {
    if (!req.body || !Array.isArray(req.body.notificationIds) || req.body.notificationIds.length === 0) {
        return res.status(400).json({ message: 'Please provide an array of notification IDs.' });
    }
    const validIds = req.body.notificationIds.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) {
        return res.status(400).json({ message: 'One or more provided notification IDs are invalid.' });
    }
    next();
}, markNotificationsAsRead);
router.delete('/:id', authorizeRoles('owner', 'manager'), deleteNotification);

module.exports = router;