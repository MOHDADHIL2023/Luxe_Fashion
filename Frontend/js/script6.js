// ==========================================
// UI LOGIC - TOGGLE BETWEEN LOGIN/SIGNUP
// ==========================================
window.showForm = function(formType) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const mainTitle = document.getElementById('main-auth-title');

    if (formType === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        mainTitle.textContent = 'LOGIN FORM';
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        mainTitle.textContent = 'SIGNUP FORM';
    }
};

// ==========================================
// MESSAGE BOX DISPLAY
// ==========================================
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 100;
    `;
    
    const messageContent = document.createElement('div');
    messageContent.style.cssText = `
        background-color: white; color: #0A0A0A; padding: 2rem;
        border-radius: 0.5rem; max-width: 400px; text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    const messageText = document.createElement('p');
    messageText.style.cssText = `font-weight: 600; margin-bottom: 1.5rem; font-size: 1.1rem;`;
    messageText.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        width: 100%; padding: 0.75rem; border-radius: 0.25rem;
        background-color: #10B981; color: white; font-weight: 700; 
        border: none; cursor: pointer; font-size: 1rem;
    `;
    closeButton.onclick = () => messageBox.remove();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(closeButton);
    messageBox.appendChild(messageContent);
    document.body.appendChild(messageBox);
}

// ==========================================
// AUTHENTICATION HANDLER (LOGIN & SIGNUP)
// ==========================================
window.handleAuth = async function(event, type) {
    event.preventDefault();
    
    const formId = (type === 'login' ? 'login-form' : 'signup-form');
    const submitButton = document.querySelector(`#${formId} .btn-submit`);
    
    // Client-Side Validation for Signup
    if (type === 'signup') {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        if (password !== confirmPassword) {
            displayMessageBox(" Passwords do not match!");
            return;
        }
        
        if (password.length < 6) {
            displayMessageBox(" Password must be at least 6 characters!");
            return;
        }
    }

    // Disable button and show loading
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'PROCESSING...';
    
    // Get form data
    const email = document.getElementById(`${type}-email`).value;
    const password = document.getElementById(`${type}-password`).value;
    const name = type === 'signup' ? document.getElementById('signup-name').value : null;

    // API URLs
    const url = type === 'login' 
        ? `${API_URL}/users/login` 
        : `${API_URL}/users/signup`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                type === 'signup' 
                    ? { name, email, password } 
                    : { email, password }
            )
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Save Token & User Info
            localStorage.setItem('luxe_current_user', JSON.stringify(data.user));
            localStorage.setItem('luxe_token', data.token);
            
            const firstName = data.user.name.split(' ')[0];

            // 2. REDIRECT LOGIC
            if (data.user.role === 'admin') {
                // Admin Login
                displayMessageBox(` Welcome Admin ${firstName}! Going to Dashboard...`);
                setTimeout(() => {
                    window.location.href = '/Frontend/pages/admin.html';
                }, 1500);
            } else {
                // Customer Login OR New Signup
                let msg = type === 'signup' 
                    ? ` Account created! Welcome, ${firstName}!` 
                    : ` Welcome back, ${firstName}!`;
                    
                displayMessageBox(`${msg} Redirecting to store...`);
                
                setTimeout(() => {
                    window.location.href = '/Frontend/index.html';
                }, 1500);
            }

        } else {
            // Show error message from backend
            displayMessageBox(` ${data.error || "Authentication failed."}`);
        }

    } catch (error) {
        console.error('Auth Error:', error);
        displayMessageBox(" Server error. Check backend connection.");
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

// ==========================================
// GOOGLE SIGN-IN HANDLER
// ==========================================

// Initialize Google Button on Page Load
window.onload = function() {
    // Check if google library is loaded
    if (window.google && GOOGLE_CLIENT_ID) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse
        });

        // Render the button inside our container
        google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { 
                theme: "outline", 
                size: "large", 
                width: "350",
                text: "continue_with",
                shape: "rectangular"
            }
        );

        console.log(' Google Sign-In button initialized');
    } else {
        console.error(' Google Sign-In library not loaded or GOOGLE_CLIENT_ID missing');
    }
};

// Handle the Response from Google
async function handleGoogleResponse(response) {
    console.log(" Google Sign-In Response Received");

    try {
        // Send the Google Token to YOUR Backend
        const res = await fetch(`${API_URL}/users/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (res.ok) {
            console.log(' Backend verified Google token');

            // Save Token & User Info (Same as normal login)
            localStorage.setItem('luxe_current_user', JSON.stringify(data.user));
            localStorage.setItem('luxe_token', data.token);

            const firstName = data.user.name.split(' ')[0];
            displayMessageBox(` Google Login Successful! Welcome ${firstName}!`);

            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = '/Frontend/pages/admin.html';
                } else {
                    window.location.href = '/Frontend/index.html';
                }
            }, 1500);
        } else {
            console.error(' Backend rejected Google token:', data);
            displayMessageBox(` ${data.error || "Google Login failed"}`);
        }

    } catch (error) {
        console.error(" Google Auth Error:", error);
        displayMessageBox(" Server connection failed.");
    }
}

// ==========================================
// APPLE SIGN-IN (PLACEHOLDER)
// ==========================================
window.signInWithApple = function() {
    displayMessageBox(" Apple Sign-In is coming soon! This feature will be available in a future update.");
};

// ==========================================
// DYNAMIC CSS FOR MESSAGE BOX
// ==========================================
const authStyles = document.createElement('style');
authStyles.textContent = `
    #message-box {
        animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(authStyles);