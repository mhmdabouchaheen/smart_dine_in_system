import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId?: mongoose.Types.ObjectId;
  reservationId?: mongoose.Types.ObjectId;
  amount: number;
  method: 'Cash' | 'Card' | 'LoyaltyPoints';
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string; // Optional: Used if you connect to Stripe or a card reader later
  cardName?: string;
  cardNumberLast4?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  orderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order', 
    required: false
  },
  reservationId: {
    type: Schema.Types.ObjectId,
    ref: 'Reservation',
    required: false
  },
  amount: { 
    type: Number, 
    required: true 
  },
  method: { 
    type: String, 
    enum: ['Cash', 'Card', 'LoyaltyPoints'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'], 
    default: 'Pending' 
  },
  transactionId: { 
    type: String, 
    required: false 
  },
  cardName: { type: String, trim: true },
  cardNumberLast4: { type: String, match: /^\d{4}$/ }
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
