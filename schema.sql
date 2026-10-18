
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    media_type TEXT NOT NULL
        CHECK (media_type IN ('image', 'video')),
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
