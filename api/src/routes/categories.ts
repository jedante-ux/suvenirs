import { Router, Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    // Get a sample product image for each category
    const categoriesWithImages = await Promise.all(
      categories.map(async (category) => {
        const categoryObj = category.toJSON();

        // If category already has an image, use it
        if (categoryObj.image) {
          return categoryObj;
        }

        // Otherwise, get a product image from this category
        const sampleProduct = await Product.findOne({
          category: category._id,
          isActive: true,
          image: { $ne: '/placeholder-product.jpg' }
        }).select('image');

        if (sampleProduct) {
          categoryObj.image = sampleProduct.image;
        } else {
          // If no product with real image, try any product
          const anyProduct = await Product.findOne({
            category: category._id,
            isActive: true
          }).select('image');

          if (anyProduct) {
            categoryObj.image = anyProduct.image;
          }
        }

        return categoryObj;
      })
    );

    res.json({ success: true, data: categoriesWithImages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching categories' });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching category' });
  }
});

// GET /api/categories/slug/:slug - Get category by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching category' });
  }
});

// POST /api/categories - Create category (Admin only)
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting category' });
  }
});

export default router;
