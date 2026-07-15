import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  tableId: Types.ObjectId;
  customerId?: Types.ObjectId;
  customerIds?: Types.ObjectId[];
  userId?: Types.ObjectId;
  userIds?: Types.ObjectId[];
  reservationId?: Types.ObjectId;
  items: IOrderItem[];
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
  totalAmount: number;
  
  // --- UPDATED & NEW FIELDS ---
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod?: string;
  needsAssistance?: boolean;
  note?: string;
  noteAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  customerIds: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation' },
  items: [{
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    specialInstructions: { type: String, default: '' }
  }],
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  totalAmount: { type: Number, required: true, min: 0 },
  
  // --- UPDATED & NEW FIELDS ---
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentMethod: { type: String, default: 'card' },
  needsAssistance: { type: Boolean, default: false },
  note: { type: String, default: '' },
  noteAt: { type: Date },
}, { timestamps: true });

export const Order = model<IOrder>('Order', OrderSchema);
