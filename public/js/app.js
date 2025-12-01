// =============================================================
// APLIKASI UTAMA
// =============================================================
import { CONFIG } from './utils/constants.js';
import { handleSearch } from './components/search.js';

// Import komponen modal
import { MediaModal } from './components/modal.js';
import { SettingsModal } from './components/settings.js';

// Import kelas halaman
import { HomePage } from './pages/home.js';
import { SearchPage } from './pages/search.js';
import { DiscoverPage } from './pages/discover.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi komponen modal
    const mediaModal = new MediaModal();
        // TERUSKAN instance mediaModal ke SettingsModal
    const settingsModal = new SettingsModal(mediaModal);
    
    // Event listener untuk kartu media (menggunakan event delegation)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.media-card');
        if (card) {
            const mediaType = card.dataset.type; // 'movie' atau 'tv'
            const mediaId = card.dataset.id;
            
            if (mediaType && mediaId) {
                mediaModal.open(mediaId, mediaType);
            }
        }
    });
    
    // Event listener untuk tombol pencarian
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Tentukan halaman mana yang sedang aktif dan inisialisasi
    if (document.getElementById('latest-movies-section')) {
        // Ini adalah halaman beranda
        const homePage = new HomePage();
    } else if (document.getElementById('search-results-grid')) {
        // Ini adalah halaman pencarian
        const searchPage = new SearchPage();
    } else if (document.getElementById('discover-grid')) {
        // Ini adalah halaman discover
        const discoverPage = new DiscoverPage();
    }
});