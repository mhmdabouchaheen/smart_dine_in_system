import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  isGuest: boolean;
  name?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  /** Unique identifier for guest sessions — server-side tracking */
  guestSessionId?: string;
  /** Current redeemable balance — cached sum of the LoyaltyTransaction ledger */
  loyaltyPoints: number;
  /** Lifetime total earned — never decreases after a redemption */
  totalPointsEarned: number;
  /** Lifetime total redeemed — absolute value, always positive */
  totalPointsRedeemed: number;
  /** Timestamp of the last EARN or REDEEM event */
  lastRewardActivity?: Date;
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

    phone: {
      type: String,
      required: false,
      trim: true,
    },

    guestSessionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: false,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
    },

    // --- Loyalty cache fields (Phase 3 addition) ---
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRewardActivity: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);