import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['receive', 'adjustment', 'sale', 'return'],
    required: true
  },
  quantityChange: {
    type: Number,
    required: true,
    validate: Number.isSafeInteger
  },
  previousQty: {
    type: Number,
    required: true,
    min: 0,
    validate: Number.isSafeInteger
  },
  newQty: {
    type: Number,
    required: true,
    min: 0,
    validate: Number.isSafeInteger
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  reference: {
    type: String,
    trim: true,
    default: '',
    maxlength: 100
  }
}, {
  timestamps: true,
  versionKey: false
});

inventoryMovementSchema.index({ createdAt: -1, _id: -1 });
inventoryMovementSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('InventoryMovement', inventoryMovementSchema);
