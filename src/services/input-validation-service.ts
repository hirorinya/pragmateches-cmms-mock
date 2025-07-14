/**
 * Input Validation and Sanitization Service
 * Comprehensive security and data integrity validation for CMMS queries
 */

interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'email' | 'url' | 'equipment_id' | 'date' | 'sql' | 'json'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  allowedValues?: any[]
  customValidator?: (value: any) => boolean | string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedData: any
  securityFlags: string[]
}

interface SecurityPattern {
  name: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export class InputValidationService {
  private static instance: InputValidationService
  
  // Security patterns for detecting malicious input
  private securityPatterns: SecurityPattern[] = [
    {
      name: 'SQL_INJECTION',
      pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b|--|\/\*|\*\/|;|\||&)/gi,
      severity: 'critical',
      description: 'Potential SQL injection attempt'
    },
    {
      name: 'XSS_SCRIPT',
      pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      severity: 'high',
      description: 'Cross-site scripting attempt'
    },
    {
      name: 'XSS_ATTRIBUTES',
      pattern: /\bon\w+\s*=|javascript:|data:text\/html/gi,
      severity: 'high',
      description: 'XSS via attributes or javascript protocol'
    },
    {
      name: 'PATH_TRAVERSAL',
      pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/gi,
      severity: 'high',
      description: 'Path traversal attempt'
    },
    {
      name: 'COMMAND_INJECTION',
      pattern: /[;&|`${}()]/g,
      severity: 'high',
      description: 'Command injection attempt'
    },
    {
      name: 'LDAP_INJECTION',
      pattern: /[()\\*\x00]/g,
      severity: 'medium',
      description: 'LDAP injection attempt'
    },
    {
      name: 'SUSPICIOUS_KEYWORDS',
      pattern: /\b(eval|exec|system|shell|cmd|powershell|bash)\b/gi,
      severity: 'medium',
      description: 'Suspicious system keywords'
    }
  ]

  // Common validation rules for CMMS fields
  private cmmsValidationRules: Map<string, ValidationRule[]> = new Map([
    ['query', [
      {
        field: 'query',
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 1000,
        pattern: /^[a-zA-Z0-9\s\-_.,?!()\/\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/
      }
    ]],
    ['equipment_id', [
      {
        field: 'equipment_id',
        type: 'equipment_id',
        required: true,
        pattern: /^[A-Z]{2,3}-\d{2,4}$/,
        maxLength: 10
      }
    ]],
    ['user_input', [
      {
        field: 'prompt',
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 2000
      },
      {
        field: 'type',
        type: 'string',
        required: true,
        allowedValues: ['cmms_query', 'graph', 'insights', 'text_to_sql', 'data_requirements']
      }
    ]],
    ['api_request', [
      {
        field: 'timestamp',
        type: 'date',
        required: false
      },
      {
        field: 'user_id',
        type: 'string',
        pattern: /^[a-zA-Z0-9_-]+$/,
        maxLength: 50
      }
    ]]
  ])

  constructor() {
    if (InputValidationService.instance) {
      return InputValidationService.instance
    }
    InputValidationService.instance = this
  }

  /**
   * Validate and sanitize input data
   */
  validateInput(
    data: any,
    ruleSetName: string,
    customRules: ValidationRule[] = []
  ): ValidationResult {
    const rules = [
      ...(this.cmmsValidationRules.get(ruleSetName) || []),
      ...customRules
    ]

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      sanitizedData: {},
      securityFlags: []
    }

    // Security scan first
    this.performSecurityScan(data, result)

    // Apply validation rules
    for (const rule of rules) {
      const fieldValue = this.getFieldValue(data, rule.field)
      const fieldResult = this.validateField(fieldValue, rule)
      
      if (!fieldResult.isValid) {
        result.isValid = false
        result.errors.push(...fieldResult.errors)
      }
      
      result.warnings.push(...fieldResult.warnings)
      
      // Store sanitized value
      this.setFieldValue(result.sanitizedData, rule.field, fieldResult.sanitizedValue)
    }

    // Copy non-validated fields (with basic sanitization)
    for (const [key, value] of Object.entries(data)) {
      if (!rules.some(rule => rule.field === key)) {
        result.sanitizedData[key] = this.basicSanitize(value)
      }
    }

    return result
  }

  /**
   * Validate CMMS query specifically
   */
  validateCMMSQuery(query: string): ValidationResult {
    const data = { query }
    const result = this.validateInput(data, 'query')
    
    // Additional CMMS-specific validations
    this.validateCMMSQueryContent(query, result)
    
    return result
  }

  /**
   * Validate API request body
   */
  validateAPIRequest(requestBody: any): ValidationResult {
    const result = this.validateInput(requestBody, 'user_input')
    
    // Additional API-specific validations
    if (requestBody.data && typeof requestBody.data === 'object') {
      try {
        JSON.stringify(requestBody.data)
      } catch (error) {
        result.isValid = false
        result.errors.push('Invalid JSON data structure')
      }
    }
    
    return result
  }

  /**
   * Sanitize SQL query for safe execution
   */
  sanitizeSQLQuery(query: string): {
    sanitized: string
    isSecure: boolean
    warnings: string[]
  } {
    const warnings: string[] = []
    let sanitized = query.trim()
    
    // Check for dangerous SQL operations
    const dangerousPatterns = [
      /\b(drop|create|alter|insert|update|delete)\b/gi,
      /\b(exec|execute|sp_|xp_)\b/gi,
      /--|\*\/|\/\*/g,
      /;\s*(drop|create|alter|insert|update|delete)/gi
    ]
    
    let isSecure = true
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        isSecure = false
        warnings.push(`Potentially dangerous SQL pattern detected: ${pattern.source}`)
      }
    }
    
    // Only allow SELECT statements
    if (!sanitized.toLowerCase().trim().startsWith('select')) {
      isSecure = false
      warnings.push('Only SELECT statements are allowed')
      sanitized = '-- Query blocked: Only SELECT statements allowed'
    }
    
    // Remove dangerous characters
    sanitized = sanitized
      .replace(/[\\;]/g, '') // Remove semicolons and backslashes
      .replace(/--.*$/gm, '') // Remove SQL comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    
    return { sanitized, isSecure, warnings }
  }

  /**
   * Validate equipment ID format
   */
  validateEquipmentId(equipmentId: string): boolean {
    const pattern = /^[A-Z]{2,3}-\d{2,4}$/
    return pattern.test(equipmentId)
  }

  /**
   * Sanitize user input for display
   */
  sanitizeForDisplay(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
  }

  /**
   * Check for rate limiting abuse patterns
   */
  detectAbusePatterns(
    requests: Array<{ timestamp: number; query: string; ip?: string }>
  ): {
    isAbusive: boolean
    patterns: string[]
    recommendations: string[]
  } {
    const patterns: string[] = []
    const recommendations: string[] = []
    
    // Check for rapid repeated requests
    const recentRequests = requests.filter(r => 
      Date.now() - r.timestamp < 60000 // Last minute
    )
    
    if (recentRequests.length > 50) {
      patterns.push('High request frequency detected')
      recommendations.push('Apply stricter rate limiting')
    }
    
    // Check for identical queries
    const queryGroups = new Map<string, number>()
    recentRequests.forEach(r => {
      const count = queryGroups.get(r.query) || 0
      queryGroups.set(r.query, count + 1)
    })
    
    for (const [query, count] of queryGroups.entries()) {
      if (count > 10) {
        patterns.push(`Repeated identical query: ${query.substring(0, 50)}...`)
        recommendations.push('Implement query deduplication')
      }
    }
    
    // Check for unusual query patterns
    const suspiciousQueries = recentRequests.filter(r => 
      this.securityPatterns.some(p => p.pattern.test(r.query))
    )
    
    if (suspiciousQueries.length > 3) {
      patterns.push('Multiple suspicious queries detected')
      recommendations.push('Block client temporarily')
    }
    
    return {
      isAbusive: patterns.length > 0,
      patterns,
      recommendations
    }
  }

  /**
   * Private helper methods
   */
  private performSecurityScan(data: any, result: ValidationResult): void {
    const scanText = JSON.stringify(data)
    
    for (const securityPattern of this.securityPatterns) {
      if (securityPattern.pattern.test(scanText)) {
        result.securityFlags.push(securityPattern.name)
        
        if (securityPattern.severity === 'critical' || securityPattern.severity === 'high') {
          result.isValid = false
          result.errors.push(`Security violation: ${securityPattern.description}`)
        } else {
          result.warnings.push(`Security warning: ${securityPattern.description}`)
        }
      }
    }
  }

  private validateField(value: any, rule: ValidationRule): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    sanitizedValue: any
  } {
    const errors: string[] = []
    const warnings: string[] = []
    let sanitizedValue = value

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        isValid: false,
        errors: [`${rule.field} is required`],
        warnings: [],
        sanitizedValue: null
      }
    }

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedValue: null
      }
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        sanitizedValue = this.validateString(value, rule, errors, warnings)
        break
      case 'number':
        sanitizedValue = this.validateNumber(value, rule, errors, warnings)
        break
      case 'equipment_id':
        sanitizedValue = this.validateEquipmentIdField(value, rule, errors, warnings)
        break
      case 'date':
        sanitizedValue = this.validateDate(value, rule, errors, warnings)
        break
      case 'email':
        sanitizedValue = this.validateEmail(value, rule, errors, warnings)
        break
      case 'url':
        sanitizedValue = this.validateURL(value, rule, errors, warnings)
        break
      default:
        sanitizedValue = this.basicSanitize(value)
    }

    // Custom validator
    if (rule.customValidator && sanitizedValue !== null) {
      const customResult = rule.customValidator(sanitizedValue)
      if (typeof customResult === 'string') {
        errors.push(customResult)
      } else if (!customResult) {
        errors.push(`${rule.field} failed custom validation`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue
    }
  }

  private validateString(value: any, rule: ValidationRule, errors: string[], warnings: string[]): string {
    const strValue = String(value).trim()
    
    if (rule.minLength && strValue.length < rule.minLength) {
      errors.push(`${rule.field} must be at least ${rule.minLength} characters`)
    }
    
    if (rule.maxLength && strValue.length > rule.maxLength) {
      errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`)
      return strValue.substring(0, rule.maxLength)
    }
    
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(`${rule.field} format is invalid`)
    }
    
