import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';
import { globalCoalescer } from '../utils/requestCoalescer';

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const category = await MenuCategory.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await MenuCategory.find().sort({ createdAt: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const newItem = await MenuItem.create(req.body);
    globalCoalescer.invalidate(`menu:category:${req.body.categoryId}`);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    globalCoalescer.invalidate(`menu:category:${updatedItem.categoryId}`);
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getMenuItemsByCategory = async (req: Request, res: Response): Promise<void> => {
  // Explicitly cast to string to fix TS error
  const categoryId = req.params.categoryId as string; 
  const cacheKey = `menu:category:${categoryId}`;
  
  try {
    const items = await globalCoalescer.execute(
      cacheKey,
      async () => await MenuItem.find({ 
          categoryId: new Types.ObjectId(categoryId), 
          isAvailable: true 
      }),
      { cacheTTL: 10000 }
    );
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};