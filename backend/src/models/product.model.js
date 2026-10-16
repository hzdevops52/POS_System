import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true, minlength: 2, maxlength: 120
  },
  sku: {
    type: String, required: true, trim: true, uppercase: true,
    minlength: 2, maxlength: 40, match: /^[A-Z0-9_-]+$/
  },
  barcode: {
    type: String, trim: true, default: undefined, maxlength: 80
  },
  category: {
    type: String, required: true, trim: true, maxlength: 80
  },
  description: {
    type: String, trim: true, default: '', maxlength: 1000
  },
  pricePaisa: {
    type: Number, required: true, min: 0,
    validate: {
      validator: Number.isSafeInteger,
      message: 'pricePaisa must be a safe integer.'
    }
  },
  stockQty: {
    type: Number, required: true, min: 0, default: 0,
    validate: {
      validator: Number.isSafeInteger,
      message: 'stockQty must be a non-negative integer.'
    }
  },
  lowStockThreshold: {
    type: Number, required: true, min: 0, default: 5,
    validate: {
      validator: Number.isSafeInteger,
      message: 'lowStockThreshold must be a non-negative integer.'
    }
  },
  status: {
    type: String, enum: ['active', 'inactive'], default: 'active'
  }
}, {
  timestamps: true,
  versionKey: false
});

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index(
  { barcode: 1 },
  { unique: true, sparse: true }
);
productSchema.index({ name: 1 });
productSchema.index({ category: 1, status: 1 });

export default mongoose.model('Product', productSchema);
