import { Schema, model, Document } from 'mongoose';

export interface IOrderItem {
  menuItemId: Schema.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  tableId: Schema.Types.ObjectId;
  customerId?: Schema.Types.ObjectId;
  userId?: Schema.Types.ObjectId;
  reservationId?: Schema.Types.ObjectId;
  items: IOrderItem[];
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
  totalAmount: number;
  paymentStatus: 'Pending' | 'Paid';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
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
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
}, { timestamps: true });

export const Order = model<IOrder>('Order', OrderSchema);