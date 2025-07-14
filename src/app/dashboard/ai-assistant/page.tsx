'use client'

import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Send, 
  Brain, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Settings,
  MessageSquare,
  Lightbulb,
  Database,
  Activity,
  CheckCircle
} from 'lucide-react'
import { aiQueryService } from '@/services/ai-query-service'
import { DatabaseBridge } from '@/lib/database-bridge'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  executionTime?: number
  source?: 'openai' | 'mock'
}

interface QuickQuery {
  id: string
  title: string
  description: string
  query: string
  icon: React.ReactNode
  category: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiService] = useState(() => aiQueryService)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickQueries: QuickQuery[] = [
    // Enhanced Natural Language Examples
    {
      id: 'equipment-problems',
      title: 'What Problems Do We Have?',
      description: 'Natural language query for current equipment issues',
      query: 'What equipment problems do we have right now?',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'Problems'
    },
    {
      id: 'equipment-status',
      title: 'How Are Things Running?',
      description: 'Natural language equipment status check',
      query: 'How is all our equipment running today?',
      icon: <Activity className="h-4 w-4" />,
      category: 'Status'
    },
    {
      id: 'maintenance-due',
      title: 'What Maintenance Is Due?',
      description: 'Natural language maintenance schedule query',
      query: 'What maintenance work is due this week?',
      icon: <Clock className="h-4 w-4" />,
      category: 'Schedule'
    },
    {
      id: 'recent-work',
      title: 'Show Recent Work',
      description: 'Natural language maintenance history',
      query: 'Show me what maintenance work was done recently',
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'History'
    },
    {
      id: 'specific-equipment',
      title: 'Tell Me About HX-101',
      description: 'Natural language equipment info query',
      query: 'Tell me about equipment HX-101 - how is it running?',
      icon: <Lightbulb className="h-4 w-4" />,
      category: 'Equipment'
    },
    {
      id: 'all-equipment',
      title: 'Show All Equipment',
      description: 'Natural language overview request',
      query: 'Show me all equipment in the facility',
      icon: <Database className="h-4 w-4" />,
      category: 'Overview'
    },
    {
      id: 'critical-issues',
      title: 'Any Critical Issues?',
      description: 'Natural language critical status check',
      query: 'Are there any critical equipment issues I should know about?',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'Critical'
    },
    {
      id: 'performance-check',
      title: 'Equipment Performance',
      description: 'Natural language performance query',
      query: 'Which equipment is performing poorly this month?',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'Performance'
    }
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (query?: string) => {
    const messageText = query || inputValue.trim()
    if (!messageText) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await aiService.processQuery(messageText)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: formatAIResponse(response),
        timestamp: new Date(),
        intent: response.intent,
        confidence: response.confidence,
        executionTime: response.execution_time,
        source: response.source
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatAIResponse = (response: any) => {
    // Parse JSON string responses from the API
    let parsedResponse = response
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response)
      } catch (error) {
        // If it's not valid JSON, treat it as plain text
        return `## AI Response\n\n${response}`
      }
    }

    // Handle malformed JSON responses
    if (typeof parsedResponse.summary !== 'string') {
      console.error('Malformed AI response:', parsedResponse)
      return `## Response Processing Error\n\nReceived incomplete response from AI service. Please try again.\n\n**Debug Info:**\n- Intent: ${parsedResponse.intent || 'Unknown'}\n- Confidence: ${parsedResponse.confidence || 'Unknown'}`
    }

    let formatted = `## ${parsedResponse.summary}\n\n`

    // Add enhanced metadata section for transparency
    if (parsedResponse.intent || parsedResponse.confidence) {
      formatted += `### 📋 Query Analysis\n`
      formatted += `- **Intent:** ${parsedResponse.intent || 'Unknown'}\n`
      formatted += `- **Confidence:** ${Math.round((parsedResponse.confidence || 0) * 100)}%\n`
      if (parsedResponse.source) {
        const sourceEmoji = parsedResponse.source === 'openai' ? '🤖' : 
                           parsedResponse.source === 'enhanced_ai' ? '🧠' : '💾'
        formatted += `- **Source:** ${sourceEmoji} ${parsedResponse.source.replace('_', ' ').toUpperCase()}\n`
      }
      if (parsedResponse.execution_time) {
        formatted += `- **Processing Time:** ${parsedResponse.execution_time}ms\n`
      }
      
      // Add context information if available
      if (parsedResponse.context) {
        const ctx = parsedResponse.context
        if (ctx.urgency && ctx.urgency !== 'low') {
          formatted += `- **Urgency:** ${ctx.urgency.toUpperCase()}\n`
        }
        if (ctx.hasEquipment) {
          formatted += `- **Equipment Query:** Yes\n`
        }
        if (ctx.hasTimeframe) {
          formatted += `- **Time-based Query:** Yes\n`
        }
      }
      
      formatted += '\n'
    }

    if (parsedResponse.results && (Array.isArray(parsedResponse.results) ? parsedResponse.results.length > 0 : Object.keys(parsedResponse.results).length > 0)) {
      formatted += `### 📊 Analysis Results\n\n`
      
      // Handle results array - preserve risk assessment data structure
      let uniqueResults = Array.isArray(parsedResponse.results) ? parsedResponse.results : [parsedResponse.results]
      
      
      // Only remove duplicates for basic equipment data, not for risk assessments or strategies
      if (uniqueResults.length > 0 && !uniqueResults[0]?.risk_level && !uniqueResults[0]?.risk_score && !uniqueResults[0]?.strategy_id) {
        uniqueResults = DatabaseBridge.removeDuplicateEquipment(uniqueResults)
      }
      
      if (Array.isArray(uniqueResults) && DatabaseBridge.getEquipmentId(uniqueResults[0]) && (uniqueResults[0]?.missing_risk || uniqueResults[0]?.risk_coverage)) {
        // Coverage analysis format - handles both missing and covered scenarios
        uniqueResults.forEach((result: any, index: number) => {
          formatted += `**${index + 1}. Equipment ${DatabaseBridge.getEquipmentId(result) || 'Unknown'}**\n`
          formatted += `- **Type:** ${result.equipment_type || 'Heat Exchanger'}\n`
          formatted += `- **System:** ${result.system || 'SYS-001'}\n`
          formatted += `- **Location:** ${result.location || 'Not specified'}\n`
          
          if (result.missing_risk) {
            formatted += `- **Missing Risk:** ${result.missing_risk}\n`
            formatted += `- **Risk Gap Level:** ${result.risk_gap || 'HIGH'}\n`
          } else if (result.risk_coverage) {
            formatted += `- **Risk Coverage:** ${result.risk_coverage}\n`
            formatted += `- **Coverage Status:** ${result.coverage_status || 'COVERED'}\n`
          }
          formatted += '\n'
        })
      } else if (DatabaseBridge.getEquipmentId(uniqueResults[0]) && (uniqueResults[0]?.total_measures !== undefined || uniqueResults[0]?.implemented || uniqueResults[0]?.planned)) {
        // Mitigation status format
        const r = uniqueResults[0]
        formatted += `**🔧 Equipment:** ${DatabaseBridge.getEquipmentId(r)}\n`
        formatted += `**🏢 Department:** ${r.department}\n`
        formatted += `**📋 Total Measures:** ${r.total_measures}\n\n`
        
        if (r.implemented?.length > 0) {
          formatted += `**✅ Implemented Measures (${r.implemented.length}):**\n`
          r.implemented.forEach((measure: any, index: number) => {
            formatted += `${index + 1}. ${measure.measure} (👤 ${measure.responsible_person})\n`
          })
          formatted += '\n'
        }
        
        if (r.planned?.length > 0) {
          formatted += `**📅 Planned Measures (${r.planned.length}):**\n`
          r.planned.forEach((measure: any, index: number) => {
            formatted += `${index + 1}. ${measure.measure} (📅 Start: ${measure.planned_start})\n`
          })
          formatted += '\n'
        }
      } else if (Array.isArray(uniqueResults) && uniqueResults[0]?.impact_level) {
        // Impact analysis format
        uniqueResults.forEach((equipment: any, index: number) => {
          formatted += `**${index + 1}. Equipment ${DatabaseBridge.getEquipmentId(equipment)}** (${equipment.equipment_type})\n`
          formatted += `- **Impact Level:** ${equipment.impact_level}\n`
          formatted += `- **System:** ${equipment.system || 'SYS-001'}\n`
          
          if (equipment.immediate_actions?.length > 0) {
            formatted += `- **⚡ Immediate Actions Required:**\n`
            equipment.immediate_actions.forEach((action: string) => {
              formatted += `  • ${action}\n`
            })
          }
          formatted += '\n'
        })
      } else if (uniqueResults.length > 0 && 
                 (uniqueResults[0]?.risk_level || uniqueResults[0]?.risk_score || uniqueResults[0]?.risk_scenario || 
                  uniqueResults[0]?.risk_factors || uniqueResults[0]?.impact_rank || uniqueResults[0]?.mitigation_measures)) {
        // Risk assessment format - show comprehensive risk details with standardized scenarios
        uniqueResults.forEach((risk: any, index: number) => {
          formatted += `**${index + 1}. Equipment ${risk.equipment_id}**\n`
          formatted += `- **Name:** ${risk.equipment_name || risk.equipment_id}\n`
          formatted += `- **Type:** ${risk.equipment_type || 'Unknown'}\n`
          formatted += `- **Risk Level:** ${risk.risk_level || 'Not assessed'}\n`
          formatted += `- **Risk Score:** ${risk.risk_score || 'N/A'}\n`
          
          // Show standardized scenario if available
          if (risk.risk_scenario_standardized) {
            formatted += `- **Risk Scenario:** ${risk.risk_scenario_standardized}`
            if (risk.risk_scenario_english && risk.risk_scenario_english !== 'Not standardized') {
              formatted += ` (${risk.risk_scenario_english})`
            }
            formatted += '\n'
          } else if (risk.risk_scenario) {
            formatted += `- **Risk Scenario:** ${risk.risk_scenario}\n`
          }
          
          // Show scenario description if available
          if (risk.scenario_description && risk.scenario_description !== 'No description available') {
            formatted += `- **Scenario Description:** ${risk.scenario_description}\n`
          }
          
          // Show risk matrix if available
          if (risk.likelihood_score && risk.consequence_score) {
            formatted += `- **Risk Matrix:** Likelihood ${risk.likelihood_score}/5, Consequence ${risk.consequence_score}/5\n`
          }
          
          if (risk.risk_factor) {
            formatted += `- **Risk Factors:** ${risk.risk_factor}\n`
          }
          if (risk.impact_rank) {
            formatted += `- **Impact Rank:** ${risk.impact_rank}\n`
          }
          if (risk.reliability_rank) {
            formatted += `- **Reliability Rank:** ${risk.reliability_rank}\n`
          }
          if (risk.mitigation_measures) {
            formatted += `- **Mitigation Measures:** ${risk.mitigation_measures}\n`
          }
          formatted += '\n'
        })
      } else if (uniqueResults.length > 0 && DatabaseBridge.getEquipmentId(uniqueResults[0]) && 
                 !uniqueResults[0]?.risk_level && !uniqueResults[0]?.risk_score && !uniqueResults[0]?.risk_scenario) {
        // Equipment info format (using bridge functions) - only for equipment WITHOUT risk data
        uniqueResults.forEach((equipment: any, index: number) => {
          formatted += `**${index + 1}. Equipment ${DatabaseBridge.getEquipmentId(equipment)}**\n`
          if (DatabaseBridge.getEquipmentName(equipment)) formatted += `- **Name:** ${DatabaseBridge.getEquipmentName(equipment)}\n`
          if (equipment.製造者 || equipment.manufacturer) formatted += `- **Manufacturer:** ${equipment.製造者 || equipment.manufacturer}\n`
          if (equipment.型式 || equipment.model) formatted += `- **Model:** ${equipment.型式 || equipment.model}\n`
          if (DatabaseBridge.getEquipmentLocation(equipment)) formatted += `- **Location:** ${DatabaseBridge.getEquipmentLocation(equipment)}\n`
          if (equipment.稼働状態 || equipment.operating_status) formatted += `- **Status:** ${equipment.稼働状態 || equipment.operating_status}\n`
          if (equipment.設備種別名 || equipment.equipment_type_name) formatted += `- **Type:** ${equipment.設備種別名 || equipment.equipment_type_name}\n`
          formatted += '\n'
        })
      } else if (uniqueResults.length > 0 && uniqueResults[0]?.strategy_id) {
        // Equipment strategy format - show equipment details along with strategy
        uniqueResults.forEach((strategy: any, index: number) => {
          formatted += `**${index + 1}. Equipment ${strategy.equipment_id}**\n`
          formatted += `- **Name:** ${strategy.equipment_name}\n`
          formatted += `- **Type:** ${strategy.equipment_type}\n`
          formatted += `- **Strategy:** ${strategy.strategy_name}\n`
          formatted += `- **Strategy Type:** ${strategy.strategy_type}\n`
          formatted += `- **Frequency:** ${strategy.frequency}\n`
          formatted += `- **Priority:** ${strategy.priority}\n`
          if (strategy.risk_level) {
            formatted += `- **Risk Level:** ${strategy.risk_level}\n`
          }
          if (strategy.risk_factors) {
            formatted += `- **Risk Factors:** ${strategy.risk_factors}\n`
          }
          if (strategy.coverage_status) {
            formatted += `- **Coverage Status:** ${strategy.coverage_status}\n`
          }
          formatted += '\n'
        })
      } else if (uniqueResults.length > 0) {
        // Generic results format - for equipment with basic info, show equipment details
        if (uniqueResults[0]?.equipment_id && !uniqueResults[0]?.risk_level && !uniqueResults[0]?.risk_score) {
          uniqueResults.forEach((equipment: any, index: number) => {
            formatted += `**${index + 1}. Equipment ${equipment.equipment_id}**\n`
            if (equipment.equipment_name) formatted += `- **Name:** ${equipment.equipment_name}\n`
            if (equipment.equipment_type) formatted += `- **Type:** ${equipment.equipment_type}\n`
            if (equipment.location) formatted += `- **Location:** ${equipment.location}\n`
            if (equipment.operational_status) formatted += `- **Status:** ${equipment.operational_status}\n`
            formatted += '\n'
          })
        } else {
          // Truly generic case - show all data
          formatted += `**Equipment Analysis:**\n\n`
          uniqueResults.forEach((result: any, index: number) => {
            formatted += `**${index + 1}. Analysis Result**\n`
            
            // Display key-value pairs in a user-friendly way
            Object.entries(result).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                const displayKey = key
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                
                if (typeof value === 'object' && value !== null) {
                  formatted += `- **${displayKey}:** ${JSON.stringify(value, null, 2)}\n`
                } else {
                  formatted += `- **${displayKey}:** ${value}\n`
                }
              }
            })
            formatted += '\n'
          })
        }
      }
    } else if (parsedResponse.results && !Array.isArray(parsedResponse.results) && typeof parsedResponse.results === 'object') {
      // Handle single object results that aren't arrays
      formatted += `### 📊 Analysis Results\n\n`
      formatted += `**Equipment Analysis:**\n`
      Object.entries(parsedResponse.results).forEach(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        formatted += `- **${displayKey}:** ${value}\n`
      })
      formatted += '\n'
    }

    if (parsedResponse.recommendations?.length > 0) {
      formatted += `### 💡 Recommendations\n\n`
      parsedResponse.recommendations.forEach((rec: string, index: number) => {
        formatted += `${index + 1}. ${rec}\n`
      })
      formatted += '\n'
    }

    // Add additional debug info if needed
    if (parsedResponse.debug_info) {
      formatted += `### 🔍 Debug Information\n`
      formatted += `${parsedResponse.debug_info}\n`
    }

    return formatted
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="mr-3 h-8 w-8 text-blue-600" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Intelligent analysis and insights for maintenance management
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Demo Mode
        </Badge>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat Interface
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Lightbulb className="mr-2 h-4 w-4" />
            Example Queries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Query Buttons */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Queries</CardTitle>
                  <CardDescription>
                    Try these common analysis requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQueries.map((query) => (
                    <Button
                      key={query.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleSendMessage(query.query)}
                    >
                      <div className="flex items-start space-x-2">
                        {query.icon}
                        <div className="text-left">
                          <div className="font-medium text-xs">{query.title}</div>
                          <div className="text-xs text-muted-foreground">{query.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Chat with AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about equipment risks, maintenance status, and process impacts
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">Welcome to AI Assistant</p>
                        <p className="text-sm">Ask me about equipment risks, maintenance status, or process impacts</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border shadow-sm'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none">
                            {message.type === 'assistant' ? (
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            ) : (
                              <div>{message.content}</div>
                            )}
                          </div>
                          
                          <div className={`flex items-center justify-between text-xs mt-2 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{message.timestamp.toLocaleTimeString()}</span>
                            </div>
                            
                            {message.type === 'assistant' && message.confidence && (
                              <div className="flex items-center space-x-2">
                                <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                                {message.executionTime && (
                                  <span>({message.executionTime}ms)</span>
                                )}
                                {message.source && (
                                  <Badge variant={message.source === 'openai' ? 'default' : 'secondary'} className="text-xs">
                                    {message.source === 'openai' ? '🤖 OpenAI' : '🗄️ Database'}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about equipment risks, maintenance status, or process impacts..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickQueries.map((query) => (
              <Card key={query.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSendMessage(query.query)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {query.icon}
                      <CardTitle className="text-lg">{query.title}</CardTitle>
                    </div>
                    <Badge variant="outline">{query.category}</Badge>
                  </div>
                  <CardDescription>{query.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm italic">"{query.query}"</p>
                  </div>
                  <Button 
                    className="w-full mt-3" 
                    size="sm"
                    onClick={() => handleSendMessage(query.query)}
                  >
                    Try This Query
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional Use Cases</CardTitle>
              <CardDescription>
                More examples of what you can ask the AI Assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">🔍 Risk Analysis</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Find equipment with high RPN scores</li>
                    <li>• Identify missing failure modes</li>
                    <li>• Compare risk levels across systems</li>
                    <li>• Analyze risk trends over time</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📊 Maintenance Status</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Check implementation progress</li>
                    <li>• Find overdue maintenance tasks</li>
                    <li>• Analyze department workloads</li>
                    <li>• Review completion rates</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">⚡ Process Impact</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Trace instrument dependencies</li>
                    <li>• Analyze parameter correlations</li>
                    <li>• Predict maintenance needs</li>
                    <li>• Identify cascade effects</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🎯 Optimization</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Suggest frequency adjustments</li>
                    <li>• Optimize resource allocation</li>
                    <li>• Identify efficiency opportunities</li>
                    <li>• Recommend best practices</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  )
}