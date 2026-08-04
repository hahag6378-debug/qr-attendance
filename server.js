const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// បញ្ជូន File index.html ទៅកាន់ទូរស័ព្ទដោយស្វ័យប្រវត្តិ
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ទីតាំង GPS ក្រុមហ៊ុន (អាចប្តូរ Coordinate តាមក្រោយបាន)
const OFFICE_LAT = 11.5564;
const OFFICE_LNG = 104.9282;
const ALLOWED_METERS = 100;

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

app.post('/api/checkin', (req, res) => {
    const { userName, userLat, userLng } = req.body;
    const distance = getDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);

    if (distance <= ALLOWED_METERS) {
        return res.json({ 
            success: true, 
            message: `ចុះវត្តមានជោគជ័យ! អ្នកនៅចម្ងាយ ${distance.toFixed(0)}m ពីក្រុមហ៊ុន។` 
        });
    } else {
        return res.status(400).json({ 
            success: false, 
            message: `បរាជ័យ! អ្នកនៅឆ្ងាយពីក្រុមហ៊ុនពេក (${(distance/1000).toFixed(2)} km)។` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));