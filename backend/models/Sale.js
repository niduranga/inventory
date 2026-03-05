const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const saleSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, trim: true, index: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        sellingPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'ONLINE'], required: true },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'FAILED'], required: true, default: 'PENDING' },
    customerName: { type: String, trim: true, maxlength: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

saleSchema.pre('save', async function(next) {
    if (this.isNew) {
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.receiptNumber = `${datePrefix}-${uuidv4().substring(0, 6).toUpperCase()}`;

        let calculatedSubtotal = 0;
        for (const item of this.products) {
            item.totalPrice = item.quantity * item.sellingPrice;
            calculatedSubtotal += item.totalPrice;
        }
        this.subtotal = calculatedSubtotal;
        this.totalAmount = this.subtotal + this.taxAmount - this.discount;

        if (this.totalAmount < 0) {
            this.totalAmount = 0;
        }
    }
    next();
});

saleSchema.index({ shopId: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ shopId: 1, createdAt: 1 });
saleSchema.index({ shopId: 1, paymentMethod: 1 });
saleSchema.index({ shopId: 1, createdBy: 1 });

module.exports = mongoose.model('Sale', saleSchema);