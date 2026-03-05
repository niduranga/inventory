const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, match: [/.+\@.+\..+/, 'Please fill a valid email address'] },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

supplierSchema.index({ name: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', supplierSchema);