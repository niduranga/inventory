const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stockMovementSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    type: { type: String, enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true, default: 0 },
    newStock: { type: Number, required: true, default: 0 },
    reason: { type: String, trim: true, maxlength: 500, required: true },
    referenceType: { type: String, enum: ['SALE', 'PURCHASE', 'ADJUSTMENT', 'OTHER'], default: 'OTHER' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceType', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

stockMovementSchema.index({ productId: 1, shopId: 1 });
stockMovementSchema.index({ referenceId: 1, referenceType: 1 });
stockMovementSchema.index({ createdAt: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);