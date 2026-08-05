const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 📍 ទីតាំងហាង/ការិយាល័យ (Latitude, Longitude)
const OFFICE_LAT = 11.5564;
const OFFICE_LNG = 104.9282;
const ALLOWED_METERS = 50000; // កើនចម្ងាយដល់ ៥០ គីឡូម៉ែត្រ ដើម្បីកុំឱ្យស្ទះ GPS

// 🔴 QR Code Content (កំណត់ត្រូវតាម Link ដែលស្កេនឃើញ)
const VALID_QR_CODE = "https://q.me-qr.com/c4emo1w3";

// 🔴 Google Apps Script Web App URL
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// មុខងារគណនាចម្ងាយ GPS (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// API ទទួលការ Check-In / Check-Out
app.post('/api/checkin', async (req, res) => {
    try {
        const { userName, userLat, userLng, actionType, qrCodeData } = req.body;

        // ១. ផ្ទៀងផ្ទាត់ QR Code (Trim លុបចន្លោះទំនេរ)
        if (!qrCodeData || qrCodeData.trim() !== VALID_QR_CODE.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: `QR មិនត្រូវ! អ្នកស្កេនចំ: "${qrCodeData}"` 
            });
        }

        // ២. ផ្ទៀងផ្ទាត់ GPS ចម្ងាយ
        const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);
        if (distance > ALLOWED_METERS) {
            return res.status(400).json({ 
                success: false, 
                message: `អ្នកនៅឆ្ងាយពីហាងពេក (${Math.round(distance)} ម៉ែត្រ)!` 
            });
        }

        // ៣. ផ្ញើទិន្នន័យទៅ Google Sheet
        if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.includes("YOUR_SCRIPT_ID")) {
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: userName,
                    actionType: actionType,
                    distance: Math.round(distance),
                    timestamp: new Date().toISOString()
                })
            });
        }

        return res.json({ 
            success: true, 
            message: `✅ ${actionType} ជោគជ័យ!` 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "មានបញ្ហានៅលើ Server!" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
