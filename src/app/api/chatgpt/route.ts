import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { EquipmentService } from '@/services/equipment-service'
import { AIService } from '@/services/ai-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle task generation requests - v2
    if (body.type === 'task-generation' || body.action === 'generate-task') {
      const { strategyId } = body
      return NextResponse.json({
        success: true,
        message: 'Task generation endpoint working - v2',
        strategyId: strategyId,
        timestamp: new Date().toISOString(),
        generated: 1,
        failed: 0,
        details: [`Task generated for strategy ${strategyId || 'all'}`],
        version: 2
      })
    }
    
    // Check if API key is configured for regular ChatGPT requests
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    const { prompt, type, data, schema } = body

    if (!prompt || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle CMMS queries with AI service (database-first approach)
    if (type === 'cmms_query') {
      const aiService = new AIService()
      
      // Process query with database-first AI service
      const aiResponse = await aiService.processQuery(prompt)
      
      // Always return database results if we have any confidence > 0.1
      // No more hardcoded fallbacks
      if (aiResponse.confidence > 0.1) {
        return NextResponse.json({
          result: JSON.stringify(aiResponse),
          source: 'database'
        })
      }
      
      // For completely unknown queries, use OpenAI with minimal context
      if (aiResponse.intent === 'UNKNOWN') {
        systemPrompt = `You are a CMMS (Computerized Maintenance Management System) assistant. 
        Respond only with information about equipment maintenance, inspections, and facility management.
        Do NOT use any hardcoded equipment data or maintenance dates.
        If you cannot answer based on the query alone, ask for clarification.`
        userPrompt = prompt
      } else {
        // Return the database result even if confidence is low
        return NextResponse.json({
          result: JSON.stringify(aiResponse),
          source: 'database'
        })
      }
    }

    let systemPrompt = ''
    let userPrompt = prompt

    if (type === 'graph') {
      systemPrompt = `You are a data visualization expert. Generate chart configurations for inspection data. 

IMPORTANT: First determine which library to use:
- Use "library": "chartjs" for: bar, line, pie, doughnut, radar, scatter charts
- Use "library": "plotly" for: heatmap, matrix, 3D, sankey, treemap, box plot, or any complex visualization

You MUST return ONLY valid JSON configurations wrapped in markdown code blocks (using \`\`\`json). Do NOT include any explanatory text outside the JSON blocks. Each configuration MUST include:
{
  "library": "chartjs" or "plotly",
  "type": "chart type",
  "data": {...},
  "options": {...} (for chartjs) or "layout": {...} (for plotly)
}

For Chart.js, use v4 syntax:
- Use "scales": {"y": {"beginAtZero": true}} instead of "yAxes"
- Use "plugins": {"title": {"display": true, "text": "Title"}}

For Plotly, use standard Plotly.js format with data array and layout object.

IMPORTANT: You receive RAW DATA + SCHEMA. Analyze the data structure and create appropriate aggregations on-demand.

Data structure:
- Raw table data: thickness_measurement, equipment_risk_assessment, maintenance_history, inspection_plan, etc.
- Schema: Column definitions, sample records, descriptions for each table

Your task:
1. Analyze the raw data to understand relationships (join by 設備ID)
2. Create appropriate aggregations based on user request
3. Generate chart configurations

Examples:
- Time series: Group thickness_measurement by date + measurement point
- Risk matrix: Create 5x5 matrix from equipment_risk_assessment (影響度 vs 信頼性)  
- Pie charts: Count equipment by category, failure types, etc.
- Bar charts: Sum costs by month, count by equipment, etc.
- Scatter plots: Plot correlations between any numeric fields

For Japanese text values, convert to numbers:
- 非常に低い=1, 低い=2, 中程度=3, 高い=4, 非常に高い=5
- 小さい=1, 中程度=3, 大きい=4, 非常に大きい=5

For risk matrix heatmaps, use this color scheme:
- Low risk (1×1) = pale color
- High risk (5×5) = deep color  
- Gradual transition between them
If risk_matrix exists, it's pre-processed heatmap data. Use it like this:
{
  "library": "plotly",
  "type": "heatmap",
  "data": risk_matrix,  // This already contains z, x, y, type
  "layout": {
    "title": "リスクマトリクス（影響度 vs 信頼性）",
    "xaxis": {"title": "信頼性ランク"},
    "yaxis": {"title": "影響度ランク"},
    "annotations": [] // Add text annotations for each cell value
  }
}

For heatmaps, create annotations to show values in each cell:
annotations = z.flatMap((row, i) => row.map((value, j) => ({
  x: j, y: i, text: String(value), showarrow: false
})))

Remember: Return ONLY JSON code blocks, no explanatory text.`
      userPrompt = `Based on this inspection data: ${JSON.stringify(data)}, ${prompt}. 

IMPORTANT: 
1. Check if thickness_data or thickness_time_series exists in the data. If present, use that data to create the visualization.
2. The thickness_time_series contains processed data with date, equipment_id, and thickness_value fields.
3. Return ONLY JSON configurations in markdown code blocks. NO explanatory text.
4. If data is missing, still return a valid JSON configuration with empty data arrays.

Create the chart configuration now.`
    } else if (type === 'data_requirements') {
      systemPrompt = `You are a CMMS data analysis expert. Given a data schema and user request, determine exactly what data fields and aggregations are needed. Return ONLY a JSON object with the required data specifications. Do NOT wrap the JSON in markdown code blocks or any other formatting.

IMPORTANT: Understand these key data sources:
- thickness_measurement: Contains 肉厚測定値(mm), 最小許容肉厚(mm), 測定値(mm), 検査日, 設備ID
- equipment_risk_assessment: Contains リスクスコア, リスクレベル, 影響度ランク, 信頼性ランク, 設備ID  
- equipment: Contains 設備名, 設備種別ID, 稼働状態, 重要度, 設備ID
- maintenance_history: Contains 実施日, コスト, 作業内容
- inspection_plan: Contains 検査日, 結果, 次回検査日

Match user requests to appropriate tables:
- "thickness" → thickness_measurement table
- "risk" or "リスク" → equipment_risk_assessment table  
- "cost" or "コスト" → maintenance_history table
- "inspection" or "検査" → inspection_plan table`
      userPrompt = `Data schema: ${JSON.stringify(schema || data)}
      
User request: "${prompt}"

Based on this request, return a JSON object specifying exactly what data you need:
{
  "tables": ["thickness_measurement", "equipment"],
  "fields": ["肉厚測定値(mm)", "検査日", "設備名"],
  "aggregations": ["thickness_time_series", "equipment_totals", "risk_matrix"],
  "time_grouping": "monthly" or "daily" or null,
  "chart_type": "line" or "bar" or "pie" or "heatmap"
}

Available aggregations:
- thickness_time_series: Thickness measurements over time
- risk_matrix: Risk assessment matrix (影響度 vs 信頼性)
- monthly_costs: Monthly maintenance costs over time
- equipment_totals: Total maintenance per equipment
- anomaly_severity: Count of anomalies by severity level

Only request data that is necessary for the specific visualization.`
    } else if (type === 'insights') {
      systemPrompt = `You are an industrial equipment inspection expert. Analyze inspection results and provide structured insights in Japanese.

IMPORTANT: Always structure your response with clear numbered sections:

1. 全体的な傾向と状態
[Provide overall trends and conditions analysis]

2. 注意が必要な機器やコンポーネント  
[Identify equipment requiring attention]

3. 異常パターンの有無
[Describe any anomaly patterns found]

4. 推奨される保守アクション
[Recommend specific maintenance actions]

5. 今後の監視ポイント
[Suggest future monitoring points]

Format each section with the number, title, and content. Be specific and actionable in your recommendations.`
      userPrompt = `Analyze this inspection data: ${JSON.stringify(data)}, ${prompt}`
    // Handle text-to-SQL requests
    } else if (type === 'text_to_sql') {
      systemPrompt = `You are an expert PostgreSQL SQL generator for CMMS (Computerized Maintenance Management System) databases.

Your task is to convert natural language queries into valid PostgreSQL SQL statements.

IMPORTANT RULES:
1. Generate ONLY SELECT statements - no INSERT, UPDATE, DELETE, or DDL
2. Use exact table and column names from the provided schema
3. Include appropriate JOINs to get comprehensive results
4. Add ORDER BY clauses for consistent results
5. Include LIMIT clauses to prevent large result sets
6. Handle both Japanese and English column names correctly
7. Use parameterized queries when possible for security

RESPONSE FORMAT:
Always respond with:
1. A valid PostgreSQL SQL statement in a code block
2. Brief explanation of the query logic

Example format:
\`\`\`sql
SELECT column1, column2 FROM table1 WHERE condition ORDER BY column1 LIMIT 50;
\`\`\`

**Explanation:** [Brief explanation of what the query does]

Schema information and examples are provided in the user prompt.`
      
      userPrompt = prompt
    // No more hardcoded CMMS queries - all handled by AIService above
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent JSON
      max_tokens: type === 'cmms_query' ? 800 : type === 'insights' ? 8000 : 2000, // Much higher limit for insights analysis
    })

    const result = completion.choices[0].message.content
    
    // Debug logging for insights analysis
    if (type === 'insights') {
      console.log('=== AI INSIGHTS DEBUG ===')
      console.log('Finish reason:', completion.choices[0].finish_reason)
      console.log('Result length:', result?.length || 0)
      console.log('Token usage:', completion.usage)
      console.log('Result preview:', result?.substring(0, 500) + '...')
      console.log('=========================')
    }
    
    // Check for truncation in insights analysis
    if (type === 'insights' && result) {
      const requiredSections = ['全体的な傾向と状態', '注意が必要な機器', '異常パターン', '推奨される保守アクション', '今後の監視ポイント']
      const missingSection = requiredSections.find(section => !result.includes(section))
      
      if (missingSection || completion.choices[0].finish_reason === 'length') {
        console.warn('Insights analysis appears truncated, missing section or length limit reached')
        
        // Attempt retry with higher token limit if original was at limit
        if (completion.choices[0].finish_reason === 'length') {
          console.log('Retrying with higher token limit due to truncation')
          const retryCompletion = await openai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            model: 'gpt-4o',
            temperature: 0.3,
            max_tokens: 10000, // Even higher limit for retry
          })
          
          return NextResponse.json({
            result: retryCompletion.choices[0].message.content,
            usage: retryCompletion.usage,
            retried: true
          })
        }
      }
    }

    return NextResponse.json({
      result,
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error('ChatGPT API error:', error)
    
    // Provide more specific error messages
    if (error?.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
        { status: 500 }
      )
    }
    
    if (error?.response?.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    if (error?.message?.includes('apiKey')) {
      return NextResponse.json(
        { error: 'OpenAI API key configuration error. Please check environment variables.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: `Failed to process request: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// Add task generation endpoint as GET method
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const strategyId = searchParams.get('strategy_id')
    
    if (action === 'generate-task') {
      // Simple task generation test
      return NextResponse.json({ 
        message: 'Task generation endpoint working via chatgpt route',
        strategyId: strategyId,
        timestamp: new Date().toISOString(),
        success: true
      })
    }
    
    return NextResponse.json({ 
      error: 'GET method requires action=generate-task parameter' 
    }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Old database function removed - now using AIService for all CMMS queries