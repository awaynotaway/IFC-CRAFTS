function renderProducts(
    products
) {

    const container =
        document.getElementById(
            "product-container"
        );

    if (!container) return;

    container.innerHTML = "";

    products.forEach(
        product => {

            container.innerHTML += `
                <div class="col">
                    <div class="card h-100">

                        ${product.image_url}

                        <div class="card-body">

                            <h6>
                                ${product.product_name}
                            </h6>

                            <p>
                                ₱${product.price}
                            </p>

                            <button
                                class="btn btn-dark"
                                onclick="
                                    showProductModal(
                                        ${product.id}
                                    )
                                "
                            >
                                View
                            </button>

                        </div>

                    </div>
                </div>
            `;

        }
    );

}