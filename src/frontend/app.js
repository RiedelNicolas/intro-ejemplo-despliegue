import { fetchProducts, createProduct } from './api.js';

// --- UI Logic & Event Handlers ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Logic for index.html ---
    const productsTbody = document.getElementById('products-tbody');
    if (productsTbody) {
        const getStockClass = (stock) => {
            if (stock <= 5) return 'stock-low';
            if (stock <= 15) return 'stock-medium';
            return 'stock-high';
        };

        const loadProducts = async () => {
            try {
                const products = await fetchProducts();
                productsTbody.innerHTML = '';
                
                products.forEach(product => {
                    const row = document.createElement('tr');
                    const stockClass = getStockClass(product.stock);
                    
                    row.innerHTML = `
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td><span class="${stockClass}">${product.stock}</span></td>
                        <td>${product.price}</td>
                    `;
                    
                    productsTbody.appendChild(row);
                });
            } catch (error) {
                console.error('Error loading products:', error);
                productsTbody.innerHTML = '<tr><td colspan="5">Error cargando productos desde la API...</td></tr>';
            }
        };

        loadProducts();
    }

    // --- Logic for agregar-productos/index.html ---
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const form = event.target;
            const productData = {
                name: form.name.value,
                category: form.category.value,
                stock: parseInt(form.stock.value),
                price: form.price.value
            };

            try {
                await createProduct(productData);
                alert('¡Producto agregado exitosamente!');
                window.location.href = '/';
            } catch (error) {
                console.error('Error al enviar el formulario:', error);
                alert('Ocurrió un error: ' + error.message);
            }
        });
    }
}); 