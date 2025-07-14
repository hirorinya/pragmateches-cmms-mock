/**
 * API Configuration Service
 * Validates and manages API configurations for the AI assistant system
 */

export interface ConfigStatus {
  openai_available: boolean
  supabase_available: boolean
  features_enabled: {
    text_to_sql: boolean
    pattern_matching: boolean
    database_queries: boolean
    enhanced_ai: boolean
  }
  operational_mode: 'full' | 'limited' | 'offline'
  config_errors: string[]
  recommendations: string[]
}

export interface APIHealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'unavailable'
  response_time?: number
  last_check: number
  error_message?: string
}

export class APIConfigService {
  private static instance: APIConfigService
  private configStatus: ConfigStatus | null = null
  private healthChecks: Map<string, APIHealthCheck> = new Map()
  private lastValidation: number = 0
  private readonly VALIDATION_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {
    if (APIConfigService.instance) {
      return APIConfigService.instance
    }
    APIConfigService.instance = this
  }

  /**
   * Validate all system configurations at startup
   */
  static async validateConfiguration(): Promise<ConfigStatus> {
    const service = new APIConfigService()
    return await service.performValidation()
  }

  /**
   * Get current operational mode
   */
  static getOperationalMode(): 'full' | 'limited' | 'offline' {
    const service = new APIConfigService()
    if (!service.configStatus) {
      // Synchronous fallback check
      const hasOpenAI = !!process.env.OPENAI_API_KEY
      const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      if (hasOpenAI && hasSupabase) return 'full'
      if (hasSupabase) return 'limited'
      return 'offline'
    }
    return service.configStatus.operational_mode
  }

  /**
   * Check if a specific feature is available
   */
  static isFeatureAvailable(feature: keyof ConfigStatus['features_enabled']): boolean {
    const service = new APIConfigService()
    if (!service.configStatus) {
      // Fallback checks
      switch (feature) {
        case 'text_to_sql':
          return !!process.env.OPENAI_API_KEY
        case 'pattern_matching':
          return true // Always available
        case 'database_queries':
          return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        case 'enhanced_ai':
          return !!process.env.OPENAI_API_KEY
        default:
          return false
      }
    }
    return service.configStatus.features_enabled[feature]
  }

  /**
   * Perform comprehensive configuration validation
   */
  private async performValidation(): Promise<ConfigStatus> {
    // Check if we have a recent validation
    if (this.configStatus && (Date.now() - this.lastValidation) < this.VALIDATION_CACHE_DURATION) {
      return this.configStatus
    }

    console.log('🔧 Starting API configuration validation...')
    
    const configErrors: string[] = []
    const recommendations: string[] = []
    
    // Check OpenAI configuration
    const openaiStatus = await this.validateOpenAI()
    if (!openaiStatus.available) {
      configErrors.push(...openaiStatus.errors)
      recommendations.push(...openaiStatus.recommendations)
    }
    
    // Check Supabase configuration
    const supabaseStatus = await this.validateSupabase()
    if (!supabaseStatus.available) {
      configErrors.push(...supabaseStatus.errors)
      recommendations.push(...supabaseStatus.recommendations)
    }
    
    // Determine operational mode
    const operationalMode = this.determineOperationalMode(openaiStatus.available, supabaseStatus.available)
    
    // Build configuration status
    this.configStatus = {
      openai_available: openaiStatus.available,
      supabase_available: supabaseStatus.available,
      features_enabled: {
        text_to_sql: openaiStatus.available,
        pattern_matching: true, // Always available
        database_queries: supabaseStatus.available,
        enhanced_ai: openaiStatus.available && supabaseStatus.available
      },
      operational_mode: operationalMode,
      config_errors: configErrors,
      recommendations: recommendations
    }
    
    this.lastValidation = Date.now()
    
    // Log configuration status
    this.logConfigurationStatus()
    
    return this.configStatus
  }

  /**
   * Validate OpenAI API configuration
   */
  private async validateOpenAI(): Promise<{available: boolean, errors: string[], recommendations: string[]}> {
    const errors: string[] = []
    const recommendations: string[] = []
    
    // Check environment variable
    if (!process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY environment variable is not set')
      recommendations.push('Set OPENAI_API_KEY in your environment variables')
      recommendations.push('Contact administrator for API key configuration')
      return { available: false, errors, recommendations }
    }
    
    // Validate API key format
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey.startsWith('sk-')) {
      errors.push('OPENAI_API_KEY does not appear to be valid (should start with sk-)')
      recommendations.push('Check that the API key is correctly formatted')
      return { available: false, errors, recommendations }
    }
    
    // Test API connectivity (optional - only in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const healthCheck = await this.performOpenAIHealthCheck()
        this.healthChecks.set('openai', healthCheck)
        
