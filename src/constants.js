export const DB_NAME = "SpotShareDB";

// FS-2: Centralised magic strings — import these instead of raw string literals
export const RESERVATION_STATUS = Object.freeze({
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
});

export const PAYMENT_STATUS = Object.freeze({
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
});

export const USER_ROLE = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
});

export const PARKING_STATUS = Object.freeze({
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
});