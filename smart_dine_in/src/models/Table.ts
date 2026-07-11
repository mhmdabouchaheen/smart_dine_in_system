import { Schema, model, Document } from 'mongoose';

export interface ITable extends Document {
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Resetting';
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
    status: { 
      type: String, 
      enum: ['Available', 'Occupied', 'Reserved', 'Resetting'], 
      default: 'Available' 
    }
  },
  { timestamps: true }
);

export const Table = model<ITable>('Table', tableSchema);