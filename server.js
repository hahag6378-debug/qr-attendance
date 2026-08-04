const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// 🔴 1. ដាក់ Google Sheet Web App URL របស់អ្នកត្រង់នេះ
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbzyVbizqdKWSy03tvw9NKPBS4zRTxkvv9odNv82h8QxdYeXGBVN1vNwwu7yY_qk4DDQjQ/exec";

// បញ្ជូន File index.html ទៅកាន់អ្នកប្រើប្រាស់ដោយស្វ័យប្រវត្តិ
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ទីតាំង GPS ក្រុមហ៊ុន (អាចប្តូរ Coordinate តាមក្រោយបាន)
const OFFICE_LAT = 11.5307426;
const OFFICE_LNG = 104.9237006;
const ALLOWED_METERS = 30;

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

app.post('/api/checkin', async (req, res) => {
    const { userName, userLat, userLng, actionType } = req.body;
    
    // គណនាចម្ងាយ
    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);

    // ប្រសិនបើស្ថិតក្នុងរង្វង់ 10 ម៉ែត្រ
    if (distance <= ALLOWED_METERS) {
        try {
            // បញ្ជូនទិន្នន័យទៅ Google Sheet
            if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.includes("YOUR_ACTUAL_SCRIPT_ID")) {
                await fetch(GOOGLE_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userName,
                        userLat,
                        userLng,
                        status: actionType || "វត្តមាន"
                    })
                });
            }

            return res.json({
                success: true,
                message: `ចុះវត្តមានជោគជ័យ! អ្នកនៅចម្ងាយ ${distance.toFixed(0)}m ពីក្រុមហ៊ុន។`
            });
        } catch (err) {
            console.error("Sheet Error:", err);
            return res.status(500).json({ success: false, message: "មានបញ្ហាក្នុងការបញ្ជូនទៅ Google Sheet!" });
        }
    } else {
        // បើនៅឆ្ងាយលើស ៣០ ម៉ែត្រ
        return res.status(400).json({
            success: false,
            message: `បរាជ័យ! អ្នកនៅឆ្ងាយពីក្រុមហ៊ុនពេក (${(distance/1000).toFixed(2)} km)`
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// កូដសម្គាល់ QR Code ដែលអ្នកបាន Print បិទនៅច្រកទ្វារ
const VALID_QR_CODE = "COMPANY_OFFICE_QR_2026";

app.post('/api/checkin', async (req, res) => {
    const { userName, userLat, userLng, actionType, qrCodeData } = req.body;
    
    // ១. ផ្ទៀងផ្ទាត់ QR Code
    if (qrCodeData !== VALID_QR_CODE) {
        return res.status(400).json({
            success: false,
            message: "QR Code មិនត្រឹមត្រូវ! សូមស្កេន QR Code ក្រុមហ៊ុននៅច្រកទ្វារ។"
        });
    }

    // ២. ផ្ទៀងផ្ទាត់ GPS ចម្ងាយ
    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);

    if (distance <= ALLOWED_METERS) {
        try {
            if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.includes("YOUR_ACTUAL_SCRIPT_ID")) {
                await fetch(GOOGLE_SHEET_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userName,
                        userLat,
                        userLng,
                        status: actionType || "Check-In"
                    })
                });
            }

            return res.json({
                success: true,
                message: `ចុះវត្តមាន ${actionType} ជោគជ័យ! (${distance.toFixed(0)}m ពីក្រុមហ៊ុន)`
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: "មានបញ្ហាក្នុងការបញ្ជូនទៅ Google Sheet!" });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: `បរាជ័យ! អ្នកនៅឆ្ងាយពីក្រុមហ៊ុនពេក (${(distance/1000).toFixed(2)} km)`
        });
    }
});
