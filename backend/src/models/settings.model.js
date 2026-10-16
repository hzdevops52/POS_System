import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'store',
    unique: true,
    immutable: true,
    required: true
  },
  storeName: { type: String, default: 'HZ Retail', trim: true, maxlength: 100 },
  address: { type: String, default: '', trim: true, maxlength: 300 },
  phone: { type: String, default: '', trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, maxlength: 254 },
  currency: { type: String, enum: ['PKR'], default: 'PKR' },
  receiptFooter: { type: String, default: 'Thank you for shopping with us!', trim: true, maxlength: 300 },
  showAddressOnReceipt: { type: Boolean, default: true },
  showContactOnReceipt: { type: Boolean, default: true },
  showFooterOnReceipt: { type: Boolean, default: true },
  taxEnabled: { type: Boolean, default: false },
  taxRate: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Settings', settingsSchema);
