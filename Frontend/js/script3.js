// Simple Message Box Implementation (Replaces 'alert()')
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
    messageBox.innerHTML =`
        <div class="bg-white text-primary-dark p-6 rounded-lg shadow-2xl max-w-sm mx-4 space-y-4">
            <p class="font-semibold">${message}</p>
            <button class="w-full py-2 rounded bg-accent-green text-primary-dark font-bold hover:bg-green-400 transition" onclick="document.getElementById('message-box').remove()">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(messageBox);
}

// --- JS for Intersection Observer (Better Scroll Animation) ---
// This makes elements animate when they enter the viewport, not just on load.
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-active'); // Add a class to trigger CSS animation
                // observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, { 
    rootMargin: '0px', 
    threshold: 0.1 
});

// Find all elements that should animate
document.querySelectorAll('.animate-on-load').forEach(element => {
    element.classList.remove('animate-on-load'); // Remove static load animation
    element.classList.add('animate-trigger'); // Add trigger class
    observer.observe(element);
});


// Add the active animation class definition for Intersection Observer
const styleSheet = document.createElement('style');
styleSheet.innerText = `
    .animate-trigger { opacity: 0; }
    .animate-trigger.animate-active {
            animation: fadeInUp 0.8s ease-out forwards;
            }
                .team-member .animate-trigger.animate-active {
                     /* Apply staggering using the style attribute set in HTML */
                     /* Note: Simple CSS load animation delays will still be used as a fallback if JS is disabled */
                }
            `;
    document.head.appendChild(styleSheet);
});