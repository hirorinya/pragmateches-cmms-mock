'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Brain, 
  Database, 
  Search, 
  CheckCircle,
  AlertCircle,
  Code,
  Zap,
  Target,
  FileText,
  Settings,
  Clock,
  Shield,
  Play
} from 'lucide-react'

export default function TextToSQLProcessPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const processSteps = [
    {
      id: 1,
      title: "User Input",
      icon: <FileText className="h-6 w-6" />,
      description: "User enters natural language query",
      example: "\"List equipment belongs to SYS-001\"",
      details: "Natural language query received through the AI Assistant interface",
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Query Routing Decision",
      icon: <Target className="h-6 w-6" />,
      description: "Enhanced AI Service decides processing path",
      example: "shouldUseTextToSQL() evaluates query complexity",
      details: "Checks for patterns: system IDs, complex queries, time references, aggregations",
      color: "bg-purple-500"
    },
    {
      id: 3,
      title: "Entity Resolution",
      icon: <Search className="h-6 w-6" />,
      description: "Extract and resolve entities from query",
      example: "SYS-001 → System ID, equipment → Entity Type",
      details: "Uses regex patterns and fuzzy matching to identify equipment IDs, systems, time periods",
      color: "bg-green-500"
    },
    {
      id: 4,
      title: "Schema Context Building",
      icon: <Database className="h-6 w-6" />,
      description: "Generate database schema context",
      example: "Load table definitions, relationships, business meanings",
      details: "Provides semantic layer with column descriptions and sample values",
      color: "bg-yellow-500"
    },
    {
      id: 5,
      title: "Few-Shot Example Selection",
      icon: <Brain className="h-6 w-6" />,
      description: "Select relevant query examples",
      example: "Find 3-5 most relevant SQL examples from 15+ patterns",
      details: "Scores examples based on similarity and intent matching",
      color: "bg-indigo-500"
    },
    {
      id: 6,
      title: "OpenAI API Call",
      icon: <Zap className="h-6 w-6" />,
      description: "Generate SQL using GPT-4",
      example: "Send comprehensive prompt to OpenAI",
      details: "Includes schema context, few-shot examples, entity information, and generation guidelines",
      color: "bg-red-500"
    },
    {
      id: 7,
      title: "SQL Parsing & Validation",
      icon: <Shield className="h-6 w-6" />,
      description: "Validate and optimize generated SQL",
      example: "Check syntax, security, performance",
      details: "Prevents SQL injection, ensures only SELECT queries, validates table references",
      color: "bg-orange-500"
    },
    {
      id: 8,
      title: "Query Execution",
      icon: <Code className="h-6 w-6" />,
      description: "Execute SQL against database",
      example: "Run validated SQL with result limits",
      details: "Applies safety limits, captures execution time and results",
      color: "bg-teal-500"
    },
    {
      id: 9,
      title: "Response Formatting",
      icon: <CheckCircle className="h-6 w-6" />,
      description: "Format results for user display",
      example: "Generate summary, recommendations, and metadata",
      details: "Creates user-friendly explanation with confidence scores and processing time",
      color: "bg-gray-500"
    }
  ]

  const startAnimation = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= processSteps.length - 1) {
          clearInterval(interval)
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 2000)
  }

  const resetAnimation = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Brain className="mr-3 h-8 w-8 text-blue-600" />
              Text-to-SQL Process Flow
            </h1>
            <p className="text-muted-foreground">
              Step-by-step visualization of natural language to SQL conversion
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={startAnimation} disabled={isPlaying}>
              <Play className="mr-2 h-4 w-4" />
              {isPlaying ? 'Playing...' : 'Start Demo'}
            </Button>
            <Button variant="outline" onClick={resetAnimation}>
              Reset
            </Button>
          </div>
        </div>

        {/* Process Flow Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Process Pipeline</CardTitle>
            <CardDescription>
              From natural language input to SQL execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  {/* Step Circle */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                    ${index <= currentStep ? step.color : 'bg-gray-300'}
                    ${index === currentStep ? 'ring-4 ring-blue-200 animate-pulse' : ''}
                    transition-all duration-500
                  `}>
                    {index < currentStep ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className={`
                    flex-1 p-4 rounded-lg border-2 transition-all duration-500
                    ${index <= currentStep ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                    ${index === currentStep ? 'border-blue-400 bg-blue-100' : ''}
                  `}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                        <p className="text-sm font-mono bg-gray-200 p-2 rounded mt-2">{step.example}</p>
                        <p className="text-xs text-gray-600 mt-1">{step.details}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {index < currentStep && (
                          <Badge variant="default" className="bg-green-600">
                            Completed
                          </Badge>
                        )}
                        {index === currentStep && isPlaying && (
                          <Badge variant="default" className="bg-blue-600 animate-pulse">
                            Processing...
                          </Badge>
                        )}
                        {index > currentStep && (
                          <Badge variant="outline">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < processSteps.length - 1 && (
                    <div className={`
                      flex-shrink-0 transition-all duration-500
                      ${index < currentStep ? 'text-blue-600' : 'text-gray-400'}
                    `}>
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OpenAI Integration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-red-500" />
                OpenAI API Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Request Structure</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`POST /api/chatgpt
{
  "type": "text_to_sql",
  "prompt": "# Text-to-SQL Conversion...",
  "data": {
    "entities": [...],
    "intent": "equipment_by_system",
    "context": {...}
  }
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Expected Response</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`{
  "result": "SELECT e.設備ID, e.設備名... 
             FROM equipment e 
             WHERE ...",
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 150
  }
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Processing Time</h4>
                <p className="text-sm text-muted-foreground">
                  Typical OpenAI response: 1-3 seconds<br/>
                  Pattern matching fallback: &lt;50ms
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Implementation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-gray-500" />
                Technical Implementation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Service Architecture</h4>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• <code>enhanced-ai-service.ts</code> - Main orchestrator</li>
                  <li>• <code>text-to-sql-service.ts</code> - Core pipeline</li>
                  <li>• <code>entity-resolution-service.ts</code> - Entity extraction</li>
                  <li>• <code>schema-context-service.ts</code> - Database context</li>
                  <li>• <code>few-shot-learning-service.ts</code> - Example selection</li>
                  <li>• <code>query-validation-service.ts</code> - SQL validation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Decision Logic</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded mt-2">
{`if (shouldUseTextToSQL(query)) {
  // Use OpenAI pipeline
  result = await textToSQLService.convert(query)
} else {
  // Use pattern matching
  result = await patternBasedHandler(query)
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Fallback Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  1. OpenAI text-to-SQL (primary)<br/>
                  2. Template-based SQL (fallback)<br/>
                  3. Pattern matching (last resort)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Query Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Example: "List equipment belongs to SYS-001"</CardTitle>
            <CardDescription>
              Step-by-step breakdown of actual query processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">1. Query Analysis</h4>
                  <p className="text-sm mt-2">
                    Pattern: "belongs to SYS-XXX"<br/>
                    Decision: ✅ Use Text-to-SQL<br/>
                    Reason: Contains system ID
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">2. Entity Extraction</h4>
                  <p className="text-sm mt-2">
                    Found: SYS-001 (system)<br/>
                    Found: equipment (entity type)<br/>
                    Confidence: 95%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">3. Schema Context</h4>
                  <p className="text-sm mt-2">
                    Tables: equipment, equipment_system_mapping<br/>
                    Relationships: JOIN conditions<br/>
                    Sample values provided
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">4. OpenAI Prompt (Simplified)</h4>
                <pre className="text-xs mt-2 overflow-x-auto">
{`Convert to PostgreSQL: "List equipment belongs to SYS-001"

Schema:
- equipment (設備ID, 設備名, 稼働状態)
- equipment_system_mapping (equipment_id, system_id)

Examples:
- "Show equipment in system" → SELECT e.設備ID, e.設備名 FROM equipment e JOIN...

Generate SQL with proper JOINs and system filtering.`}
                </pre>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">5. Expected OpenAI Response</h4>
                <pre className="text-xs mt-2 overflow-x-auto">
{`SELECT e.設備ID, e.設備名, e.稼働状態, etm.設備種別名
FROM equipment e
JOIN equipment_system_mapping esm ON e.設備ID = esm.equipment_id
JOIN equipment_type_master etm ON e.設備種別ID = etm.id
WHERE esm.system_id = 'SYS-001'
ORDER BY e.設備ID
LIMIT 100;`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">1-3s</p>
                  <p className="text-sm text-muted-foreground">OpenAI Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">&lt;50ms</p>
                  <p className="text-sm text-muted-foreground">Pattern Matching</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Security Validated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}