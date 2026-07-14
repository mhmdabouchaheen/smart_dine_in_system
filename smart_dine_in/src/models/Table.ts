import { Schema, model, Document } from 'mongoose';

export interface ITable extends Document {
  tableNumber: number;
  capacity: number;
  zone: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Resetting';
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    tableNumber: { 
      type: Number, 
      required: true, 
      unique: true 
    },
    capacity: { 
      type: Number, 
      required: true 
    },
    zone: { type: String, default: 'Dining Room', trim: true },
    status: { 
      type: String, 
      enum: ['Available', 'Occupied', 'Reserved', 'Resetting'], 
      default: 'Available' 
    }
  },
  { timestamps: true }
);

export const Table = model<ITable>('Table', tableSchema);
