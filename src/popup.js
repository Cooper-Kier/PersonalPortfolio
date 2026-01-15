let activePopup = null;

const overlay = document.getElementById('overlay');

export function showPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!overlay || !popup) return;

    // Hide all popups
    document.querySelectorAll('.popup').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });

    // Show overlay + popup
    overlay.style.display = 'block';
    popup.style.display = 'block';

    // Force reflow for animation
    void overlay.offsetWidth;
    void popup.offsetWidth;

    popup.classList.add('active');
    activePopup = popup;

    const closeButton = popup.querySelector('.close-btn');
    if (closeButton) {
        closeButton.onclick = closeActivePopup;
    }

    popup.onclick = e => e.stopPropagation();
}

function closeActivePopup() {
    if (!activePopup) return;

    activePopup.classList.remove('active');

    setTimeout(() => {
        activePopup.style.display = 'none';
        overlay.style.display = 'none';
        activePopup = null;
    }, 150);
}

// Attach ONCE
overlay.addEventListener('click', closeActivePopup);

// Nav links
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const targetPopupId = link.getAttribute('data-popup');
        if (targetPopupId) {
            showPopup(targetPopupId);
        }
    });
});
