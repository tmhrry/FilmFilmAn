// =============================================================
// LOGIKA HALAMAN DISCOVER
// =============================================================
import { fetchDiscover, fetchGenres } from '../utils/api.js';
import { MediaCard } from '../components/media-card.js';

export class DiscoverPage {
    constructor() {
        // State
        this.currentMediaType = 'movie';
        this.currentPage = 1;
        this.totalPages = 1;
        this.filters = {
            sort_by: 'popularity.desc',
            with_genres: '',
            primary_release_year: '', // Untuk film
            first_air_date_year: '' // Untuk series
        };

        // Elemen DOM
        this.discoverGrid = document.getElementById('discover-grid');
        this.resultsTitle = document.getElementById('results-title');
        
        // Filter Elements
        this.movieToggle = document.getElementById('movie-toggle');
        this.seriesToggle = document.getElementById('series-toggle');
        this.sortBySelect = document.getElementById('sort-by-select');
        this.genreContainer = document.getElementById('genre-checkbox-container');
        this.yearInput = document.getElementById('year-input');
        this.applyFiltersBtn = document.getElementById('apply-filters-btn');

        // Pagination Elements
        this.prevPageBtn = document.getElementById('prev-page-btn');
        this.nextPageBtn = document.getElementById('next-page-btn');
        this.currentPageInput = document.getElementById('current-page-input');
        this.totalPagesSpan = document.getElementById('total-pages');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFilterOptions();
        this.loadResults(); // HANYA muat hasil sekali di awal
    }

