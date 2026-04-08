// КОНФІГУРАЦІЯ FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBU7yr7SRj8JEvDHmY4w7SSXIX8zjgocCg",
    authDomain: "goratattokrop.firebaseapp.com",
    databaseURL: "https://goratattokrop-default-rtdb.firebaseio.com",
    projectId: "goratattokrop",
    storageBucket: "goratattokrop.firebasestorage.app",
    messagingSenderId: "921888337663",
    appId: "1:921888337663:web:06a6fa71a114c35a4326ca",
    measurementId: "G-F4F8ENB5D7"
};

// Ініціалізація Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const totalPhotos = 20; 
let fp; // Екземпляр календаря

// Налаштування Telegram
const TELEGRAM_BOT_TOKEN = '8758214194:AAFI7drpn1wGVEpEaB9XrNyBoZHg1M7GApE'; 
const TELEGRAM_CHAT_ID = '7443699603'; 


// --- ГАЛЕРЕЯ ---
function loadPhotos() {
    const grid = document.getElementById('photo-grid');
    if (!grid) return;
    grid.innerHTML = ''; 
    
    for (let i = 1; i <= totalPhotos; i++) {
        const item = document.createElement('div');
        item.className = 'reveal-item';
        
        const img = document.createElement('img');
        img.src = `img/${i}.jpg`; 
        img.alt = `Tattoo work ${i}`;
        img.loading = "lazy";

        // Якщо фото не знайдено - видаляємо пустий блок
        img.onerror = function() { 
            item.remove(); 
        };

        // Функція збільшення при кліку
        item.onclick = function() {
            const modal = document.getElementById('image-modal');
            const modalImg = document.getElementById('full-image');
            if (modal && modalImg) {
                modal.style.display = "flex"; // Показуємо модалку
                modalImg.src = img.src;      // Передаємо шлях до великого фото
                document.body.style.overflow = "hidden"; // Блокуємо прокрутку сайту
            }
        };

        item.appendChild(img);
        grid.appendChild(item);
    }
}

// --- УНІВЕРСАЛЬНА МОДАЛКА ДЛЯ ІНФО-ПОСТЕРІВ ---
function initUniversalModal() {
    // Шукаємо всі картинки в секції інформації
    const infoImages = document.querySelectorAll('#aftercare img');
    
    infoImages.forEach(img => {
        // Щоб не додавати обробник двічі, перевіряємо, чи він уже є
        if (!img.dataset.modalInit) {
            img.onclick = function() {
                const modal = document.getElementById('image-modal');
                const modalImg = document.getElementById('full-image');
                if (modal && modalImg) {
                    modal.style.display = "flex"; // Показуємо модалку
                    modalImg.src = this.src;      // Передаємо шлях до великого фото
                    document.body.style.overflow = "hidden"; // Блокуємо прокрутку сайту
                }
            };
            img.dataset.modalInit = "true"; // Позначаємо, що обробник додано
        }
    });
}

// --- НАВІГАЦІЯ ---
// --- НАВІГАЦІЯ (Оновлена) ---
window.showTab = function(tabId) {
    try {
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // --- ДОДАНО ТУТ ---
        // Якщо перейшли на інформацію, ініціалізуємо модалку для її фото
        if (tabId === 'aftercare') {
            initUniversalModal();
        }

        // Викликаємо календар тільки якщо перейшли на вкладку запису
        if (tabId === 'booking') {
            renderCalendar();
        }
        
        window.scrollTo(0, 0);
        if (typeof checkReveal === "function") setTimeout(checkReveal, 100);
    } catch (e) {
        console.error("Помилка навігації:", e);
    }
}

