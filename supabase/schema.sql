-- Enable PostGIS for Spatial Calculations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Operational Zones Table (MCC Wards, CMCs, Town Panchayats)
CREATE TABLE operational_zones (
   zone_id VARCHAR(50) PRIMARY KEY, -- e.g., 'MCC_ZONE_3', 'PANCHAYAT_BOGADI'
   name VARCHAR(100) NOT NULL,
   boundary_geom GEOMETRY(Polygon, 4326),
   buffer_geom GEOMETRY(Polygon, 4326),
   geojson JSONB
);

-- 2. Fleet Assets Table
CREATE TABLE fleet_assets (
   zone_id VARCHAR(50) PRIMARY KEY REFERENCES operational_zones(zone_id),
   tipper_trucks_active INT DEFAULT 2,
   backhoes_active INT DEFAULT 1,
   labor_squads_active INT DEFAULT 4,
   spillover_quota_monthly INT DEFAULT 20,
   spillover_used_monthly INT DEFAULT 0
);

-- 3. Core Incidents Table
CREATE TABLE incidents (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   tracking_code VARCHAR(12) UNIQUE NOT NULL,
   latitude DECIMAL(10, 7) NOT NULL,
   longitude DECIMAL(10, 7) NOT NULL,
   category VARCHAR(50) NOT NULL,
   description TEXT,
   evidence_photo_url TEXT,
   severity_rank INT CHECK (severity_rank BETWEEN 1 AND 5),
   home_zone_id VARCHAR(50) NOT NULL,
   dispatched_zone_id VARCHAR(50) NOT NULL,
   is_spillover BOOLEAN DEFAULT FALSE,
   status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED, ESCALATED
   before_image_url TEXT,
   after_image_url TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. Inter-Agency Clearing Ledger (Financial Attribution)
CREATE TABLE inter_agency_clearing_ledger (
   entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   incident_id UUID REFERENCES incidents(id),
   debtor_zone_id VARCHAR(50) NOT NULL,   -- Overloaded zone that owned the land
   creditor_zone_id VARCHAR(50) NOT NULL, -- Performing zone that deployed machinery
   clearing_cost_inr DECIMAL(10, 2) NOT NULL,
   settlement_status VARCHAR(20) DEFAULT 'PENDING',
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Field Verification Log
CREATE TABLE verification_logs (
   log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   incident_id UUID REFERENCES incidents(id),
   worker_id VARCHAR(50) NOT NULL,
   closure_latitude DECIMAL(10, 7) NOT NULL,
   closure_longitude DECIMAL(10, 7) NOT NULL,
   distance_from_origin_meters DECIMAL(6, 2) NOT NULL,
   verified_photo_url TEXT NOT NULL,
   closure_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Starter Data
INSERT INTO operational_zones (zone_id, name) VALUES
('MCC_ZONE_3', 'MCC Zone 3'),
('TP_BOGADI', 'Bogadi Town Panchayat');

INSERT INTO fleet_assets (zone_id, tipper_trucks_active, backhoes_active, labor_squads_active) VALUES
('MCC_ZONE_3', 3, 2, 5),
('TP_BOGADI', 1, 0, 2);
