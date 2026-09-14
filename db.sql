-- Esquema PostgreSQL — Servicio Americano SPA

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(8) NOT NULL UNIQUE,  -- 8 dígitos normalizados (sin "+56 9")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technicians (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(16) NOT NULL UNIQUE,  -- 16 dígitos normalizados (sin "+56 9")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    commune TEXT NOT NULL,
    full_address TEXT NOT NULL,
    broken_device TEXT NOT NULL,
    device_brand TEXT NOT NULL,
    user_problem_description TEXT NOT NULL,

    scheduled_date TIMESTAMPTZ NOT NULL,
    google_event_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    technician_id INT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (technician_id) REFERENCES technicians(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_services_scheduled_date ON services (scheduled_date);