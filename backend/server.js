const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger'); // Winston logger
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./config/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            // useNewUrlParser: true, // Not needed in Mongoose 6+
            // useUnifiedTopology: true, // Not needed in Mongoose 6+
        });
        logger.info('MongoDB connected successfully');
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

connectDB();

// Apply Global Middleware
if (process.env.NODE_ENV === 'production') {
    app.use(helmet()); // Basic security headers
}
app.use(cors()); // Enable CORS for all origins (configure in production)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(logger.middleware); // Winston HTTP request logger
app.use(rateLimiter); // Apply rate limiting to all requests

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing server
app.get('/', (req, res) => {
    res.send('Inventory Management System API is running!');
});

// Global Error Handling Middleware (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app; // Export for testing or other purposes
