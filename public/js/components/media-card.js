// =============================================================
// KOMPONEN KARTU MEDIA
// =============================================================
import { CONFIG } from '../utils/constants.js';

export class MediaCard {
    constructor(media, mediaType) {
        this.media = media;
        this.mediaType = mediaType;
        this.element = this.createElement();
    }
    
    createElement() {
        const card = document.createElement('button');
        card.className = 'media-card';
        
        // Tentukan judul dan tahun berdasarkan tipe media
        const title = this.mediaType === 'movie' ? this.media.title : this.media.name;
        const year = (this.media.release_date || this.media.first_air_date || '').substring(0, 4);
        const posterPath = this.media.poster_path;
        
        // Simpan data di atribut untuk digunakan saat modal dibuka
        card.dataset.type = this.mediaType; // 'movie' atau 'tv'
        card.dataset.id = this.media.id;
        
        // Buat struktur HTML untuk kartu
        card.innerHTML = `
            <img src="${posterPath ? `${CONFIG.IMAGE_BASE_URL}${posterPath}` : 'https://via.placeholder.com/150x225/1a1a1a/ffffff?text=No+Image'}" 
                 alt="${title} Poster" 
                 class="media-poster" 
                 loading="lazy">
            <div class="media-info">
                <h3 class="media-title">${title}</h3>
                <p class="media-year">${year}</p>
            </div>
        `;
        
        return card;
    }
    
    getElement() {
        return this.element;
    }
}