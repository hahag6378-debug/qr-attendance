const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const JWT_SECRET = 'my_secret_key_attendance_2026';

// 🟢 1. Database Schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' }
});

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    actionType: String,
    shift: String,
    status: String,
    lateBy: Number,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

// 🟢 2. Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'សូម Login ជាមុនសិន!' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Session អស់សុពលភាព!' });
        req.user = user;
        next();
    });
};

// 🟢 3. API Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ success: false, message: 'រកមិនឃើញគណនីនេះទេ!' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ success: false, message: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ!' });

    const token = jwt.sign({ id: user._id, fullName: user.fullName, role: user.role }, JWT_SECRET);
    res.json({ success: true, token, user: { fullName: user.fullName, role: user.role } });
});

// 🟢 4. API សម្រាប់ Admin: បន្ថែមបុគ្គលិក (Add User)
app.post('/api/admin/add-employee', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'គ្មានសិទ្ធិ!' });

    const { username, password, fullName } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, fullName, role: 'employee' });
        await newUser.save();
        res.json({ success: true, message: 'បន្ថែមបុគ្គលិកជោគជ័យ!' });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Username នេះមានរួចហើយ!' });
    }
});

// 🟢 5. API សម្រាប់ បុគ្គលិក: ស្កេនវត្តមាន (មិនបាច់វាយឈ្មោះ)
app.post('/api/employee/scan', authenticateToken, async (req, res) => {
    const { actionType } = req.body;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    let shift = 'វេនព្រឹក';
    let status = 'ទាន់ម៉ោង';
    let lateBy = 0;

    if (actionType === 'Check-In') {
        if (totalMinutes <= 480) { // មុន 8:00 AM -> វេនព្រឹក (6:00 AM)
            shift = 'វេនព្រឹក';
            lateBy = Math.max(0, totalMinutes - 360 - 15);
        } else { // វេនរសៀល (10:00 AM)
            shift = 'វេនរសៀល';
            lateBy = Math.max(0, totalMinutes - 600 - 15);
        }
        status = lateBy > 0 ? 'យឺត' : 'ទាន់ម៉ោង';
    }

    const record = new Attendance({
        userId: req.user.id,
        userName: req.user.fullName,
        actionType,
        shift,
        status,
        lateBy
    });

    await record.save();
    res.json({ success: true, message: `ស្កេនជោគជ័យ [${shift} - ${status}]`, record });
});

// 🟢 បង្កើត Admin Default ប្រសិនបើមិនទាន់មាន
async function createDefaultAdmin() {
    const adminExist = await User.findOne({ role: 'admin' });
    if (!adminExist) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({ username: 'admin', password: hashedPassword, fullName: 'System Admin', role: 'admin' });
        console.log('👤 Admin Default Created: Username: admin | Password: admin123');
    }
}

// 🟢 ភ្ជាប់ MongoDB & Run Server
// ជំនួស URI ខាងក្រោមដោយ MongoDB Atlas Link របស់បង ឬទុក 'mongodb://127.0.0.1:27017/attendance_db' ប្រសិនបើប្រើក្នុងម៉ាស៊ីន
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendance_db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        createDefaultAdmin();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err));
