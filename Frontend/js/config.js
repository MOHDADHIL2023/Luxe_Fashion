const CONFIG = {
    // 1. UNCOMMENT THIS LINE FOR LOCAL DEVELOPMENT (When running on your computer)
    // API_URL: 'http://localhost:5001',

    // 2. UNCOMMENT THIS LINE FOR LIVE PUBLISHING (After you deploy your backend)
    // Replace the URL below with your actual deployed backend URL (e.g., from Render/Railway)
    API_URL: 'https://luxe-backend.onrender.com' // Use YOUR specific URL from Phase A
};

// Remove trailing slash if present to prevent double slashes later
if (CONFIG.API_URL.endsWith('/')) {
    CONFIG.API_URL = CONFIG.API_URL.slice(0, -1);
}