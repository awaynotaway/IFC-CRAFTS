function renderProducts(products) {
    const container = document.getElementById("product-container");
    if (!container) return;

    container.replaceChildren();

    if (products.length === 0) {
        const message = document.createElement("div");
        message.className = "col-12 text-center text-muted py-4";
        message.textContent = "No products match your filters.";
        container.append(message);
        return;
    }

    products.forEach(product => {
        const column = document.createElement("div");
        column.className = "col";

        const card = document.createElement("div");
        card.className = "product-card";

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "product-img-wrapper";

        const image = document.createElement("img");
        const imagePath = String(product.product_image ?? "");

        image.className = "product-img";
        image.alt = product.product_name ?? "Product";
        image.loading = "lazy";

        if (imagePath) {
            image.src = imagePath.startsWith("/")
                ? `http://localhost:5000${imagePath}`
                : imagePath;
        }

        imageWrapper.append(image);

        const body = document.createElement("div");
        body.className = "product-body";

        const name = document.createElement("h6");
        name.className = "product-name";
        name.textContent = product.product_name ?? "";

        const size = document.createElement("p");
        size.className = "product-size text-muted mb-2";
        size.textContent = product.size ?? product.product_size ?? "";

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = `₱${product.price}`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-dark";
        button.textContent = "View";
        button.addEventListener("click", () => {
            showProductModal(product.id);
        });

        body.append(name, size, price, button);
        card.append(imageWrapper, body);
        column.append(card);
        container.append(column);
    });
}