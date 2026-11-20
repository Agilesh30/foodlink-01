-- Supabase Schema for FoodLink (Email-Based Authentication)
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. Real Users Table (Email as Primary Identifier)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('donor', 'ngo', 'admin', 'inspector')),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Safe migration if users table was already created
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
    END IF;
END $$;

-- Case-insensitive index for email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- 2. Real Food Listings Table
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    servings INTEGER NOT NULL,
    veg BOOLEAN DEFAULT true,
    nature TEXT,                                     -- Freshly cooked / Packaged
    expires TIMESTAMPTZ NOT NULL,
    address TEXT NOT NULL,
    donor TEXT NOT NULL,                             -- Display name of donor/restaurant/mess
    donor_user TEXT NOT NULL,                        -- Donor's email address
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'picked_up', 'expired')),
    approval TEXT DEFAULT 'pending' CHECK (approval IN ('pending', 'approved', 'rejected')),
    inspect_note TEXT,
    inspected_at TIMESTAMPTZ,
    code TEXT,                                       -- 4-digit verification code generated upon claim
    assigned_inspector TEXT,                         -- Email of the assigned inspector
    claimed_at TIMESTAMPTZ,
    claimed_by TEXT,                                 -- NGO's email address
    claimer JSONB,                                   -- { name, phone, mail, kind }
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure assigned_inspector column exists on foods table
ALTER TABLE foods ADD COLUMN IF NOT EXISTS assigned_inspector TEXT;

-- Indexes for active approved food listings
CREATE INDEX IF NOT EXISTS idx_foods_status_approval ON foods (status, approval);
CREATE INDEX IF NOT EXISTS idx_foods_donor_user ON foods (donor_user);
CREATE INDEX IF NOT EXISTS idx_foods_claimed_by ON foods (claimed_by);

-- 3. Sessions Table (for Express session persistence)
CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- 4. Permissions (allows seamless access with your key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE foods DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE users TO anon, authenticated, service_role;
GRANT ALL ON TABLE foods TO anon, authenticated, service_role;
GRANT ALL ON TABLE sessions TO anon, authenticated, service_role;
