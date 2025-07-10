import { supabase } from '@/lib/supabase'
import { RISK_THRESHOLDS, RPN_THRESHOLD } from '@/config/constants'

interface FailureMode {
  failure_mode_id?: string
  system_id: string
  equipment_id?: string
  failure_mode: string
  failure_mechanism?: string
  failure_effect_local?: string
  failure_effect_system?: string
  failure_effect_plant?: string
  detection_method?: string
  current_controls?: string
  recommended_actions?: string
  severity_score: number
  occurrence_score: number
  detection_score: number
  safety_impact?: boolean
  environmental_impact?: boolean
  production_impact?: boolean
}

interface RiskScenario {
  scenario_id?: string
  system_id: string
  scenario_name: string
  scenario_description?: string
  trigger_conditions?: string
  likelihood_category: string
  likelihood_score: number
  consequence_category: string
  consequence_score: number
  current_barriers?: string[]
  mitigation_status?: string
  residual_risk_score?: number
}

interface RiskReview {
  review_id?: string
  system_id: string
  review_type: string
  review_status?: string
  review_date: string
  review_leader: string
  review_team?: string[]
  triggered_by?: string
  trigger_reference?: string
  findings?: string
  recommendations?: string
  action_items?: any
}

interface RiskESRecommendation {
  recommendation_id?: string
  source_type: string
  source_id: string
  strategy_id: string
  recommendation_type: string
  current_frequency_type?: string
  current_frequency_value?: number
  recommended_frequency_type?: string
  recommended_frequency_value?: number
  risk_level?: string
  rpn_score?: number
  justification?: string
}

export class RiskAssessmentService {
  // Calculate Risk Priority Number (RPN)
  calculateRPN(severity: number, occurrence: number, detection: number): number {
    return severity * occurrence * detection
  }

  // Get risk level from likelihood and consequence scores
  getRiskLevel(likelihood: number, consequence: number): string {
    const riskScore = likelihood * consequence
    if (riskScore >= RISK_THRESHOLDS.EXTREME) return 'EXTREME'
    if (riskScore >= RISK_THRESHOLDS.HIGH) return 'HIGH'
    if (riskScore >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM'
    return 'LOW'
  }

  // Create or update failure mode
  async upsertFailureMode(failureMode: FailureMode): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('failure_modes')
        .upsert({
          ...failureMode,
          updated_at: new Date().toISOString(),
          updated_by: 'SYSTEM' // In production, use actual user ID
        })
        .select()
        .single()

      if (error) throw error

      // Track history if scores changed
      if (failureMode.failure_mode_id) {
        await this.trackRiskScoreHistory(
          'FAILURE_MODE',
          failureMode.failure_mode_id,
          failureMode,
          'Manual update'
        )
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Error upserting failure mode:', error)
      return { success: false, error: error.message }
    }
  }

