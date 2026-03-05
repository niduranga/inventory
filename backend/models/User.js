const mongoose = require('mongoose');
const { hashPassword } = require('../utils/passwordUtils');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['superadmin', 'owner', 'manager', 'staff'], default: 'staff' },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await hashPassword(this.password);
    next();
});

module.exports = mongoose.model('User', userSchema);