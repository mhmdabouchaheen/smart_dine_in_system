import { Schema, model, Document, Types } from 'mongoose';

// TypeScript Interface for the Recipe Ingredient item
interface IRecipeIngredient {
  ingredientId: Types.ObjectId; // References the exact ingredient in your inventory
  quantityRequired: number;             // Amount needed for exactly 1 portion
}

// TypeScript Interface representing a Menu Item document
export interface IMenuItem extends Document {
  categoryId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number; // Stored in minutes (e.g., 15) 
  recipe: IRecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema definition
const MenuItemSchema = new Schema<IMenuItem>(
  {
    categoryId: { 
      type: Schema.Types.ObjectId, 
      ref: 'MenuCategory', // Enforces relationship integrity to your categories 
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true,
      min: 0 
    },
    imageUrl: { 
      type: String, 
      required: true 
    },
    isAvailable: { 
      type: Boolean, 
      default: true // Easily toggles a dish on/off in the app 
    },
    preparationTime: { 
      type: Number, 
      required: true,
      min: 1 // Minutes required in the kitchen 
    },
    recipe: [
      {
        ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
        quantityRequired: { type: Number, required: true, min: 0 }
      }
    ]
  },
  { 
    timestamps: true 
  }
);

export const MenuItem = model<IMenuItem>('MenuItem', MenuItemSchema);