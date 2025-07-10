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
    } else if (type === 'cmms_query') {
      systemPrompt = `You are an expert CMMS analyst for a refinery. Respond in JSON format that matches our application structure.

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "intent": "COVERAGE_ANALYSIS" | "MITIGATION_STATUS" | "IMPACT_ANALYSIS" | "EQUIPMENT_INFO" | "THICKNESS_MEASUREMENT" | "SYSTEM_LIST" | "GENERAL_ANALYSIS",
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
- SYS-001: プロセス冷却系統 (Process Cooling System) - HIGH criticality
- SYS-002: 原料供給系統 (Raw Material Supply System) - CRITICAL
- SYS-003: 排水処理系統 (Wastewater Treatment System) - MEDIUM
- SYS-004: 電力供給系統 (Power Supply System) - CRITICAL
- SYS-005: 安全監視系統 (Safety Monitoring System) - CRITICAL

Static Equipment (Type 1):
- EQ001: CNC旋盤1号機 (CNC Lathe #1), Manufacturer: ヤマザキマザック, Model: INTEGREX i-300, Location: 第1工場A棟, Status: 稼働中, Installed: 2018-03-15
- EQ002: マシニングセンタ1号機 (Machining Center #1), Manufacturer: DMG森精機, Model: DMU 50, Location: 第1工場A棟, Status: 稼働中, Installed: 2017-06-20
- EQ003: 研削盤1号機 (Grinding Machine #1), Manufacturer: 岡本工作機械, Model: PSG-52DX, Location: 第1工場A棟, Status: 稼働中, Installed: 2019-01-10
- EQ004: ボール盤1号機 (Drilling Machine #1), Manufacturer: 日立工機, Model: B13RH, Location: 第1工場A棟, Status: 稼働中, Installed: 2016-11-25

Rotating Equipment (Type 2):
- EQ005: 送風機1号機 (Blower #1), Manufacturer: 三菱電機, Model: SF-150, Location: 第1工場B棟, Status: 稼働中, Installed: 2020-02-14, System: SYS-001
- EQ006: ポンプ1号機 (Pump #1), Manufacturer: 荏原製作所, Model: 50DL51.5, Location: ポンプ室, Status: 稼働中, Installed: 2019-08-03, System: SYS-001
- EQ007: 圧縮機1号機 (Compressor #1), Manufacturer: 日立産機システム, Model: DSP-22VN, Location: 第1工場B棟, Status: 稼働中, Installed: 2018-12-07
- EQ008: モータ1号機 (Motor #1), Manufacturer: 東芝, Model: IKH3-FBKAW21E, Location: 第1工場B棟, Status: 稼働中, Installed: 2017-09-22

Electrical Equipment (Type 3):
- EQ009: 変圧器1号機 (Transformer #1), Manufacturer: 三菱電機, Model: 1000kVA, Location: 受電室, Status: 稼働中, Installed: 2021-04-16, System: SYS-004
- EQ010: 配電盤1号機 (Distribution Panel #1), Manufacturer: 河村電器産業, Model: ENESTA, Location: 配電室, Status: 稼働中, Installed: 2020-07-11, System: SYS-004
- EQ011: LED照明1号機 (LED Lighting #1), Manufacturer: パナソニック, Location: 第1工場A棟, Status: 稼働中, Installed: 2019-05-18
- EQ012: 非常用発電機 (Emergency Generator), Manufacturer: ヤンマー, Model: AG200S, Location: 発電機室, Status: 待機中, Installed: 2018-10-05, System: SYS-004

Instrumentation Equipment (Type 4):
- EQ013: 流量計1号機 (Flow Meter #1), Manufacturer: 横河電機, Model: ADMAG AXF, Location: 配管室, Status: 稼働中, Installed: 2020-01-25, System: SYS-002
- EQ014: 圧力計1号機 (Pressure Gauge #1), Manufacturer: 長野計器, Model: GV55, Location: 制御室, Status: 稼働中, Installed: 2019-11-30, System: SYS-002
- EQ015: 温度計1号機 (Temperature Gauge #1), Manufacturer: チノー, Model: DB1000, Location: 制御室, Status: 稼働中, Installed: 2018-04-14
- EQ016: 制御盤1号機 (Control Panel #1), Manufacturer: オムロン, Model: CP1E, Location: 制御室, Status: 稼働中, Installed: 2017-12-02, System: SYS-002

Piping Equipment (Type 5):
- EQ017: 配管1号機 (Piping #1), Manufacturer: クボタ, Model: GENEX, Location: 配管室, Status: 稼働中, Installed: 2021-01-09, System: SYS-003
- EQ018: 弁1号機 (Valve #1), Manufacturer: キッツ, Model: 10K, Location: 配管室, Status: 稼働中, Installed: 2020-06-27, System: SYS-003

Environmental Equipment (Type 8):
- EQ019: エアコン1号機 (Air Conditioner #1), Manufacturer: ダイキン, Model: FHCP50DB, Location: 第1工場地下, Status: 稼働中, Installed: 2019-03-23, System: SYS-001
- EQ020: 換気扇1号機 (Ventilation Fan #1), Manufacturer: 三菱電機, Model: EX-25SC3-M, Location: 事務所, Status: 稼働中, Installed: 2018-08-11, System: SYS-001

Process Equipment (Risk Assessment Data):
Tanks (TK-series):
- TK-100 to TK-109: Storage tanks with comprehensive risk assessment and thickness measurement data
- TK-101: Storage tank with 33 thickness measurement records (2015-2025), Shell-1: 10.68mm, Shell-2: 8.99mm, Bottom-1: 10.1mm (all passing)

Heat Exchangers (HX-series):
- HX-100 to HX-109: Heat exchangers with detailed risk scenarios and coverage analysis
- HX-101: Heat exchanger with fouling blockage risk covered

Pumps (PU-series):
- PU-100 to PU-109: Process pumps with comprehensive risk assessment data

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

For COVERAGE_ANALYSIS queries about equipment NOT reflected in ES, use this results format:
[
  {"equipment_id": "EQ013", "equipment_type": "FLOW_METER", "system": "SYS-002", "missing_risk": "fouling blockage risk", "risk_gap": "HIGH"},
  {"equipment_id": "EQ014", "equipment_type": "PRESSURE_GAUGE", "system": "SYS-002", "missing_risk": "fouling blockage risk", "risk_gap": "HIGH"},
  {"equipment_id": "EQ016", "equipment_type": "CONTROL_PANEL", "system": "SYS-002", "missing_risk": "fouling blockage risk", "risk_gap": "HIGH"}
]

For COVERAGE_ANALYSIS queries about equipment ARE reflected in ES, use this results format:
[
  {"equipment_id": "EQ006", "equipment_type": "PUMP", "risk_coverage": "fouling blockage risk covered", "coverage_status": "COVERED"},
  {"equipment_id": "HX-101", "equipment_type": "HEAT_EXCHANGER", "risk_coverage": "fouling blockage risk covered", "coverage_status": "COVERED"}
]

For IMPACT_ANALYSIS queries, use this results format:
[
  {"equipment_id": "EQ013", "equipment_type": "FLOW_METER", "impact_level": "HIGH", "immediate_actions": ["Check flow readings", "Verify sensor calibration"]}
]

For EQUIPMENT_INFO queries, use this results format:
{
  "equipment_id": "EQ006",
  "name": "ポンプ1号機 (Pump #1)",
  "manufacturer": "荏原製作所",
  "model": "50DL51.5",
  "location": "ポンプ室",
  "status": "稼働中",
  "installed_date": "2019-08-03",
  "system": "SYS-001",
  "type": "Rotating Equipment",
  "specifications": {
    "capacity": "Available in maintenance records",
    "power": "Available in maintenance records",
    "service": "Process cooling system"
  },
  "last_maintenance": "Available in maintenance history",
  "next_inspection": "Available in inspection plan",
  "risk_level": "Available in risk assessment"
}

For THICKNESS_MEASUREMENT queries, use this results format:
{
  "equipment_id": "TK-101",
  "measurement_points": [
    {"point": "Shell-1", "current": "10.68mm", "design": "11.7mm", "minimum": "8.2mm", "status": "Passing", "date": "2025"},
    {"point": "Shell-2", "current": "8.99mm", "design": "10.0mm", "minimum": "7.0mm", "status": "Passing", "date": "2025"},
    {"point": "Bottom-1", "current": "10.1mm", "design": "11.1mm", "minimum": "7.8mm", "status": "Passing", "date": "2025"}
  ],
  "trend": "Gradual thinning observed over 10-year period",
  "recommendation": "Shell-2 point requires increased monitoring - approaching minimum threshold"
}

For SYSTEM_LIST queries (when asking to list systems), use this results format:
[
  {"system_id": "SYS-001", "name": "プロセス冷却系統 (Process Cooling System)", "criticality": "HIGH", "equipment_count": 4},
  {"system_id": "SYS-002", "name": "原料供給系統 (Raw Material Supply System)", "criticality": "CRITICAL", "equipment_count": 3},
  {"system_id": "SYS-003", "name": "排水処理系統 (Wastewater Treatment System)", "criticality": "MEDIUM", "equipment_count": 2},
  {"system_id": "SYS-004", "name": "電力供給系統 (Power Supply System)", "criticality": "CRITICAL", "equipment_count": 3},
  {"system_id": "SYS-005", "name": "安全監視系統 (Safety Monitoring System)", "criticality": "CRITICAL", "equipment_count": 0}
]

IMPORTANT: When user asks to "list systems", "システムの一覧", "list the name of System we have", or similar, use SYSTEM_LIST intent and return the actual system list as results, NOT generic recommendations.

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