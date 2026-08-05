const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 📍 ទីតាំងហាង/ការិយាល័យ (Latitude, Longitude) ឧទាហរណ៍៖ ភ្នំពេញ
const OFFICE_LAT = 11.5564;
const OFFICE_LNG = 104.9282;
const ALLOWED_METERS = 100; // កំណត់ឱ្យស្កេនបានតែក្នុងរង្វង់ ១០០ ម៉ែត្រប៉ុណ្ណោះ

// 🔴 QR Code Content
const VALID_QR_CODE = "https://q.me-qr.com/c4emo1w3";

// ផ្ទុកទិន្នន័យបណ្តោះអាសន្ន (In-Memory Database)
const attendanceLogs = [];

// មុខងារគណនាចម្ងាយ GPS ជាម៉ែត្រ
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // កាំផែនដីជាម៉ែត្រ
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // ទទួលបានចម្ងាយជាម៉ែត្រ
}

// 1. API សម្រាប់ Check-in / Check-out
app.post('/api/checkin', (req, res) => {
    try {
        const { userName, userLat, userLng, actionType, qrCodeData } = req.body;

        // ផ្ទៀងផ្ទាត់ QR Code
        if (!qrCodeData || qrCodeData.trim() !== VALID_QR_CODE.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: `QR មិនត្រូវ! អ្នកស្កេនចំ: "${qrCodeData}"` 
            });
        }

        // ផ្ទៀងផ្ទាត់ GPS ចម្ងាយ
        if (userLat === undefined || userLng === undefined) {
            return res.status(400).json({
                success: false,
                message: "មិនអាចទាញយកទីតាំង GPS របស់អ្នកបានទេ!"
            });
        }

        const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);
        
        if (distance > ALLOWED_METERS) {
            return res.status(400).json({ 
                success: false, 
                message: `អ្នកនៅឆ្ងាយពីហាងពេក! (ចម្ងាយបច្ចុប្បន្ន: ${distance}m / អនុញ្ញាតត្រឹម: ${ALLOWED_METERS}m)` 
            });
        }

        // រក្សាទុកទិន្នន័យ
        const record = {
            id: attendanceLogs.length + 1,
            userName,
            actionType,
            distance: `${distance} ម៉ែត្រ`,
            timestamp: new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })
        };
        attendanceLogs.push(record);

        return res.json({ 
            success: true, 
            message: `✅ ${actionType} ជោគជ័យ! (ចម្ងាយពីហាង: ${distance}m)` 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server មានបញ្ហា!" });
    }
});

// 2. API សម្រាប់ទាញយកទិន្នន័យ (Download Data JSON)
app.get('/api/export-data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.json"');
    res.send(JSON.stringify(attendanceLogs, null, 2));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