// --- КАЛЕНДАР ---
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderCalendar() {
    const dateInput = document.querySelector("#book-date");
    const container = document.querySelector("#book-date-container");

    if (!dateInput || !container) return;

    // Спробуємо отримати дані з Firebase
    database.ref('bookings').once('value').then((snapshot) => {
        const allData = snapshot.val() || {};
        
        const lockedDates = Object.keys(allData).filter(date => {
            return allData[date].status === "confirmed" || 
                   (allData[date].clientName && allData[date].clientName.includes("ВИХІДНИЙ"));
        });

        // Знищуємо старий календар перед створенням нового
        if (window.fp && typeof window.fp.destroy === "function") {
            window.fp.destroy();
        }

        // Ініціалізація з перевіркою мови
        window.fp = flatpickr(dateInput, {
            minDate: "today",
            static: true, 
            appendTo: container, 
            dateFormat: "Y-m-d",
            "locale": "uk", 
            disable: lockedDates,
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                if (dayElem.dateObj && typeof formatDateLocal === "function") {
                    const dateStr = formatDateLocal(dayElem.dateObj);
                    if (lockedDates.includes(dateStr)) {
                        dayElem.classList.add("booked-day");
                    }
                }
            }
        });
    }).catch(err => {
        // Якщо база не відповіла, все одно показуємо порожній календар, щоб сайт не "лежав"
        window.fp = flatpickr(dateInput, { minDate: "today", "locale": "uk" });
        console.error("Firebase error:", err);
    });
}

// --- ОБРОБКА ФОРМИ ЗАПИСУ ---
// --- ОБРОБКА ФОРМИ ЗАПИСУ ---
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'submit-booking') {
        const date = document.getElementById('book-date').value;
        const name = document.getElementById('book-name').value.trim();
        const idea = document.getElementById('book-idea').value.trim();
        const contact = document.getElementById('book-contact').value.trim();
        const fileInput = document.getElementById('book-file');
        const status = document.getElementById('booking-status');
        const btn = e.target;

        // 1. Валідація
        if (!date || !name || !contact || !idea) {
            alert("Заповніть всі поля 🖤");
            return;
        }

        // 2. Блокування інтерфейсу
        btn.disabled = true;
        btn.style.opacity = "0.5";
        status.style.display = "block";
        status.innerText = "Відправка... зачекайте 🖤";

        // 3. Запис у Firebase
        database.ref('bookings/' + date).set({
            clientName: name,
            clientContact: contact,
            idea: idea,
            status: "pending",
            timestamp: Date.now()
        }).then(() => {
            const message = `🔔 НОВА ЗАЯВКА\n📅 Дата: ${date}\n👤 Клієнт: ${name}\n📝 Ідея: ${idea}\n📱 Контакт: ${contact}`;
            
            // 4. Відправка в Telegram
            if (fileInput.files && fileInput.files[0]) {
                // ВІДПРАВКА З ФОТО
                const formData = new FormData();
                formData.append('chat_id', TELEGRAM_CHAT_ID);
                formData.append('photo', fileInput.files[0]);
                formData.append('caption', message);

                fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                    method: 'POST',
                    body: formData // Для FormData заголовок Content-Type НЕ МОЖНА ставити вручну!
                })
                .then(r => r.json())
                .then(data => {
                    if(!data.ok) throw new Error(data.description);
                    finalize();
                })
                .catch(err => {
                    console.error("Telegram Error:", err);
                    alert("Помилка відправки фото. Запис збережено в базі, я побачу його в адмінці.");
                    finalize();
                });
            } else {
                // ВІДПРАВКА БЕЗ ФОТО
                fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                })
                .then(r => r.json())
                .then(data => {
                    if(!data.ok) throw new Error(data.description);
                    finalize();
                })
                .catch(err => {
                    console.error("Telegram Error:", err);
                    finalize();
                });
            }
        }).catch(err => {
            alert("Помилка бази даних. Спробуйте пізніше.");
            btn.disabled = false;
            btn.style.opacity = "1";
        });

        function finalize() {
            status.innerHTML = "Успішно! Я напишу вам 🖤";
            document.getElementById('booking-form-container').style.opacity = "0.3";
            document.getElementById('booking-form-container').style.pointerEvents = "none";
            if (typeof renderCalendar === "function") renderCalendar();
            
            // Авто-перезавантаження через 4 секунди для очищення форми
            setTimeout(() => { location.reload(); }, 4000);
        }
    }
});

// --- СТАРТ ТА АНІМАЦІЇ ---
function checkReveal() {
    document.querySelectorAll('.reveal-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) item.classList.add('visible');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (modal) {
        // Закриття при кліку на фон
        modal.onclick = (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                modal.style.display = "none";
                document.body.style.overflow = "auto"; // Повертаємо прокрутку
            }
        };
    }
});

window.addEventListener('scroll', checkReveal);
