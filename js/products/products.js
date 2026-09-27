let allProducts = [];

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

        initializeFilters();

    }
);

async function loadProducts() {

    try {

        const response =
            await fetch(
                `${API_URL}/products`
            );

        const result =
            await response.json();

        allProducts =
            result.data || result;

        renderProducts(
            allProducts
        );

    } catch (error) {

        console.error(
            "Products Error:",
            error
        );

    }

}