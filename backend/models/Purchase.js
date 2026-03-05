const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const purchaseSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        quantity: { type: Number, required: true, min: 1 },
        purchasePrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now, required: true },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'PENDING'], required: true, default: 'PENDING' },
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

purchaseSchema.pre('save', function(next) {
    if (!this.isNew) return next();

    if (!this.products || this.products.length === 0) {
        return next(new Error('Purchase must contain at least one product.'));
    }

    let calculatedTotalAmount = 0;
    for (const item of this.products) {
        item.totalPrice = item.quantity * item.purchasePrice;
        calculatedTotalAmount += item.totalPrice;
    }
    this.totalAmount = calculatedTotalAmount;
    this.finalAmount = this.totalAmount + this.taxAmount - this.discount;

    if (this.finalAmount < 0) {
        this.finalAmount = 0;
    }
    next();
});

purchaseSchema.index({ shopId: 1, supplierId: 1 });
purchaseSchema.index({ shopId: 1, purchaseDate: 1 });
purchaseSchema.index({ shopId: 1, paymentStatus: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);