const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ផ្ទុកទិន្នន័យ
let attendanceRecords = [];
let systemConfig = {
    botToken: '',
    chatId: '',
    shiftStart: '06:00',
    gpsRadius: 50
};

// 🟢 អនុគមន៍ផ្ញើសារប្រាប់ដំណឹងទៅ Telegram
async function sendTelegramNotification(userName, actionType, distance) {
    const { botToken, chatId } = systemConfig;
    
    // បើគ្មាន Token ឬ Chat ID ទេ វាមិនផ្ញើឡើយ
    if (!botToken || !chatId) {
        console.log("⚠️ មិនទាន់កំណត់ Telegram Bot Token ឬ Chat ID ឡើយ!");
        return;
    }

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
        console.log("✅ ផ្ញើសារទៅ Telegram ជោគជ័យ!");
    } catch (error) {
        console.error("❌ Telegram Notification Error:", error);
    }
}

// 🟢 API សម្រាប់ រក្សាទុកការកំណត់ (Settings) ពី Admin
app.post('/api/save-settings', (req, res) => {
    const { shiftStart, gpsRadius, botToken, chatId } = req.body;
    systemConfig = { shiftStart, gpsRadius, botToken, chatId };
    res.json({ success: true, message: 'រក្សាទុកការកំណត់ជោគជ័យ!' });
});

// 🟢 API សម្រាប់ ទាញយកការកំណត់ (Settings) មកបង្ហាញលើ Admin
app.get('/api/get-settings', (req, res) => {
    res.json(systemConfig);
});

// 🟢 API សម្រាប់ បុគ្គលិកស្កេនវត្តមាន
app.post('/api/scan-attendance', (req, res) => {
    const { userName, actionType, distance } = req.body;

    const newRecord = {
        id: attendanceRecords.length + 1,
        userName: userName || 'Employee',
        actionType: actionType || 'Check-In',
        distance: distance || 0,
        timestamp: new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })
    };

    attendanceRecords.unshift(newRecord);

    // ហៅអនុគមន៍ផ្ញើសារ Telegram
    sendTelegramNotification(newRecord.userName, newRecord.actionType, newRecord.distance);

    res.json({ success: true, message: 'ស្កេនវត្តមានជោគជ័យ!', record: newRecord });
});

// 🟢 API សម្រាប់ Admin ទាញយកទិន្នន័យ
app.get('/api/export-data', (req, res) => {
    res.json(attendanceRecords);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
