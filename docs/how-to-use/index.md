# CMMS User Guide - How to Use

## Welcome to Your Intelligent CMMS System

This guide will help you understand how to effectively use our Computerized Maintenance Management System (CMMS) designed specifically for refinery operations. The system automatically generates tasks, monitors process conditions, and manages risk assessments to optimize your maintenance operations.

## 🏭 System Overview

Our CMMS consists of three integrated core features that work together to create a proactive maintenance ecosystem:

### 1. **Automatic Task Generation** 📋
- **What it does**: Automatically creates maintenance tasks based on Equipment Strategies (ES)
- **Key benefit**: Eliminates manual scheduling and ensures consistent maintenance
- **Example**: A pump with a weekly inspection ES automatically generates work orders every 7 days

### 2. **Process Monitoring** 📊
- **What it does**: Monitors real-time process parameters and detects when conditions change
- **Key benefit**: Adjusts maintenance frequency when equipment operates outside normal conditions
- **Example**: High temperature detected → increases inspection frequency → prevents failures

### 3. **Risk Assessment (FMEA)** ⚠️
- **What it does**: Evaluates failure modes and risk scenarios to prioritize maintenance activities
- **Key benefit**: Focuses resources on highest-risk equipment and scenarios
- **Example**: High RPN failure mode → increases maintenance frequency → reduces risk

## 🔄 How the Features Work Together

```
Process Monitoring → Risk Assessment → Equipment Strategy → Task Generation
       ↓                    ↓              ↓              ↓
  Detects changes     Updates risk     Adjusts frequency  Creates work orders
```

**Real-world example**:
1. **Process Monitoring** detects pump temperature increasing beyond normal range
2. **Risk Assessment** is triggered to review pump failure modes
3. **Equipment Strategy** frequency is increased from monthly to weekly
4. **Task Generation** creates additional work orders for more frequent inspections

## 👥 User Roles & Responsibilities

### 🔧 **Maintenance Engineers**
- Create and maintain Equipment Strategies
- Conduct risk assessments and FMEA reviews
- Approve process-triggered changes
- **Daily**: Review pending ES changes and risk notifications
- [→ Detailed Guide](./maintenance-engineers.md)

### 🔨 **Field Technicians**
- Complete generated work orders
- Report equipment conditions and issues
- Enter inspection results
- **Daily**: Check assigned tasks and complete inspections
- [→ Detailed Guide](./field-technicians.md)

### 👔 **Supervisors**
- Monitor work progress and team performance
- Approve high-priority changes
- Review risk assessment results
- **Daily**: Check dashboard for critical alerts and team status
- [→ Detailed Guide](./supervisors.md)

### ⚙️ **System Administrators**
- Configure process monitoring rules
- Manage user access and permissions
- Set up equipment systems and parameters
- **Weekly**: Review system performance and configuration
- [→ Detailed Guide](./system-administrators.md)

## 📈 Daily Workflow Overview

### Morning Routine (All Users)
1. **Check Dashboard** - Review overnight alerts and critical items
2. **Review Notifications** - Address any system-generated alerts
3. **Plan Day** - Prioritize tasks based on system recommendations

### Throughout the Day
- **Process Monitoring** runs continuously in background
- **Task Generation** creates new work orders as needed
- **Risk Assessment** triggers reviews when conditions change

### End of Day
1. **Complete Tasks** - Finish assigned work orders
2. **Update Status** - Enter results and observations
3. **Review Tomorrow** - Check upcoming scheduled work

## 🚨 Key Decision Points

### When Manual Intervention is Required

#### 1. **Process Change Notifications**
- **Trigger**: Process parameters exceed thresholds
- **Action Required**: Review and approve/reject ES frequency changes
- **Who**: Maintenance Engineers
- **Timeline**: Within 24 hours

#### 2. **High-Risk Scenarios**
- **Trigger**: Risk assessment identifies EXTREME or HIGH risk
- **Action Required**: Immediate review and mitigation planning
- **Who**: Supervisors + Maintenance Engineers
- **Timeline**: Immediate (within 4 hours)

#### 3. **Equipment Strategy Conflicts**
- **Trigger**: Multiple conflicting recommendations for same equipment
- **Action Required**: Manual review and decision
- **Who**: Maintenance Engineers
- **Timeline**: Within 48 hours

## 🎯 Key Performance Indicators

Monitor these metrics to ensure system effectiveness:

- **Task Completion Rate**: Target >95%
- **Process Alert Response Time**: Target <4 hours
- **Risk Review Completion**: Target <72 hours
- **Preventive vs Reactive Work**: Target 70/30 ratio

## 🔧 Common Scenarios

### Scenario 1: Routine Operations
- System generates tasks automatically
- Technicians complete scheduled work
- No manual intervention needed

### Scenario 2: Process Deviation
- Monitoring detects temperature spike
- System evaluates if ES change needed
- Engineer reviews and approves change
- Additional tasks generated automatically

### Scenario 3: Risk Assessment Update
- Scheduled risk review identifies new failure mode
- System calculates impact on maintenance frequency
- Updated ES generates additional preventive tasks

## 📚 Quick Start Guides

### New User Setup
1. [System Login and Navigation](./tutorials/system-login.md)
2. [Dashboard Overview](./tutorials/dashboard-overview.md)
3. [Role-Specific Setup](./tutorials/role-setup.md)

### Common Tasks
1. [Completing a Work Order](./tutorials/complete-work-order.md)
2. [Creating an Equipment Strategy](./tutorials/create-equipment-strategy.md)
3. [Conducting a Risk Assessment](./tutorials/risk-assessment.md)
4. [Responding to Process Alerts](./tutorials/process-alerts.md)

## 🆘 Getting Help

### Support Resources
- **System Issues**: Contact IT Helpdesk (ext. 2400)
- **Process Questions**: Contact Maintenance Supervisor
- **Training Requests**: Contact Training Department
- **Feature Requests**: Submit via System Feedback form

### Emergency Procedures
- **Critical Equipment Failure**: Follow emergency shutdown procedures
- **System Outage**: Use backup paper forms (located in supervisor office)
- **Process Safety Event**: Contact Control Room immediately (ext. 911)

## 📖 Additional Resources

- [System Architecture Overview](./technical/architecture.md)
- [Data Flow Diagrams](./technical/data-flow.md)
- [Integration Points](./technical/integrations.md)
- [Troubleshooting Guide](./technical/troubleshooting.md)
- [Best Practices](./best-practices.md)
- [FAQ](./faq.md)

---

## 🔄 Document Updates

- **Version**: 1.0
- **Last Updated**: July 2025
- **Next Review**: October 2025
- **Feedback**: [Submit feedback](mailto:cmms-feedback@company.com)

---

*This guide is designed to help you maximize the effectiveness of our intelligent CMMS system. For role-specific detailed instructions, please refer to your designated user guide.*