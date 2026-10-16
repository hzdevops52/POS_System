import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'cashier'],
    default: 'cashier'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });

export default mongoose.model('User', userSchema);
