const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const app = express();
app.use(express.json());

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Products API',
      version: '1.0.0',
      description: 'API for managing products',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, './frontend')));

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database schema
async function initializeDatabase() {
  try {
    // Drop the table if it exists to ensure a clean slate on restart
    await pool.query('DROP TABLE IF EXISTS productos');
    
    // Create products table with auto-generating ID
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        price NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database schema initialized successfully');
    
    // Check if table is empty and seed with initial data
    const result = await pool.query('SELECT COUNT(*) FROM productos');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log('Seeding database with initial products...');
      const initialProducts = [
        { name: 'Laptop Dell XPS 13', category: 'Electrónicos', stock: 5, price: 1299.99 },
        { name: 'Mouse Logitech MX Master', category: 'Accesorios', stock: 15, price: 99.99 },
        { name: 'Teclado Mecánico Corsair', category: 'Accesorios', stock: 25, price: 149.99 },
        { name: 'Monitor Samsung 27"', category: 'Electrónicos', stock: 12, price: 329.99 },
        { name: 'Auriculares Sony WH-1000XM4', category: 'Audio', stock: 3, price: 349.99 },
        { name: 'Webcam Logitech C920', category: 'Accesorios', stock: 18, price: 79.99 },
        { name: 'SSD Samsung 1TB', category: 'Almacenamiento', stock: 20, price: 119.99 },
        { name: 'Router TP-Link AC1750', category: 'Redes', stock: 7, price: 89.99 }
      ];
      
      for (const product of initialProducts) {
        await pool.query(
          'INSERT INTO productos (name, category, stock, price) VALUES ($1, $2, $3, $4)',
          [product.name, product.category, product.stock, product.price]
        );
      }
      console.log('Database seeded with initial products');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Returns a list of products
 *     responses:
 *       200:
 *         description: The list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The auto-generated id of the product.
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       stock:
 *                         type: integer
 *                       price:
 *                         type: number
 */
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    
    // Format response to match frontend expectations
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      stock: row.stock,
      price: row.price
    }));
    
    res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Creates a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: The created product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     category:
 *                       type: string
 *                     stock:
 *                       type: integer
 *                     price:
 *                       type: number
 *       400:
 *         description: Missing required fields
 */
app.post('/products', async (req, res) => {
  const { name, category, stock, price } = req.body;
  
  // Validate required fields
  if (!name || !category || stock === undefined || !price) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, category, stock, price' 
    });
  }
  
  try {
    const newProduct = await pool.query(
      'INSERT INTO productos (name, category, stock, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, stock, parseFloat(price)]
    );
    
    res.status(201).json({ 
      message: 'Producto creado exitosamente',
      product: newProduct.rows[0]
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Checks the health of the API
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

const PORT = process.env.PORT || 3000;

// Start server and initialize database
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Products endpoint: http://localhost:${PORT}/products`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

startServer().catch(console.error);