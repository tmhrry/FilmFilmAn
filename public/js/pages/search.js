// =============================================================
// LOGIKA HALAMAN PENCARIAN
// =============================================================
import { searchMulti } from '../utils/api.js';
import { MediaCard } from '../components/media-card.js';

export class SearchPage {
    constructor() {
        this.searchResultsGrid = document.getElementById('search-results-grid');
        this.searchQuerySpan = document.getElementById('search-query');
        this.totalResultsSpan = document.getElementById('total-results');
        
        // Elemen Paginasi
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.currentPageInput = document.getElementById('current-page-input');
        this.totalPagesSpan = document.getElementById('total-pages');
        
        // Variabel state untuk paginasi
        this.currentQuery = '';
        this.currentPage = 1;
        this.totalPages = 1;
        
        this.init();
    }
    
    init() {
        this.initEventListeners();
        this.loadSearchResults();
    }
    
    initEventListeners() {
        // Event listener untuk tombol paginasi
        this.prevPageBtn.addEventListener('click', () => this.changePage(this.currentPage - 1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(this.currentPage + 1));
        this.currentPageInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const newPage = parseInt(e.target.value, 10);
                this.changePage(newPage);
            }
        });
    }
    
    async loadSearchResults() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query');
        const pageParam = urlParams.get('page');
        
        if (!query) {
            this.searchResultsGrid.innerHTML = '<p class="empty-state">Tidak ada query pencarian yang ditemukan di URL.</p>';
            return;
        }
        
        // Simpan query global
        this.currentQuery = query;
        
        // Tampilkan query yang dicari di header
        this.searchQuerySpan.textContent = query;
        
        // Tampilkan spinner
        this.searchResultsGrid.innerHTML = '<div class="spinner"></div>';
        
        // Ambil data untuk halaman yang diminta
        const searchResults = await searchMulti(query, pageParam ? parseInt(pageParam) : 1);
        
        if (searchResults && searchResults.results) {
            this.renderMediaGrid(this.searchResultsGrid, searchResults.results);
            this.updatePaginationControls(searchResults);
        } else {
            this.searchResultsGrid.innerHTML = '<p class="empty-state">Terjadi kesalahan saat mengambil data pencarian.</p>';
        }
    }
    
    async changePage(newPage) {
        // Validasi halaman baru
        if (newPage < 1 || newPage > this.totalPages || isNaN(newPage)) {
            return;
        }
        
        // Update state
        this.currentPage = newPage;
        
        // Tampilkan spinner
        this.searchResultsGrid.innerHTML = '<div class="spinner"></div>';
        
        // Ambil data untuk halaman baru
        const searchResults = await searchMulti(this.currentQuery, this.currentPage);
        
        if (searchResults && searchResults.results) {
            this.renderMediaGrid(this.searchResultsGrid, searchResults.results);
            this.updatePaginationControls(searchResults);
        } else {
            this.searchResultsGrid.innerHTML = '<p class="empty-state">Terjadi kesalahan saat mengambil data halaman.</p>';
        }
    }
    
    renderMediaGrid(gridElement, mediaList) {
        gridElement.innerHTML = ''; // Kosongkan grid sebelumnya
        
        if (!mediaList || mediaList.length === 0) {
            gridElement.innerHTML = '<p class="empty-state">Tidak ada hasil yang ditemukan untuk pencarian ini.</p>';
            return;
        }
        
        mediaList.forEach(media => {
            // Hanya tampilkan 'movie' dan 'tv', abaikan 'person'
            if (media.media_type === 'movie' || media.media_type === 'tv') {
                const card = new MediaCard(media, media.media_type);
                gridElement.appendChild(card.getElement());
            }
        });
    }
    
    updatePaginationControls(searchResults) {
        this.currentPage = searchResults.page;
        this.totalPages = searchResults.total_pages;
        
        this.currentPageInput.value = this.currentPage;
        this.totalPagesSpan.textContent = this.totalPages;
        this.totalResultsSpan.textContent = searchResults.total_results.toLocaleString('id-ID');
        
        // Nonaktifkan tombol jika perlu
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
    }
}