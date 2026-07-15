import { Schema, model, Document, Types } from 'mongoose';

export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUST';

export interface ILoyaltyTransaction extends Document {
  customerId: Types.ObjectId;        // ref: Customer — always required
  orderId?: Types.ObjectId | null;   // ref: Order — required for EARN/REDEEM, optional for ADJUST
  tableId?: Types.ObjectId | null;   // ref: Table — denormalized for fast history queries
  type: LoyaltyTransactionType;
  points: number;                    // EARN: positive. REDEEM: stored as negative. ADJUST: either.
  moneyEquivalent: number;           // dollar value: EARN = item total spent, REDEEM = discount applied
  reason: string;                    // human-readable description
  createdBy?: Types.ObjectId | null; // ref: User — only set for ADJUST (admin/manager action)
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    type: {
      type: String,
      enum: ['EARN', 'REDEEM', 'ADJUST'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      // EARN → positive, REDEEM → negative (stored as-is), ADJUST → either
    },
    moneyEquivalent: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

// Fast per-customer history (most common query pattern)
LoyaltyTransactionSchema.index({ customerId: 1, createdAt: -1 });

// Fast per-order lookup — used to check if loyalty was already earned (prevents duplicates)
LoyaltyTransactionSchema.index({ orderId: 1, type: 1 });

// Fast per-table history (admin table history view)
LoyaltyTransactionSchema.index({ tableId: 1, createdAt: -1 });

export const LoyaltyTransaction = model<ILoyaltyTransaction>(
  'LoyaltyTransaction',
  LoyaltyTransactionSchema,
);
