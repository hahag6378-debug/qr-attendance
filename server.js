const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔴 ទីតាំងហាងរបស់អ្នក (Latitude, Longitude)
const OFFICE_LAT = 11.5564; 
const OFFICE_LNG = 104.9282; 
const ALLOWED_METERS = 30; // កំណត់ចម្ងាយ ៣០ ម៉ែត្រ

// 🔴 QR Code Content ផ្លូវការរបស់ហាង
const VALID_QR_CODE = "MY_SHOP_ATTENDANCE_2026";

// 🔴 Google Apps Script Web App URL របស់អ្នក
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxDHFlgKX_wMpwM1PE3Mz1oepqLssvK0CsWzUvV1qGhQd2I0-CGUmr7td-tS_G0Vao49g/exec";

// មុខងារគណនាចម្ងាយ GPS (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}

app.post('/api/checkin', async (req, res) => {
    const { userName, userLat, userLng, actionType, qrCodeData } = req.body;

    if (!userName || userName.trim() === "") {
        return res.status(400).json({ success: false, message: "សូមបញ្ចូលឈ្មោះ ឬ ID បុគ្គលិក!" });
    }

    // ផ្ទៀងផ្ទាត់ QR Code
    if (qrCodeData !== VALID_QR_CODE) {
        return res.status(400).json({ success: false, message: "QR Code មិនត្រឹមត្រូវឡើយ!" });
    }

    // ផ្ទៀងផ្ទាត់ទីតាំង GPS (30m)
    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);
    if (distance > ALLOWED_METERS) {
        return res.status(400).json({
            success: false,
            message: `បរាជ័យ! អ្នកនៅឆ្ងាយពីហាងពេក (${distance.toFixed(0)} ម៉ែត្រ)`
        });
    }

    // បញ្ជូនទៅកាន់ Google Apps Script
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: userName.trim(),
                userLat,
                userLng,
                status: actionType || "Check-In"
            })
        });

        return res.json({
            success: true,
            message: `ចុះវត្តមាន ${actionType} ជោគជ័យ! (${distance.toFixed(0)}m ពីហាង)`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "មានបញ្ហាក្នុងការផ្ញើទិន្នន័យ!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
