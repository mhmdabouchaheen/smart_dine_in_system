import { Schema, model, Document } from 'mongoose';

// 1. TypeScript Interface representing a Category document
export interface IMenuCategory extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Mongoose Schema definition
const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    }
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt [cite: 45]
  }
);

// 3. Export the Compiled Model
export const MenuCategory = model<IMenuCategory>('MenuCategory', MenuCategorySchema);