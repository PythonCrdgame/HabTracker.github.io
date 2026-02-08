const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Sutoraika:strikerda@qwerty1.xokern3.mongodb.net/habit-tracker?retryWrites=true&w=majority';

console.log('🔗 Attempting MongoDB connection...');

mongoose.connect(mongoURI)
.then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
});

// Root route - FIXES THE "Cannot GET /" ERROR
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Habit Tracker API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #333; }
                .endpoint { 
                    background: #f5f5f5; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 5px;
                    border-left: 4px solid #3b82f6;
                }
                code { 
                    background: #e5e7eb; 
                    padding: 2px 6px; 
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                }
                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    background: #10b981;
                    color: white;
                    border-radius: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Habit Tracker API</h1>
                <p><span class="status">✅ Running</span></p>
                <p>Database: <strong>${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}</strong></p>
                <p>Port: <strong>${process.env.PORT || 5000}</strong></p>
                
                <h2>Available Endpoints:</h2>
                
                <div class="endpoint">
                    <h3>GET <code>/api/test</code></h3>
                    <p>Test server status</p>
                    <a href="/api/test">Test now</a>
                </div>
                
                <div class="endpoint">
                    <h3>GET <code>/api/habits</code></h3>
                    <p>Get all habits</p>
                    <a href="/api/habits">View habits</a>
                </div>
                
                <div class="endpoint">
                    <h3>GET <code>/api/habits/today/status</code></h3>
                    <p>Get today's status</p>
                    <a href="/api/habits/today/status">View today</a>
                </div>
                
                <h2>Frontend:</h2>
                <p>Start the React frontend: <code>cd client && npm start</code></p>
                <p>Then visit: <a href="http://localhost:3000">http://localhost:3000</a></p>
            </div>
        </body>
        </html>
    `);
});

// Your existing API routes continue below...
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Habit Schema
const habitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    streak: {
        type: Number,
        default: 0
    },
    bestStreak: {
        type: Number,
        default: 0
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
    },
    completedDates: [{
        date: String,
        status: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    color: {
        type: String,
        default: '#3b82f6'
    }
});

const Habit = mongoose.model('Habit', habitSchema);

// API Routes
app.get('/api/habits', async (req, res) => {
    try {
        const habits = await Habit.find().sort({ createdAt: -1 });
        res.json(habits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/habits/today/status', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const habits = await Habit.find();
        
        const todayStatus = habits.map(habit => {
            const todayEntry = habit.completedDates.find(d => d.date === today);
            return {
                _id: habit._id,
                name: habit.name,
                streak: habit.streak,
                status: todayEntry ? todayEntry.status : 'none',
                color: habit.color
            };
        });
        
        res.json(todayStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/habits', async (req, res) => {
    try {
        const habit = new Habit(req.body);
        await habit.save();
        res.status(201).json(habit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/habits/:id/track', async (req, res) => {
    try {
        const { date, status } = req.body;
        const habit = await Habit.findById(req.params.id);
        
        if (!habit) return res.status(404).json({ message: 'Habit not found' });
        
        const dateIndex = habit.completedDates.findIndex(d => d.date === date);
        
        if (dateIndex >= 0) {
            habit.completedDates[dateIndex].status = status;
        } else {
            habit.completedDates.push({ date, status });
        }
        
        // Calculate streak
        let currentStreak = 0;
        const sortedDates = habit.completedDates
            .filter(d => d.status === 'completed')
            .map(d => new Date(d.date))
            .sort((a, b) => b - a);
        
        const today = new Date();
        
        for (let i = 0; i < sortedDates.length; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            
            const hasMatch = sortedDates.some(d => 
                d.getDate() === checkDate.getDate() &&
                d.getMonth() === checkDate.getMonth() &&
                d.getFullYear() === checkDate.getFullYear()
            );
            
            if (hasMatch) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        habit.streak = currentStreak;
        if (currentStreak > habit.bestStreak) {
            habit.bestStreak = currentStreak;
        }
        
        await habit.save();
        res.json(habit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/habits/:id', async (req, res) => {
    try {
        const habit = await Habit.findByIdAndDelete(req.params.id);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });
        res.json({ message: 'Habit deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT}`);
});