        if (healthCheck.status !== 'healthy') {
          errors.push(`OpenAI API health check failed: ${healthCheck.error_message}`)
          recommendations.push('Check OpenAI API key validity and account status')
          return { available: false, errors, recommendations }
        }
      } catch (error) {
        console.warn('OpenAI health check failed:', error)
        // Don't fail validation on health check failure in development
        recommendations.push('OpenAI health check failed - API may still work for actual requests')
      }
    }
    
    console.log('✅ OpenAI configuration validated successfully')
    return { available: true, errors, recommendations }
  }

  /**
   * Validate Supabase configuration
   */
  private async validateSupabase(): Promise<{available: boolean, errors: string[], recommendations: string[]}> {
    const errors: string[] = []
    const recommendations: string[] = []
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
      recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in your environment variables')
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set')
      recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables')
    }
    
    if (errors.length > 0) {
      recommendations.push('Contact administrator for Supabase configuration')
      return { available: false, errors, recommendations }
    }
    
    // Validate URL format
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL')
      recommendations.push('Check that the Supabase URL is correctly formatted')
      return { available: false, errors, recommendations }
    }
    
    // Test database connectivity (optional)
    try {
      const healthCheck = await this.performSupabaseHealthCheck()
      this.healthChecks.set('supabase', healthCheck)
      
      if (healthCheck.status === 'unavailable') {
        errors.push(`Supabase connection failed: ${healthCheck.error_message}`)
        recommendations.push('Check Supabase project status and network connectivity')
        return { available: false, errors, recommendations }
      }
      
      if (healthCheck.status === 'degraded') {
        recommendations.push('Supabase connection is slow - monitor performance')
      }
    } catch (error) {
      console.warn('Supabase health check failed:', error)
      // Don't fail validation on health check failure
      recommendations.push('Supabase health check failed - database may still be accessible')
    }
    
    console.log('✅ Supabase configuration validated successfully')
    return { available: true, errors, recommendations }
  }

  /**
   * Perform OpenAI API health check
   */
  private async performOpenAIHealthCheck(): Promise<APIHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simple health check - just test the API endpoint
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return {
          service: 'openai',
          status: responseTime > 2000 ? 'degraded' : 'healthy',
          response_time: responseTime,
          last_check: Date.now()
        }
      } else {
        const errorText = await response.text()
        return {
          service: 'openai',
          status: 'unavailable',
          response_time: responseTime,
          last_check: Date.now(),
          error_message: `HTTP ${response.status}: ${errorText}`
        }
      }
    } catch (error: any) {
      return {
        service: 'openai',
        status: 'unavailable',
        response_time: Date.now() - startTime,
        last_check: Date.now(),
        error_message: error.message
      }
    }
  }

  /**
   * Perform Supabase health check
   */
  private async performSupabaseHealthCheck(): Promise<APIHealthCheck> {
    const startTime = Date.now()
    
    try {
      // Import supabase client dynamically to avoid issues during validation
      const { supabase } = await import('@/lib/supabase')
      
      // Simple query to test connectivity
      const { data, error } = await supabase
        .from('equipment')
        .select('equipment_id')
        .limit(1)
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        return {
          service: 'supabase',
          status: 'unavailable',
          response_time: responseTime,
          last_check: Date.now(),
          error_message: error.message
        }
      }
      
      return {
        service: 'supabase',
        status: responseTime > 1000 ? 'degraded' : 'healthy',
        response_time: responseTime,
        last_check: Date.now()
      }
    } catch (error: any) {
      return {
        service: 'supabase',
        status: 'unavailable',
        response_time: Date.now() - startTime,
        last_check: Date.now(),
        error_message: error.message
      }
    }
  }

  /**
   * Determine operational mode based on available services
   */
  private determineOperationalMode(openaiAvailable: boolean, supabaseAvailable: boolean): 'full' | 'limited' | 'offline' {
    if (openaiAvailable && supabaseAvailable) {
      return 'full'
    } else if (supabaseAvailable) {
      return 'limited'
    } else {
      return 'offline'
    }
  }

  /**
   * Log configuration status for monitoring
   */
  private logConfigurationStatus(): void {
    const status = this.configStatus!
    
    console.log('🔧 System Configuration Status:')
    console.log('  OpenAI:', status.openai_available ? '✅ Available' : '❌ Unavailable')
    console.log('  Supabase:', status.supabase_available ? '✅ Available' : '❌ Unavailable')
    console.log('  Operational Mode:', status.operational_mode.toUpperCase())
    console.log('  Features:')
    Object.entries(status.features_enabled).forEach(([feature, enabled]) => {
      console.log(`    ${feature}: ${enabled ? '✅' : '❌'}`)
    })
    
    if (status.config_errors.length > 0) {
      console.error('⚠️ Configuration Errors:')
      status.config_errors.forEach(error => console.error(`  - ${error}`))
    }
    
    if (status.recommendations.length > 0) {
      console.warn('💡 Recommendations:')
      status.recommendations.forEach(rec => console.warn(`  - ${rec}`))
    }
  }

  /**
   * Get health status for monitoring dashboard
   */
  static getHealthStatus(): {overall: string, services: APIHealthCheck[]} {
    const service = new APIConfigService()
    const services = Array.from(service.healthChecks.values())
    
    let overall = 'healthy'
    if (services.some(s => s.status === 'unavailable')) {
      overall = 'degraded'
    }
    if (services.every(s => s.status === 'unavailable')) {
      overall = 'unavailable'
    }
    
    return { overall, services }
  }

  /**
   * Refresh configuration validation
   */
  static async refreshConfiguration(): Promise<ConfigStatus> {
    const service = new APIConfigService()
    service.lastValidation = 0 // Force refresh
    return await service.performValidation()
  }
}

// Export singleton instance
export const apiConfigService = new APIConfigService()