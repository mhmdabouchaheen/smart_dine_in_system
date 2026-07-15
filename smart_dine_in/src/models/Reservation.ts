import { Schema, model, Document, Types } from 'mongoose';

export interface IReservation extends Document {
  tableId: Types.ObjectId;
  customerId?: Types.ObjectId; // Optional if guest booking [cite: 1, 24]
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
  dateTime: Date;
  partySize: number;
  seatingZone: 'The Counter' | 'The Dining Room' | 'The Private Cellar';
  status: 'Pending' | 'Confirmed' | 'Seated' | 'Cancelled' | 'No Show';
  notes?: string;
  depositAmount: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    tableId: { 
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: true 
    },
    customerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Customer' 
    },
    customerDetails: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true }
    },
    dateTime: { 
      type: Schema.Types.Date, 
      required: true 
    },
    partySize: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    
    status: { 
      type: String, 
      enum: ['Pending', 'Confirmed', 'Seated', 'Cancelled', 'No Show'], 
      default: 'Pending' 
    },
    notes: { 
      type: String, 
      default: '' 
    },
    depositAmount: { type: Number, default: 0, min: 0 },
    paymentId: { type: String, trim: true }
  },
  { 
    timestamps: true 
  }
);

export const Reservation = model<IReservation>('Reservation', ReservationSchema);
