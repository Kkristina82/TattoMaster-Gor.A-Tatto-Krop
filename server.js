const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Робимо всі файли в папці доступними для браузера
app.use(express.static(__dirname));

// API для отримання списку фотографій
app.get('/api/photos', (req, res) => {
    const imgFolder = path.join(__dirname, 'img');

    // Перевіряємо, чи існує папка
    if (!fs.existsSync(imgFolder)) {
        return res.status(404).json({ error: "Папка img не знайдена" });
    }

    fs.readdir(imgFolder, (err, files) => {
        if (err) return res.status(500).json({ error: "Помилка читання папки" });
        
        // Фільтруємо лише зображення
        const images = files.filter(file => 
            /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
        );
        res.json(images);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер працює на: http://localhost:${PORT}`);
});