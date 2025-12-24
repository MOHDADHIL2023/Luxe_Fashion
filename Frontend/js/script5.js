// --- Utility Functions ---
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

// --- Contact Form Submission Handler (JS) ---
function handleContactForm(event) {
    event.preventDefault(); // Stop the form from actually submitting
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    
    if (name && email && subject) {
        const message = `Thank you, ${name}! Your inquiry regarding "${subject}" has been submitted. We will respond to ${email} shortly.`;
        displayMessageBox(message);
        
        // Clear the form fields after successful submission
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

    } else {
        displayMessageBox("Please fill in all fields to submit your inquiry.");
    }
}

// --- FAQ Accordion Logic (NEW) ---
function toggleAccordion(headerElement) {
    const item = headerElement.closest('.accordion-item');
    const content = item.querySelector('.accordion-content');
    
    // Check if this item is already active
    const isActive = item.classList.contains('active');
    
    // Close all other open accordions first (optional but good UX)
    document.querySelectorAll('.accordion-item').forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
        }
    });

    // Toggle the active class on the current item
    item.classList.toggle('active', !isActive);
}