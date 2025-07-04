-- Create CMMS Schema Migration
-- Based on the data model from docs/data_model.md

-- Master Tables
CREATE TABLE equipment_type_master (
    -�.%ID INTEGER PRIMARY KEY,
    -�.% VARCHAR(50) NOT NULL,
    � TEXT
);

CREATE TABLE work_type_master (
    \m.%ID INTEGER PRIMARY KEY,
    \m.% VARCHAR(50) NOT NULL,
    � TEXT,
    �\mB� INTEGER -- in hours
);

CREATE TABLE staff_master (
    �SID VARCHAR(10) PRIMARY KEY,
     VARCHAR(50) NOT NULL,
    �r VARCHAR(50),
    yw VARCHAR(30),
    �� VARCHAR(30),
    #aH VARCHAR(100)
);

CREATE TABLE contractor_master (
    mID VARCHAR(10) PRIMARY KEY,
    m VARCHAR(100) NOT NULL,
    m.% VARCHAR(50),
    �� VARCHAR(50),
    #aH VARCHAR(100),
    �S VARCHAR(50),
    Q��� DATE,
    QB�� DATE
);

CREATE TABLE inspection_cycle_master (
    hID INTEGER PRIMARY KEY,
    h VARCHAR(20) NOT NULL,
    h�p INTEGER NOT NULL,
    � TEXT
);

-- Main Tables
CREATE TABLE equipment (
    -�ID VARCHAR(10) PRIMARY KEY,
    -� VARCHAR(100) NOT NULL,
    -�.%ID INTEGER REFERENCES equipment_type_master(-�.%ID),
    -��� VARCHAR(20) UNIQUE NOT NULL,
    -n4@ VARCHAR(100),
    �  VARCHAR(50),
    � VARCHAR(50),
    -nt� DATE,
    <ͶK VARCHAR(20),
    ́� VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE work_order (
    \m:ID VARCHAR(10) PRIMARY KEY,
    -�ID VARCHAR(10) REFERENCES equipment(-�ID),
    \m.%ID INTEGER REFERENCES work_type_master(\m.%ID),
    \m�� TEXT NOT NULL,
    *H� VARCHAR(10),
    ;���B TIMESTAMP,
    ;B��B TIMESTAMP,
    �����B TIMESTAMP,
    ��B��B TIMESTAMP,
    \mID VARCHAR(10) REFERENCES staff_master(�SID),
    �K VARCHAR(20),
    � TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE maintenance_history (
    etID VARCHAR(10) PRIMARY KEY,
    -�ID VARCHAR(10) REFERENCES equipment(-�ID),
    \m:ID VARCHAR(10) REFERENCES work_order(\m:ID),
    ��� DATE NOT NULL,
    \mID VARCHAR(10) REFERENCES staff_master(�SID),
    mID VARCHAR(10) REFERENCES contractor_master(mID),
    \m�� TEXT,
    \mP� TEXT,
    (�� TEXT,
    \mB� DECIMAL(4,2), -- in hours
    ��� INTEGER, -- in yen
    !ިh� DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inspection_plan (
    ;ID VARCHAR(10) PRIMARY KEY,
    -�ID VARCHAR(10) REFERENCES equipment(-�ID),
    hID INTEGER REFERENCES inspection_cycle_master(hID),
    �� TEXT NOT NULL,
     B�� DATE,
    !޹� DATE,
    �SID VARCHAR(10) REFERENCES staff_master(�SID),
    �K VARCHAR(20),
    � TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE anomaly_report (
    1JID VARCHAR(10) PRIMARY KEY,
    -�ID VARCHAR(10) REFERENCES equipment(-�ID),
    z�B TIMESTAMP NOT NULL,
    z�ID VARCHAR(10) REFERENCES staff_master(�SID),
    p8.% VARCHAR(30) NOT NULL,
    �'� VARCHAR(10) NOT NULL,
    Ƕ TEXT,
    �� TEXT,
    ��� TEXT,
    �K VARCHAR(20),
    1J�B TIMESTAMP,
    �z�B TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_equipment_type ON equipment(-�.%ID);
CREATE INDEX idx_equipment_location ON equipment(-n4@);
CREATE INDEX idx_work_order_equipment ON work_order(-�ID);
CREATE INDEX idx_work_order_status ON work_order(�K);
CREATE INDEX idx_maintenance_equipment ON maintenance_history(-�ID);
CREATE INDEX idx_maintenance_date ON maintenance_history(���);
CREATE INDEX idx_inspection_equipment ON inspection_plan(-�ID);
CREATE INDEX idx_inspection_next_date ON inspection_plan(!޹�);
CREATE INDEX idx_anomaly_equipment ON anomaly_report(-�ID);
CREATE INDEX idx_anomaly_status ON anomaly_report(�K);
CREATE INDEX idx_anomaly_severity ON anomaly_report(�'�);

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE equipment_type_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_type_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_cycle_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_report ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Allow all access" ON equipment_type_master FOR ALL USING (true);
CREATE POLICY "Allow all access" ON work_type_master FOR ALL USING (true);
CREATE POLICY "Allow all access" ON staff_master FOR ALL USING (true);
CREATE POLICY "Allow all access" ON contractor_master FOR ALL USING (true);
CREATE POLICY "Allow all access" ON inspection_cycle_master FOR ALL USING (true);
CREATE POLICY "Allow all access" ON equipment FOR ALL USING (true);
CREATE POLICY "Allow all access" ON work_order FOR ALL USING (true);
CREATE POLICY "Allow all access" ON maintenance_history FOR ALL USING (true);
CREATE POLICY "Allow all access" ON inspection_plan FOR ALL USING (true);
CREATE POLICY "Allow all access" ON anomaly_report FOR ALL USING (true);