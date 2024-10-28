const navLinks = document.querySelectorAll('nav ul li a');
const popups = document.querySelectorAll('.popup');
const overlay = document.getElementById('overlay');
const closeButtons = document.querySelectorAll('.close');

navLinks.forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const targetPopupId = link.getAttribute('data-popup');
        const targetPopup = document.getElementById(targetPopupId);

        popups.forEach(popup => popup.style.display = 'none');
        overlay.style.display = 'block';

        if (targetPopup) {
            targetPopup.style.display = 'block';
        }
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        popups.forEach(popup => popup.style.display = 'none');
        overlay.style.display = 'none';
    });
});

overlay.addEventListener('click', () => {
    popups.forEach(popup => popup.style.display = 'none');
    overlay.style.display = 'none';
});