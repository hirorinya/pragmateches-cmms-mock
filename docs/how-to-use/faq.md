# Frequently Asked Questions (FAQ)

## General System Questions

### Q: What makes this CMMS system "intelligent"?
**A:** Our CMMS system features three integrated capabilities that work together automatically:
1. **Automatic Task Generation** - Creates work orders based on equipment strategies without manual scheduling
2. **Process Monitoring Integration** - Adjusts maintenance frequency when real-time process conditions change
3. **Risk-Based Optimization** - Uses FMEA analysis to prioritize maintenance activities by risk level

The system learns from operational data and continuously optimizes maintenance schedules for your specific equipment and operating conditions.

### Q: How is this different from traditional CMMS systems?
**A:** Traditional CMMS systems are primarily scheduling and tracking tools. Our intelligent system:
- **Proactively adjusts** maintenance frequency based on real-time conditions
- **Automatically generates** work orders without manual intervention
- **Integrates risk assessment** directly into maintenance planning
- **Uses process data** to trigger strategy modifications
- **Optimizes resources** through data-driven decision making

### Q: What training is required to use the system?
**A:** Training requirements vary by role:
- **Field Technicians**: 4 hours basic training on task execution and mobile interface
- **Supervisors**: 8 hours on team management, approvals, and performance monitoring
- **Maintenance Engineers**: 16 hours on strategy development, risk assessment, and system optimization
- **System Administrators**: 24 hours on configuration, integration, and advanced features

Ongoing refresher training is provided quarterly.

---

## Task Generation Questions

### Q: How does automatic task generation work?
**A:** The system uses Equipment Strategies (ES) that define:
- **What work** needs to be done (inspection, lubrication, replacement)
- **How often** it should be performed (daily, weekly, monthly)
- **Who** should do the work (skill level requirements)
- **What resources** are needed (tools, parts, permits)

Work orders are automatically created based on these strategies, eliminating manual scheduling.

### Q: Can I override automatically generated tasks?
**A:** Yes, supervisors and engineers can:
- **Reschedule tasks** for operational coordination
- **Change priority levels** based on current conditions
- **Modify task scope** for specific situations
- **Cancel tasks** with proper justification

All overrides are logged for analysis and continuous improvement.

### Q: What happens if I can't complete a task on time?
**A:** The system provides flexibility:
1. **Update the work order** with current status and reason for delay
2. **Reschedule automatically** - system suggests new due date
3. **Escalate if critical** - supervisor notification for high-priority work
4. **Track performance** - completion rates are monitored but delays are expected

The goal is continuous improvement, not punishment for realistic scheduling challenges.

### Q: How do I know what tools and parts I need for a task?
**A:** Each automatically generated work order includes:
- **Required tools** list with specific model numbers when needed
- **Parts requirements** including part numbers and quantities
- **Special equipment** needs (cranes, test equipment, etc.)
- **Permit requirements** (confined space, hot work, electrical)
- **Safety requirements** specific to the task

This information is available on mobile devices for field reference.

---

## Process Monitoring Questions

### Q: How does process monitoring affect my maintenance schedule?
**A:** Process monitoring continuously watches equipment parameters (temperature, pressure, vibration, etc.). When parameters indicate changing conditions:
1. **System evaluates** if maintenance frequency should change
2. **Generates recommendation** for increased or decreased frequency
3. **Notifies engineer** for review and approval
4. **Updates work orders** automatically once approved

This ensures maintenance responds to actual equipment condition, not just calendar time.

### Q: What types of process changes trigger maintenance adjustments?
**A:** Common triggers include:
- **Temperature deviations** indicating bearing wear or cooling problems
- **Pressure changes** suggesting seal leakage or system blockages
- **Vibration increases** indicating mechanical wear or misalignment
- **Flow variations** suggesting pump wear or system restrictions
- **Performance degradation** indicating efficiency loss

The system is configured with thresholds specific to each piece of equipment.

### Q: How quickly does the system respond to process changes?
**A:** Response times vary by severity:
- **CRITICAL alerts**: Immediate notification (within 5 minutes)
- **HIGH alerts**: 15-30 minute notification
- **MEDIUM alerts**: 1-4 hour notification
- **LOW alerts**: 4-24 hour notification

