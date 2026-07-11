import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
  name: string;
  quantityInStock: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pieces';
  reorderThreshold: number; // Alerts the manager when stock drops below this number
}

const IngredientSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  quantityInStock: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  unit: { 
    type: String, 
    enum: ['kg', 'g', 'L', 'ml', 'pieces'], 
    required: true 
  },
  reorderThreshold: { 
    type: Number, 
    required: true, 
    default: 10 
  }
}, { timestamps: true });

export const Ingredient = mongoose.model<IIngredient>('Ingredient', IngredientSchema);