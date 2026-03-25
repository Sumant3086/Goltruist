require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scoreRoutes = require('./routes/scores');
const subscriptionRoutes = require('./routes/subscriptions');
const drawRoutes = require('./routes/draws');
const charityRoutes = require('./routes/charities');
const adminRoutes = require('./routes/admin');
const winnerRoutes = require('./routes/winners');
const donationRoutes = require('./routes/donations');

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    /\.vercel\.app$/,   // allow any vercel preview URL
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/donations', donationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