Engineers typically have 4-24 hours to review and approve recommended changes, depending on urgency.

### Q: Can I see the data that triggered a recommendation?
**A:** Yes, the system provides complete transparency:
- **Historical trends** showing parameter changes over time
- **Threshold comparisons** showing normal vs. current values
- **Event timeline** showing when conditions changed
- **Related parameters** that may indicate root causes

This data helps engineers make informed decisions about recommended changes.

---

## Risk Assessment Questions

### Q: What is FMEA and why do we use it?
**A:** FMEA (Failure Mode and Effects Analysis) is a systematic method to:
- **Identify potential failures** before they occur
- **Evaluate consequences** of different failure modes
- **Prioritize risks** using Risk Priority Number (RPN = Severity × Occurrence × Detection)
- **Develop mitigation strategies** to reduce high-risk scenarios

This ensures maintenance resources focus on the highest-risk equipment and failure modes.

### Q: How often are risk assessments conducted?
**A:** Risk assessment frequency depends on several factors:
- **Scheduled reviews**: Annual or bi-annual for all systems
- **Process-triggered reviews**: When monitoring detects significant changes
- **Event-triggered reviews**: After equipment failures or incidents
- **Modification reviews**: When equipment is modified or upgraded

The system automatically schedules and tracks these reviews.

### Q: What is RPN scoring and how is it used?
**A:** RPN (Risk Priority Number) is calculated as:
**Severity (1-10) × Occurrence (1-10) × Detection (1-10)**

- **Severity**: How bad the consequences are if failure occurs
- **Occurrence**: How likely the failure is to happen  
- **Detection**: How likely we are to detect the problem before failure

**RPN > 100** typically requires immediate action to reduce risk through:
- Increased inspection frequency
- Additional monitoring
- Improved procedures
- Equipment modifications

### Q: How do risk assessments affect my daily work?
**A:** Risk assessments influence maintenance planning by:
- **Prioritizing work orders** - high-risk equipment gets priority
- **Adjusting frequencies** - high RPN scores increase inspection frequency
- **Modifying procedures** - adding inspection points or changing methods
- **Resource allocation** - ensuring adequate skills and tools for critical work

The goal is to focus effort where it provides the most safety and reliability benefit.

---

## Mobile and Field Use Questions

### Q: Can I use the system on my smartphone or tablet?
**A:** Yes, the system is fully mobile-responsive and includes:
- **Work order access** and completion on mobile devices
- **Photo capture** for documentation and evidence
- **Offline capability** for areas with poor connectivity
- **Barcode scanning** for equipment identification
- **Voice notes** for quick observations

All mobile data syncs automatically when connectivity is restored.

### Q: What if I lose connectivity while working in the field?
**A:** The mobile interface works offline:
- **Download work orders** at the start of your shift
- **Complete tasks offline** and store data locally
- **Sync automatically** when you return to WiFi/cellular coverage
- **No data loss** - all information is preserved

The system is designed for industrial environments with variable connectivity.

### Q: How do I attach photos to work orders?
**A:** Photo attachment is built into the mobile interface:
1. **Open work order** on mobile device
2. **Tap camera icon** in the documentation section
3. **Take photos** of conditions, readings, or problems
4. **Add captions** describing what the photo shows
5. **Photos sync** automatically and are available to all users

Photos are particularly valuable for documenting equipment conditions and sharing with engineers.

---

## Performance and Troubleshooting Questions

### Q: The system seems slow. What should I do?
**A:** Try these troubleshooting steps:
1. **Check internet connection** - slow connectivity affects performance
2. **Close other applications** - free up device memory
3. **Clear browser cache** - refresh stored data
4. **Try different browser** - some browsers perform better than others
5. **Contact IT support** if problems persist (ext. 2400)

Most performance issues are related to connectivity or device capacity.

### Q: I can't find a work order that should be assigned to me. Where is it?
**A:** Check these possibilities:
1. **Filter settings** - ensure you're viewing "All" or correct date range
2. **Assignment status** - work order may be assigned to someone else
3. **Priority level** - check if you're filtering by priority
4. **Completion status** - work order may already be completed
5. **System synchronization** - refresh the page to update data

Contact your supervisor if the work order still cannot be located.

