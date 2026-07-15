import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
  /** Which logged-in Customer added this item. null = added by a guest. */
  addedByCustomerId?: Types.ObjectId | null;
  /** When this item was added to the order */
  addedAt?: Date;
}

export interface IOrder extends Document {
  tableId: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerIds?: Types.ObjectId[];
  userId?: Types.ObjectId;
  userIds?: Types.ObjectId[];
  customerName?: string;
  customerEmail?: string;
  reservationId?: Types.ObjectId;
  items: IOrderItem[];
  orderSummary?: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
  totalAmount: number;
  loyaltyDiscount?: number;
  amountDue?: number;
  
  // --- UPDATED & NEW FIELDS ---
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod?: string;
  needsAssistance?: boolean;
  note?: string;
  noteAt?: Date;
  /** True once loyalty points have been awarded for this order. Guards against double-earning. */
  loyaltyProcessed: boolean;
  preparationStartedAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerIds: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  customerName: { type: String },
  customerEmail: { type: String },
  reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation' },
  items: [{
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    specialInstructions: { type: String, default: '' },
    addedByCustomerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    addedAt: { type: Date, default: () => new Date() },
  }],
  orderSummary: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  totalAmount: { type: Number, required: true, min: 0 },
  loyaltyDiscount: { type: Number, default: 0, min: 0 },
  amountDue: { type: Number, min: 0 },
  
  // --- UPDATED & NEW FIELDS ---
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String, default: 'card' },
  needsAssistance: { type: Boolean, default: false },
  note: { type: String, default: '' },
  noteAt: { type: Date },
  loyaltyProcessed: { type: Boolean, default: false },
  preparationStartedAt: { type: Date },
  readyAt: { type: Date },
  servedAt: { type: Date },
}, { timestamps: true });

export const Order = model<IOrder>('Order', OrderSchema);
