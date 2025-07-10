# System Administrators Guide

## Your Role in the CMMS System

As a System Administrator, you are responsible for the technical foundation that enables intelligent maintenance operations. You configure the automated systems, manage integrations, ensure data quality, and optimize system performance to support all maintenance activities.

## 🎯 Key Responsibilities

- **Configure system parameters** for automatic task generation and process monitoring
- **Manage user access** and role-based permissions
- **Ensure data integration** between CMMS, DCS, and other plant systems
- **Monitor system performance** and optimize for reliability and speed
- **Maintain data quality** and system integrity
- **Support continuous improvement** through system enhancements

## 📅 Daily Workflow

### Morning System Check (15-20 minutes)
1. **System Health Dashboard** - Review overnight system status
2. **Data Integration Status** - Verify DCS feeds and external connections
3. **User Activity Review** - Check for any access issues or unusual activity
4. **Backup Verification** - Confirm automated backups completed successfully
5. **Performance Metrics** - Review system response times and capacity

### Throughout the Day
- **Monitor alerts** and respond to system issues
- **Support user requests** for access, training, and troubleshooting
- **Data quality management** - investigate and resolve data anomalies
- **Configuration changes** as requested by maintenance engineering

### Weekly System Maintenance (2-3 hours)
- **Database optimization** and maintenance routines
- **User access review** and permission updates
- **System performance analysis** and capacity planning
- **Integration health check** with external systems
- **Backup and recovery testing**

## ⚙️ Core System Architecture

### System Components Overview

```
CMMS System Architecture:
┌─────────────────────────────────────────────────────┐
│                Frontend (Next.js)                   │
├─────────────────────────────────────────────────────┤
│                 API Layer                           │
│  ┌─────────────┬──────────────┬─────────────────┐    │
│  │ Task Gen.   │ Process Mon. │ Risk Assessment │    │
│  └─────────────┴──────────────┴─────────────────┘    │
├─────────────────────────────────────────────────────┤
│            Database (Supabase PostgreSQL)           │
│  ┌─────────────┬──────────────┬─────────────────┐    │
│  │ Equipment   │ Process Data │ Risk/FMEA Data │    │
│  │ Strategies  │ & Parameters │ & Reviews       │    │
│  └─────────────┴──────────────┴─────────────────┘    │
├─────────────────────────────────────────────────────┤
│              External Integrations                  │
│  ┌─────────────┬──────────────┬─────────────────┐    │
│  │ DCS/SCADA   │ ERP System   │ Document Mgmt   │    │
│  │ (Real-time) │ (Parts/Work) │ (Procedures)    │    │
│  └─────────────┴──────────────┴─────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Database Schema Management

**Core Tables by Function**:

**Equipment Management**:
- `equipment` - Master equipment registry
- `equipment_strategy` - Maintenance strategies and rules
- `equipment_systems` - System groupings for risk assessment
- `equipment_system_mapping` - Equipment to system relationships

**Task Generation**:
- `work_order` - Generated and manual work orders
- `maintenance_history` - Completed work records
- `staff_master` - User and technician information

**Process Monitoring**:
- `process_parameters` - Monitored DCS parameters
- `process_data` - Real-time parameter values
- `process_trigger_rules` - Alert and threshold rules
- `process_trigger_events` - Detected events and alerts
- `es_change_notifications` - Strategy modification requests

**Risk Assessment**:
- `failure_modes` - FMEA failure mode catalog
- `risk_scenarios` - System-level risk scenarios
- `risk_reviews` - Formal FMEA review records
- `risk_es_recommendations` - Risk-based strategy changes

## 🔧 System Configuration

### 1. Process Monitoring Setup

#### Adding New Process Parameters

**Step 1: Define Parameter**
```sql
INSERT INTO process_parameters (
    parameter_id, parameter_name, parameter_type, unit,
    equipment_id, tag_name, 
    normal_min, normal_max, critical_min, critical_max
) VALUES (
    'TI-102-01', 'Pump 2 Bearing Temperature', 'TEMPERATURE', '°C',
    'EQ007', 'TI_102_01',
    40.0, 60.0, 35.0, 75.0
);
```

**Step 2: Create Trigger Rules**
```sql
INSERT INTO process_trigger_rules (
    rule_id, rule_name, parameter_id, trigger_type, condition_type,
    threshold_value, threshold_percent, evaluation_window_minutes,
    min_duration_minutes, severity, is_active
) VALUES (
    'RULE-TI-102-HIGH', 'Pump 2 High Temperature', 'TI-102-01', 
    'LIMIT_EXCEEDED', 'GREATER_THAN',
    65.0, NULL, 15, 5, 'HIGH', true
);
```

**Step 3: Link to Equipment Strategy**
```sql
INSERT INTO es_process_mapping (
    mapping_id, strategy_id, rule_id, recommended_action,
    impact_description, auto_apply
) VALUES (
    'MAP-001', 'ES-007', 'RULE-TI-102-HIGH',
    'INCREASE_FREQUENCY',
    'High bearing temperature indicates increased wear rate',
    false
);
```

#### Process Monitoring Configuration Guidelines

**Parameter Selection Criteria**:
- **Safety critical**: Parameters that indicate immediate safety risks
- **Equipment health**: Indicators of wear, degradation, or malfunction
- **Process stability**: Parameters affecting product quality or yield
- **Environmental compliance**: Emissions, effluent, noise levels

**Threshold Setting Best Practices**:
- **Normal range**: Based on design specifications and operating experience
- **Critical limits**: Safety and equipment protection boundaries
- **Evaluation windows**: Balance responsiveness vs. false alarms
- **Minimum duration**: Prevent nuisance alarms from brief transients

### 2. User Management and Security

#### Role-Based Access Control (RBAC)

**User Roles and Permissions**:

```
Role: field_technician
Permissions:
- Read: work_order, equipment, maintenance_history
- Write: work_order (status updates only), maintenance_history
- No access: equipment_strategy, process_trigger_rules, risk_reviews

