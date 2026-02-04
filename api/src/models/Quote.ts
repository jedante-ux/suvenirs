import mongoose, { Document, Schema } from 'mongoose';

export interface IQuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  description: string;
}

export interface IQuote extends Document {
  quoteNumber: string;
  items: IQuoteItem[];
  totalItems: number;
  totalUnits: number;
  quotedAmount?: number;  // Monto cotizado en CLP
  finalAmount?: number;   // Monto final de venta en CLP
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'quoted' | 'approved' | 'rejected' | 'completed';
  source: 'whatsapp' | 'web' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

const quoteItemSchema = new Schema<IQuoteItem>(
  {
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
    },
  },
  { _id: false }
);

const quoteSchema = new Schema<IQuote>(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [quoteItemSchema],
      required: true,
      validate: {
        validator: (items: IQuoteItem[]) => items.length > 0,
        message: 'At least one item is required',
      },
    },
    totalItems: {
      type: Number,
      required: true,
    },
    totalUnits: {
      type: Number,
      required: true,
    },
    quotedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerCompany: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'quoted', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['whatsapp', 'web', 'manual'],
      default: 'web',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
quoteSchema.index({ quoteNumber: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ customerEmail: 1 });

// Pre-save middleware to generate quote number
quoteSchema.pre('save', async function (next) {
  if (this.isNew && !this.quoteNumber) {
    const count = await Quote.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.quoteNumber = `COT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

export const Quote = mongoose.model<IQuote>('Quote', quoteSchema);
