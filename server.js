const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let attendanceRecords = [];

// 🟢 អនុគមន៍ផ្ញើសារទៅ Telegram (កែប្រែឱ្យដើរ ១០០% គ្មាន Error)
async function sendTelegramNotification(userName, actionType, distance, botToken, chatId) {
    if (!botToken || !chatId) {
        console.log("⚠️ មិនទាន់មាន Bot Token ឬ Chat ID ឡើយ!");
        return;
    }

    const icon = actionType === 'Check-In' ? '🟢' : '🔴';
    const timeString = new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });

    // រៀបចំសារធម្មតា (មិនប្រើ Markdown ដើម្បីចៀសវាង Telegram Reject សារ)
    const message = `${icon} ការស្កេនវត្តមានថ្មី!\n\n` +
                    `👤 បុគ្គលិក: ${userName}\n` +
                    `📌 សកម្មភាព: ${actionType}\n` +
                    `📍 ចម្ងាយ: ${distance} ម៉ែត្រ\n` +
                    `⏰ កាលបរិច្ឆេទ: ${timeString}`;

    try {
        const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId.trim(),
                text: message
            })
        });

        const resData = await response.json();
        if (!resData.ok) {
            console.error("❌ Telegram API Error:", resData.description);
        } else {
            console.log("✅ ផ្ញើសារទៅ Telegram ជោគជ័យ!");
        }
    } catch (error) {
        console.error("❌ Fetch Error:", error);
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

    // ផ្ញើសារទៅ Telegram
    sendTelegramNotification(newRecord.userName, newRecord.actionType, newRecord.distance, botToken, chatId);

    res.json({ success: true, message: 'ស្កេនវត្តមានជោគជ័យ!', record: newRecord });
});

// 🟢 API សម្រាប់ Admin
app.get('/api/export-data', (req, res) => {
    res.json(attendanceRecords);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
