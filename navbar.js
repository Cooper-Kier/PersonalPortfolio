const toggleButton = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

toggleButton.addEventListener('click', function() {
    navMenu.classList.toggle('visible');
});