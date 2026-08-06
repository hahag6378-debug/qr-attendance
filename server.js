const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_attendance_key_123';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Temporary In-Memory Database (សម្រាប់តេស្ត ឬអាចភ្ជាប់ MongoDB/PostgreSQL)
let users = [
    { id: 1, fullName: 'Admin System', username: 'admin', password: 'adminpassword', role: 'admin' },
    { id: 2, fullName: 'សុខ មករា', username: 'sokmakara', password: '123', role: 'employee' }
];

let attendanceLogs = [];
const COMPANY_QR_SECRET = "COMPANY_ATTENDANCE_SECRET_KEY";

// Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'ត្រូវការ Token ដើម្បីចូលប្រព័ន្ធ' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token មិនត្រឹមត្រូវ ឬផុតកំណត់' });
        req.user = user;
        next();
    });
}

// 1. API Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role }
    });
});

// 2. API សម្រាប់ Admin បង្កើតគណនីបុគ្គលិកថ្មី
app.post('/api/admin/create-employee', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'សិទ្ធិមិនគ្រប់គ្រាន់!' });
    }

    const { fullName, username, password } = req.body;
    if (!fullName || !username || !password) {
        return res.status(400).json({ success: false, message: 'សូមបំពេញព័ត៌មានឱ្យគ្រប់!' });
    }

    const existing = users.find(u => u.username === username);
    if (existing) {
        return res.status(400).json({ success: false, message: 'ឈ្មោះគណនីនេះមានរួចហើយ!' });
    }

    const newUser = {
        id: users.length + 1,
        fullName,
        username,
        password,
        role: 'employee'
    };
    users.push(newUser);

    res.json({ success: true, message: 'បង្កើតគណនីបុគ្គលិកជោគជ័យ!', user: newUser });
});

// 3. API សម្រាប់ Admin មើលរបាយការណ៍វត្តមាន (Attendance Logs)
app.get('/api/admin/attendance-logs', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'សិទ្ធិមិនគ្រប់គ្រាន់!' });
    }
    res.json({ success: true, logs: attendanceLogs });
});

// 4. API សម្រាប់បុគ្គលិកស្កេន QR Code
app.post('/api/employee/scan', authenticateToken, (req, res) => {
    const { actionType, qrCode } = req.body;

    if (qrCode !== COMPANY_QR_SECRET) {
        return res.status(400).json({ success: false, message: 'QR Code មិនត្រឹមត្រូវឡើយ!' });
    }

    const newLog = {
        id: attendanceLogs.length + 1,
        userId: req.user.id,
        employeeName: req.user.fullName,
        username: req.user.username,
        actionType: actionType || 'Check-In',
        createdAt: new Date().toISOString()
    };

    attendanceLogs.unshift(newLog);

    res.json({
        success: true,
        message: `${actionType || 'Check-In'} ជោគជ័យ!`,
        log: newLog
    });
});

// Catch-all route នាំទៅ login.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
