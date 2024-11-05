export function showPopup(popupId) {
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById(popupId);
    
    if (overlay && popup) {
        document.querySelectorAll('.popup').forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        
        overlay.style.display = 'block';
        popup.style.display = 'block';
        
        void overlay.offsetWidth;
        void popup.offsetWidth;
        
        popup.classList.add('active');
        
        const closePopup = () => {
            popup.classList.remove('active');
            setTimeout(() => {
                overlay.style.display = 'none';
                popup.style.display = 'none';
            }, 10);
        };
        
        const closeButton = popup.querySelector('.close-btn');
        if (closeButton) {
            closeButton.onclick = closePopup;
        }
        
        overlay.onclick = closePopup;
        popup.onclick = (e) => e.stopPropagation();
    }
}

document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const targetPopupId = link.getAttribute('data-popup');
        if (targetPopupId) {
            showPopup(targetPopupId);
        }
    });
});
