CREATE TABLE IF NOT EXISTS version_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL,
    version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_key VARCHAR(512) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_hash VARCHAR(128) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_version_file_name UNIQUE (version_id, file_name),
    CONSTRAINT fk_version_files_package_id
    FOREIGN KEY (package_id) REFERENCES packages(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_version_files_version_id ON version_files (version_id);
CREATE INDEX IF NOT EXISTS idx_version_files_package_id ON version_files (package_id);
