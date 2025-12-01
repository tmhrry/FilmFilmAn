// =============================================================
// KOMPONEN MODAL
// =============================================================
import { CONFIG } from '../utils/constants.js';
import { fetchDetails, fetchSeasonEpisodes } from '../utils/api.js';

export class MediaModal {
    constructor() {
        // Elemen Modal Utama
        this.modal = document.getElementById('media-modal');
        this.closeBtn = document.getElementById('close-modal');
        this.poster = document.getElementById('modal-poster');
        this.title = document.getElementById('modal-title');
        this.meta = document.getElementById('modal-meta');
        this.overview = document.getElementById('modal-overview');
        this.videoPlayer = document.getElementById('video-player');
        this.serverSelect = document.getElementById('server-select');
        
        // Elemen Selector Series
        this.seriesSelector = document.getElementById('series-selector');
        this.seasonSelect = document.getElementById('season-select');
        this.episodeSelect = document.getElementById('episode-select');

        // State internal
        this.currentMediaType = null;
        this.currentMediaId = null;
        this.currentEpisodes = [];

        this.initEventListeners();
    }
    
    initEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        window.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });

        // Event listener untuk perubahan server
        this.serverSelect.addEventListener('change', (e) => this.updateVideoSource(e.target.value));

        // Event listener untuk selector series
        this.seasonSelect.addEventListener('change', () => this.onSeasonChange());
        this.episodeSelect.addEventListener('change', () => this.onEpisodeChange());
    }
    
    async open(mediaId, mediaType) {
        this.currentMediaType = mediaType;
        this.currentMediaId = mediaId;

        // Ambil daftar server terbaru dari backend
        await this.populateServerDropdown();

        if (mediaType === 'movie') {
            await this.openMovie(mediaId);
        } else if (mediaType === 'tv') {
            await this.openSeries(mediaId);
        }
        
        this.modal.style.display = 'flex';
    }
    
    close() {
        this.modal.style.display = 'none';
        this.videoPlayer.src = '';
        this.seriesSelector.style.display = 'none'; // Sembunyikan selector saat modal ditutup
    }

    async openMovie(movieId) {
        this.seriesSelector.style.display = 'none'; // Pastikan selector series disembunyikan
        const details = await fetchDetails(movieId, false);
        if (!details) return;

        this.title.innerText = details.title;
        const year = (details.release_date || '').substring(0, 4);
        const runtime = details.runtime ? `${details.runtime} menit` : 'N/A';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        this.meta.innerText = `${year} • ${runtime} • ${rating}/10`;
        this.overview.innerText = details.overview || 'Tidak ada ringkasan tersedia.';
        this.poster.src = details.poster_path ? `${CONFIG.IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Image';
        
        // this.populateServerDropdown();
        this.updateVideoSource(this.serverSelect.value); // Perbarui video untuk film
    }

    async openSeries(seriesId) {
        const details = await fetchDetails(seriesId, true);
        if (!details) return;

        // Tampilkan info series secara default
        this.title.innerText = details.name;
        const year = (details.first_air_date || '').substring(0, 4);
        const seasons = details.number_of_seasons ? `${details.number_of_seasons} Musim` : 'N/A';
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        this.meta.innerText = `${year} • ${seasons} • ${rating}/10`;
        this.overview.innerText = details.overview || 'Tidak ada ringkasan tersedia.';
        this.poster.src = details.poster_path ? `${CONFIG.IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/ffffff?text=No+Image';

        // Tampilkan dan isi selector
        this.seriesSelector.style.display = 'flex';
        this.populateSeasons(details.seasons);
        
        // this.populateServerDropdown();
        // this.updateVideoSource(this.serverSelect.value); // Perbarui video untuk series
    }

    populateSeasons(seasons) {
        this.seasonSelect.innerHTML = '';
        seasons.forEach(season => {
            // Abaikan season 0 (specials)
            if (season.season_number === 0) return;
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Season ${season.season_number}`;
            this.seasonSelect.appendChild(option);
        });

        // Pilih season pertama dan muat episodenya
        if (this.seasonSelect.options.length > 0) {
            this.seasonSelect.selectedIndex = 0;
            this.onSeasonChange(); // Trigger untuk load episode
        }
    }

    async onSeasonChange() {
        const seasonNumber = this.seasonSelect.value;
        if (!seasonNumber) return;

        const seasonData = await fetchSeasonEpisodes(this.currentMediaId, seasonNumber);
        if (seasonData && seasonData.episodes) {
            this.currentEpisodes = seasonData.episodes;
            this.populateEpisodes(this.currentEpisodes);
        }
    }

    populateEpisodes(episodes) {
        this.episodeSelect.innerHTML = '';
        episodes.forEach(episode => {
            const option = document.createElement('option');
            option.value = episode.episode_number;
            option.textContent = `Episode ${episode.episode_number}: ${episode.name}`;
            this.episodeSelect.appendChild(option);
        });

        // Pilih episode pertama dan update modal
        if (this.episodeSelect.options.length > 0) {
            this.episodeSelect.selectedIndex = 0;
            this.onEpisodeChange(); // Trigger untuk update detail
        }
    }

    onEpisodeChange() {
        const episodeNumber = parseInt(this.episodeSelect.value, 10);
        const episode = this.currentEpisodes.find(ep => ep.episode_number === episodeNumber);

        if (!episode) return;

        // Simpan judul asli series untuk digunakan kembali
        const originalTitle = this.title.innerText.split(':')[0];

        // Update judul dan info dengan data episode
        this.title.innerText = `${this.title.innerText.split(':')[0]}: ${episode.name}`;
        this.overview.innerText = episode.overview || 'Tidak ada ringkasan untuk episode ini.';
        if (episode.still_path) {
            this.poster.src = `${CONFIG.IMAGE_BASE_URL}${episode.still_path}`;
        }

        // Perbarui sumber video untuk episode ini
        // this.updateVideoSource(this.serverSelect.value, true);

        // PERBAIKAN: Panggil updateVideoSource tanpa parameter tambahan
        this.updateVideoSource(this.serverSelect.value);
    }

    async updateVideoSource(serverKey) {
      // Tampilkan loading atau placeholder di iframe
      this.videoPlayer.src = '';

      const requestBody = {
            serverKey: serverKey,
            mediaType: this.currentMediaType,
            mediaId: this.currentMediaId,
        };

        // Jika ini adalah series, kirim juga season dan episode
        if (this.currentMediaType === 'tv') {
            const selectedSeason = this.seasonSelect.value;
            const selectedEpisode = this.episodeSelect.value;
            if (selectedSeason && selectedEpisode) {
                requestBody.season = selectedSeason;
                requestBody.episode = selectedEpisode;
            }
        }
        
        try {
            // Lakukan request POST ke backend kita
            const response = await fetch('http://localhost:3001/api/video-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to get video URL from backend.');
            }

            const data = await response.json();
            if (data.url) {
                this.videoPlayer.src = data.url;
            } else {
                throw new Error('No URL received from backend.');
            }

        } catch (error) {
            console.error("Error updating video source:", error);
            // Tampilkan pesan error kepada pengguna
            this.videoPlayer.src = 'about:blank'; // Hentikan loading
            alert('Gagal memuat video. Silakan coba server lain atau hubungi admin.');
        }
    }

        

        
        // Hanya update iframe jika URL valid
        if (videoUrl) {
            this.videoPlayer.src = videoUrl;
          }
            
        

    
    
    async populateServerDropdown() {
      this.serverSelect.innerHTML = ''; // Kosongkan dulu

      try {
          // Ambil daftar server dari backend kita
          const response = await fetch('http://localhost:3001/api/video-servers');
          if (!response.ok) {
              throw new Error('Gagal mengambil daftar server.');
          }
          const servers = await response.json();

          // Isi dropdown dengan server yang didapat dari backend
          servers.forEach(server => {
              const option = document.createElement('option');
              option.value = server.key;
              option.textContent = server.name;
              this.serverSelect.appendChild(option);
          });

      } catch (error) {
          console.error("Tidak bisa memuat daftar server:", error);
          // Tampilkan pesan error di dropdown jika gagal
          this.serverSelect.innerHTML = '<option>Gagal memuat server</option>';
      }
    }
}