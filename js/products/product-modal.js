function showProductModal(
    productId
) {

    const product =
        allProducts.find(
            p =>
                p.id ===
                productId
        );

    if (!product)
        return;

    document.getElementById(
        "modalTitle"
    ).textContent =
        product.product_name;

    document.getElementById(
        "modalPrice"
    ).textContent =
        `₱${product.price}`;

    document.getElementById(
        "modalImage"
    ).src =
        product.image_url;

    document.getElementById(
        "modalDescription"
    ).textContent =
        product.description;

    new bootstrap.Modal(
        document.getElementById(
            "itemModal"
        )
    ).show();

}