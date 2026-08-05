const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ផ្ទុកទិន្នន័យវត្តមានបណ្តោះអាសន្ន
let attendanceRecords = [];

// 🟢 អនុគមន៍ផ្ញើសារស្វ័យប្រវត្តិទៅកាន់ Telegram
async function sendTelegramNotification(userName, actionType, distance, botToken, chatId) {
    if (!botToken || !chatId) return;

    const icon = actionType === 'Check-In' ? '🟢' : '🔴';
    const timeString = new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });

    const message = `${icon} *ការស្កេនវត្តមានថ្មី!*\n\n` +
                    `👤 *បុគ្គលិក:* ${userName}\n` +
                    `📌 *សកម្មភាព:* ${actionType}\n` +
                    `📍 *ចម្ងាយ:* ${distance} ម៉ែត្រ\n` +
                    `⏰ *កាលបរិច្ឆេទ:* ${timeString}`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error("Telegram Notification Error:", error);
    }
}

// 🟢 API សម្រាប់បុគ្គលិកស្កេនវត្តមាន
app.post('/api/scan-attendance', (req, res) => {
    const { userName, actionType, distance, botToken, chatId } = req.body;

    const newRecord = {
        id: attendanceRecords.length + 1,
        userName: userName || 'Employee',
        actionType: actionType || 'Check-In',
        distance: distance || 0,
        timestamp: new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })
    };

    attendanceRecords.unshift(newRecord);

    // ផ្ញើសារប្រាប់ដំណឹងទៅ Telegram ភ្លាមៗ
    sendTelegramNotification(newRecord.userName, newRecord.actionType, newRecord.distance, botToken, chatId);

    res.json({ success: true, message: 'ស្កេនវត្តមានជោគជ័យ!', record: newRecord });
});

// 🟢 API សម្រាប់ Admin ទាញយកទិន្នន័យ
app.get('/api/export-data', (req, res) => {
    res.json(attendanceRecords);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
