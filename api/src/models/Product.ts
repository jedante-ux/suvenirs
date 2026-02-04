import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  productId: string;
  name: string;
  slug: string;
  description: string;
  category?: mongoose.Types.ObjectId;
  quantity: number;
  price?: number;
  salePrice?: number;
  currency: string;
  image: string;
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
      validate: {
        validator: function(this: IProduct, value: number) {
          // Sale price must be less than regular price if both exist
          if (value && this.price) {
            return value < this.price;
          }
          return true;
        },
        message: 'Sale price must be less than regular price',
      },
    },
    currency: {
      type: String,
      default: 'CLP',
      uppercase: true,
    },
    image: {
      type: String,
      default: '/placeholder-product.jpg',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret._id = String(ret._id);
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
