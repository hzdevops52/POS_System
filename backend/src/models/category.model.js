import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

categorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

export default mongoose.model('Category', categorySchema);
