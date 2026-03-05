const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shopName: { type: String, required: true, trim: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    address: { type: String, trim: true },
    timezone: { type: String, default: 'UTC' },
    subscriptionPlan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'basic' },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);