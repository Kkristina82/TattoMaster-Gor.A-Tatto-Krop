const totalPhotos = 20; // Кількість ваших фото в папці img/

function loadPhotos() {
    const grid = document.getElementById('photo-grid');
    if (!grid) return;
    grid.innerHTML = ''; 
    for (let i = 1; i <= totalPhotos; i++) {
        const item = document.createElement('div');
        item.className = 'reveal-item';
        const img = document.createElement('img');
        img.src = `img/${i}.jpg`; 
        img.onerror = function() { item.remove(); };
        img.onclick = function() { openModal(this.src); };
        item.appendChild(img);
        grid.appendChild(item);
    }
}

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    window.scrollTo(0, 0);
    setTimeout(checkReveal, 100);
}

function checkReveal() {
    const items = document.querySelectorAll('.reveal-item');
    items.forEach(item => {
        const top = item.getBoundingClientRect().top;
        if (top < window.innerHeight * 0.9) item.classList.add('visible');
    });
}

function openModal(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('full-image');
    modal.style.display = "flex";
    modalImg.src = src;
}

document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    checkReveal();
    
    const modal = document.getElementById('image-modal');
    if(modal) {
        modal.onclick = () => modal.style.display = "none";
    }
});

window.addEventListener('scroll', checkReveal);
