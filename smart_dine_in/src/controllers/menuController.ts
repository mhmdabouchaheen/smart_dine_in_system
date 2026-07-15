import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';
import { Order } from '../models/Order';
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
    const body = req.body || {};
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      image,
      isAvailable,
      preparationTime,
      prepTimeMinutes,
      recipe,
      recipeIngredients,
      ...rest
    } = body;

    if (!categoryId || !name) {
      res.status(400).json({ error: 'categoryId and name are required' });
      return;
    }

    const normalizedItem = {
      categoryId,
      name,
      description: description || '',
      price: Number(price ?? 0),
      imageUrl: imageUrl || image || 'https://example.com/default-food.jpg',
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
      preparationTime: Number(preparationTime ?? prepTimeMinutes ?? 10),
      recipe: Array.isArray(recipe) ? recipe : Array.isArray(recipeIngredients) ? recipeIngredients : [],
      ...rest,
    };

    const newItem = await MenuItem.create(normalizedItem);
    globalCoalescer.invalidate(`menu:category:${categoryId}`);
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

export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }

    // Check if this item appears in any active (non-paid, non-completed) orders
    const activeOrderWithItem = await Order.findOne({
      'items.menuItemId': item._id,
      status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] },
      paymentStatus: { $ne: 'Paid' },
    });

    if (activeOrderWithItem) {
      // Cannot hard-delete — disable the item instead
      item.isAvailable = false;
      await item.save();
      globalCoalescer.invalidate(`menu:category:${item.categoryId}`);
      res.status(200).json({
        message: 'Item has active orders and cannot be deleted. It has been disabled instead.',
        item,
        disabled: true,
      });
      return;
    }

    await MenuItem.findByIdAndDelete(id);
    globalCoalescer.invalidate(`menu:category:${item.categoryId}`);
    res.status(200).json({ message: 'Menu item deleted successfully', deleted: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};