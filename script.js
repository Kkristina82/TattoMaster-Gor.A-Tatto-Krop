const totalPhotos = 20; 

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
        item.appendChild(img);
        grid.appendChild(item);
    }
}

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
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

function initLightbox() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('full-image');
    
    document.addEventListener('click', (e) => {
        if (e.target.closest('.info-posters img') || e.target.closest('.course-card img')) {
            modal.style.display = "flex";
            modalImg.src = e.target.src;
        }
    });

    modal.onclick = function() { modal.style.display = "none"; };
}

document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    checkReveal();
    initLightbox();
});

window.addEventListener('scroll', checkReveal);