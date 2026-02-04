import { Router, Request, Response } from 'express';
import multer from 'multer';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Quote } from '../models/Quote.js';
import { Category } from '../models/Category.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// GET /api/admin/sales/monthly - Get monthly sales stats
router.get('/sales/monthly', async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    // Default to current month if not provided
    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth(); // month is 0-indexed

    // Create date range for the month
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Get completed quotes for the month
    const completedQuotes = await Quote.find({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Calculate totals
    const totalSales = completedQuotes.length;
    const totalUnits = completedQuotes.reduce((sum, quote) => sum + quote.totalUnits, 0);
    const totalAmount = completedQuotes.reduce((sum, quote) => sum + (quote.finalAmount || quote.quotedAmount || 0), 0);

    // Get all quotes (not just completed) for the month for comparison
    const allQuotesInMonth = await Quote.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth + 1,
        monthName: startDate.toLocaleDateString('es-CL', { month: 'long' }),
        sales: {
          count: totalSales,
          totalUnits,
          totalAmount,
          totalQuotes: allQuotesInMonth,
          conversionRate: allQuotesInMonth > 0 ? ((totalSales / allQuotesInMonth) * 100).toFixed(1) : '0',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching monthly sales' });
  }
});

// GET /api/admin/dashboard - Get dashboard stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStockProducts,
      totalUsers,
      totalQuotes,
      pendingQuotes,
      recentQuotes,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ featured: true }),
      Product.countDocuments({ quantity: 0 }),
      User.countDocuments(),
      Quote.countDocuments(),
      Quote.countDocuments({ status: 'pending' }),
      Quote.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          featured: featuredProducts,
          outOfStock: outOfStockProducts,
        },
        users: {
          total: totalUsers,
        },
        quotes: {
          total: totalQuotes,
          pending: pendingQuotes,
          recent: recentQuotes,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching dashboard data' });
  }
});

// ========== USER MANAGEMENT ==========

// GET /api/admin/users - Get all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sort as string]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching users' });
  }
});

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching user' });
  }
});

// POST /api/admin/users - Create new user/admin
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, company, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      role: role || 'user',
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, company, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, company, role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/users/:id/password - Reset user password
router.put('/users/:id/password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting user' });
  }
});

// ========== PRODUCTS MANAGEMENT (additional admin routes) ==========

// GET /api/admin/products - Get all products (including inactive)
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      featured,
      isActive,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category (can be comma-separated slugs)
    if (category) {
      const categorySlugs = (category as string).split(',').map(s => s.trim());
      const categoryDocs = await Category.find({ slug: { $in: categorySlugs } });
      const categoryIds = categoryDocs.map(cat => cat._id);

      if (categoryIds.length > 0) {
        query.category = { $in: categoryIds };
      }
    }

    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
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

