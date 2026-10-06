function initializeFilters() {
    document
        .querySelectorAll(".size-filter, .price-filter")
        .forEach(filter => {
            filter.addEventListener("change", applyFilters);
        });
}

function applyFilters() {
    const selectedSizes = Array.from(
        document.querySelectorAll(".size-filter:checked")
    ).map(input => input.value.trim().toLowerCase());

    const selectedPrice =
        document.querySelector(".price-filter:checked")?.value || "all";

    const filtered = allProducts.filter(product => {
        const size = String(
            product.size ?? product.product_size ?? ""
        ).trim().toLowerCase();

        const price = Number(
            String(product.price ?? "")
                .replace(/[₱,\s]/g, "")
        );

        const matchesSize =
            selectedSizes.length === 0 ||
            selectedSizes.includes(size);

        let matchesPrice = true;

        if (selectedPrice !== "all") {
            if (!Number.isFinite(price)) return false;

            switch (selectedPrice) {
                case "under100":
                    matchesPrice = price < 100;
                    break;
                case "100-150":
                    matchesPrice = price >= 100 && price <= 150;
                    break;
                case "150-200":
                    matchesPrice = price > 150 && price <= 200;
                    break;
            }
        }

        return matchesSize && matchesPrice;
    });

    renderProducts(filtered);
}