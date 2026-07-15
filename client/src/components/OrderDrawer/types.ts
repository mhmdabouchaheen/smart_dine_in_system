// client/src/components/OrderDrawer/types.ts

export interface OrderItemPayload {
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
  totalAmount: number; // Make sure this matches your database key
  paymentStatus: 'Paid' | 'Pending';
  status: 'Pending';
  needsAssistance: boolean;
}