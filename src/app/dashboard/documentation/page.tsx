'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Wrench, 
  Settings, 
  Shield, 
  FileText, 
  HelpCircle, 
  Download,
  ExternalLink,
  Search,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

interface DocumentSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  role: string[]
  readTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  content: string
}

export default function DocumentationPage() {
  const [activeDoc, setActiveDoc] = useState<string>('getting-started')
  const [searchTerm, setSearchTerm] = useState('')

  const documentSections: DocumentSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Quick start guide for new users',
      icon: <BookOpen className="h-5 w-5" />,
      role: ['All Users'],
      readTime: '5 min',
      difficulty: 'Beginner',
      content: `# Getting Started Guide

## Welcome to Intelligent CMMS!

This quick guide will get you up and running in 5 minutes.

### 🚀 First Steps

#### 1. **Login & Navigation**
- Access the system through your web browser
- Use your assigned credentials
- Navigate using the sidebar menu (左側のメニュー)

#### 2. **Dashboard Overview**
Your main dashboard shows:
- **検査統計** - Live inspection statistics
- **メニューカード** - Quick access to all features
- **最新情報** - Recent system updates

#### 3. **Key Features Tour**

**🔍 検査結果 (Inspection Results)**
- View inspection data by equipment type
- Filter by status: 合格/不合格/要確認
- Export reports and track trends

**🤖 AIアシスタント (AI Assistant)**
- **AIチャット**: Ask questions about equipment and maintenance
- **グラフ生成**: Create charts from your data automatically
- **インサイト分析**: Get AI insights on equipment trends

**📊 プロセス監視 (Process Monitoring)**
- Monitor real-time equipment parameters
- Receive automatic alerts
- Track performance trends

**⚠️ リスク評価 (Risk Assessment)**
- View risk matrix and scenarios
- Conduct FMEA analysis
- Track mitigation measures

**🔧 タスク管理 (Task Management)**
- View work orders and schedules
- Track completion status
- Manage equipment strategies

### 📱 Mobile Usage

**Access on Mobile:**
- Same URL works on phone/tablet
- Touch-friendly interface
- Offline capability for field work

**Quick Tips:**
- Download work orders before field visits
- Take photos for documentation
- Sync when back online

### 🎯 Common Tasks

#### **Daily Routine (5 minutes)**
1. **Check Dashboard** - Review inspection stats
2. **Review Alerts** - Process monitoring notifications  
3. **Complete Tasks** - Work orders assigned to you
4. **Update Status** - Mark completed work

#### **Weekly Tasks (15 minutes)**
1. **Review Reports** - Inspection trends and compliance
2. **AI Analysis** - Ask AI about equipment patterns
3. **Plan Ahead** - Check upcoming maintenance
4. **Team Communication** - Coordinate with colleagues

### 🆘 Need Help?

#### **In-System Help**
- 📖 **Documentation** - Complete guides for your role
- 🤖 **AI Assistant** - Ask questions anytime
- ❓ **FAQ** - Common questions answered

#### **Contact Support**
- **Technical Issues**: IT Helpdesk (ext. 2400)
- **Process Questions**: Maintenance Engineering (ext. 2150)
- **Training**: Training Department (ext. 2300)

### ✅ Success Tips

**For Best Results:**
- 📱 **Mobile Ready** - Use phone/tablet for field work
- 🔄 **Stay Updated** - Check dashboard daily
- 💬 **Ask Questions** - Use AI assistant for insights
- 📊 **Review Data** - Look at trends and patterns
- 🤝 **Collaborate** - Share findings with team

### 🎓 Next Steps

#### **Learn More:**
1. **Read Your Role Guide** - Detailed procedures for your position
2. **Try AI Features** - Experiment with AI assistant
3. **Explore Reports** - Understand your data
4. **Join Training** - Attend user group meetings

#### **Become an Expert:**
- **Practice Daily** - Use system for routine work
- **Ask Questions** - Don't hesitate to seek help
- **Share Tips** - Help colleagues learn
- **Provide Feedback** - Suggest improvements

**Ready to start? Begin with your dashboard and explore!** 🚀`
    },
    {
      id: 'overview',
      title: 'System Overview',
      description: 'Complete introduction to the intelligent CMMS system',
      icon: <BookOpen className="h-5 w-5" />,
      role: ['All Users'],
      readTime: '10 min',
      difficulty: 'Beginner',
      content: `# CMMS System Overview

## Welcome to Your Intelligent CMMS

This system consists of three integrated features that work together:

### 1. 🔧 Automatic Task Generation
- Creates work orders automatically based on Equipment Strategies
- Eliminates manual scheduling
- Ensures consistent maintenance execution

### 2. 📊 Process Monitoring  
- Monitors real-time equipment parameters
- Detects when conditions change
- Automatically adjusts maintenance frequency

### 3. ⚠️ Risk Assessment (FMEA)
- Systematically evaluates equipment failure modes
- Prioritizes maintenance based on risk levels
- Optimizes resource allocation

## How They Work Together

\`\`\`
Process Monitoring → Risk Assessment → Equipment Strategy → Task Generation
       ↓                ↓              ↓              ↓
  Detects changes   Updates risk    Adjusts frequency  Creates work orders
\`\`\`

## Daily Workflow
1. **Check Dashboard** - Review priorities and alerts
2. **Complete Tasks** - Execute generated work orders  
3. **Report Conditions** - Document findings accurately
4. **Monitor Alerts** - Respond to system notifications

## Key Benefits
- **Proactive Maintenance** - Prevent failures before they occur
- **Optimized Resources** - Focus effort where it matters most
- **Data-Driven Decisions** - Use real data, not guesswork
- **Consistent Execution** - Standardized processes across teams`
    },
    {
      id: 'engineers',
      title: 'Maintenance Engineers',
      description: 'Equipment strategies, risk assessment, and system optimization',
      icon: <Wrench className="h-5 w-5" />,
      role: ['Maintenance Engineer'],
      readTime: '25 min',
      difficulty: 'Advanced',
      content: `# Maintenance Engineers Guide

## Your Core Responsibilities

### 1. Equipment Strategy Management
Create and optimize maintenance strategies that drive automatic task generation.

**Creating a New Strategy:**
1. Navigate to Task Management → Equipment Strategies
2. Click "Create New Strategy"
3. Define strategy parameters:
   - Equipment selection
   - Maintenance frequency (Daily/Weekly/Monthly)
   - Task procedures and requirements
   - Resource needs (tools, skills, parts)

**Best Practices:**
- Start conservative, optimize based on data
- Include clear, actionable procedures
- Consider operational constraints
- Document technical justification

### 2. Risk Assessment (FMEA) 
Conduct systematic failure mode analysis to prioritize maintenance.

**FMEA Process:**
1. **Identify Failure Modes** - What can go wrong?
2. **Evaluate Impact** - Severity (1-10 scale)
3. **Assess Probability** - Occurrence (1-10 scale)  
4. **Review Detection** - How likely to catch early (1-10 scale)
5. **Calculate RPN** - Severity × Occurrence × Detection

**RPN Action Guidelines:**
- **>200**: Immediate action required
- **125-200**: High priority, address within week
- **75-125**: Medium priority, plan improvements
- **<75**: Low priority, monitor

### 3. Process Monitoring Response
Review and approve system-recommended changes based on real-time data.

**Response Process:**
1. **Alert Review** - Analyze parameter trends and thresholds
2. **Technical Assessment** - Evaluate equipment condition
3. **Decision Making** - Approve, reject, or modify recommendations
4. **Implementation** - Update equipment strategies
5. **Monitoring** - Track effectiveness of changes

## Daily Workflow
- **Morning**: Review overnight alerts and pending approvals
- **Throughout Day**: Respond to notifications within 4 hours
- **End of Day**: Document decisions and plan next day priorities`
    },
    {
      id: 'technicians',
      title: 'Field Technicians',
      description: 'Daily task execution, mobile interface, and quality reporting',
      icon: <Users className="h-5 w-5" />,
      role: ['Field Technician'],
      readTime: '15 min',
      difficulty: 'Beginner',
      content: `# Field Technicians Guide

## Your Daily Workflow

### Start of Shift (10-15 minutes)
1. **Login to CMMS** - Check task dashboard
2. **Review Priorities** - CRITICAL → HIGH → MEDIUM → LOW
3. **Gather Resources** - Tools, parts, permits, PPE
4. **Safety Brief** - Review specific hazards for today's tasks

### Task Execution

**Priority Levels:**
- **🔴 CRITICAL**: Immediate response (safety/production risk)
- **🟡 HIGH**: Within 4 hours (equipment degradation)
- **🔵 MEDIUM**: Within 24 hours (routine preventive)
- **🟢 LOW**: Within 72 hours (optimization tasks)

**Quality Documentation:**
Always document:
- **Condition Found** - Detailed current state
- **Actions Taken** - Specific work performed
- **Measurements** - All readings and observations
- **Recommendations** - Suggestions for follow-up

### Mobile Interface Tips
- **Work Offline** - Download tasks at shift start
- **Take Photos** - Document unusual conditions
- **Use Voice Notes** - Quick observations
- **Sync Regularly** - Upload when connectivity available

### When to Escalate
**Immediate Escalation (Call Supervisor):**
- Safety hazards (leaks, electrical, structural)
- Production threats (equipment about to fail)
- Environmental risks (spills, emissions)

**Routine Escalation (Same Day Report):**
- Performance degradation
- Additional work needed
- Parts requirements
- Procedure unclear

## Example Good Documentation

\`\`\`
Equipment: EQ006 - Cooling Pump
Task: Weekly Inspection

Condition Found:
- Bearing temperature: 65°C (normal: 45-55°C)  
- Unusual vibration at motor end
- Slight oil seepage at bearing housing
- Pump performance normal (flow/pressure OK)

Actions Taken:
- Added 200ml lubricating oil
- Checked alignment - within spec
- Cleaned oil seepage area
- Scheduled vibration analysis

Recommendations:
- Monitor bearing temperature daily
- Consider bearing replacement within 30 days
\`\`\``
    },
    {
      id: 'supervisors',
      title: 'Supervisors',
      description: 'Team management, approvals, and performance monitoring',
      icon: <Shield className="h-5 w-5" />,
      role: ['Supervisor'],
      readTime: '20 min',
      difficulty: 'Intermediate',
      content: `# Supervisors Guide

## Your Leadership Role

### Daily Team Management

**Morning Routine (20-30 minutes):**
1. **Team Brief** - Review overnight events and priorities
2. **Critical Alerts** - Address HIGH/CRITICAL items first
3. **Resource Planning** - Ensure adequate staffing and materials
4. **Safety Review** - Discuss specific hazards and precautions

**Throughout the Day:**
- **Monitor Progress** - Track work order completion
- **Decision Support** - Help technicians with complex issues
- **Approve Changes** - Review system recommendations
- **Coordinate** - Interface with operations and engineering

### Approval Workflows

**Equipment Strategy Changes:**
When you receive ES change requests:
1. **Review Justification** - Is recommendation technically sound?
2. **Assess Resources** - Can team handle increased workload?
3. **Check History** - Is this a recurring issue?
4. **Make Decision** - Approve, reject, or modify

**Approval Criteria:**
- ✅ **Approve**: Clear justification + manageable impact
- 🔄 **Modify**: Adjust frequency or scope as needed  
- ❌ **Reject**: Insufficient justification or better alternatives
- ⏸️ **Defer**: Need more information or consultation

### Performance Monitoring

**Key Metrics to Track:**
- **Completion Rate**: Target >95%
- **On-Time Performance**: Target >90%
- **Quality Score**: Based on documentation completeness
- **Safety Performance**: Zero incidents goal

**Team Development:**
- **Fair Work Distribution** - Balance challenging and routine work
- **Skill Building** - Provide cross-training opportunities
- **Recognition** - Acknowledge quality work publicly
- **Problem Solving** - Involve team in process improvements

### Resource Management

**Daily Staffing Decisions:**
- **Skill Matching** - Right person for technical requirements
- **Workload Balancing** - Distribute work fairly
- **Development** - Consider training opportunities
- **Coverage** - Ensure critical work completion

## Emergency Response

**Emergency Authority:**
- Override system priorities for emergency response
- Authorize overtime and additional resources
- Request external support (contractors, vendors)
- Modify procedures temporarily if required

**Crisis Communication:**
- **Immediate**: Control room and department manager
- **15 minutes**: Plant management and engineering  
- **1 hour**: Corporate notification if required`
    },
    {
      id: 'admins',
      title: 'System Administrators',
      description: 'Configuration, integration, and technical management',
      icon: <Settings className="h-5 w-5" />,
      role: ['System Administrator'],
      readTime: '30 min',
      difficulty: 'Advanced',
      content: `# System Administrators Guide

## System Architecture Overview

\`\`\`
CMMS System Components:
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
├─────────────────────────────────────────────┤
│              API Layer                      │
│ ┌─────────────┬──────────────┬───────────┐  │
│ │ Task Gen.   │ Process Mon. │ Risk Mgmt │  │
│ └─────────────┴──────────────┴───────────┘  │
├─────────────────────────────────────────────┤
│        Database (Supabase PostgreSQL)      │
├─────────────────────────────────────────────┤
│           External Integrations             │
│ ┌─────────────┬──────────────┬───────────┐  │
│ │ DCS/SCADA   │ ERP System   │ Document  │  │
│ │ (Real-time) │ (Parts/Work) │ Mgmt      │  │
│ └─────────────┴──────────────┴───────────┘  │
└─────────────────────────────────────────────┘
\`\`\`

## Core Configuration Tasks

### 1. Process Monitoring Setup

**Adding New Parameters:**
\`\`\`sql
INSERT INTO process_parameters (
    parameter_id, parameter_name, parameter_type, 
    equipment_id, tag_name,
    normal_min, normal_max, critical_min, critical_max
) VALUES (
    'TI-102-01', 'Pump Bearing Temperature', 'TEMPERATURE',
    'EQ007', 'TI_102_01',
    40.0, 60.0, 35.0, 75.0
);
\`\`\`

**Creating Trigger Rules:**
\`\`\`sql
INSERT INTO process_trigger_rules (
    rule_id, parameter_id, trigger_type, condition_type,
    threshold_value, evaluation_window_minutes, severity
) VALUES (
    'RULE-TI-102-HIGH', 'TI-102-01', 'LIMIT_EXCEEDED', 'GREATER_THAN',
    65.0, 15, 'HIGH'
);
\`\`\`

### 2. User Management

**Role-Based Permissions:**
- **field_technician**: Read work orders, write completion data
- **maintenance_engineer**: Full equipment strategy access
- **supervisor**: Approval workflows and team management
- **system_admin**: Full system configuration access

**User Creation Process:**
1. Create in Supabase Auth
2. Link to staff_master table
3. Assign role in user metadata
4. Test permissions

### 3. Data Integration

**DCS Integration Configuration:**
\`\`\`javascript
const dcsConfig = {
    source: 'DCS_SYSTEM',
    endpoint: 'https://dcs.plant.com/api/realtime',
    polling_interval: 60, // seconds
    parameters: [
        {
            dcs_tag: 'TI_101_01',
            cmms_parameter: 'TI-101-01',
            conversion_factor: 1.0
        }
    ]
};
\`\`\`

## Performance Monitoring

**Key System Metrics:**
- **Database Connections**: Monitor connection pool usage
- **API Response Times**: Track endpoint performance  
- **Data Integration**: Verify DCS feed continuity
- **User Activity**: Monitor system adoption

**Daily Health Check:**
\`\`\`sql
-- Check latest process data
SELECT parameter_id, MAX(timestamp) as last_data
FROM process_data
GROUP BY parameter_id
ORDER BY last_data;

-- Monitor slow queries  
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
\`\`\`

## Troubleshooting Guide

**Common Issues:**

**1. DCS Data Feed Interruption**
- Check network connectivity
- Verify API credentials
- Review firewall settings
- Restart ingestion service

**2. Slow Performance**
- Monitor database connections
- Check for long-running queries
- Verify index utilization
- Consider query optimization

**3. User Access Problems**
- Verify Supabase Auth status
- Check role assignments
- Review RLS policies
- Test permissions

## Backup and Recovery

**Backup Strategy:**
- **Database**: Automated Supabase backups (daily)
- **Configuration**: Export critical settings weekly
- **Documentation**: Version control system

**Recovery Procedures:**
1. Assess outage scope
2. Notify stakeholders  
3. Implement workarounds
4. Coordinate with vendors
5. Execute recovery plan
6. Validate data integrity`
    },
    {
      id: 'tutorials',
      title: 'Step-by-Step Tutorials',
      description: 'Hands-on guides for common tasks and workflows',
      icon: <FileText className="h-5 w-5" />,
      role: ['All Users'],
      readTime: '5-15 min each',
      difficulty: 'Beginner',
      content: `# Step-by-Step Tutorials

## Tutorial 1: Creating an Equipment Strategy

**Prerequisites:** Maintenance Engineer role

**Steps:**
1. **Navigate to Task Management**
   - Dashboard → Task Management → Equipment Strategies

2. **Create New Strategy**
   - Click "Create New Strategy" button
   - Select equipment from dropdown
   - Enter strategy name: "Weekly Pump Inspection"

3. **Define Parameters**
   - Strategy Type: "Preventive"
   - Frequency: "Weekly" 
   - Duration: 2.0 hours
   - Skills: "Basic mechanical"

4. **Task Description**
   \`\`\`
   1. Visual inspection for leaks and damage
   2. Check bearing temperature (<60°C)  
   3. Listen for unusual sounds
   4. Verify coupling alignment
   5. Record observations
   \`\`\`

5. **Save and Activate**
   - Set priority: MEDIUM
   - Activate: Yes
   - Save strategy

## Tutorial 2: Responding to Process Alerts

**Scenario:** High temperature alert on cooling pump

**Steps:**
1. **Receive Alert**
   \`\`\`
   Process Alert: TI-101-01 Temperature: 85°C
   Normal Range: 60-80°C
   Equipment: EQ006 - Cooling Pump
   \`\`\`

2. **Review Data**
   - Navigate: Process Monitoring → Parameter Details
   - Check: Historical trends and related parameters

3. **Evaluate Recommendation**
   - Current: Monthly inspection
   - Recommended: Weekly inspection
   - Impact: +6 hours/month

4. **Make Decision**
   - ☑ Approve frequency increase
   - Document justification
   - Click "Approve Change"

5. **Verify Implementation**
   - Check Equipment Strategy updated
   - Confirm next work order scheduled

## Tutorial 3: Completing a Work Order

**Prerequisites:** Field Technician role

**Steps:**
1. **Access Work Order**
   - Open CMMS on mobile device
   - Select assigned work order
   - Review task requirements

2. **Gather Resources**
   - Check tool requirements
   - Verify parts availability
   - Confirm safety requirements

3. **Execute Work**
   - Follow procedure step-by-step
   - Take measurements and photos
   - Document all observations

4. **Complete Documentation**
   \`\`\`
   Condition Found: [Detailed description]
   Actions Taken: [Specific work performed]
   Measurements: [All readings]
   Recommendations: [Follow-up needs]
   \`\`\`

5. **Update Status**
   - Mark work order complete
   - Upload photos and notes
   - Sync data when connectivity available

## Tutorial 4: Conducting Risk Assessment

**Prerequisites:** Engineer or Supervisor role

**Steps:**
1. **Initiate Review**
   - Navigate: Risk Assessment → System Overview
   - Select system for review
   - Click "Create New Review"

2. **Set Up Team**
   - Review Type: SCHEDULED
   - Leader: [Your name]
   - Team: [Select members]

3. **Evaluate Failure Modes**
   \`\`\`
   Example: "Pump bearing failure"
   Severity (1-10): 7 (Production impact)
   Occurrence (1-10): 4 (Once per 2 years)
   Detection (1-10): 6 (Weekly inspection)
   RPN = 7 × 4 × 6 = 168
   \`\`\`

4. **Determine Actions**
   - RPN ≥ 100 requires action
   - Options: Increase frequency, add monitoring, improve procedures

5. **Submit Review**
   - Document findings
   - Generate recommendations  
   - Submit for approval

## Quick Reference Cards

**Process Alert Response:**
1. Review → Analyze → Decide → Document → Implement

**Work Order Execution:**
1. Prepare → Execute → Document → Complete → Sync

**Risk Assessment:**
1. Setup → Evaluate → Score → Action → Approve`
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Common questions and troubleshooting help',
      icon: <HelpCircle className="h-5 w-5" />,
      role: ['All Users'],
      readTime: 'Variable',
      difficulty: 'Beginner',
      content: `# Frequently Asked Questions

## General System Questions

**Q: What makes this CMMS "intelligent"?**
A: Three integrated features work together automatically:
- Automatic task generation from equipment strategies
- Process monitoring that adjusts maintenance frequency
- Risk assessment that prioritizes work by safety/reliability impact

**Q: How is this different from traditional CMMS?**
A: Traditional systems are scheduling tools. Our system:
- Proactively adjusts frequency based on real-time conditions
- Automatically generates work orders
- Integrates risk assessment into maintenance planning
- Uses process data to optimize strategies

## Task Generation

**Q: Can I override automatically generated tasks?**
A: Yes, supervisors can reschedule, change priority, modify scope, or cancel tasks with proper justification.

**Q: What if I can't complete a task on time?**
A: Update the work order status, reschedule automatically, and escalate if critical. The system tracks performance for improvement, not punishment.

## Process Monitoring

**Q: How quickly does the system respond to changes?**
A: Response times by severity:
- CRITICAL: 5 minutes
- HIGH: 15-30 minutes  
- MEDIUM: 1-4 hours
- LOW: 4-24 hours

**Q: What triggers maintenance adjustments?**
A: Common triggers include temperature deviations, pressure changes, vibration increases, and performance degradation.

## Risk Assessment

**Q: What is RPN scoring?**
A: RPN = Severity × Occurrence × Detection
- Severity: How bad if failure occurs (1-10)
- Occurrence: How likely to happen (1-10)
- Detection: How likely to catch early (1-10)
- RPN >100 typically requires action

**Q: How often are risk assessments done?**
A: 
- Scheduled: Annual/bi-annual
- Process-triggered: When monitoring detects changes
- Event-triggered: After failures or incidents

## Mobile Use

**Q: Can I work offline?**
A: Yes, download work orders at shift start, work offline, and sync when connectivity returns.

**Q: How do I attach photos?**
A: Open work order on mobile → tap camera icon → take photos → add captions → sync automatically.

## Troubleshooting

**Q: System seems slow - what should I do?**
A: 
1. Check internet connection
2. Close other applications
3. Clear browser cache
4. Try different browser
5. Contact IT (ext. 2400) if problems persist

**Q: I can't find my work order - where is it?**
A:
1. Check filter settings
2. Verify assignment status  
3. Check completion status
4. Refresh page to sync
5. Contact supervisor if still missing

## Support Contacts

**Emergency Safety**: Control Room (ext. 911)
**Technical Issues**: IT Helpdesk (ext. 2400)
**Process Questions**: Maintenance Engineering (ext. 2150)
**Training**: Training Department (ext. 2300)

## Common Error Messages

**"Parameter not found"**
- Solution: Refresh page or contact system admin

**"Permission denied"**
- Solution: Check with supervisor about role permissions

**"Connection timeout"**
- Solution: Check internet connection, try again

**"Data sync failed"**
- Solution: Ensure good connectivity, try manual sync`
    }
  ]

  const filteredDocs = documentSections.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Documentation & User Guides</h1>
            <p className="text-muted-foreground">
              Comprehensive guides for using the intelligent CMMS system
            </p>
          </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.open('/docs', '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Full Documentation
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentation Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    activeDoc === doc.id 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {doc.icon}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(doc.difficulty)}`}
                        >
                          {doc.difficulty}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {doc.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setActiveDoc('getting-started')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Getting Started
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setActiveDoc('tutorials')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Video Tutorials
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setActiveDoc('faq')}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Support Center
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className={activeDoc === doc.id ? 'block' : 'hidden'}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {doc.icon}
                      <div>
                        <CardTitle className="text-2xl">{doc.title}</CardTitle>
                        <CardDescription className="text-lg mt-1">
                          {doc.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(doc.difficulty)}
                      >
                        {doc.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {doc.readTime}
                      </div>
                    </div>
                  </div>
                  
                  {/* Role Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {doc.role.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {doc.content}
                    </pre>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-6 pt-6 border-t">
                    <Button size="sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Read
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Section
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Full Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Additional Help?</CardTitle>
          <CardDescription>
            Contact information and additional resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">System Training</h4>
              <p className="text-sm text-muted-foreground">Training Department</p>
              <p className="text-sm font-mono">ext. 2300</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Technical Issues</h4>
              <p className="text-sm text-muted-foreground">IT Helpdesk</p>
              <p className="text-sm font-mono">ext. 2400</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h4 className="font-medium">Process Questions</h4>
              <p className="text-sm text-muted-foreground">Maintenance Engineering</p>
              <p className="text-sm font-mono">ext. 2150</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}