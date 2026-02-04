import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/products - Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      featured,
      random,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = { isActive: true };

    if (search) {
      query.$text = { $search: search as string };
    }

    // Filter by featured products
    if (featured === 'true') {
      query.featured = true;
    }

    // Random products - use MongoDB $sample for better distribution
    if (random === 'true') {
      const pipeline: any[] = [
        { $match: query },
      ];

      // Add category lookup
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      });

      // Random sample
      pipeline.push({ $sample: { size: Number(limit) } });

      const products = await Product.aggregate(pipeline);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: 1,
          limit: Number(limit),
          total: products.length,
          totalPages: 1,
        },
      });
      return;
    }

    // Support filtering by multiple categories (comma-separated)
    if (category) {
      const categoryValues = (category as string).split(',').map(c => c.trim());

      if (categoryValues.length === 1) {
        // Single category - original logic
        const singleCategory = categoryValues[0];
        if (mongoose.Types.ObjectId.isValid(singleCategory)) {
          query.category = singleCategory;
        } else {
          const categoryDoc = await Category.findOne({ slug: singleCategory });
          if (categoryDoc) {
            query.category = categoryDoc._id;
          }
        }
      } else {
        // Multiple categories - use $in
        const categoryIds: any[] = [];

        for (const catValue of categoryValues) {
          if (mongoose.Types.ObjectId.isValid(catValue)) {
            categoryIds.push(catValue);
          } else {
            const categoryDoc = await Category.findOne({ slug: catValue });
            if (categoryDoc) {
              categoryIds.push(categoryDoc._id);
            }
          }
        }

        if (categoryIds.length > 0) {
          query.category = { $in: categoryIds };
        }
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug description icon')
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description icon');

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching product' });
  }
});

// GET /api/products/slug/:slug - Get product by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug description icon');

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching product' });
  }
});

// POST /api/products - Create product (Admin only)
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting product' });
  }
});

export default router;