// POST /api/admin/products/import - Import products from CSV/Excel
router.post('/products/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      res.status(400).json({ success: false, error: 'File is empty or has no data rows' });
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['productId', 'name', 'description', 'quantity', 'image'];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required columns: ${missingHeaders.join(', ')}`
      });
      return;
    }

    let imported = 0;
    let errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Find category by categoryId if provided
        let categoryId = null;
        if (row.category) {
          const category = await Category.findOne({ categoryId: row.category });
          if (category) {
            categoryId = category._id;
          }
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ productId: row.productId });

        // Parse price if provided
        let price: number | undefined;
        if (row.price || row.precio) {
          const priceStr = row.price || row.precio;
          const cleanPrice = priceStr.replace(/[$.\s]/g, '').replace(',', '.');
          price = parseFloat(cleanPrice);
          if (isNaN(price) || price < 0) price = undefined;
        }

        if (existingProduct) {
          // Update existing product
          const updateData: any = {
            name: row.name,
            description: row.description,
            quantity: parseInt(row.quantity) || 0,
            image: row.image,
            category: categoryId,
            featured: row.featured === 'true',
            isActive: row.isActive !== 'false', // Default to true
          };
          if (price !== undefined) updateData.price = price;

          await Product.findByIdAndUpdate(existingProduct._id, updateData);
        } else {
          // Create new product
          const createData: any = {
            productId: row.productId,
            name: row.name,
            slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: row.description,
            quantity: parseInt(row.quantity) || 0,
            image: row.image,
            category: categoryId,
            featured: row.featured === 'true',
            isActive: row.isActive !== 'false', // Default to true
          };
          if (price !== undefined) createData.price = price;

          await Product.create(createData);
        }

        imported++;
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported} products imported successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/products/import-prices - Import product prices from CSV
router.post('/products/import-prices', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      res.status(400).json({ success: false, error: 'File is empty or has no data rows' });
      return;
    }

    // Parse header - support both comma and semicolon separators
    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

    // Check for required column (productId or codigo or id)
    const idColumnIndex = headers.findIndex(h =>
      h === 'productid' || h === 'codigo' || h === 'id' || h === 'product_id' || h === 'sku'
    );
    const priceColumnIndex = headers.findIndex(h =>
      h === 'price' || h === 'precio' || h === 'valor' || h === 'monto' || h === 'price_clp'
    );
    const salePriceColumnIndex = headers.findIndex(h =>
      h === 'saleprice' || h === 'sale_price' || h === 'precio_oferta' || h === 'descuento'
    );

    if (idColumnIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'Missing required column: productId (or codigo, id, sku)'
      });
      return;
    }

    if (priceColumnIndex === -1) {
      res.status(400).json({
        success: false,
        error: 'Missing required column: price (or precio, valor, monto)'
      });
      return;
    }

    let updated = 0;
    let notFound = 0;
    let errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(separator).map(v => v.trim());

        const productId = values[idColumnIndex];
        const priceStr = values[priceColumnIndex];
        const salePriceStr = salePriceColumnIndex !== -1 ? values[salePriceColumnIndex] : null;

        if (!productId || !priceStr) {
          continue; // Skip empty rows
        }

        // Parse price - handle different formats (1000, 1.000, 1,000, $1.000)
        const cleanPrice = priceStr.replace(/[$.\s]/g, '').replace(',', '.');
        const price = parseFloat(cleanPrice);

        if (isNaN(price) || price < 0) {
          errors.push(`Row ${i + 1}: Invalid price "${priceStr}"`);
          continue;
        }

        // Parse sale price if present
        let salePrice: number | undefined;
        if (salePriceStr && salePriceStr.trim()) {
          const cleanSalePrice = salePriceStr.replace(/[$.\s]/g, '').replace(',', '.');
          salePrice = parseFloat(cleanSalePrice);
          if (isNaN(salePrice) || salePrice < 0) {
            salePrice = undefined;
          }
        }

        // Find and update product
        const product = await Product.findOne({ productId: productId });

        if (product) {
          const updateData: any = { price };
          if (salePrice !== undefined && salePrice < price) {
            updateData.salePrice = salePrice;
          }

          await Product.findByIdAndUpdate(product._id, updateData);
          updated++;
        } else {
          notFound++;
          errors.push(`Row ${i + 1}: Product "${productId}" not found`);
        }
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      updated,
      notFound,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Limit errors to first 20
      totalErrors: errors.length,
      message: `${updated} product prices updated${notFound > 0 ? `, ${notFound} products not found` : ''}${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== CATEGORIES MANAGEMENT ==========

// POST /api/admin/categories - Create new category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parent, order, isActive, image, icon } = req.body;

    // Auto-generate categoryId
    const allCategories = await Category.find().sort({ categoryId: -1 }).limit(1);
    let nextCategoryNumber = 1;

    if (allCategories.length > 0 && allCategories[0].categoryId) {
      // Extract the number from the last categoryId (e.g., "CAT-175" -> 175)
      const lastIdNumber = parseInt(allCategories[0].categoryId.replace('CAT-', ''));
      nextCategoryNumber = lastIdNumber + 1;
    }

    const categoryId = `CAT-${String(nextCategoryNumber).padStart(3, '0')}`;

    const category = await Category.create({
      categoryId,
      name,
      slug,
      description,
      parent: parent || null,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      image,
      icon,
      productCount: 0,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parent, order, isActive, image, icon } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, description, parent: parent || null, order, isActive, image, icon },
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

// DELETE /api/admin/categories/:id - Delete category
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    // Check if category has products
    const productsWithCategory = await Product.countDocuments({ category: req.params.id });
    if (productsWithCategory > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete category with ${productsWithCategory} products. Please reassign or delete the products first.`
      });
      return;
    }

    // Check if category has children
    const childCategories = await Category.countDocuments({ parent: req.params.id });
    if (childCategories > 0) {
      res.status(400).json({
        success: false,
        error: `Cannot delete category with ${childCategories} sub-categories. Please delete or reassign the sub-categories first.`
      });
      return;
    }

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
