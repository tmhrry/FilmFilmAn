// =============================================================
// UTILITAS API TMDB
// =============================================================
import { CONFIG } from '../utils/constants.js';
import { loadSettings } from './helpers.js';

/**
 * Mengambil data dari API TMDB.
 * @param {string} endpoint - Endpoint API TMDB (contoh: '/movie/now_playing').
 * @param {object} params - Parameter tambahan untuk query string.
 * @returns {Promise<object|null>} - Data dari API atau null jika terjadi error.
 */
export async function fetchFromTMDB(endpoint, params = {}) {
    const settings = loadSettings();

    const url = new URL(`${CONFIG.API_BASE_URL}${endpoint}`);
    url.search = new URLSearchParams({
        // api_key: CONFIG.API_KEY,
        language: settings.language,
        include_adult: settings.includeAdult,
        ...params
    });

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching from TMDB:", error);
        return null;
    }
}

/**
 * Mengambil data film terbaru
 */
export async function fetchLatestMovies() {
    return await fetchFromTMDB('/movie/now_playing');
}

/**
 * Mengambil data series terbaru
 */
export async function fetchLatestSeries() {
    return await fetchFromTMDB('/tv/on_the_air');
}

/**
 * Mencari film/series
 */
export async function searchMulti(query, page = 1) {
    return await fetchFromTMDB('/search/multi', { query, page });
}

/**
 * Mengambil detail film/series
 */
export async function fetchDetails(id, isSeries = false) {
    const mediaType = isSeries ? 'tv' : 'movie';
    return await fetchFromTMDB(`/${mediaType}/${id}`);
}

/**
 * Mengambil data film/series berdasarkan filter (discover)
 * @param {string} mediaType - 'movie' atau 'tv'
 * @param {object} params - Parameter filter
 * @returns {Promise<object|null>}
 */
export async function fetchDiscover(mediaType, params = {}) {
    const endpoint = `/discover/${mediaType}`;
    return await fetchFromTMDB(endpoint, params);
}

/**
 * Mengambil daftar genre
 * @param {string} mediaType - 'movie' atau 'tv'
 * @returns {Promise<object|null>}
 */
export async function fetchGenres(mediaType) {
    const endpoint = `/genre/${mediaType}/list`;
    const data = await fetchFromTMDB(endpoint);
    return data ? data.genres : [];
}

/**
 * Mencari media berdasarkan IMDb ID
 * @param {string} imdbId - ID dari IMDb (contoh: 'tt0111161')
 * @returns {Promise<object|null>}
 */
export async function findByImdbId(imdbId) {
    const endpoint = `/find/${imdbId}`;
    const params = { external_source: 'imdb_id' };
    return await fetchFromTMDB(endpoint, params);
}

/**
 * Mengambil daftar episode untuk season tertentu dari sebuah series TV
 * @param {string} tvId - ID series TV
 * @param {number} seasonNumber - Nomor season
 * @returns {Promise<object|null>}
 */
export async function fetchSeasonEpisodes(tvId, seasonNumber) {
    const endpoint = `/tv/${tvId}/season/${seasonNumber}`;
    return await fetchFromTMDB(endpoint);
}