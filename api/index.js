const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize database schema
async function initializeDatabase() {
  try {
    // Create products table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        price VARCHAR(20) NOT NULL,
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
        { id: '001', name: 'Laptop Dell XPS 13', category: 'Electrónicos', stock: 5, price: '$1,299.99' },
        { id: '002', name: 'Mouse Logitech MX Master', category: 'Accesorios', stock: 15, price: '$99.99' },
        { id: '003', name: 'Teclado Mecánico Corsair', category: 'Accesorios', stock: 25, price: '$149.99' },
        { id: '004', name: 'Monitor Samsung 27"', category: 'Electrónicos', stock: 12, price: '$329.99' },
        { id: '005', name: 'Auriculares Sony WH-1000XM4', category: 'Audio', stock: 3, price: '$349.99' },
        { id: '006', name: 'Webcam Logitech C920', category: 'Accesorios', stock: 18, price: '$79.99' },
        { id: '007', name: 'SSD Samsung 1TB', category: 'Almacenamiento', stock: 20, price: '$119.99' },
        { id: '008', name: 'Router TP-Link AC1750', category: 'Redes', stock: 7, price: '$89.99' }
      ];
      
      for (const product of initialProducts) {
        await pool.query(
          'INSERT INTO productos (id, name, category, stock, price) VALUES ($1, $2, $3, $4, $5)',
          [product.id, product.name, product.category, product.stock, product.price]
        );
      }
      console.log('Database seeded with initial products');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Get all products
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

// Create a new product
app.post('/products', async (req, res) => {
  const { id, name, category, stock, price } = req.body;
  
  // Validate required fields
  if (!id || !name || !category || stock === undefined || !price) {
    return res.status(400).json({ 
      error: 'Missing required fields: id, name, category, stock, price' 
    });
  }
  
  try {
    await pool.query(
      'INSERT INTO productos (id, name, category, stock, price) VALUES ($1, $2, $3, $4, $5)',
      [id, name, category, stock, price]
    );
    
    res.status(201).json({ 
      message: 'Producto creado exitosamente',
      product: { id, name, category, stock, price }
    });
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Product with this ID already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Health check endpoint
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
  });
}

startServer().catch(console.error);