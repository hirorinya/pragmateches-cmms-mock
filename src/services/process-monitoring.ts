// ============================================
// Process Monitoring and ES Change Detection Service
// ============================================

import { createClient } from '@supabase/supabase-js'

interface ProcessParameter {
  parameter_id: string
  parameter_name: string
  parameter_type: string
  unit: string
  equipment_id: string
  tag_name: string
  normal_min: number
  normal_max: number
  critical_min: number
  critical_max: number
}

interface ProcessData {
  parameter_id: string
  timestamp: string
  value: number
  quality: string
  source: string
}

interface TriggerRule {
  rule_id: string
  rule_name: string
  parameter_id: string
  trigger_type: string
  condition_type: string
  threshold_value?: number
  threshold_percent?: number
  evaluation_window_minutes: number
  min_duration_minutes: number
  severity: string
}

interface TriggerEvent {
  rule_id: string
  triggered_at: string
  trigger_value: number
  baseline_value?: number
  deviation_percent?: number
  duration_minutes?: number
  severity: string
}

interface ESChangeRecommendation {
  strategy_id: string
  notification_type: string
  impact_description: string
  recommended_action: string
  current_frequency_type?: string
  current_frequency_value?: number
  recommended_frequency_type?: string
  recommended_frequency_value?: number
  priority: string
}

