export function showPopup(popupId) {
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById(popupId);
    
    if (overlay && popup) {
        // Hide any currently open popups
        document.querySelectorAll('.popup').forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        
        // Show new popup
        overlay.style.display = 'block';
        popup.style.display = 'block';
        
        // Force reflow
        void overlay.offsetWidth;
        void popup.offsetWidth;
        
        // Add active class for animation
        popup.classList.add('active');
        
        // Setup close handlers
        const closePopup = () => {
            popup.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
                popup.style.display = 'none';
            }, 300);
        };
        
        // Close button handler
        const closeButton = popup.querySelector('.close');
        if (closeButton) {
            closeButton.onclick = closePopup;
        }
        
        // Overlay click handler
        overlay.onclick = closePopup;
        
        // Prevent popup click from closing
        popup.onclick = (e) => e.stopPropagation();
    }
}

// Handle navigation menu popup triggers
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const targetPopupId = link.getAttribute('data-popup');
        if (targetPopupId) {
            showPopup(targetPopupId);
        }
    });
});