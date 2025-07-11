/**
 * Query Validation Service for Text-to-SQL
 * Ensures SQL safety, correctness, and performance following Google Cloud best practices
 */

import { supabase } from '@/lib/supabase'
import { schemaContextService } from './schema-context-service'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
  rewrittenQuery?: string
  estimatedCost?: number
  executionPlan?: any
}

export interface ValidationError {
  type: 'syntax' | 'security' | 'permission' | 'logic' | 'performance'
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  line?: number
  column?: number
  suggestion?: string
}

export interface ValidationWarning {
  type: 'performance' | 'best_practice' | 'readability' | 'maintainability'
  message: string
  suggestion?: string
}

export interface QueryRewriteRule {
  pattern: RegExp
  replacement: string
  description: string
  category: 'security' | 'performance' | 'correctness'
}

export class QueryValidationService {
  private rewriteRules: QueryRewriteRule[] = []
  private allowedTables: Set<string> = new Set()
  private allowedColumns: Map<string, Set<string>> = new Map()
  private dangerousPatterns: RegExp[] = []

  constructor() {
    this.initializeRules()
    this.initializeSchema()
  }

  private initializeRules() {
    this.rewriteRules = [
      // Security rules
      {
        pattern: /DROP\s+TABLE/gi,
        replacement: '',
        description: 'Remove DROP TABLE statements',
        category: 'security'
      },
      {
        pattern: /DELETE\s+FROM/gi,
        replacement: '',
        description: 'Remove DELETE statements',
        category: 'security'
      },
      {
        pattern: /INSERT\s+INTO/gi,
        replacement: '',
        description: 'Remove INSERT statements',
        category: 'security'
      },
      {
        pattern: /UPDATE\s+SET/gi,
        replacement: '',
        description: 'Remove UPDATE statements',
        category: 'security'
      },
      {
        pattern: /ALTER\s+TABLE/gi,
        replacement: '',
        description: 'Remove ALTER TABLE statements',
        category: 'security'
      },
      {
        pattern: /CREATE\s+TABLE/gi,
        replacement: '',
        description: 'Remove CREATE TABLE statements',
        category: 'security'
      },
      
      // Performance rules
      {
        pattern: /SELECT\s+\*\s+FROM/gi,
        replacement: 'SELECT /* specify columns */ FROM',
        description: 'Avoid SELECT * for better performance',
        category: 'performance'
      },
      {
        pattern: /LIKE\s+'%([^%]+)%'/gi,
        replacement: "LIKE '$1%'",
        description: 'Prefer prefix matching over full wildcard',
        category: 'performance'
      },
      
      // Correctness rules
      {
        pattern: /\bequipment_id\b/gi,
        replacement: '設備ID',
        description: 'Use correct Japanese column name',
        category: 'correctness'
      },
      {
        pattern: /\bequipment_name\b/gi,
        replacement: '設備名',
        description: 'Use correct Japanese column name',
        category: 'correctness'
      },
      {
        pattern: /\bmaintenance_date\b/gi,
        replacement: '実施日',
        description: 'Use correct Japanese column name',
        category: 'correctness'
      }
    ]

    this.dangerousPatterns = [
      /;\s*DROP/gi,
      /;\s*DELETE/gi,
      /;\s*INSERT/gi,
      /;\s*UPDATE/gi,
      /;\s*ALTER/gi,
      /;\s*CREATE/gi,
      /UNION\s+SELECT/gi,
      /\/\*.*\*\//gi,  // Block comments
      /--.*$/gm,       // Line comments
      /\bEXEC\b/gi,
      /\bEXECUTE\b/gi,
      /\bsp_/gi,       // Stored procedures
      /\bxp_/gi,       // Extended procedures
      /\bSHUTDOWN\b/gi,
      /\bWAITFOR\b/gi
    ]
  }

  private async initializeSchema() {
    const context = await schemaContextService.getSchemaContext()
    
    // Initialize allowed tables
    this.allowedTables = new Set(context.tables.map(t => t.table_name))
    
    // Initialize allowed columns for each table
    context.tables.forEach(table => {
      const columns = new Set(table.columns.map(c => c.column_name))
      this.allowedColumns.set(table.table_name, columns)
    })
  }

