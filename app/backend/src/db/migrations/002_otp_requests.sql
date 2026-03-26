CREATE TABLE IF NOT EXISTS otp_requests (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_expires_at ON otp_requests (expires_at);
