-- Performance Optimization: Add database indexes for frequently queried columns
-- Created: 2025-07-10
-- Priority: Production Performance Enhancement

-- Phase 1: Critical Indexes (Real-time monitoring & core functionality)

-- 1. Equipment category filtering (used in data aggregation, coverage analysis)
CREATE INDEX IF NOT EXISTS idx_equipment_category 
ON equipment("設備種別ID");

-- 2. Process data real-time queries (critical for monitoring dashboard)
CREATE INDEX IF NOT EXISTS idx_process_data_param_time 
ON process_data(parameter_id, timestamp DESC);

-- 3. Active trigger rules for process monitoring
CREATE INDEX IF NOT EXISTS idx_trigger_rules_param_active 
ON process_trigger_rules(parameter_id, is_active);

-- 4. Equipment-system mapping (system queries)
CREATE INDEX IF NOT EXISTS idx_equipment_system_mapping_system 
ON equipment_system_mapping(system_id);

-- 5. Equipment-system mapping (equipment queries)
CREATE INDEX IF NOT EXISTS idx_equipment_system_mapping_equipment 
ON equipment_system_mapping(equipment_id);

-- 6. Maintenance history by equipment and date (cost analysis, timeline)
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment_date 
ON maintenance_history("設備ID", "実施日" DESC);

-- Phase 2: High Priority Indexes

-- 7. Failure modes for risk analysis
CREATE INDEX IF NOT EXISTS idx_failure_modes_system_equipment 
ON failure_modes(system_id, equipment_id);

-- 8. High-risk equipment identification
CREATE INDEX IF NOT EXISTS idx_failure_modes_equipment_rpn 
ON failure_modes(equipment_id, rpn_score DESC);

-- 9. Equipment strategies for task generation
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_equipment_status 
ON equipment_strategy(equipment_id, status);

-- 10. Due strategies for maintenance scheduling
CREATE INDEX IF NOT EXISTS idx_equipment_strategy_next_date_status 
ON equipment_strategy(next_execution_date, status);

-- 11. Inspection planning and compliance
CREATE INDEX IF NOT EXISTS idx_inspection_plan_equipment_next_date 
ON inspection_plan("設備ID", "次回点検日");

-- 12. Thickness measurement time series
CREATE INDEX IF NOT EXISTS idx_thickness_measurement_equipment_date 
ON thickness_measurement("設備ID", "検査日" DESC);

-- Phase 3: Medium Priority Indexes

-- 13. Maintenance history date range queries
CREATE INDEX IF NOT EXISTS idx_maintenance_history_date 
ON maintenance_history("実施日" DESC);

-- 14. Overdue inspections tracking
CREATE INDEX IF NOT EXISTS idx_inspection_plan_next_date_status 
ON inspection_plan("次回点検日", "状態");

-- 15. Equipment risk ranking
CREATE INDEX IF NOT EXISTS idx_equipment_risk_assessment_equipment_score 
ON equipment_risk_assessment("設備ID", "リスクスコア" DESC);

-- 16. Equipment operational status filtering
CREATE INDEX IF NOT EXISTS idx_equipment_status 
ON equipment("稼働状態");

-- Additional Performance Indexes

-- 17. Anomaly reports by equipment for trend analysis
CREATE INDEX IF NOT EXISTS idx_anomaly_report_equipment_date 
ON anomaly_report("設備ID", "発生日時" DESC);

-- 18. Task scheduling and status tracking
CREATE INDEX IF NOT EXISTS idx_task_schedule_equipment_status 
ON task_schedule(equipment_id, task_status);

-- 19. Process parameter equipment mapping
CREATE INDEX IF NOT EXISTS idx_process_parameter_equipment 
ON process_parameter_equipment_mapping(equipment_id);

-- 20. System hierarchy and criticality queries
CREATE INDEX IF NOT EXISTS idx_equipment_systems_criticality 
ON equipment_systems(criticality, system_id);

-- Performance Analysis Queries
-- These can be used to monitor index effectiveness

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes ORDER BY idx_tup_read DESC;

-- Check table statistics
-- SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- Monitor slow queries
-- SELECT query, mean_time, calls, total_time
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC LIMIT 10;

COMMENT ON INDEX idx_equipment_category IS 'Optimizes equipment filtering by type in data aggregation and analytics';
COMMENT ON INDEX idx_process_data_param_time IS 'Critical for real-time process monitoring and trend analysis';
COMMENT ON INDEX idx_equipment_system_mapping_system IS 'Optimizes system-based equipment queries and coverage analysis';
COMMENT ON INDEX idx_maintenance_history_equipment_date IS 'Optimizes maintenance timeline and cost analysis queries';
COMMENT ON INDEX idx_equipment_strategy_equipment_status IS 'Optimizes task generation and maintenance scheduling';

-- Log index creation
INSERT INTO migration_log (migration_name, applied_at, description) 
VALUES (
  '20250710_add_performance_indexes',
  NOW(),
  'Added 20 performance indexes for frequently queried columns. Expected 40-80% query performance improvement for real-time monitoring, analytics, and reporting.'
) ON CONFLICT DO NOTHING;