  /**
   * Main validation function
   */
  async validateQuery(sql: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // Step 1: Basic syntax validation
    await this.validateSyntax(sql, result)

    // Step 2: Security validation
    await this.validateSecurity(sql, result)

    // Step 3: Schema validation
    await this.validateSchema(sql, result)

    // Step 4: Performance validation
    await this.validatePerformance(sql, result)

    // Step 5: Query rewriting if needed
    if (result.errors.length === 0) {
      const rewrittenQuery = await this.rewriteQuery(sql)
      if (rewrittenQuery !== sql) {
        result.rewrittenQuery = rewrittenQuery
        result.suggestions.push('Query was automatically optimized')
      }
    }

    // Step 6: Dry run execution
    if (result.errors.length === 0) {
      await this.dryRunValidation(result.rewrittenQuery || sql, result)
    }

    // Final validation result
    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Validate SQL syntax
   */
  private async validateSyntax(sql: string, result: ValidationResult): Promise<void> {
    // Basic syntax checks
    const parenthesesCount = (sql.match(/\(/g) || []).length - (sql.match(/\)/g) || []).length
    if (parenthesesCount !== 0) {
      result.errors.push({
        type: 'syntax',
        message: 'Unmatched parentheses in SQL query',
        severity: 'critical',
        suggestion: 'Check for missing opening or closing parentheses'
      })
    }

    // Check for incomplete statements
    if (sql.trim().endsWith(',')) {
      result.errors.push({
        type: 'syntax',
        message: 'SQL query ends with comma',
        severity: 'high',
        suggestion: 'Remove trailing comma or complete the statement'
      })
    }

    // Check for required keywords
    if (!sql.toUpperCase().includes('SELECT')) {
      result.errors.push({
        type: 'syntax',
        message: 'Query must contain SELECT statement',
        severity: 'critical',
        suggestion: 'Add SELECT clause to query'
      })
    }

    // Check for proper FROM clause
    if (sql.toUpperCase().includes('SELECT') && !sql.toUpperCase().includes('FROM')) {
      result.errors.push({
        type: 'syntax',
        message: 'SELECT statement missing FROM clause',
        severity: 'high',
        suggestion: 'Add FROM clause to specify table'
      })
    }
  }

  /**
   * Validate security aspects
   */
  private async validateSecurity(sql: string, result: ValidationResult): Promise<void> {
    // Check for dangerous patterns
    this.dangerousPatterns.forEach(pattern => {
      if (pattern.test(sql)) {
        result.errors.push({
          type: 'security',
          message: `Dangerous SQL pattern detected: ${pattern.source}`,
          severity: 'critical',
          suggestion: 'Remove dangerous SQL operations'
        })
      }
    })

    // Check for SQL injection patterns
    const injectionPatterns = [
      /'\s*OR\s*'1'\s*=\s*'1/gi,
      /'\s*OR\s*1\s*=\s*1/gi,
      /'\s*UNION\s*SELECT/gi,
      /'\s*;\s*DROP/gi
    ]

    injectionPatterns.forEach(pattern => {
      if (pattern.test(sql)) {
        result.errors.push({
          type: 'security',
          message: 'Potential SQL injection pattern detected',
          severity: 'critical',
          suggestion: 'Use parameterized queries instead'
        })
      }
    })

    // Check for only SELECT operations
    const allowedOperations = ['SELECT', 'WITH']
    const sqlUpper = sql.toUpperCase()
    const operations = sqlUpper.match(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/g) || []
    
    const disallowedOps = operations.filter(op => !allowedOperations.includes(op))
    if (disallowedOps.length > 0) {
      result.errors.push({
        type: 'security',
        message: `Only SELECT queries are allowed. Found: ${disallowedOps.join(', ')}`,
        severity: 'critical',
        suggestion: 'Use only SELECT statements for data retrieval'
      })
    }
  }

  /**
   * Validate schema references
   */
  private async validateSchema(sql: string, result: ValidationResult): Promise<void> {
    // Extract table references
    const tableMatches = sql.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi) || []
    const tables = tableMatches.map(match => {
      const tableName = match.replace(/FROM\s+|JOIN\s+/gi, '').trim()
      return tableName
    })

    // Check if tables exist
    tables.forEach(table => {
      if (!this.allowedTables.has(table)) {
        result.errors.push({
          type: 'logic',
          message: `Table '${table}' does not exist in schema`,
          severity: 'critical',
          suggestion: `Available tables: ${Array.from(this.allowedTables).join(', ')}`
        })
      }
    })

    // Extract column references (simplified)
    const columnMatches = sql.match(/\b\w+\.\w+\b/g) || []
    columnMatches.forEach(match => {
      const [table, column] = match.split('.')
      if (this.allowedTables.has(table)) {
        const allowedColumns = this.allowedColumns.get(table)
        if (allowedColumns && !allowedColumns.has(column)) {
          result.warnings.push({
            type: 'best_practice',
            message: `Column '${column}' might not exist in table '${table}'`,
            suggestion: `Check column name spelling`
          })
        }
      }
    })
  }