Role: maintenance_engineer  
Permissions:
- Read: All tables
- Write: equipment_strategy, risk_reviews, es_change_notifications
- Admin: None

Role: supervisor
Permissions:
- Read: All tables
- Write: work_order, equipment_strategy (approval), risk_reviews (approval)
- Admin: None

Role: system_admin
Permissions:
- Read: All tables + system logs
- Write: All tables
- Admin: User management, system configuration
```

#### User Account Management

**Creating New Users**:
1. **Supabase Auth Setup**:
   ```sql
   -- User created through Supabase Auth UI or API
   -- Then link to staff_master table
   INSERT INTO staff_master (
       担当者ID, 氏名, 部署, 役職, 専門分野, 連絡先
   ) VALUES (
       'ST011', 'New Technician', '保全部', '技師', '機械', 'new@company.com'
   );
   ```

2. **Role Assignment**:
   ```sql
   -- Row Level Security policies automatically apply based on user metadata
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
       COALESCE(raw_user_meta_data, '{}'),
       '{role}',
       '"field_technician"'
   )
   WHERE email = 'new@company.com';
   ```

**Deactivating Users**:
- Disable in Supabase Auth (preserves audit trail)
- Update staff_master status to inactive
- Review and reassign any active work orders

### 3. Data Integration Management

#### DCS/SCADA Integration

**Real-time Data Feed Configuration**:
```javascript
// Example configuration for DCS data ingestion
const processDataIngestion = {
    source: 'DCS_SYSTEM',
    endpoint: 'https://dcs.plant.com/api/realtime',
    authentication: 'api_key',
    polling_interval: 60, // seconds
    parameters: [
        {
            dcs_tag: 'TI_101_01',
            cmms_parameter: 'TI-101-01',
            conversion_factor: 1.0,
            quality_mapping: {
                'GOOD': 'GOOD',
                'BAD': 'BAD',
                'UNCERTAIN': 'UNCERTAIN'
            }
        }
    ],
    error_handling: {
        max_retries: 3,
        retry_interval: 30,
        fallback_action: 'log_and_continue'
    }
};
```

**Data Quality Monitoring**:
- **Missing data detection**: Identify gaps in DCS feeds
- **Quality flag validation**: Ensure only GOOD quality data triggers actions
- **Timestamp verification**: Check for delayed or future-dated data
- **Range validation**: Detect obviously erroneous values

#### ERP System Integration

**Work Order Synchronization**:
- Export completed work orders to ERP for cost tracking
- Import parts usage and labor costs
- Synchronize equipment master data
- Update maintenance schedules based on ERP planning

### 4. Performance Monitoring and Optimization

#### System Performance Metrics

**Database Performance**:
```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check database size and growth
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Application Performance**:
- **Response time monitoring**: API endpoint performance
- **Error rate tracking**: System errors and user errors
- **User activity analysis**: Peak usage times and patterns
- **Resource utilization**: CPU, memory, storage trends

#### Optimization Strategies

**Database Optimization**:
- **Index management**: Create indexes for frequently queried columns
- **Query optimization**: Rewrite slow queries for better performance
- **Data archiving**: Move old data to archive tables
- **Vacuum and analyze**: Regular maintenance routines

