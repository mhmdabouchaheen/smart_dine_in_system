import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  isGuest: boolean;
  name?: string; 
  email?: string; // Only required if isGuest is false
  loyaltyPoints: number;
}

const CustomerSchema: Schema = new Schema({
  isGuest: {
    type: Boolean,
    default: true // Defaults to guest unless they explicitly log in
  },
  name: { type: String, required: false },
  email: { 
    type: String, 
    unique: true, 
    sparse: true // Allows multiple guests to not have an email
  },
  loyaltyPoints: { 
    type: Number, 
    default: 0 // Will increase as they complete orders
  }
}, { timestamps: true });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);