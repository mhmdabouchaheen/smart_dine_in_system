import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  method: 'Cash' | 'Card' | 'LoyaltyPoints';
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string; // Optional: Used if you connect to Stripe or a card reader later
}

const PaymentSchema: Schema = new Schema({
  orderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
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
  }
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);