    if (rule.allowedValues && !rule.allowedValues.includes(strValue)) {
      errors.push(`${rule.field} must be one of: ${rule.allowedValues.join(', ')}`)
    }
    
    return this.sanitizeForDisplay(strValue)
  }

  private validateNumber(value: any, rule: ValidationRule, errors: string[], warnings: string[]): number | null {
    const numValue = Number(value)
    
    if (isNaN(numValue)) {
      errors.push(`${rule.field} must be a valid number`)
      return null
    }
    
    if (rule.min !== undefined && numValue < rule.min) {
      errors.push(`${rule.field} must be at least ${rule.min}`)
    }
    
    if (rule.max !== undefined && numValue > rule.max) {
      errors.push(`${rule.field} must not exceed ${rule.max}`)
    }
    
    return numValue
  }

  private validateEquipmentIdField(value: any, rule: ValidationRule, errors: string[], warnings: string[]): string {
    const strValue = String(value).trim().toUpperCase()
    
    if (!this.validateEquipmentId(strValue)) {
      errors.push(`${rule.field} must follow format XX-000 or XXX-0000`)
    }
    
    return strValue
  }

  private validateDate(value: any, rule: ValidationRule, errors: string[], warnings: string[]): Date | null {
    const date = new Date(value)
    
    if (isNaN(date.getTime())) {
      errors.push(`${rule.field} must be a valid date`)
      return null
    }
    
    return date
  }

  private validateEmail(value: any, rule: ValidationRule, errors: string[], warnings: string[]): string {
    const strValue = String(value).trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailPattern.test(strValue)) {
      errors.push(`${rule.field} must be a valid email address`)
    }
    
    return strValue
  }

  private validateURL(value: any, rule: ValidationRule, errors: string[], warnings: string[]): string {
    const strValue = String(value).trim()
    
    try {
      new URL(strValue)
    } catch {
      errors.push(`${rule.field} must be a valid URL`)
    }
    
    return strValue
  }

  private validateCMMSQueryContent(query: string, result: ValidationResult): void {
    // Check for equipment ID patterns
    const equipmentIds = query.match(/[A-Z]{2,3}-\d{2,4}/g) || []
    
    for (const id of equipmentIds) {
      if (!this.validateEquipmentId(id)) {
        result.warnings.push(`Potentially invalid equipment ID: ${id}`)
      }
    }
    
    // Check query complexity
    if (query.length > 500) {
      result.warnings.push('Very long query detected - consider breaking into smaller queries')
    }
    
    // Check for overly broad queries
    const broadPatterns = [
      /\ball\s+equipment/i,
      /\bevery\s+/i,
      /\s+\*\s+/
    ]
    
    for (const pattern of broadPatterns) {
      if (pattern.test(query)) {
        result.warnings.push('Broad query detected - may return large result set')
        break
      }
    }
  }

  private basicSanitize(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeForDisplay(value)
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.basicSanitize(item))
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {}
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.basicSanitize(val)
      }
      return sanitized
    }
    
    return value
  }

  private getFieldValue(data: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let current = data
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part]
      } else {
        return undefined
      }
    }
    
    return current
  }

  private setFieldValue(data: any, fieldPath: string, value: any): void {
    const parts = fieldPath.split('.')
    let current = data
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {}
      }
      current = current[part]
    }
    
    current[parts[parts.length - 1]] = value
  }

  /**
   * Update validation rules
   */
  updateValidationRules(ruleSetName: string, rules: ValidationRule[]): void {
    this.cmmsValidationRules.set(ruleSetName, rules)
    console.log(`Validation rules updated for ${ruleSetName}`)
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalRuleSets: number
    securityPatterns: number
    ruleSetNames: string[]
  } {
    return {
      totalRuleSets: this.cmmsValidationRules.size,
      securityPatterns: this.securityPatterns.length,
      ruleSetNames: Array.from(this.cmmsValidationRules.keys())
    }
  }
}

// Export singleton instance
export const inputValidationService = new InputValidationService()