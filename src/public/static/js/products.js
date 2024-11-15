
// Pagination - Letter
var container = document.querySelector('.container-card');
var prevBtn = document.getElementById('prevBtn');
var nextBtn = document.getElementById('nextBtn');
var currentPageElement = document.getElementById('currentPage');

var totalProductsTag = document.getElementById('total-products-text');

var itemsPerPage = 12;
var currentPage = 1;

// Obtener la lista de elementos .item
var itemsList = container.getElementsByClassName('card');

// Calcular el número total de páginas
var totalPages = Math.ceil(itemsList.length / itemsPerPage);

function showPage(page) {
    var startIndex = (page - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;

    // Ocultar todos los elementos .item
    for (var i = 0; i < itemsList.length; i++) {
        itemsList[i].style.display = 'none';
    }

    // Mostrar los elementos .item correspondientes a la página actual
    for (var j = startIndex; j < endIndex && j < itemsList.length; j++) {
        itemsList[j].style.display = 'block';
    }

    currentPageElement.textContent = 'Page ' + page + ' of ' + totalPages;
    currentPageElement.dataset.page = page;

    totalProductsTag.textContent = `${startIndex + 1} - ${endIndex > itemsList.length ? itemsList.length : endIndex} of ${itemsList.length} products`;
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage);
    }
}

showPage(currentPage);

prevBtn.addEventListener('click', goToPrevPage);
nextBtn.addEventListener('click', goToNextPage);