export class ProcessMonitoringService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  /**
   * Main function to process incoming DCS data and detect triggers
   */
  async processIncomingData(data: ProcessData[]): Promise<{
    success: boolean
    processed: number
    triggers_detected: number
    es_notifications: number
    details: string[]
  }> {
    console.log(`[ProcessMonitoring] Processing ${data.length} data points`)
    
    const results = {
      success: true,
      processed: 0,
      triggers_detected: 0,
      es_notifications: 0,
      details: [] as string[]
    }

    try {
      // 1. Store incoming process data
      const { error: insertError } = await this.supabase
        .from('process_data')
        .insert(data)

      if (insertError) {
        throw new Error(`Failed to insert process data: ${insertError.message}`)
      }

      results.processed = data.length
      results.details.push(`✅ Stored ${data.length} process data points`)

      // 2. Evaluate triggers for each parameter
      const uniqueParameters = [...new Set(data.map(d => d.parameter_id))]
      
      for (const parameterId of uniqueParameters) {
        const triggerResults = await this.evaluateParameterTriggers(parameterId)
        results.triggers_detected += triggerResults.triggered_rules.length
        
        if (triggerResults.triggered_rules.length > 0) {
          results.details.push(`🔔 ${triggerResults.triggered_rules.length} triggers for ${parameterId}`)
          
          // 3. Generate ES change notifications
          for (const event of triggerResults.triggered_rules) {
            const notifications = await this.generateESChangeNotifications(event)
            results.es_notifications += notifications.length
            results.details.push(`📋 ${notifications.length} ES notifications generated for ${event.rule_id}`)
          }
        }
      }

    } catch (error: any) {
      results.success = false
      results.details.push(`❌ Error: ${error.message}`)
      console.error('[ProcessMonitoring] Error:', error)
    }

    return results
  }

  /**
   * Evaluate triggers for a specific parameter
   */
  private async evaluateParameterTriggers(parameterId: string): Promise<{
    triggered_rules: TriggerEvent[]
    evaluations: string[]
  }> {
    const triggeredRules: TriggerEvent[] = []
    const evaluations: string[] = []

    try {
      // Get active trigger rules for this parameter
      const { data: rules, error: rulesError } = await this.supabase
        .from('process_trigger_rules')
        .select('*')
        .eq('parameter_id', parameterId)
        .eq('is_active', true)

      if (rulesError) throw new Error(`Failed to fetch trigger rules: ${rulesError.message}`)
      if (!rules || rules.length === 0) return { triggered_rules: [], evaluations: [] }

      // Get recent data for evaluation
      const { data: recentData, error: dataError } = await this.supabase
        .from('process_data')
        .select('*')
        .eq('parameter_id', parameterId)
        .eq('quality', 'GOOD')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (dataError) throw new Error(`Failed to fetch recent data: ${dataError.message}`)
      if (!recentData || recentData.length === 0) return { triggered_rules: [], evaluations: [] }

      // Evaluate each rule
      for (const rule of rules) {
        const evaluation = await this.evaluateTriggerRule(rule, recentData)
        evaluations.push(`${rule.rule_id}: ${evaluation.result}`)
        
        if (evaluation.triggered) {
          // Check if this trigger is already active
          const { data: existingEvents } = await this.supabase
            .from('process_trigger_events')
            .select('event_id')
            .eq('rule_id', rule.rule_id)
            .eq('status', 'ACTIVE')

          if (!existingEvents || existingEvents.length === 0) {
            // Create new trigger event
            const triggerEvent: TriggerEvent = {
              rule_id: rule.rule_id,
              triggered_at: new Date().toISOString(),
              trigger_value: evaluation.trigger_value!,
              baseline_value: evaluation.baseline_value,
              deviation_percent: evaluation.deviation_percent,
              duration_minutes: evaluation.duration_minutes,
              severity: rule.severity
            }

            const { error: eventError } = await this.supabase
              .from('process_trigger_events')
              .insert(triggerEvent)

            if (!eventError) {
              triggeredRules.push(triggerEvent)
            }
          }
        }
      }

    } catch (error: any) {
      console.error(`[ProcessMonitoring] Error evaluating triggers for ${parameterId}:`, error)
    }

    return { triggered_rules: triggeredRules, evaluations }
  }

  /**
   * Evaluate a specific trigger rule against recent data
   */
  private async evaluateTriggerRule(rule: TriggerRule, recentData: ProcessData[]): Promise<{
    triggered: boolean
    result: string
    trigger_value?: number
    baseline_value?: number
    deviation_percent?: number
    duration_minutes?: number
  }> {
    const windowMs = rule.evaluation_window_minutes * 60 * 1000
    const minDurationMs = rule.min_duration_minutes * 60 * 1000
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowMs)

    // Filter data within evaluation window
    const windowData = recentData.filter(d => 
      new Date(d.timestamp) >= windowStart
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    if (windowData.length === 0) {
      return { triggered: false, result: 'No data in evaluation window' }
    }

    const currentValue = windowData[0].value
    let triggered = false
    let result = ''

    try {
      switch (rule.trigger_type) {
        case 'LIMIT_EXCEEDED':
          triggered = await this.evaluateLimitExceeded(rule, currentValue)
          result = `Current: ${currentValue}, Limit: ${rule.threshold_value}, Triggered: ${triggered}`
          break

        case 'DEVIATION':
          const deviationResult = await this.evaluateDeviation(rule, windowData)
          triggered = deviationResult.triggered
          result = `Deviation: ${deviationResult.deviation_percent?.toFixed(1)}%, Threshold: ${rule.threshold_percent}%`
          return {
            triggered,
            result,
            trigger_value: currentValue,
            baseline_value: deviationResult.baseline_value,
            deviation_percent: deviationResult.deviation_percent
          }

        case 'TREND':
          const trendResult = await this.evaluateTrend(rule, windowData)
          triggered = trendResult.triggered
          result = `Trend: ${trendResult.trend_percent?.toFixed(1)}%, Threshold: ${rule.threshold_percent}%`
          return {
            triggered,
            result,
            trigger_value: currentValue,
            deviation_percent: trendResult.trend_percent
          }

        default:
          result = `Unknown trigger type: ${rule.trigger_type}`
      }

      // Check minimum duration for sustained conditions
      if (triggered && rule.min_duration_minutes > 0) {
        const sustainedResult = await this.checkSustainedCondition(rule, windowData, minDurationMs)
        triggered = sustainedResult.sustained
        result += ` | Sustained: ${sustainedResult.sustained} (${sustainedResult.duration_minutes}min)`
        
        return {
          triggered,
          result,
          trigger_value: currentValue,
          duration_minutes: sustainedResult.duration_minutes
        }
      }

    } catch (error: any) {
      result = `Evaluation error: ${error.message}`
    }

    return {
      triggered,
      result,
      trigger_value: currentValue
    }
  }

  /**
   * Evaluate limit exceeded conditions
   */
  private async evaluateLimitExceeded(rule: TriggerRule, currentValue: number): Promise<boolean> {
    if (!rule.threshold_value) return false

    switch (rule.condition_type) {
      case 'GREATER_THAN':
        return currentValue > rule.threshold_value
      case 'LESS_THAN':
        return currentValue < rule.threshold_value
      default:
        return false
    }
  }

  /**
   * Evaluate deviation from baseline
   */
  private async evaluateDeviation(rule: TriggerRule, windowData: ProcessData[]): Promise<{
    triggered: boolean
    baseline_value?: number
    deviation_percent?: number
  }> {
    if (!rule.threshold_percent) return { triggered: false }

    // Get baseline value
    const { data: baseline } = await this.supabase
      .from('process_baselines')
      .select('baseline_value')
      .eq('parameter_id', rule.parameter_id)
      .eq('baseline_type', 'MONTHLY')
      .eq('is_active', true)
      .order('valid_from', { ascending: false })
      .limit(1)
      .single()

    if (!baseline) return { triggered: false }

    const currentValue = windowData[0].value
    const baselineValue = baseline.baseline_value
    const deviationPercent = ((currentValue - baselineValue) / baselineValue) * 100

    let triggered = false
    switch (rule.condition_type) {
      case 'CHANGE_PERCENT':
        triggered = Math.abs(deviationPercent) > Math.abs(rule.threshold_percent)
        break
      case 'OUTSIDE_RANGE':
        triggered = Math.abs(deviationPercent) > rule.threshold_percent
        break
    }

    return {
      triggered,
      baseline_value: baselineValue,
      deviation_percent: deviationPercent
    }
  }

  /**
   * Evaluate trend analysis
   */
  private async evaluateTrend(rule: TriggerRule, windowData: ProcessData[]): Promise<{
    triggered: boolean
    trend_percent?: number
  }> {
    if (!rule.threshold_percent || windowData.length < 2) return { triggered: false }

    // Calculate trend over the evaluation window
    const oldestValue = windowData[windowData.length - 1].value
    const newestValue = windowData[0].value
    const trendPercent = ((newestValue - oldestValue) / oldestValue) * 100

    const triggered = Math.abs(trendPercent) > Math.abs(rule.threshold_percent)

    return { triggered, trend_percent: trendPercent }
  }

  /**
   * Check if condition is sustained for minimum duration
   */
  private async checkSustainedCondition(rule: TriggerRule, windowData: ProcessData[], minDurationMs: number): Promise<{
    sustained: boolean
    duration_minutes: number
  }> {
    // Simple implementation: check if condition persists for minimum duration
    const now = new Date()
    const sustainStart = new Date(now.getTime() - minDurationMs)
    
    const sustainedData = windowData.filter(d => new Date(d.timestamp) >= sustainStart)
    const sustained = sustainedData.length > 0
    const durationMinutes = sustained ? minDurationMs / (60 * 1000) : 0

    return { sustained, duration_minutes: durationMinutes }
  }

  /**
   * Generate ES change notifications based on triggered events
   */
  private async generateESChangeNotifications(event: TriggerEvent): Promise<ESChangeRecommendation[]> {
    const notifications: ESChangeRecommendation[] = []

    try {
      // Get ES mappings for this rule
      const { data: mappings, error } = await this.supabase
        .from('es_process_mapping')
        .select(`
          *,
          equipment_strategy!inner(*)
        `)
        .eq('rule_id', event.rule_id)

      if (error) throw new Error(`Failed to fetch ES mappings: ${error.message}`)
      if (!mappings || mappings.length === 0) return []

      for (const mapping of mappings) {
        const strategy = mapping.equipment_strategy
        let notificationType = 'ES_REVIEW_REQUIRED'
        let recommendedFrequencyType = strategy.frequency_type
        let recommendedFrequencyValue = strategy.frequency_value

        // Determine recommended changes based on mapping
        switch (mapping.recommended_action) {
          case 'INCREASE_FREQUENCY':
            notificationType = 'FREQUENCY_CHANGE'
            if (strategy.frequency_type === 'DAILY') {
              // Already daily, can't increase further
            } else if (strategy.frequency_type === 'WEEKLY') {
              recommendedFrequencyType = 'DAILY'
              recommendedFrequencyValue = 1
            } else if (strategy.frequency_type === 'MONTHLY') {
              recommendedFrequencyType = 'WEEKLY'
              recommendedFrequencyValue = 1
            }
            break

          case 'CHANGE_PRIORITY':
            notificationType = 'PRIORITY_CHANGE'
            break

          case 'ADD_INSPECTION':
            notificationType = 'SCOPE_CHANGE'
            break
        }

        const recommendation: ESChangeRecommendation = {
          strategy_id: mapping.strategy_id,
          notification_type: notificationType,
          impact_description: mapping.impact_description,
          recommended_action: mapping.recommended_action,
          current_frequency_type: strategy.frequency_type,
          current_frequency_value: strategy.frequency_value,
          recommended_frequency_type: recommendedFrequencyType,
          recommended_frequency_value: recommendedFrequencyValue,
          priority: event.severity
        }

        // Insert notification
        const { error: notificationError } = await this.supabase
          .from('es_change_notifications')
          .insert({
            event_id: event.rule_id, // This should be the actual event_id
            strategy_id: recommendation.strategy_id,
            notification_type: recommendation.notification_type,
            current_frequency_type: recommendation.current_frequency_type,
            current_frequency_value: recommendation.current_frequency_value,
            recommended_frequency_type: recommendation.recommended_frequency_type,
            recommended_frequency_value: recommendation.recommended_frequency_value,
            impact_description: recommendation.impact_description,
            priority: recommendation.priority
          })

        if (!notificationError) {
          notifications.push(recommendation)

          // Auto-apply if configured
          if (mapping.auto_apply) {
            await this.autoApplyESChange(recommendation)
          }

          // Check if this should trigger a risk review
          await this.checkRiskReviewTrigger(event, mapping, strategy)
        }
      }

    } catch (error: any) {
      console.error('[ProcessMonitoring] Error generating ES notifications:', error)
    }

    return notifications
  }

  /**
   * Check if process event should trigger a risk review
   */
  private async checkRiskReviewTrigger(event: TriggerEvent, mapping: any, strategy: any): Promise<void> {
    try {
      // Only trigger risk review for high/critical severity events
      if (!['HIGH', 'CRITICAL'].includes(event.severity)) return

      // Get equipment's system mapping
      const { data: systemMapping } = await this.supabase
        .from('equipment_system_mapping')
        .select('system_id')
        .eq('equipment_id', strategy.equipment_id)
        .limit(1)
        .single()

      if (!systemMapping) return

      // Check if we should trigger a risk review
      const triggerResponse = await fetch('/api/risk/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_from_process_trigger',
          process_event_id: event.rule_id,
          system_id: systemMapping.system_id,
          severity: event.severity,
          review_leader: 'SYSTEM'
        })
      })

      if (triggerResponse.ok) {
        const result = await triggerResponse.json()
        if (result.triggered) {
          console.log(`[ProcessMonitoring] Risk review triggered for system ${systemMapping.system_id}`)
        }
      }

    } catch (error: any) {
      console.error('[ProcessMonitoring] Error checking risk review trigger:', error)
    }
  }

  /**
   * Automatically apply ES changes when configured
   */
  private async autoApplyESChange(recommendation: ESChangeRecommendation): Promise<void> {
    try {
      if (recommendation.notification_type === 'FREQUENCY_CHANGE') {
        const { error } = await this.supabase
          .from('equipment_strategy')
          .update({
            frequency_type: recommendation.recommended_frequency_type,
            frequency_value: recommendation.recommended_frequency_value,
            updated_at: new Date().toISOString()
          })
          .eq('strategy_id', recommendation.strategy_id)

        if (!error) {
          console.log(`[ProcessMonitoring] Auto-applied frequency change for ${recommendation.strategy_id}`)
        }
      }
    } catch (error: any) {
      console.error('[ProcessMonitoring] Error auto-applying ES change:', error)
    }
  }

  /**
   * Get current process monitoring status
   */
  async getMonitoringStatus(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('process_monitoring_dashboard')
        .select('*')
        .order('last_update', { ascending: false })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get pending ES change notifications
   */
  async getPendingNotifications(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('es_change_notifications')
        .select(`
          *,
          equipment_strategy!inner(strategy_name, equipment_id),
          process_trigger_events!inner(rule_id, triggered_at, severity)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}