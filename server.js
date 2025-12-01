// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');

// --- KONFIGURASI WINSTON LOGGER ---
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'filmfilman-api' },
    transports: [
        // Tulis semua log dengan level 'error' ke file error.log
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Tulis semua log ke file combined.log
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Jika kita tidak dalam mode produksi, juga tampilkan log di konsol
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const app = express();
const PORT = process.env.PORT || 3001;

// Inisialisasi cache dengan TTL (Time-To-Live) 6 jam
const tmdbCache = new NodeCache({ stdTTL: 21600 }); // 21600 detik = 6 jam

// TAMBAHKAN KONFIGURASI RATE LIMITING
const tmdbApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Jendela waktu: 15 menit
    max: 100, // Batasi setiap IP ke 100 permintaan per jendela waktu
    message: {
        error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.'
    },
    standardHeaders: true, // Kembalikan info rate limit di header `RateLimit-*`
    legacyHeaders: false, // Nonaktifkan header `X-RateLimit-*`
});

// Middleware
app.use(cors()); // Izinkan request dari frontend
app.use(express.json()); // Baca JSON body dari request

// --- TAMBAHKAN MORGAN UNTUK LOGGING REQUEST ---
// Gunakan format 'combined' yang detail
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// --- Proxy untuk TMDB API ---
// --- GANTI console.log & console.error dengan logger ---
// Di dalam rute TMDB, ganti bagian error handling
app.get('/api/tmdb/*path', tmdbApiLimiter, async (req, res) => { // <-- TAMBAHKAN NAMA 'path' - TAMBAHKAN tmdbApiLimiter
	// Buat kunci cache yang unik berdasarkan path dan query
    // Ini penting agar /movie/popular?page=1 dan /movie/popular?page=2 memiliki cache terpisah
    const cacheKey = `${req.params.path.join('/')}?${new URLSearchParams(req.query).toString()}`;

	// 1. CEK CACHE
    const cachedResponse = tmdbCache.get(cacheKey);
    if (cachedResponse) {
	// logger.info(`Cache HIT for key: ${cacheKey}`); // Opsional, Morgan sudah mencatat requestnya
        // console.log(`Cache HIT for key: ${cacheKey}`);
        return res.json(cachedResponse);
    }

	// 2. JIKA TIDAK ADA DI CACHE, LAKUKAN REQUEST KE TMDB
	// logger.info(`Cache MISS for key: ${cacheKey}. Fetching from TMDB...`); // Opsional
    // console.log(`Cache MISS for key: ${cacheKey}. Fetching from TMDB...`);

	// --- TAMBAHKAN DUA BARIS INI UNTUK DEBUGGING ---
    // console.log('Raw req.params object:', req.params);
    // console.log('Value of req.params.path:', req.params.path);
    try {
        const tmdbPath = req.params.path.join('/'); // <-- GANTI req.params[0] menjadi req.params.path
        const queryParams = new URLSearchParams(req.query);
        
        const apiUrl = `https://api.themoviedb.org/3/${tmdbPath}?api_key=${process.env.TMDB_API_KEY}&${queryParams.toString()}`;
        
	// Tambahkan log untuk melihat URL yang dibuat backend
        // console.log(`Forwarding request to TMDB: ${apiUrl}`);

        const response = await axios.get(apiUrl);

	// 3. SIMPAN HASIL KE CACHE SEBELUM DIKIRIM KE USER
        tmdbCache.set(cacheKey, response.data);

        res.json(response.data);
    } catch (error) {
        // --- GANTI BAGIAN ERROR INI ---
        logger.error('Error occurred while proxying to TMDB', {
            message: error.message,
            stack: error.stack,
            tmdbPath: req.params.path.join('/'),
            query: req.query,
        });

        if (error.response) {
            logger.error('TMDB API responded with error', {
                status: error.response.status,
                data: error.response.data
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to fetch data from TMDB.', 
            error: error.message 
        });
    }
});

// --- Proxy untuk URL Video ---
app.post('/api/video-url', (req, res) => {
    try {
        const { serverKey, mediaType, mediaId, season, episode } = req.body;

        // Cari URL dan nama server dari environment variables secara dinamis
        const serverUrl = process.env[`${serverKey.toUpperCase()}_URL`];
        const serverName = process.env[`${serverKey.toUpperCase()}_NAME`];

        if (!serverUrl) {
            return res.status(400).json({ message: `Server with key '${serverKey}' not found.` });
        }

        let videoUrl = `${serverUrl}${mediaType}/${mediaId}`;

        // Jika ini adalah episode spesifik
        if (mediaType === 'tv' && season && episode) {
            videoUrl = `${videoUrl}/${season}/${episode}`;
        }

        console.log(`Generated video URL from ${serverName}: ${videoUrl}`);
        res.json({ url: videoUrl });

    } catch (error) {
        console.error('Error generating video URL:', error.message);
        res.status(500).json({ message: 'Failed to generate video URL.' });
    }
});

// --- Endpoint untuk mendapatkan daftar server video ---
app.get('/api/video-servers', (req, res) => {
    const servers = [];
    const serverRegex = /^SERVER(\d+)_NAME$/; // Cari pola SERVER1_NAME, SERVER2_NAME, dll.

    // Iterasi semua variabel di process.env
    for (const key in process.env) {
        const match = key.match(serverRegex);
        if (match) {
            const serverNumber = match[1];
            const serverKey = `server${serverNumber}`; // Buat key: server1, server2
            const serverName = process.env[key];
            
            // Pastikan URL juga ada sebelum menambahkan ke daftar
            const serverUrl = process.env[`SERVER${serverNumber}_URL`];
            
            if (serverName && serverUrl) {
                servers.push({
                    key: serverKey,
                    name: serverName
                });
            }
        }
    }

    // Urutkan berdasarkan key agar konsisten (server1, server2, ...)
    servers.sort((a, b) => a.key.localeCompare(b.key));

    res.json(servers);
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});