    setupEventListeners() {
        // Toggle Media Type
        this.movieToggle.addEventListener('click', () => this.switchMediaType('movie'));
        this.seriesToggle.addEventListener('click', () => this.switchMediaType('tv'));

        // Apply Filters - SATU-SATUNYA TEMPAT PEMANGGILAN loadResults() UNTUK FILTER
        this.applyFiltersBtn.addEventListener('click', () => {
            this.currentPage = 1; // Reset ke halaman 1
            this.updateFiltersFromForm();
            this.loadResults();
        });

        // Pagination
        this.prevPageBtn.addEventListener('click', () => this.changePage(this.currentPage - 1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(this.currentPage + 1));
        this.currentPageInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const newPage = parseInt(e.target.value, 10);
                this.changePage(newPage);
            }
        });
    }

    async loadFilterOptions() {
        this.populateSortByOptions();
        await this.populateGenreOptions();
    }

    populateSortByOptions() {
        const movieOptions = [
            { value: 'popularity.desc', text: 'Populer' },
            { value: 'vote_average.desc', text: 'Rating Tertinggi' },
            { value: 'release_date.desc', text: 'Tanggal Rilis Terbaru' },
            { value: 'release_date.asc', text: 'Tanggal Rilis Terlama' },
            { value: 'title.asc', text: 'Judul (A-Z)' },
            { value: 'title.desc', text: 'Judul (Z-A)' }
        ];

        const tvOptions = [
            { value: 'popularity.desc', text: 'Populer' },
            { value: 'vote_average.desc', text: 'Rating Tertinggi' },
            { value: 'first_air_date.desc', text: 'Tanggal Tayang Terbaru' },
            { value: 'first_air_date.asc', text: 'Tanggal Tayang Terlama' },
            { value: 'name.asc', text: 'Nama (A-Z)' },
            { value: 'name.desc', text: 'Nama (Z-A)' }
        ];

        const options = this.currentMediaType === 'movie' ? movieOptions : tvOptions;
        this.sortBySelect.innerHTML = '';
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            this.sortBySelect.appendChild(option);
        });
    }

    async populateGenreOptions() {
        this.genreContainer.innerHTML = '';

        const allGenresLabel = document.createElement('label');
        allGenresLabel.innerHTML = `<input type="checkbox" id="genre-all" value="" checked> Semua Genre`;
        this.genreContainer.appendChild(allGenresLabel);

        // PERMINTAAN API INI DIPERLUKAN UNTUK MENGISI Opsi Genre
        const genres = await fetchGenres(this.currentMediaType);
        
        genres.forEach(genre => {
            const genreLabel = document.createElement('label');
            genreLabel.innerHTML = `
                <input type="checkbox" class="genre-checkbox" value="${genre.id}">
                ${genre.name}
            `;
            this.genreContainer.appendChild(genreLabel);
        });

        const allGenresCheckbox = document.getElementById('genre-all');
        allGenresCheckbox.addEventListener('change', () => {
            if (allGenresCheckbox.checked) {
                document.querySelectorAll('.genre-checkbox').forEach(cb => cb.checked = false);
            }
        });

        document.querySelectorAll('.genre-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    allGenresCheckbox.checked = false;
                }
            });
        });
    }

    // =============================================================
    // FUNGSI INI HANYA MEMPERBARUI UI, TIDAK MELAKUKAN REQUEST DATA
    // =============================================================
    switchMediaType(mediaType) {
        if (this.currentMediaType === mediaType) return;

        // Update state internal
        this.currentMediaType = mediaType;

        // Update UI Toggle
        if (mediaType === 'movie') {
            this.movieToggle.classList.add('active');
            this.seriesToggle.classList.remove('active');
            this.resultsTitle.textContent = 'Film Populer';
            this.yearInput.placeholder = 'Contoh: 2023';
        } else {
            this.seriesToggle.classList.add('active');
            this.movieToggle.classList.remove('active');
            this.resultsTitle.textContent = 'Series Populer';
            this.yearInput.placeholder = 'Contoh: 2023';
        }
        
        // HANYA muat ulang opsi filter (genre dan sort).
        // TIDAK ADA pemanggilan loadResults() di sini.
        this.loadFilterOptions();
    }

    updateFiltersFromForm() {
        this.filters.sort_by = this.sortBySelect.value;
        
        const checkedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked'))
                                    .map(cb => cb.value);

        this.filters.with_genres = checkedGenres.join(',');
        
        if (this.currentMediaType === 'movie') {
            this.filters.primary_release_year = this.yearInput.value;
            delete this.filters.first_air_date_year;
        } else {
            this.filters.first_air_date_year = this.yearInput.value;
            delete this.filters.primary_release_year;
        }
    }

    // =============================================================
    // FUNGSI INI SATU-SATUNYA YANG MELAKUKAN REQUEST DATA UTAMA
    // =============================================================
    async loadResults() {
        this.discoverGrid.innerHTML = '<div class="spinner"></div>';
        
        const params = { ...this.filters, page: this.currentPage };
        const results = await fetchDiscover(this.currentMediaType, params);

        if (results && results.results) {
            this.renderMediaGrid(results.results);
            this.updatePaginationControls(results);
        } else {
            this.discoverGrid.innerHTML = '<p class="empty-state">Gagal memuat data. Coba lagi nanti.</p>';
        }
    }

    renderMediaGrid(mediaList) {
        this.discoverGrid.innerHTML = '';
        if (!mediaList || mediaList.length === 0) {
            this.discoverGrid.innerHTML = '<p class="empty-state">Tidak ada hasil yang ditemukan dengan filter ini.</p>';
            return;
        }

        mediaList.forEach(media => {
            const card = new MediaCard(media, this.currentMediaType);
            this.discoverGrid.appendChild(card.getElement());
        });
    }

    updatePaginationControls(results) {
        this.currentPage = results.page;
        this.totalPages = results.total_pages;

        this.currentPageInput.value = this.currentPage;
        this.totalPagesSpan.textContent = this.totalPages;

        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
    }

    changePage(newPage) {
        if (newPage < 1 || newPage > this.totalPages || isNaN(newPage)) {
            return;
        }
        this.currentPage = newPage;
        this.loadResults(); // Panggil di sini karena mengubah halaman adalah menerapkan filter baru
    }
}