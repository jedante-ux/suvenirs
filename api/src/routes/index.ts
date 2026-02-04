import { Router } from 'express';
import productsRouter from './products.js';
import categoriesRouter from './categories.js';
import authRouter from './auth.js';
import quotesRouter from './quotes.js';
import adminRouter from './admin.js';
import imagesRouter from './images.js';
import blogRouter from './blog.js';

const router = Router();

router.use('/products', productsRouter);
router.use('/categories', categoriesRouter);
router.use('/auth', authRouter);
router.use('/quotes', quotesRouter);
router.use('/admin', adminRouter);
router.use('/images', imagesRouter);
router.use('/blog', blogRouter);

export default router;
