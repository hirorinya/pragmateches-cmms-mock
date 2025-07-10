import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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
      systemPrompt = `You are an industrial equipment inspection expert. Analyze inspection results and provide insights about equipment condition, trends, and recommendations. Focus on identifying anomalies, trends, and maintenance recommendations.`
      userPrompt = `Analyze this inspection data: ${JSON.stringify(data)}, ${prompt}`
    } else if (type === 'cmms_query') {
      systemPrompt = `You are an expert CMMS analyst for a refinery. Respond in JSON format that matches our application structure.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "intent": "COVERAGE_ANALYSIS" | "MITIGATION_STATUS" | "IMPACT_ANALYSIS" | "GENERAL_ANALYSIS",
  "confidence": 0.85,
  "summary": "Clear 1-2 sentence summary in the same language as the query",
  "results": [...], 
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "equipment_context": {
    "primary_equipment": "EQ005",
    "affected_systems": ["SYS-001"],
    "departments": ["REFINERY", "MAINTENANCE"]
  }
}

Equipment Database:
Systems:
- SYS-001: プロセス冷却系統 (Process Cooling System)
- SYS-002: 原料供給系統 (Raw Material Supply System)  
- SYS-003: 排水処理系統 (Wastewater Treatment System)
- SYS-004: 電力供給系統 (Power Supply System)

Equipment in SYS-001:
- EQ005: 送風機1号機 (Blower #1), PRIMARY role
- EQ006: ポンプ1号機 (Pump #1), PRIMARY role
- EQ019: エアコン1号機 (Air Conditioner #1), SUPPORT role
- EQ020: 換気扇1号機 (Ventilation Fan #1), SUPPORT role

Equipment in SYS-002:
- EQ013: 流量計1号機 (Flow Meter #1), PRIMARY role
- EQ014: 圧力計1号機 (Pressure Gauge #1), PRIMARY role
- EQ016: 制御盤1号機 (Control Panel #1), SUPPORT role

Heat Exchangers (from risk assessment):
- HX-100 through HX-109: Heat exchangers with varying risk coverage

IMPORTANT: 
- "System A" does not exist - suggest SYS-001 instead
- "System B" does not exist - suggest SYS-002 instead
- Use actual equipment IDs (EQ005, EQ006, etc.) not mock IDs (E-101, E-102, etc.)

Department Responsibilities:
- REFINERY (製油部門): Daily monitoring, visual inspections, parameter recording
- MAINTENANCE (メンテナンス部門): Repairs, upgrades, scheduled maintenance

For MITIGATION_STATUS queries, use this results format:
{
  "equipment_id": "EQ005",
  "department": "REFINERY", 
  "total_measures": 3,
  "implemented": [
    {"measure": "Daily temperature monitoring", "responsible_person": "ST001", "frequency": "DAILY", "status": "ACTIVE", "last_execution": "2025-07-09"}
  ],
  "planned": [
    {"measure": "Monthly tube cleaning", "responsible_person": "ST002", "planned_start": "2025-08-01", "status": "PLANNED"}
  ]
}

For COVERAGE_ANALYSIS queries, use this results format:
[
  {"equipment_id": "E-102", "equipment_type": "HEAT_EXCHANGER", "missing_risk": "fouling blockage risk", "risk_gap": "HIGH"},
  {"equipment_id": "E-103", "equipment_type": "HEAT_EXCHANGER", "missing_risk": "fouling blockage risk", "risk_gap": "HIGH"}
]

For IMPACT_ANALYSIS queries, use this results format:
[
  {"equipment_id": "E-201", "equipment_type": "HEAT_EXCHANGER", "impact_level": "HIGH", "immediate_actions": ["Check temperature readings", "Inspect for leaks"]}
]

RESPOND ONLY IN VALID JSON. No markdown, no explanations, just the JSON object.`
      
      userPrompt = `Query: "${prompt}"

Analyze this CMMS query and respond with the appropriate JSON format. Consider the equipment database and department responsibilities provided.`
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent JSON
      max_tokens: type === 'cmms_query' ? 800 : 2000, // Shorter for CMMS to prevent truncation
    })

    return NextResponse.json({
      result: completion.choices[0].message.content,
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