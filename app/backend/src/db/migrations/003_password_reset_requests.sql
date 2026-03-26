CREATE TABLE IF NOT EXISTS password_reset_requests (
    email VARCHAR(255) PRIMARY KEY,
    otp_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_expires_at ON password_reset_requests (expires_at);
