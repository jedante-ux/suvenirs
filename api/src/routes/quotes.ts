import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Quote } from '../models/Quote.js';
import { authenticate, authorize } from '../middleware/auth.js';

const createQuoteSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    name: z.string().min(1).optional(),
    quantity: z.number().int().positive(),
    customization: z.string().max(500).optional(),
  })).min(1, 'At least one item is required'),
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().max(20).optional(),
  customerCompany: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(['web', 'whatsapp', 'email', 'phone']).optional(),
});

const router = Router();

const quoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many quote requests, please try again later' },
});

// POST /api/quotes - Create a new quote (public - from cart)
router.post('/', quoteLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = createQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }
    const { items, customerName, customerEmail, customerPhone, customerCompany, notes, source } = parsed.data;

    const totalItems = items.length;
    const totalUnits = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

    const quote = await Quote.create({
      items,
      totalItems,
      totalUnits,
      customerName,
      customerEmail,
      customerPhone,
      customerCompany,
      notes,
      source: source || 'web',
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/quotes - Get all quotes (Admin only)
router.get('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [quotes, total] = await Promise.all([
      Quote.find(query)
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Math.min(Number(limit), 100)),
      Quote.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: quotes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching quotes' });
  }
});

// GET /api/quotes/stats - Get quote statistics (Admin only)
router.get('/stats', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
  try {
    const [
      total,
      pending,
      contacted,
      quoted,
      approved,
      completed,
      rejected,
    ] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pending' }),
      Quote.countDocuments({ status: 'contacted' }),
      Quote.countDocuments({ status: 'quoted' }),
      Quote.countDocuments({ status: 'approved' }),
      Quote.countDocuments({ status: 'completed' }),
      Quote.countDocuments({ status: 'rejected' }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        contacted,
        quoted,
        approved,
        completed,
        rejected,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching stats' });
  }
});

// GET /api/quotes/:id - Get single quote (Admin only)
router.get('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching quote' });
  }
});

// PUT /api/quotes/:id - Update quote (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/quotes/:id/status - Update quote status (Admin only)
router.put('/:id/status', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required' });
      return;
    }

    const validStatuses = ['pending', 'contacted', 'quoted', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error updating quote status' });
  }
});

// DELETE /api/quotes/:id - Delete quote (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    res.json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting quote' });
  }
});

export default router;
