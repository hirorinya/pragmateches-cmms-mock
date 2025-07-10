# 🔧 Function Details: "Simulate Data" & "Generate Task"

## 📊 **"Simulate Data" Function**

### **Location & Access:**
- **API Endpoint**: `GET /api/process/monitor?action=simulate`
- **UI Button**: Process Monitoring page → "Simulate Data" button
- **Service**: `ProcessMonitoringService.processIncomingData()`

### **What It Does:**
Simulates real DCS/SCADA system data injection to test the process monitoring and alert system.

### **Detailed Process:**

#### **1. Data Generation** (Lines 48-70)
```javascript
// Creates 3 simulated process parameters:
{
  parameter_id: 'TI-101-01',    // Temperature sensor
  timestamp: new Date().toISOString(),
  value: 85.5,                 // HIGH temperature (triggers alert)
  quality: 'GOOD',
  source: 'DCS'
},
{
  parameter_id: 'VI-100-01',    // Vibration sensor  
  value: 3.2,                  // HIGH vibration (triggers alert)
},
{
  parameter_id: 'FI-100-01',    // Flow sensor
  value: 95.0,                 // Low flow rate (triggers alert)
}
```

#### **2. Data Processing Pipeline:**
1. **Store Data** → Inserts into `process_data` table
2. **Parameter Validation** → Checks against normal ranges in `process_parameters`
3. **Trigger Evaluation** → Evaluates against `process_trigger_rules`
4. **Alert Generation** → Creates notifications if thresholds exceeded
5. **ES Change Detection** → Checks if Equipment Strategy adjustments needed
6. **Risk Review Trigger** → May trigger risk assessment for high severity events

#### **3. Expected Results:**
```json
{
  "success": true,
  "processed": 3,              // 3 data points stored
  "triggers_detected": 2,      // 2 alert conditions triggered  
  "es_notifications": 1,       // 1 Equipment Strategy change recommended
  "details": [
    "✅ Stored 3 process data points",
    "🚨 TI-101-01 exceeded threshold: 85.5°C > 80°C",
    "📋 ES change recommended for EQ006"
  ]
}
```

### **Business Impact:**
- **Demonstrates real-time monitoring** capabilities
- **Shows automatic alert generation** 
- **Proves integration** between process data and maintenance planning
- **Validates threshold detection** and escalation workflows

---

## 🔧 **"Generate Task" Function**

### **Location & Access:**
- **API Endpoint**: `GET /api/es-tasks` or `POST /api/es-tasks`
- **UI Button**: Task Management page → "Generate Tasks" button  
- **Service**: `TaskGenerationService.generateDailyTasks()`

### **What It Does:**
Automatically creates work orders based on Equipment Strategies (ES) that are due for execution.

### **Detailed Process:**

#### **1. Strategy Evaluation** (Lines 62-64)
```sql
-- Finds strategies due for execution
SELECT * FROM equipment_strategy 
WHERE is_active = true 
AND (
  (frequency_type = 'DAILY' AND last_executed < CURRENT_DATE) OR
  (frequency_type = 'WEEKLY' AND last_executed < CURRENT_DATE - INTERVAL '7 days') OR  
  (frequency_type = 'MONTHLY' AND last_executed < CURRENT_DATE - INTERVAL '1 month')
)
```

#### **2. Work Order Creation** (Lines 67-80)
For each due strategy:
1. **Equipment Lookup** → Gets equipment details and location
2. **Staff Assignment** → Finds qualified staff based on:
   - Required skill level (basic, intermediate, advanced)
   - Area assignment (refinery, maintenance, etc.)
   - Current workload capacity
3. **Work Order Generation** → Creates record in `work_order` table:
   ```javascript
   {
     order_id: 'WO-2025-001234',
     equipment_id: 'EQ006', 
     strategy_id: 'ES-001',
     assigned_staff_id: 'ST001',
     scheduled_date: '2025-07-11',
     priority: 'MEDIUM',
     status: 'SCHEDULED',
     task_description: 'Weekly pump inspection and lubrication',
     estimated_hours: 2.0,
     required_tools: 'Temperature gun, lubricant, inspection sheet'
   }
   ```

#### **3. Strategy Update** 
- Updates `last_executed` timestamp
- Calculates next due date based on frequency
- Logs generation event in `es_change_log`

#### **4. Expected Results:**
```json
{
  "success": true,
  "generated": 3,              // 3 new work orders created
  "failed": 0,                 // 0 failures
  "details": [
    "✅ Generated task for Weekly Pump Inspection (EQ006)",
    "✅ Generated task for Daily Temperature Check (EQ007)", 
    "✅ Generated task for Monthly Cleaning (EQ008)"
  ]
}
```

### **Business Impact:**
- **Eliminates manual scheduling** - No more forgotten maintenance
- **Ensures consistency** - All equipment gets proper attention  
- **Optimizes resources** - Assigns right person with right skills
- **Maintains compliance** - Regulatory maintenance never missed

---

## 🔄 **Integration Between Functions**

### **Complete Workflow:**
1. **"Simulate Data"** → Detects process parameter deviation (e.g., high temperature)
2. **Alert Generation** → System recognizes equipment stress condition  
3. **ES Recommendation** → Suggests increasing maintenance frequency
4. **"Generate Task"** → Creates additional work orders with new frequency
5. **Risk Integration** → High severity events trigger risk review

### **Example Scenario:**
```
🌡️ TI-101-01 temperature rises to 85°C (normal: 60-80°C)
     ↓
🚨 "Simulate Data" detects threshold exceeded  
     ↓
📋 Recommends changing pump inspection from MONTHLY → WEEKLY
     ↓  
🔧 "Generate Task" creates additional weekly work orders
     ↓
✅ Equipment gets more frequent monitoring until temperature normalizes
```

---

## 🎯 **Demo Value**

### **For Process Monitoring Demo:**
1. **Click "Simulate Data"** → Shows real-time alerting
2. **Point out alerts** → "System detected high temperature"
3. **Show recommendations** → "Automatically suggests more frequent maintenance"
4. **Emphasize automation** → "No manual intervention needed"

### **For Task Management Demo:**  
1. **Click "Generate Tasks"** → Shows automatic scheduling
2. **Show work orders** → "System created maintenance tasks"
3. **Point out assignments** → "Right person, right skills, right time"
4. **Emphasize efficiency** → "Eliminates manual planning overhead"

### **Combined Story:**
**"Watch how process conditions automatically drive maintenance planning - from detection to execution, completely automated!"** 🚀

This demonstrates the core value proposition: **Intelligent, data-driven maintenance management**.