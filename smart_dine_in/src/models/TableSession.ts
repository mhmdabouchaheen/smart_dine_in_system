import { Schema, model, Document, Types } from 'mongoose';

export interface ITableSession extends Document {
  tableId: Types.ObjectId;
  /** Set for registered customers */
  customerId?: Types.ObjectId;
  /** Set for guests — server-side guest identity */
  guestSessionId?: string;
  active: boolean;
  startedAt: Date;
  /** Set when the session is closed (order paid / table freed) */
  endedAt?: Date;
}

const TableSessionSchema = new Schema<ITableSession>(
  {
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    guestSessionId: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Index for fast lookup of active sessions per table
TableSessionSchema.index({ tableId: 1, active: 1 });
TableSessionSchema.index({ guestSessionId: 1 });
TableSessionSchema.index({ customerId: 1 });

export const TableSession = model<ITableSession>('TableSession', TableSessionSchema);