  /**
   * Validate performance aspects
   */
  private async validatePerformance(sql: string, result: ValidationResult): Promise<void> {
    // Check for SELECT *
    if (sql.toUpperCase().includes('SELECT *')) {
      result.warnings.push({
        type: 'performance',
        message: 'SELECT * can impact performance',
        suggestion: 'Specify only required columns'
      })
    }

    // Check for missing ORDER BY with LIMIT
    if (sql.toUpperCase().includes('LIMIT') && !sql.toUpperCase().includes('ORDER BY')) {
      result.warnings.push({
        type: 'performance',
        message: 'LIMIT without ORDER BY may return inconsistent results',
        suggestion: 'Add ORDER BY clause for consistent results'
      })
    }

    // Check for complex WHERE clauses
    const whereClause = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i)?.[1]
    if (whereClause) {
      const orCount = (whereClause.match(/\bOR\b/gi) || []).length
      if (orCount > 3) {
        result.warnings.push({
          type: 'performance',
          message: 'Complex WHERE clause with many OR conditions may be slow',
          suggestion: 'Consider using UNION or restructuring the query'
        })
      }
    }

    // Check for cartesian products
    const fromClause = sql.match(/FROM\s+(.+?)(?:\s+WHERE|\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i)?.[1]
    if (fromClause) {
      const commaJoins = (fromClause.match(/,/g) || []).length
      const explicitJoins = (fromClause.match(/\bJOIN\b/gi) || []).length
      
      if (commaJoins > 0 && explicitJoins === 0) {
        result.warnings.push({
          type: 'performance',
          message: 'Comma-separated tables without JOIN conditions may create cartesian product',
          suggestion: 'Use explicit JOIN clauses with proper conditions'
        })
      }
    }
  }

  /**
   * Rewrite query for optimization
   */
  private async rewriteQuery(sql: string): Promise<string> {
    let rewritten = sql

    // Apply rewrite rules
    this.rewriteRules.forEach(rule => {
      if (rule.pattern.test(rewritten)) {
        rewritten = rewritten.replace(rule.pattern, rule.replacement)
      }
    })

    // Add common optimizations
    rewritten = this.addCommonOptimizations(rewritten)

    return rewritten
  }

  /**
   * Add common query optimizations
   */
  private addCommonOptimizations(sql: string): string {
    let optimized = sql

    // Add LIMIT if not present and no aggregation
    if (!sql.toUpperCase().includes('LIMIT') && 
        !sql.toUpperCase().includes('GROUP BY') && 
        !sql.toUpperCase().includes('COUNT') &&
        !sql.toUpperCase().includes('SUM') &&
        !sql.toUpperCase().includes('AVG')) {
      optimized += ' LIMIT 100'
    }

    // Ensure proper ordering for pagination
    if (optimized.toUpperCase().includes('LIMIT') && !optimized.toUpperCase().includes('ORDER BY')) {
      // Add a default ordering
      if (optimized.toUpperCase().includes('設備ID') || optimized.toUpperCase().includes('EQUIPMENT')) {
        optimized = optimized.replace(/\s+LIMIT/i, ' ORDER BY 設備ID LIMIT')
      } else if (optimized.toUpperCase().includes('実施日') || optimized.toUpperCase().includes('DATE')) {
        optimized = optimized.replace(/\s+LIMIT/i, ' ORDER BY 実施日 DESC LIMIT')
      }
    }

    return optimized
  }

