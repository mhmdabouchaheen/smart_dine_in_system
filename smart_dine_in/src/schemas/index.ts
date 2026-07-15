import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
const mongoId = z.string().refine(
  (val) => /^[a-f\d]{24}$/i.test(val),
  { message: 'Invalid MongoDB ObjectId' }
)

// ---------------------------------------------------------------------------
// Order schemas
// ---------------------------------------------------------------------------
export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  qty: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  price: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  specialInstructions: z.string().optional(),
}).refine((data) => (data.qty ?? data.quantity) !== undefined, {
  message: 'Either qty or quantity is required',
})

export const CreateOrderSchema = z.object({
  tableId: z.union([z.string().min(1), z.number()]).optional(),
  tableNumber: z.number().int().min(1).optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  totalAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['card', 'staff_assisted']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'Pending', 'Paid', 'Failed']).optional(),
  needsAssistance: z.boolean().optional(),
  customerId: z.string().optional(),
  userId: z.string().optional(),
  guestSessionId: z.string().optional(),
  reservationId: z.string().optional(),
}).refine(
  (data) => !!(data.tableId || data.tableNumber),
  { message: 'tableId or tableNumber is required' }
)

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

// ---------------------------------------------------------------------------
// Reservation schemas
// ---------------------------------------------------------------------------
export const CustomerDetailsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
})

export const CreateReservationSchema = z.object({
  tableId: z.union([z.string().min(1), z.number()]),
  customerDetails: CustomerDetailsSchema.optional(),
  name: z.string().min(2).optional(),
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  dateTime: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  partySize: z.number().int().min(1, 'Party size must be at least 1'),
  notes: z.string().optional(),
  status: z.enum(['Pending', 'Confirmed', 'Seated', 'Cancelled', 'No Show']).optional(),
  depositAmount: z.number().min(0).optional(),
  paymentId: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------
export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SignupInput = z.infer<typeof SignupSchema>

// ---------------------------------------------------------------------------
// Notification schemas
// ---------------------------------------------------------------------------
export const CreateNotificationSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['Order', 'Reservation', 'Assistance', 'General', 'Urgent']).default('General'),
  recipientRole: z.enum(['Admin', 'Waiter', 'Customer', 'Kitchen', 'Manager']),
  recipientId: mongoId.optional(),
})

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
