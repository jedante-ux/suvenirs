import { Router, Request, Response } from 'express';
import { BlogPost } from '../models/BlogPost.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/blog - Get all published blog posts (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      tag,
      sort = 'publishedAt',
      order = 'desc',
    } = req.query;

    const query: any = { isPublished: true };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (tag) {
      query.tags = tag;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'firstName lastName')
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching blog posts' });
  }
});

// GET /api/blog/tags - Get all unique tags
router.get('/tags', async (_req: Request, res: Response) => {
  try {
    const tags = await BlogPost.distinct('tags', { isPublished: true });
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching tags' });
  }
});

// GET /api/blog/slug/:slug - Get blog post by slug (public)
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      isPublished: true
    }).populate('author', 'firstName lastName');

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    // Increment views
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching blog post' });
  }
});

// GET /api/blog/:id - Get blog post by ID (public, only published)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({
      _id: req.params.id,
      isPublished: true
    }).populate('author', 'firstName lastName');

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching blog post' });
  }
});

// ========== ADMIN ROUTES ==========

// GET /api/blog/admin/all - Get all blog posts including drafts (Admin only)
router.get('/admin/all', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isPublished,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'firstName lastName email')
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      BlogPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching blog posts' });
  }
});

// GET /api/blog/admin/:id - Get any blog post by ID (Admin only)
router.get('/admin/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'firstName lastName email');

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching blog post' });
  }
});

// POST /api/blog - Create blog post (Admin only)
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const postData = {
      ...req.body,
      author: (req as any).user._id,
    };

    const post = await BlogPost.create(postData);
    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'firstName lastName email');

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/blog/:id - Update blog post (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email');

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    res.json({ success: true, data: post });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/blog/:id - Delete blog post (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting blog post' });
  }
});

// PATCH /api/blog/:id/publish - Toggle publish status (Admin only)
router.patch('/:id/publish', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    post.isPublished = !post.isPublished;
    if (post.isPublished && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();

    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'firstName lastName email');

    res.json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error updating blog post' });
  }
});

export default router;
