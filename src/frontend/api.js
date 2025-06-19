const API_URL = 'https://intro-ejemplo-despliegue.onrender.com';

export async function fetchProducts() {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
        throw new Error('Error loading products');
    }
    const data = await response.json();
    return data.products;
}

export async function createProduct(productData) {
    const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    });

    if (response.status !== 201) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error creating product');
    }

    return await response.json();
} 