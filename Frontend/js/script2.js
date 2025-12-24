// Simple JavaScript to handle card clicks (for demonstration)
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.category-card');
        cards.forEach(card => {
            card.addEventListener('click', (event) => {
                const category = card.getAttribute('data-category');
            displayMessageBox(`Navigating to the ${category} category page...`);
        });
    });
});

window.handleContactClick = function() {
    displayMessageBox("Opening the contact form...");
}

// Placeholder for message box (replacing alert())
window.displayMessageBox = function(message) {
    const existingBox = document.getElementById('message-box');
    if (existingBox) existingBox.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
    messageBox.innerHTML =`
        <div class="bg-white text-gray-800 p-6 rounded-lg shadow-2xl max-w-sm mx-4 space-y-4">
            <p class="font-semibold">${message}</p>
            <button class="w-full py-2 rounded bg-gray-800 text-white font-bold hover:bg-gray-700 transition" onclick="document.getElementById('message-box').remove()">
                Close
            </button>
            </div>
    `;
    document.body.appendChild(messageBox);
}