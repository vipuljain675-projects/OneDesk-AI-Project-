-- =============================================================
-- user_profiles table
-- Auto-populated on every login via Supabase Auth trigger
-- Stores employee metadata: name, email, role, department, etc.
-- =============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,       -- maps to Supabase auth user email
    full_name       VARCHAR(255) NOT NULL DEFAULT '',
    avatar          VARCHAR(10) NOT NULL DEFAULT '',    -- 2-char initials e.g. "VJ"
    role            VARCHAR(50) NOT NULL DEFAULT 'employee',  -- employee | admin
    department      VARCHAR(100) NOT NULL DEFAULT 'General',
    employee_id     VARCHAR(50),                        -- optional formal ID like "EMP001"
    job_title       VARCHAR(100),
    phone           VARCHAR(30),
    location        VARCHAR(100),
    age             INT,
    joined_at       DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup by email (most common query)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Disable RLS for now (hackathon mode) -- enable later with proper policies
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
