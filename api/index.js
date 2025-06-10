// ...existing code...
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Configura con tus propios valores de conexión
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'productos',
  password: '123456',
  port: 5432,
});

// Obtiene todos los productos
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crea un nuevo producto
app.post('/products', async (req, res) => {
  const { nombre, precio } = req.body;
  try {
    await pool.query('INSERT INTO productos (nombre, precio) VALUES($1, $2)', [nombre, precio]);
    res.status(201).json({ message: 'Producto creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}`);
});
// ...existing code...