**Application Optimization**:
- **Caching strategies**: Implement Redis for frequently accessed data
- **API rate limiting**: Prevent system overload
- **Background job optimization**: Queue processing and error handling
- **CDN implementation**: Static asset delivery optimization

## 🔍 Monitoring and Troubleshooting

### System Health Dashboard

**Key Metrics to Monitor**:
```
System Health Overview:
┌─────────────────────────────────────────────┐
│ Database Connections: 15/100 (15%)         │
│ API Response Time: 145ms (avg)             │
│ DCS Data Feed: ✅ Online (last: 30s ago)    │
│ Disk Usage: 45GB/100GB (45%)               │
│ Memory Usage: 2.1GB/4GB (52%)              │
│                                             │
│ Integration Status:                         │
│ ✅ Process Monitoring: Active               │
│ ✅ Task Generation: Active                  │
│ ✅ Risk Assessment: Active                  │
│ ⚠️  ERP Sync: 15min delay                   │
│                                             │
│ Recent Alerts:                              │
│ • DCS connection timeout (resolved)        │
│ • High query time on work_order table      │
│ • User login failure spike (investigated)  │
└─────────────────────────────────────────────┘
```

### Common Issues and Solutions

#### Data Integration Problems

**Issue**: DCS data feed interruption
**Symptoms**: Missing process data, no new alerts generated
**Diagnosis**:
```sql
-- Check latest data timestamps
SELECT parameter_id, MAX(timestamp) as last_data
FROM process_data
GROUP BY parameter_id
ORDER BY last_data;
```
**Solutions**:
1. Check DCS system connectivity
2. Verify API credentials and permissions
3. Review firewall and network configuration
4. Restart data ingestion service if needed

**Issue**: Duplicate process data
**Symptoms**: Multiple entries for same timestamp
**Diagnosis**:
```sql
-- Find duplicate entries
SELECT parameter_id, timestamp, COUNT(*)
FROM process_data
GROUP BY parameter_id, timestamp
HAVING COUNT(*) > 1;
```
**Solutions**:
1. Implement upsert logic instead of insert
2. Add unique constraints on parameter_id + timestamp
3. Clean up existing duplicates

#### Performance Issues

**Issue**: Slow work order queries
**Symptoms**: Dashboard loading slowly, user complaints
**Diagnosis**:
```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM work_order 
WHERE 状態 = 'SCHEDULED' 
ORDER BY 計画開始日時;
```
**Solutions**:
1. Add index on status and date columns
2. Implement query result caching
3. Optimize query with better WHERE clauses

### Backup and Recovery

#### Backup Strategy

**Database Backups**:
- **Daily full backups**: Automated Supabase backups
- **Real-time replication**: Supabase handles automatically
- **Point-in-time recovery**: Available for last 7 days
- **Manual exports**: Critical configuration data

**Configuration Backups**:
- **System settings**: Export critical configuration tables
- **User permissions**: Backup role assignments
- **Integration configs**: API keys and connection settings
- **Custom procedures**: Backup any custom SQL functions

#### Disaster Recovery Procedures

**Service Outage Response**:
1. **Assess scope**: Determine which services are affected
2. **Notify stakeholders**: Inform users and management
3. **Implement workarounds**: Paper-based procedures if needed
4. **Coordinate with vendors**: Supabase, third-party service providers
5. **Document timeline**: Track outage duration and resolution steps

**Data Recovery Process**:
1. **Identify restore point**: Latest known good state
2. **Coordinate with operations**: Plan for system downtime
3. **Execute recovery**: Restore from backup
4. **Validate data integrity**: Check critical business data
5. **Resume operations**: Bring users back online gradually

## 🛠️ Advanced Configuration

### Custom Alert Rules

