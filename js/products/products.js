let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeFilters();
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
            throw new Error("Failed to load products.");
        }

        const result = await response.json();
        const products = result.data ?? result;

        if (!Array.isArray(products)) {
            throw new Error("Invalid products response.");
        }

        allProducts = products.filter(product =>
            String(product.status ?? "")
                .trim()
                .toLowerCase() === "active"
        );

        applyFilters();
    } catch (error) {
        console.error("Products Error:", error);

        const container = document.getElementById("product-container");

        if (container) {
            container.textContent =
                "Unable to load products. Please refresh and try again.";
        }
    }
}