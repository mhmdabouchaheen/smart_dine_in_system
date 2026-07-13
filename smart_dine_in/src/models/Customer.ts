import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  isGuest: boolean;
  name?: string;
  email?: string;
  passwordHash?: string;
  loyaltyPoints: number;
}

const CustomerSchema: Schema = new Schema(
  {
    isGuest: {
      type: Boolean,
      default: true,
    },

    name: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      required: false,
    },

    passwordHash: {
      type: String,
      required: false,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);