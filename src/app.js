import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const app = express();

// Security headers — must be first
app.use(helmet());

// Raw body parser for Stripe webhooks — must come BEFORE express.json()
// Stripe needs the raw body to verify the webhook signature
app.use('/api/v1/pay/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

// Global error handler — must be last middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ error: message });
});

export { app };
