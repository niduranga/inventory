const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    type: { type: String, enum: ['LOW_STOCK', 'EXPIRATION', 'SALE_ALERT', 'PURCHASE_ALERT', 'NEW_USER_INVITE', 'OTHER'], required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false },
    relatedProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true, default: null },
}, { timestamps: true });

notificationSchema.index({ shopId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ shopId: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);