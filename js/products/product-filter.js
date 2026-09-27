function initializeFilters() {

    const filters =
        document.querySelectorAll(
            ".size-filter, .price-filter"
        );

    filters.forEach(
        filter => {

            filter.addEventListener(
                "change",
                applyFilters
            );

        }
    );

}

function applyFilters() {

    let filtered =
        [...allProducts];

    renderProducts(
        filtered
    );

}