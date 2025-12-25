// =============================================
// API CONFIGURATION
// =============================================

// Backend API Base URL (Must be the server root)
const API_URL = 'http://localhost:5001'; 

// Google Client ID
const GOOGLE_CLIENT_ID = '46629384050-lmcb75sc7a8g69sc1s0hbt1rh3ahnelf.apps.googleusercontent.com';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL, GOOGLE_CLIENT_ID };
}