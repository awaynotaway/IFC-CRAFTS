let activeProduct = null;
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
    activeProduct = product;

    document.getElementById(
        "modalTitle"
    ).textContent =
        product.product_name;

    document.getElementById(
        "modalPrice"
    ).textContent =
        `₱${product.price}`;

const modalImage =
    document.getElementById(
        "modalImage"
    );

modalImage.src =
    product.product_image.startsWith("/")
        ? `http://localhost:5000${product.product_image}`
        : product.product_image;

modalImage.alt =
    product.product_name;

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