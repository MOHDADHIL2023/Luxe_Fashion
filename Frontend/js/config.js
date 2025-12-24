// =============================================
// API CONFIGURATION
// =============================================

// Backend API Base URL
const API_URL = 'http://localhost:5001/Frontend/pages/products.html';

// Google Client ID
const GOOGLE_CLIENT_ID = '46629384050-r38k8ipaocu9d4espp7g640hllivijg7.apps.googleusercontent.com';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_URL, GOOGLE_CLIENT_ID };
}