### Q: I made an error in my documentation. Can I correct it?
**A:** Documentation can be corrected within certain timeframes:
- **Same day**: Full editing capability
- **Within 7 days**: Corrections with supervisor approval
- **Beyond 7 days**: Requires maintenance engineer approval
- **Audit trail**: All changes are logged with user ID and timestamp

The goal is data accuracy while maintaining proper change control.

### Q: How do I report a system bug or request a new feature?
**A:** Use the feedback system:
1. **In-system feedback** - click the feedback icon in any screen
2. **IT helpdesk** - submit ticket for technical issues (ext. 2400)
3. **User meetings** - discuss improvements in monthly meetings
4. **Supervisor** - report through your chain of command

All feedback is reviewed and prioritized for system improvements.

---

## Data and Reporting Questions

### Q: Can I export data from the system?
**A:** Yes, authorized users can export:
- **Work order history** for analysis and reporting
- **Equipment performance data** for trending
- **Cost information** for budget planning
- **Compliance reports** for regulatory requirements

Export capabilities vary by user role and data sensitivity.

### Q: How long is historical data kept in the system?
**A:** Data retention varies by type:
- **Work orders**: 7 years (regulatory requirement)
- **Process monitoring data**: 2 years active, archived thereafter
- **Risk assessments**: Permanent retention
- **User activity**: 1 year for performance analysis
- **System logs**: 90 days for troubleshooting

Archived data can be retrieved for special analysis needs.

### Q: Who can see my work order documentation?
**A:** Access is role-based:
- **Technician**: Can see own work orders and documentation
- **Supervisor**: Can see all team work orders
- **Engineer**: Can see all work orders for managed equipment
- **Manager**: Can see summary reports and performance metrics
- **System Admin**: Can see all data for system support

Personal information and performance data have additional privacy protections.

---

## Integration Questions

### Q: How does the CMMS integrate with our DCS/SCADA system?
**A:** Integration is real-time and automatic:
- **Process parameters** are polled every 60 seconds from DCS
- **Data quality** is validated before use (GOOD/BAD/UNCERTAIN)
- **Threshold monitoring** runs continuously in the background
- **Alerts** are generated when parameters exceed configured limits
- **Work orders** are automatically adjusted based on process conditions

This provides seamless integration between operations and maintenance.

### Q: Does the system integrate with our ERP/SAP system?
**A:** Yes, integration includes:
- **Work order export** for cost tracking and analysis
- **Parts consumption** data for inventory management
- **Labor hours** for payroll and project costing
- **Equipment master** data synchronization
- **Preventive maintenance schedules** for planning

Integration frequency is configurable (typically daily or weekly).

### Q: Can we connect other plant systems?
**A:** The system is designed for integration flexibility:
- **Document management** systems for procedure links
- **Laboratory systems** for oil analysis and testing data
- **Vibration monitoring** systems for condition data
- **Thermal imaging** systems for temperature surveys
- **Energy management** systems for efficiency tracking

Contact the system administrator to discuss specific integration needs.

---

## Support and Contact Information

### Q: Who do I contact for different types of issues?

**Immediate Safety Issues**: Control Room (ext. 911)

**System Technical Issues**: IT Helpdesk (ext. 2400)
- Login problems
- System errors
- Performance issues
- Mobile device problems

**Maintenance Process Questions**: Maintenance Engineering (ext. 2150)
- Equipment strategy questions
- Risk assessment procedures
- Process monitoring setup
- Technical maintenance questions

**Training Questions**: Training Department (ext. 2300)
- User training requests
- Procedure clarification
- Best practices guidance
- System navigation help

**Administrative Issues**: Department Supervisor
- Work assignment questions
- Priority conflicts
- Resource availability
- Performance concerns

### Q: What are the system operating hours?
**A:** The CMMS system operates 24/7/365 with:
- **Scheduled maintenance**: Sunday 2:00-4:00 AM (minimal downtime)
- **Support hours**: Monday-Friday 7:00 AM - 5:00 PM
- **Emergency support**: Available 24/7 for critical issues
- **Backup procedures**: Paper forms available during outages

System availability target is >99.5% excluding scheduled maintenance.

---

*For questions not covered in this FAQ, please contact your supervisor or the appropriate support contact listed above. We continuously update this FAQ based on user questions and system improvements.*