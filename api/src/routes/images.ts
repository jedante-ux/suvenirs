import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { pexelsService } from '../services/pexels.service.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// GET /api/images/search - Search images from Pexels
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, page = 1, perPage = 15 } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Query parameter is required' });
      return;
    }

    const result = await pexelsService.searchPhotos(
      query,
      Number(page),
      Number(perPage)
    );

    if (!result) {
      res.status(503).json({
        success: false,
        error: 'Image service unavailable. Please check API configuration.'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        photos: result.photos.map((photo) => ({
          id: photo.id,
          url: photo.src.medium,
          urls: {
            original: photo.src.original,
            large: photo.src.large,
            medium: photo.src.medium,
            small: photo.src.small,
          },
          alt: photo.alt,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
        })),
        page: result.page,
        perPage: result.per_page,
        totalResults: result.total_results,
        hasMore: !!result.next_page,
      },
    });
  } catch (error: any) {
    console.error('Error searching images:', error);
    res.status(500).json({ success: false, error: 'Error searching images' });
  }
});

// GET /api/images/curated - Get curated images from Pexels
router.get('/curated', async (req: Request, res: Response) => {
  try {
    const { page = 1, perPage = 15 } = req.query;

    const result = await pexelsService.getCuratedPhotos(
      Number(page),
      Number(perPage)
    );

    if (!result) {
      res.status(503).json({
        success: false,
        error: 'Image service unavailable. Please check API configuration.'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        photos: result.photos.map((photo) => ({
          id: photo.id,
          url: photo.src.medium,
          urls: {
            original: photo.src.original,
            large: photo.src.large,
            medium: photo.src.medium,
            small: photo.src.small,
          },
          alt: photo.alt,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
        })),
        page: result.page,
        perPage: result.per_page,
        totalResults: result.total_results,
        hasMore: !!result.next_page,
      },
    });
  } catch (error: any) {
    console.error('Error fetching curated images:', error);
    res.status(500).json({ success: false, error: 'Error fetching curated images' });
  }
});

export default router;