  /**
   * Perform dry run validation
   */
  private async dryRunValidation(sql: string, result: ValidationResult): Promise<void> {
    try {
      // Use EXPLAIN to analyze query without executing
      const explainQuery = `EXPLAIN (FORMAT JSON) ${sql}`
      
      const { data, error } = await supabase.rpc('explain_query', {
        query_text: explainQuery
      }).single()

      if (error) {
        result.errors.push({
          type: 'logic',
          message: `Query validation failed: ${error.message}`,
          severity: 'high',
          suggestion: 'Check query syntax and table references'
        })
      } else {
        result.executionPlan = data
        
        // Analyze execution plan for warnings
        if (data && typeof data === 'object') {
          this.analyzeExecutionPlan(data, result)
        }
      }
    } catch (error) {
      // Fallback: try to execute with LIMIT 0
      try {
        const testQuery = `${sql} LIMIT 0`
        const { error: testError } = await supabase.rpc('validate_query', {
          query_text: testQuery
        })

        if (testError) {
          result.errors.push({
            type: 'logic',
            message: `Query validation failed: ${testError.message}`,
            severity: 'high',
            suggestion: 'Check query syntax and table references'
          })
        }
      } catch (fallbackError) {
        result.warnings.push({
          type: 'best_practice',
          message: 'Unable to validate query execution plan',
          suggestion: 'Query may still be valid but could not be pre-validated'
        })
      }
    }
  }

  /**
   * Analyze execution plan for performance issues
   */
  private analyzeExecutionPlan(plan: any, result: ValidationResult): void {
    // This is a simplified analysis - in a real implementation,
    // you would parse the PostgreSQL execution plan JSON
    
    const planStr = JSON.stringify(plan).toLowerCase()
    
    // Check for sequential scans
    if (planStr.includes('seq scan')) {
      result.warnings.push({
        type: 'performance',
        message: 'Query uses sequential scan which may be slow for large tables',
        suggestion: 'Consider adding appropriate indexes or refining WHERE conditions'
      })
    }
    
    // Check for nested loop joins
    if (planStr.includes('nested loop')) {
      result.warnings.push({
        type: 'performance',
        message: 'Query uses nested loop join which may be slow',
        suggestion: 'Consider adding indexes on join columns'
      })
    }
    
    // Estimate cost if available
    if (plan.cost) {
      result.estimatedCost = plan.cost
      if (plan.cost > 1000) {
        result.warnings.push({
          type: 'performance',
          message: 'Query has high estimated cost',
          suggestion: 'Consider optimizing the query or adding indexes'
        })
      }
    }
  }

  /**
   * Validate specific query patterns
   */
  validateQueryPattern(sql: string, expectedPattern: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // Pattern-specific validation logic
    switch (expectedPattern) {
      case 'equipment_info':
        if (!sql.toUpperCase().includes('設備ID') && !sql.toUpperCase().includes('EQUIPMENT_ID')) {
          result.warnings.push({
            type: 'best_practice',
            message: 'Equipment info query should include equipment ID',
            suggestion: 'Add equipment ID to SELECT clause'
          })
        }
        break
      
      case 'maintenance_history':
        if (!sql.toUpperCase().includes('実施日') && !sql.toUpperCase().includes('DATE')) {
          result.warnings.push({
            type: 'best_practice',
            message: 'Maintenance history query should include date information',
            suggestion: 'Add date columns to SELECT clause'
          })
        }
        break
      
      case 'risk_analysis':
        if (!sql.toUpperCase().includes('リスクスコア') && !sql.toUpperCase().includes('RISK_SCORE')) {
          result.warnings.push({
            type: 'best_practice',
            message: 'Risk analysis query should include risk score',
            suggestion: 'Add risk score to SELECT clause'
          })
        }
        break
    }

    return result
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    rulesCount: number
    allowedTables: number
    dangerousPatterns: number
  } {
    return {
      rulesCount: this.rewriteRules.length,
      allowedTables: this.allowedTables.size,
      dangerousPatterns: this.dangerousPatterns.length
    }
  }
}

// Export singleton instance
export const queryValidationService = new QueryValidationService()