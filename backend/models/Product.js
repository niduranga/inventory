const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true, index: true },
    barcode: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0, default: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true },
    productImage: { type: String, trim: true },
    expirationDate: { type: Date, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ sku: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);