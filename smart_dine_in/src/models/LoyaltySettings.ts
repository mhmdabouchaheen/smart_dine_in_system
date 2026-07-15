import { Schema, model, Document, Types } from 'mongoose';

export interface ILoyaltySettings extends Document {
  /** Points earned per $1 spent on owned items. e.g. 1 = earn 1 point per $1 */
  pointsPerDollar: number;
  /** Dollar value of 1 point when redeeming. e.g. 0.01 = 1 point = $0.01 (100pts = $1) */
  dollarValuePerPoint: number;
  /** Minimum points balance required before any redemption is allowed */
  minimumRedemptionPoints: number;
  /** Maximum points that can be redeemed in a single order */
  maximumRedemptionPoints: number;
  /** Global on/off switch — when false, no earning or redemption occurs */
  isEnabled: boolean;
  /** Ref: User — who last updated these settings */
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltySettingsSchema = new Schema<ILoyaltySettings>(
  {
    pointsPerDollar: {
      type: Number,
      required: true,
      min: 0,
      default: 1, // earn 1 point per $1 spent
    },
    dollarValuePerPoint: {
      type: Number,
      required: true,
      min: 0,
      default: 0.20, // 5 points = $1 discount
    },
    minimumRedemptionPoints: {
      type: Number,
      required: true,
      min: 0,
      default: 100, // must have at least 100 points to redeem anything
    },
    maximumRedemptionPoints: {
      type: Number,
      required: true,
      min: 0,
      default: 100, // max 100 points can be used per order
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

export const LoyaltySettings = model<ILoyaltySettings>(
  'LoyaltySettings',
  LoyaltySettingsSchema,
);
