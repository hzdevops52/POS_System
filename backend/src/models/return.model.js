import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  unitPricePaisa: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  refundPaisa: { type: Number, required: true, min: 0, validate: Number.isSafeInteger }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true,
    index: true
  },
  receiptNumber: { type: String, required: true, trim: true, index: true },
  items: {
    type: [returnItemSchema],
    required: true,
    validate: {
      validator: items => items.length > 0,
      message: 'A return must contain at least one item.'
    }
  },
  totalRefundPaisa: {
    type: Number,
    required: true,
    min: 0,
    validate: Number.isSafeInteger
  },
  reason: { type: String, required: true, trim: true, maxlength: 300 }
}, {
  timestamps: true,
  versionKey: false
});

returnSchema.index({ createdAt: -1, _id: -1 });
returnSchema.index({ sale: 1, createdAt: -1 });

export default mongoose.model('Return', returnSchema);
