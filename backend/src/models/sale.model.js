import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPricePaisa: { type: Number, required: true, min: 0 },
  lineTotalPaisa: { type: Number, required: true, min: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  items: {
    type: [saleItemSchema],
    required: true,
    validate: {
      validator: items => items.length > 0,
      message: 'A sale must contain at least one item.'
    }
  },
  subtotalPaisa: { type: Number, required: true, min: 0 },
  totalPaisa: { type: Number, required: true, min: 0 },
  // Optional in the schema for compatibility with historical sales.
  amountReceivedPaisa: { type: Number, min: 0 },
  changePaisa: { type: Number, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed'],
    default: 'completed',
    required: true
  },
  returnRevision: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  versionKey: false
});

saleSchema.index({ createdAt: -1 });

export default mongoose.model('Sale', saleSchema);
