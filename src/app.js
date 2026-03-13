import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoose from 'mongoose';

const app = express();

// DO-4: Redirect HTTP → HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// DO-3: Helmet with explicit Content-Security-Policy
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
            connectSrc: ["'self'", 'https://api.stripe.com'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 63072000,  // 2 years
        includeSubDomains: true,
        preload: true,
    },
}));

// Raw body parser for Stripe webhooks — must come BEFORE express.json()
// Stripe needs the raw body to verify the webhook signature
app.use('/api/v1/pay/webhook', express.raw({ type: 'application/json' }));

// CRIT-5: Use explicit CLIENT_URL — never a wildcard with credentials: true
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Importing the routes
import userRouter from "./routes/user.routes.js";
import parkingSpaceRouter from "./routes/parkingSpace.routes.js";
import reservationRouter from "./routes/reservation.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";

// Routes declaration and usage
app.use("/api/v1/users", userRouter);
app.use("/api/v1/parking-space", parkingSpaceRouter);
app.use("/api/v1/reservation", reservationRouter);
app.use("/api/v1/pay", paymentRouter);
app.use("/api/v1/review", reviewRouter);

// DO-5: Structured health check — verifies DB connectivity
app.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const status = dbState === 1 ? 200 : 503;
    res.status(status).json({
        status: dbState === 1 ? 'ok' : 'degraded',
        db: dbStatus,
        uptime: process.uptime(),
    });
});

// Global error handler — must be last middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
});

export { app };
