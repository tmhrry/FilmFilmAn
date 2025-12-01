// =============================================================
// FUNGSI PEMBANTU UMUM
// =============================================================

/**
 * Memuat pengaturan dari localStorage
 */
export function loadSettings(storageKey = 'movieStreamSettings') { // Tambahkan parameter default
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
        console.error("localStorage tidak didukung di lingkungan ini. Menggunakan pengaturan default.");
        return {
            language: 'id-ID',
            includeAdult: false
        };
    }
    
    const savedSettings = localStorage.getItem(storageKey);
    if (savedSettings) {
        return JSON.parse(savedSettings);
    }
    
    return {
        language: 'id-ID',
        includeAdult: false
    };
}

/**
 * Menyimpan pengaturan ke localStorage
 */
export function saveSettings(settings, storageKey = 'movieStreamSettings') { // Tambahkan parameter default
    localStorage.setItem(storageKey, JSON.stringify(settings));
}

/**
 * Menampilkan konfirmasi dan memuat ulang halaman jika disetujui
 */
export function confirmAndReload(message) {
    const isConfirmed = confirm(message);
    if (isConfirmed) {
        window.location.reload();
    }
    return isConfirmed;
}