**Creating Complex Trigger Logic**:
```sql
-- Example: Multiple parameter correlation alert
CREATE OR REPLACE FUNCTION check_pump_degradation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if both temperature and vibration are elevated
    IF EXISTS (
        SELECT 1 FROM process_data pd1, process_data pd2
        WHERE pd1.parameter_id = 'TI-101-01' 
        AND pd2.parameter_id = 'VI-101-01'
        AND pd1.timestamp = pd2.timestamp
        AND pd1.value > 70  -- High temperature
        AND pd2.value > 4.0 -- High vibration
        AND pd1.timestamp > NOW() - INTERVAL '10 minutes'
    ) THEN
        -- Create high priority alert
        INSERT INTO process_trigger_events (
            rule_id, triggered_at, trigger_value, severity
        ) VALUES (
            'PUMP-DEGRADATION', NOW(), 
            NEW.value, 'CRITICAL'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### API Integration Development

**Custom API Endpoints**:
```typescript
// Example: Custom endpoint for ERP integration
export async function POST(request: NextRequest) {
  try {
    const { work_orders } = await request.json();
    
    // Process work orders from ERP
    for (const wo of work_orders) {
      await supabase
        .from('work_order')
        .update({
          actual_cost: wo.cost,
          actual_hours: wo.hours,
          erp_sync_date: new Date().toISOString()
        })
        .eq('作業指示ID', wo.id);
    }
    
    return NextResponse.json({ 
      success: true, 
      processed: work_orders.length 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'ERP sync failed' }, 
      { status: 500 }
    );
  }
}
```

## 📊 Reporting and Analytics

### System Usage Analytics

**User Activity Reports**:
```sql
-- Monthly user activity summary
SELECT 
    u.email,
    sm.氏名,
    sm.部署,
    COUNT(wo.作業指示ID) as work_orders_completed,
    AVG(wo.actual_hours) as avg_hours_per_task,
    MAX(wo.実際終了日時) as last_activity
FROM auth.users u
JOIN staff_master sm ON u.email = sm.連絡先
LEFT JOIN work_order wo ON sm.担当者ID = wo.作業者ID
WHERE wo.実際終了日時 >= NOW() - INTERVAL '30 days'
GROUP BY u.email, sm.氏名, sm.部署
ORDER BY work_orders_completed DESC;
```

### Performance Metrics

**System Effectiveness Metrics**:
```sql
-- Equipment strategy effectiveness
SELECT 
    es.strategy_name,
    COUNT(wo.作業指示ID) as tasks_generated,
    AVG(wo.actual_hours) as avg_completion_time,
    COUNT(CASE WHEN wo.状態 = 'COMPLETED' THEN 1 END)::float / 
    COUNT(wo.作業指示ID) as completion_rate
FROM equipment_strategy es
LEFT JOIN work_order wo ON es.equipment_id = wo.設備ID
WHERE wo.created_at >= NOW() - INTERVAL '90 days'
GROUP BY es.strategy_id, es.strategy_name
ORDER BY completion_rate DESC;
```

## 📞 Support and Escalation

### Technical Support Contacts

- **Supabase Support**: [support channel]
- **DCS Integration Team**: ext. 2175
- **Network/Infrastructure**: IT Network Team (ext. 2425)
- **Security Team**: IT Security (ext. 2450)
- **Vendor Support**: [Contact list for third-party integrations]

### Escalation Procedures

**Level 1: User Issues** (Response: 2 hours)
- Password resets, access problems
- Basic configuration questions
- User training and guidance

**Level 2: System Issues** (Response: 30 minutes)
- Performance problems affecting users
- Data integration issues
- Minor configuration problems

**Level 3: Critical Issues** (Response: Immediate)
- System-wide outages
- Data corruption or loss
- Security breaches
- Safety-critical system failures

## 📚 Documentation and Knowledge Management

### System Documentation

**Technical Documentation**:
- **Architecture diagrams**: System design and data flow
- **API documentation**: Endpoint specifications and examples
- **Database schema**: Table relationships and constraints
- **Integration guides**: Third-party system connections

**Operational Documentation**:
- **User guides**: Role-specific operation manuals
- **Troubleshooting guides**: Common issues and solutions
- **Change management**: Procedures for system modifications
- **Disaster recovery**: Step-by-step recovery procedures

### Change Management

**Configuration Change Process**:
1. **Change request**: Document proposed modification
2. **Impact assessment**: Evaluate risks and dependencies
3. **Testing**: Validate changes in development environment
4. **Approval**: Get stakeholder sign-off
5. **Implementation**: Deploy during maintenance window
6. **Validation**: Verify successful deployment
7. **Documentation**: Update system documentation

---

## 🏆 System Excellence

Your role as System Administrator is the foundation that enables intelligent maintenance operations. Your expertise ensures that:

- **Systems are reliable** and available when needed
- **Data is accurate** and flows seamlessly between systems
- **Users are productive** with minimal system friction
- **Performance is optimized** for current and future needs
- **Security is maintained** without compromising usability

The CMMS system's success depends on your technical excellence, proactive monitoring, and continuous improvement efforts. Your work enables maintenance teams to focus on equipment rather than system issues.

---

*Remember: You are the guardian of system reliability and data integrity. Your expertise enables everyone else to do their jobs effectively and safely.*