  // Create risk scenario
  async createRiskScenario(scenario: RiskScenario): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('risk_scenarios')
        .insert(scenario)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error creating risk scenario:', error)
      return { success: false, error: error.message }
    }
  }

  // Create risk review
  async createRiskReview(review: RiskReview): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('risk_reviews')
        .insert(review)
        .select()
        .single()

      if (error) throw error

      // If triggered by process event, create the link
      if (review.triggered_by === 'PROCESS_CHANGE' && review.trigger_reference) {
        await supabase
          .from('process_risk_triggers')
          .insert({
            process_event_id: review.trigger_reference,
            system_id: review.system_id,
            trigger_type: 'THRESHOLD_EXCEEDED',
            action_type: 'CREATE_REVIEW',
            review_created_id: data.review_id
          })
      }

      return { success: true, data }
    } catch (error: any) {
      console.error('Error creating risk review:', error)
      return { success: false, error: error.message }
    }
  }

  // Generate ES recommendations based on risk assessment
  async generateESRecommendations(
    failureModes: FailureMode[],
    existingStrategies: any[]
  ): Promise<RiskESRecommendation[]> {
    const recommendations: RiskESRecommendation[] = []

    for (const fm of failureModes) {
      // Find related equipment strategies
      const relatedStrategies = existingStrategies.filter(
        es => es.equipment_id === fm.equipment_id
      )

      for (const strategy of relatedStrategies) {
        // High RPN suggests increasing frequency
        const rpnScore = fm.severity_score * fm.occurrence_score * fm.detection_score
        if (rpnScore > RPN_THRESHOLD) {
          const currentFreq = strategy.frequency_value || 30
          const recommendedFreq = Math.max(7, Math.floor(currentFreq * 0.5)) // Reduce interval by 50%

          recommendations.push({
            source_type: 'FAILURE_MODE',
            source_id: fm.failure_mode_id!,
            strategy_id: strategy.strategy_id,
            recommendation_type: 'FREQUENCY_INCREASE',
            current_frequency_type: strategy.frequency_type,
            current_frequency_value: currentFreq,
            recommended_frequency_type: strategy.frequency_type,
            recommended_frequency_value: recommendedFreq,
            risk_level: 'HIGH',
            rpn_score: fm.severity_score * fm.occurrence_score * fm.detection_score,
            justification: `High RPN score (${fm.severity_score * fm.occurrence_score * fm.detection_score}) for failure mode: ${fm.failure_mode}. Increasing inspection frequency to improve detection.`
          })
        }

        // Safety or environmental impact requires immediate attention
        if (fm.safety_impact || fm.environmental_impact) {
          recommendations.push({
            source_type: 'FAILURE_MODE',
            source_id: fm.failure_mode_id!,
            strategy_id: strategy.strategy_id,
            recommendation_type: 'SCOPE_CHANGE',
            current_frequency_type: strategy.frequency_type,
            current_frequency_value: strategy.frequency_value,
            risk_level: 'CRITICAL',
            justification: `Failure mode has ${fm.safety_impact ? 'safety' : 'environmental'} impact. Additional inspection scope recommended.`
          })
        }
      }
    }

    return recommendations
  }

  // Process risk review and update scores
  async processRiskReview(
    reviewId: string,
    assessments: any[]
  ): Promise<{ success: boolean; recommendations: number; error?: string }> {
    try {
      const recommendations: RiskESRecommendation[] = []

      // Process each failure mode assessment
      for (const assessment of assessments) {
        // Update failure mode scores if changed
        if (assessment.score_changed) {
          await supabase
            .from('failure_modes')
            .update({
              severity_score: assessment.severity_score_new,
              occurrence_score: assessment.occurrence_score_new,
              detection_score: assessment.detection_score_new,
              updated_at: new Date().toISOString()
            })
            .eq('failure_mode_id', assessment.failure_mode_id)
        }

        // Generate ES recommendations if needed
        if (assessment.recommended_es_changes) {
          for (const change of assessment.recommended_es_changes) {
            recommendations.push({
              source_type: 'RISK_REVIEW',
              source_id: reviewId,
              ...change
            })
          }
        }
      }

      // Insert all recommendations
      if (recommendations.length > 0) {
        const { error } = await supabase
          .from('risk_es_recommendations')
          .insert(recommendations)

        if (error) throw error
      }

      return { success: true, recommendations: recommendations.length }
    } catch (error: any) {
      console.error('Error processing risk review:', error)
      return { success: false, recommendations: 0, error: error.message }
    }
  }

  // Get risk dashboard data
  async getRiskDashboard(systemId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let query = supabase
        .from('risk_dashboard_view')
        .select('*')
        .order('max_rpn_score', { ascending: false })

      if (systemId) {
        query = query.eq('system_id', systemId)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching risk dashboard:', error)
      return { success: false, error: error.message }
    }
  }

  // Get risk matrix data
  async getRiskMatrix(systemId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let query = supabase
        .from('risk_matrix_view')
        .select('*')

      if (systemId) {
        query = query.eq('system_id', systemId)
      }

      const { data, error } = await query

      if (error) throw error

      // Format data for matrix visualization
      const matrix = this.formatRiskMatrix(data || [])

      return { success: true, data: matrix }
    } catch (error: any) {
      console.error('Error fetching risk matrix:', error)
      return { success: false, error: error.message }
    }
  }

  // Format risk scenarios for matrix visualization
  private formatRiskMatrix(scenarios: any[]): any {
    const matrix: any = {
      cells: {},
      scenarios: []
    }

    // Initialize matrix cells (5x5)
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      for (let consequence = 1; consequence <= 5; consequence++) {
        const key = `${likelihood}-${consequence}`
        matrix.cells[key] = {
          likelihood,
          consequence,
          riskLevel: this.getRiskLevel(likelihood, consequence),
          scenarios: []
        }
      }
    }

    // Place scenarios in matrix
    scenarios.forEach(scenario => {
      const key = `${scenario.likelihood_score}-${scenario.consequence_score}`
      if (matrix.cells[key]) {
        matrix.cells[key].scenarios.push(scenario)
      }
      matrix.scenarios.push(scenario)
    })

    return matrix
  }

  // Track risk score history
  private async trackRiskScoreHistory(
    recordType: string,
    recordId: string,
    newScores: any,
    changeReason: string
  ): Promise<void> {
    try {
      // Get current scores
      const table = recordType === 'FAILURE_MODE' ? 'failure_modes' : 'risk_scenarios'
      const { data: current } = await supabase
        .from(table)
        .select('severity_score, occurrence_score, detection_score')
        .eq(recordType === 'FAILURE_MODE' ? 'failure_mode_id' : 'scenario_id', recordId)
        .single()

      if (current) {
        await supabase
          .from('risk_score_history')
          .insert({
            record_type: recordType,
            record_id: recordId,
            severity_score_old: current.severity_score,
            occurrence_score_old: current.occurrence_score,
            detection_score_old: current.detection_score,
            severity_score_new: newScores.severity_score,
            occurrence_score_new: newScores.occurrence_score,
            detection_score_new: newScores.detection_score,
            change_reason: changeReason,
            changed_by: 'SYSTEM' // In production, use actual user ID
          })
      }
    } catch (error) {
      console.error('Error tracking risk history:', error)
    }
  }

  // Check if process event should trigger risk review
  async checkProcessRiskTriggers(
    processEventId: string,
    systemId: string,
    severity: string
  ): Promise<{ shouldTriggerReview: boolean; reviewType?: string }> {
    try {
      // Check if system has high-risk scenarios
      const { data: scenarios } = await supabase
        .from('risk_scenarios')
        .select('risk_level')
        .eq('system_id', systemId)
        .eq('is_active', true)
        .in('risk_level', ['HIGH', 'EXTREME'])

      // Check recent failure modes with high RPN
      const { data: failureModes } = await supabase
        .from('failure_modes')
        .select('rpn_score')
        .eq('system_id', systemId)
        .eq('is_active', true)
        .gt('rpn_score', 100)

      // Trigger review if:
      // 1. System has high-risk scenarios and process severity is HIGH/CRITICAL
      // 2. System has multiple high RPN failure modes
      if (
        (scenarios && scenarios.length > 0 && ['HIGH', 'CRITICAL'].includes(severity)) ||
        (failureModes && failureModes.length >= 3)
      ) {
        return { shouldTriggerReview: true, reviewType: 'TRIGGERED' }
      }

      return { shouldTriggerReview: false }
    } catch (error) {
      console.error('Error checking process risk triggers:', error)
      return { shouldTriggerReview: false }
    }
  }
}