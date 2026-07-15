export interface LoyaltySettings {
  pointsPerDollar: number;
  dollarValuePerPoint: number;
  minimumRedemptionPoints: number;
  maximumRedemptionPoints: number;
  isEnabled: boolean;
}

export interface LoyaltySummary {
  loyaltyPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  lastRewardActivity?: string;
  settings: LoyaltySettings;
}

export interface LoyaltyTransaction {
  _id: string;
  customerId: string;
  orderId?: {
    _id: string;
    totalAmount: number;
    tableId: string;
    status: string;
  } | null;
  tableId?: {
    _id: string;
    tableNumber: number;
  } | null;
  type: 'EARN' | 'REDEEM' | 'ADJUST';
  points: number;
  moneyEquivalent: number;
  reason: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalculateRedemptionResponse {
  customerBalance: number;
  maxRedeemable: number;
  discountValue: number;
  dollarValuePerPoint: number;
  minimumRedemptionPoints: number;
  maximumRedemptionPoints: number;
}

export interface RedeemResponse {
  message: string;
  pointsRedeemed: number;
  discountApplied: number;
  newBalance: number;
  updatedOrderTotal: number;
}
