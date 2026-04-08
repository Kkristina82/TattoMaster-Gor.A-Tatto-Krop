// Конфігурація (залишається твоя)
const firebaseConfig = {
    apiKey: "AIzaSyBU7yr7SRj8JEvDHmY4w7SSXIX8zjgocCg",
    authDomain: "goratattokrop.firebaseapp.com",
    databaseURL: "https://goratattokrop-default-rtdb.firebaseio.com",
    projectId: "goratattokrop",
    storageBucket: "goratattokrop.firebasestorage.app",
    messagingSenderId: "921888337663",
    appId: "1:921888337663:web:06a6fa71a114c35a4326ca"
};

// Ініціалізація
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- ФУНКЦІЯ ВХОДУ ---
window.loginAdmin = function() {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;

    if (!email || !pass) return alert("Введіть пошту та пароль");

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            console.log("Успішний вхід!");
            // Тут нічого переключати не треба, спрацює onAuthStateChanged нижче
        })
        .catch((error) => {
            alert("Помилка: " + error.message);
        });
};

// --- ГОЛОВНИЙ СЛУХАЧ СТАТУСУ ---
// Ця функція перевіряє, залогінені ви чи ні, щоразу при завантаженні сторінки
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');

    if (user) {
        // Якщо залогінені: показуємо адмінку, ховаємо вхід
        loginScreen.style.display = 'none';
        adminContent.style.display = 'block';
        loadAdminData(); // Завантажуємо записи
    } else {
        // Якщо ні: показуємо тільки вікно входу
        loginScreen.style.display = 'flex';
        adminContent.style.display = 'none';
    }
});

// --- ВИХІД ---
window.logoutAdmin = function() {
    auth.signOut();
};

// Функція завантаження даних (loadAdminData) та інші залишаються як були раніше

// 3. ЗАВАНТАЖЕННЯ ЗАПИСІВ З БАЗИ
function loadAdminData() {
    const listCont = document.getElementById('admin-bookings-list');
    
    // .on('value', ...) автоматично оновлює список при нових заявках
    database.ref('bookings').on('value', (snapshot) => {
        const data = snapshot.val();
        listCont.innerHTML = "";
        
        if (!data) {
            listCont.innerHTML = "<p style='color: #666;'>Записів поки немає</p>";
            return;
        }

        // Сортуємо дати (від новіших до старіших)
        const sortedDates = Object.keys(data).sort().reverse();

        sortedDates.forEach(date => {
            const booking = data[date];
            const isConfirmed = booking.status === "confirmed" || (booking.clientName && booking.clientName.includes("ВИХІДНИЙ"));
            
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 15px; 
                border-bottom: 1px solid #222; 
                margin-bottom: 10px; 
                background: ${isConfirmed ? 'rgba(255,255,255,0.02)' : 'rgba(255, 204, 0, 0.08)'};
                border-left: 3px solid ${isConfirmed ? 'var(--neon-pink)' : '#ffcc00'};
            `;
            
            item.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong style="color: ${isConfirmed ? 'var(--neon-pink)' : '#ffcc00'}">
                        ${date} — ${isConfirmed ? 'ПІДТВЕРДЖЕНО' : 'НОВА ЗАЯВКА'}
                    </strong><br>
                    <span style="font-size: 1.1rem;">👤 ${booking.clientName}</span><br>
                    <small style="color: #aaa;">📱 Контакт: ${booking.clientContact}</small>
                    <p style="font-size: 0.9rem; color: #eee; margin: 8px 0; font-style: italic;">
                        " ${booking.idea || 'Опис відсутній' } "
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${!isConfirmed ? `<button onclick="confirmBooking('${date}')" style="background: #28a745; color: white; border: none; padding: 8px 15px; cursor: pointer; font-weight: bold;">ПІДТВЕРДИТИ</button>` : ''}
                    <button onclick="deleteBooking('${date}')" style="background: none; border: 1px solid #444; color: #888; padding: 8px 15px; cursor: pointer;">ВИДАЛИТИ</button>
                </div>
            `;
            listCont.appendChild(item);
        });
    });
}

// 4. ПІДТВЕРДЖЕННЯ (Зміна статусу на confirmed)
window.confirmBooking = function(date) {
    if(confirm(`Підтвердити запис на ${date}?`)) {
        database.ref('bookings/' + date).update({ status: "confirmed" });
    }
};

// 5. ВИДАЛЕННЯ
window.deleteBooking = function(date) {
    if (confirm(`Видалити цей запис (${date})?`)) {
        database.ref('bookings/' + date).remove();
    }
};

// 6. ВСТАНОВЛЕННЯ ВИХІДНОГО
window.setDayOff = function() {
    const date = document.getElementById('admin-day-off').value;
    if (!date) return alert("Оберіть дату");
    
    database.ref('bookings/' + date).set({
        clientName: "⛔ ВИХІДНИЙ",
        clientContact: "система",
        idea: "Цей день заблоковано в календарі",
        status: "confirmed",
        timestamp: Date.now()
    }).then(() => {
        alert("Дату заблоковано!");
    });
};
window.addManualBooking = function() {
    const name = document.getElementById('manual-name').value;
    const contact = document.getElementById('manual-contact').value;
    const idea = document.getElementById('manual-idea').value;
    const date = document.getElementById('manual-date').value;

    if (!date || !name) {
        alert("Обов'язково вкажіть дату та ім'я клієнта!");
        return;
    }

    // Створюємо запис у базі
    database.ref('bookings/' + date).set({
        clientName: name,
        clientContact: contact || "Внесено вручну",
        idea: idea || "Без опису",
        status: "confirmed", // Відразу підтверджено
        timestamp: Date.now()
    }).then(() => {
        alert("Клієнта успішно записано!");
        // Очищаємо поля після запису
        document.getElementById('manual-name').value = "";
        document.getElementById('manual-contact').value = "";
        document.getElementById('manual-idea').value = "";
        document.getElementById('manual-date').value = "";
    }).catch((error) => {
        console.error("Помилка:", error);
        alert("Не вдалося зберегти запис.");
    });
};
