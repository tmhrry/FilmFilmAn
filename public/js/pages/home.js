// =============================================================
// LOGIKA HALAMAN BERANDA
// =============================================================
import { fetchLatestMovies, fetchLatestSeries } from '../utils/api.js';
import { MediaCard } from '../components/media-card.js';

export class HomePage {
    constructor() {
        this.latestMoviesGrid = document.getElementById('latest-movies-grid');
        this.latestSeriesGrid = document.getElementById('latest-series-grid');
        
        this.init();
    }
    
    async init() {
        await this.loadContent();
    }
    
    async loadContent() {
        // Tampilkan spinner sambil menunggu data
        this.latestMoviesGrid.innerHTML = '<div class="spinner"></div>';
        this.latestSeriesGrid.innerHTML = '<div class="spinner"></div>';
        
        // Ambil data film terbaru
        const latestMoviesData = await fetchLatestMovies();
        if (latestMoviesData) {
            this.renderMediaGrid(this.latestMoviesGrid, latestMoviesData.results, 'movie');
        }
        
        // Ambil data series terbaru
        const latestSeriesData = await fetchLatestSeries();
        if (latestSeriesData) {
            this.renderMediaGrid(this.latestSeriesGrid, latestSeriesData.results, 'tv');
        }
    }
    
    renderMediaGrid(gridElement, mediaList, mediaType) {
        gridElement.innerHTML = ''; // Kosongkan grid sebelumnya
        
        if (!mediaList || mediaList.length === 0) {
            gridElement.innerHTML = '<p class="empty-state">Tidak ada media yang ditemukan.</p>';
            return;
        }
        
        mediaList.forEach(media => {
            const card = new MediaCard(media, mediaType);
            gridElement.appendChild(card.getElement());
        });
    }
}