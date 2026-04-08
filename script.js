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
const TELEGRAM_BOT_TOKEN ; 
const TELEGRAM_CHAT_ID ; 

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
        img.onerror = function() { item.remove(); };
        img.onclick = function() {
            const modal = document.getElementById('image-modal');
            const modalImg = document.getElementById('full-image');
            if (modal && modalImg) {
                modal.style.display = "flex";
                modalImg.src = this.src;
            }
        };
        item.appendChild(img);
        grid.appendChild(item);
    }
}

// --- НАВІГАЦІЯ ---
window.showTab = function(tabId) {
    try {
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === 'admin-panel') tab.style.display = 'none';
        });
        
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
            if (tabId === 'admin-panel') activeTab.style.display = 'block';
        }

        // Викликаємо календар тільки якщо перейшли на вкладку запису
        if (tabId === 'booking') {
            renderCalendar();
        }
        
        if (tabId === 'admin-panel') loadAdminData();
        
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
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'book-file') {
        const fileName = e.target.files[0] ? e.target.files[0].name : "ОБРАТИ ФОТО";
        document.getElementById('file-label').innerText = fileName;
    }
});

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'submit-booking') {
        const date = document.getElementById('book-date').value;
        const name = document.getElementById('book-name').value;
        const idea = document.getElementById('book-idea').value.trim();
        const contact = document.getElementById('book-contact').value.trim();
        const fileInput = document.getElementById('book-file');
        const status = document.getElementById('booking-status');

        // Валідація
        if (!date || !name || !contact || !idea) {
            alert("Заповніть всі поля 🖤");
            return;
        }

        const instaRegex = /^@[a-zA-Z0-9._]{2,30}$/;
        const phoneRegex = /^(\+38)?0\d{9}$/;

        if (!instaRegex.test(contact) && !phoneRegex.test(contact)) {
            alert("Введіть Instagram (з @) або номер телефону 🖤");
            return;
        }

        status.style.display = "block";
        status.innerText = "Відправка... зачекайте 🖤";

        // Перевірка на зайнятість (подвійна)
        database.ref('bookings/' + date).once('value').then((snapshot) => {
            if (snapshot.exists() && (snapshot.val().status === 'confirmed' || snapshot.val().clientName.includes('ВИХІДНИЙ'))) {
                alert("Ця дата вже остаточно зайнята 🖤");
                renderCalendar();
                return;
            }

            // Запис в базу
            database.ref('bookings/' + date).set({
                clientName: name,
                clientContact: contact,
                idea: idea,
                status: "pending",
                timestamp: Date.now()
            }).then(() => {
                const message = `🔔 НОВА ЗАЯВКА\n📅 Дата: ${date}\n👤 Клієнт: ${name}\n📝 Ідея: ${idea}\n📱 Контакт: ${contact}`;
                
                if (fileInput.files && fileInput.files[0]) {
                    const formData = new FormData();
                    formData.append('chat_id', TELEGRAM_CHAT_ID);
                    formData.append('photo', fileInput.files[0]);
                    formData.append('caption', message);
                    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData }).then(finalize);
                } else {
                    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`;
                    fetch(url).then(finalize);
                }
            });
        });

        function finalize() {
            status.innerHTML = "Успішно! Я напишу вам 🖤";
            document.getElementById('booking-form-container').style.opacity = "0.3";
            document.getElementById('booking-form-container').style.pointerEvents = "none";
            renderCalendar();
        }
    }
});

// --- АДМІН-ПАНЕЛЬ ---
window.adminAuth = function() {
    const pass = prompt("Пароль:");
    if (pass === "0000") {
        showTab('admin-panel');
    } else {
        alert("Відмовлено.");
    }
};

function loadAdminData() {
    const listCont = document.getElementById('admin-bookings-list');
    database.ref('bookings').on('value', (snapshot) => {
        const data = snapshot.val();
        listCont.innerHTML = "";
        if (!data) return listCont.innerHTML = "<p>Записів немає</p>";

        // Сортування по даті
        const sortedDates = Object.keys(data).sort();

        sortedDates.forEach(date => {
            const isConfirmed = data[date].status === "confirmed" || data[date].clientName.includes("ВИХІДНИЙ");
            const item = document.createElement('div');
            item.style.cssText = "padding: 15px; border-bottom: 1px solid #222; margin-bottom: 10px; background: " + (isConfirmed ? "rgba(255,255,255,0.02)" : "rgba(255, 204, 0, 0.05)");
            
            item.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: ${isConfirmed ? 'var(--neon-pink)' : '#ffcc00'}">${date} [${isConfirmed ? 'OK' : 'ОЧІКУЄ'}]</strong><br>
                    <small>${data[date].clientName} (${data[date].clientContact})</small>
                    <p style="font-size: 0.8rem; color: #aaa; margin: 5px 0;">${data[date].idea || ''}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${!isConfirmed ? `<button onclick="confirmBooking('${date}')" style="background: #28a745; color: white; border: none; padding: 5px 10px; cursor: pointer;">ПІДТВЕРДИТИ</button>` : ''}
                    <button onclick="deleteBooking('${date}')" style="background: none; border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer;">ВИДАЛИТИ</button>
                </div>
            `;
            listCont.appendChild(item);
        });
    });
}

window.confirmBooking = function(date) {
    if(confirm(`Підтвердити ${date}?`)) {
        database.ref('bookings/' + date).update({ status: "confirmed" });
    }
};

window.deleteBooking = function(date) {
    if (confirm(`Видалити ${date}?`)) {
        database.ref('bookings/' + date).remove().then(() => renderCalendar());
    }
};

window.setDayOff = function() {
    const date = document.getElementById('admin-day-off').value;
    if (!date) return alert("Оберіть дату");
    database.ref('bookings/' + date).set({
        clientName: "⛔ ВИХІДНИЙ",
        clientContact: "system",
        status: "confirmed",
        timestamp: Date.now()
    }).then(() => renderCalendar());
};

// --- СТАРТ ТА АНІМАЦІЇ ---
function checkReveal() {
    document.querySelectorAll('.reveal-item').forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) item.classList.add('visible');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    if (window.location.hash === '#admin') adminAuth();
    window.addEventListener('hashchange', () => { if (window.location.hash === '#admin') adminAuth(); });
    const modal = document.getElementById('image-modal');
    if (modal) modal.onclick = () => modal.style.display = "none";
});

window.addEventListener('scroll', checkReveal);
