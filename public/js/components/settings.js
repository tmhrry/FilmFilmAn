// =============================================================
// KOMPONEN MODAL PENGATURAN
// =============================================================
import { loadSettings, saveSettings, confirmAndReload } from '../utils/helpers.js';
import { findByImdbId } from '../utils/api.js';

export class SettingsModal {
  // Terima instance mediaModal sebagai parameter
    constructor(mediaModal) {
        // Elemen Modal
        this.modal = document.getElementById('settings-modal');
        this.toggleBtn = document.getElementById('settings-toggle-btn');
        this.closeBtn = document.getElementById('close-settings-modal');
        
        // Elemen Form
        this.languageSelect = document.getElementById('language-select');
        this.adultContentToggle = document.getElementById('adult-content-toggle');
        this.saveBtn = document.getElementById('save-settings-btn');

        // --- ELEMEN PENCARIAN IMDb ID ---
        this.imdbIdInput = document.getElementById('imdb-id-input');
        this.imdbSearchBtn = document.getElementById('imdb-search-btn');

        // Simpan instance mediaModal untuk digunakan nanti
        this.mediaModal = mediaModal;

        this.initEventListeners();
    }

    initEventListeners() {
        // Buka modal
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.open());
        }

        // Tutup modal
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Simpan pengaturan
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.save());
        }

        // --- TAMBAHKAN EVENT LISTENER UNTUK PENCARIAN IMDb ---
        if (this.imdbSearchBtn) {
            this.imdbSearchBtn.addEventListener('click', () => this.handleImdbSearch());
        }

        if (this.imdbIdInput) {
            this.imdbIdInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.handleImdbSearch();
                }
            });
        }
    }

    open() {
        const settings = loadSettings('filmFilmanSettings'); // Gunakan kunci baru
        this.languageSelect.value = settings.language;
        this.adultContentToggle.checked = settings.includeAdult;
        this.modal.style.display = 'flex';
    }

    close() {
        this.modal.style.display = 'none';
    }

    save() {
        const newSettings = {
            language: this.languageSelect.value,
            includeAdult: this.adultContentToggle.checked
        };
        
        // Simpan ke localStorage
        saveSettings(newSettings, 'filmFilmanSettings');
        
        // Tampilkan konfirmasi dan muat ulang jika disetujui
        confirmAndReload('Apakah Anda yakin ingin menerapkan pengaturan ini? Halaman FilmFilmAn akan dimuat ulang.');
    }

    // --- TAMBAHKAN FUNGSI INI --- IMDB ID
    async handleImdbSearch() {
        const imdbId = this.imdbIdInput.value.trim();

        if (!imdbId) {
            alert('Silakan masukkan IMDb ID.');
            return;
        }

        // Cari berdasarkan IMDb ID
        const results = await findByImdbId(imdbId);

        if (!results) {
            alert('Terjadi kesalahan saat mencari IMDb ID.');
            return;
        }

        let foundMedia = null;
        let mediaType = null;

        // Prioritaskan film, lalu TV series, lalu episode
        if (results.movie_results && results.movie_results.length > 0) {
            foundMedia = results.movie_results[0];
            mediaType = 'movie';
        } else if (results.tv_results && results.tv_results.length > 0) {
            foundMedia = results.tv_results[0];
            mediaType = 'tv';
        } else if (results.tv_episode_results && results.tv_episode_results.length > 0) {
            // Jika yang ditemukan adalah episode, buka modal series induknya
            foundMedia = results.tv_episode_results[0];
            mediaType = 'tv';
        }

        if (foundMedia) {
            // Tutup modal pengaturan
            this.close();
            
            // Buka modal detail media
            // Gunakan setTimeout untuk memberikan waktu transisi modal tertutup
            setTimeout(() => {
                this.mediaModal.open(foundMedia.id, mediaType);
            }, 300);
            
        } else {
            alert(`Tidak ditemukan film atau series dengan IMDb ID: ${imdbId}`);
        }
    }
}