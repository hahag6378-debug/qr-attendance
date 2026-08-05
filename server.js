const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// កំណត់ QR Code ឱ្យត្រូវជាមួយ Link ដែលបងបានស្កេនឃើញ
const VALID_QR_CODE = "https://q.me-qr.com/c4emo1w3";

app.post('/api/checkin', (req, res) => {
    try {
        const { userName, actionType, qrCodeData } = req.body;

        // ផ្ទៀងផ្ទាត់ QR Code
        if (!qrCodeData || qrCodeData.trim() !== VALID_QR_CODE.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: `QR មិនត្រូវ! អ្នកស្កេនចំ: "${qrCodeData}"` 
            });
        }

        return res.json({ 
            success: true, 
            message: `✅ ${actionType} ជោគជ័យ! សួស្តី ${userName}` 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server មានបញ្ហា!" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
