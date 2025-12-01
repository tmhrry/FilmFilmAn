    export function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();

    if (query === '') {
        alert('Silakan masukkan judul film atau series yang ingin dicari.');
        return;
    }

    const searchUrl = `search.html?query=${encodeURIComponent(query)}`;
    window.location.href = searchUrl;
}
    
