'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Shield, Info } from 'lucide-react'

interface RiskScenario {
  scenario_id: string
  scenario_name: string
  system_name: string
  likelihood_score: number
  consequence_score: number
  risk_level: string
  likelihood_category: string
  consequence_category: string
  related_failure_modes: number
}

interface MatrixCell {
  likelihood: number
  consequence: number
  riskLevel: string
  scenarios: RiskScenario[]
}

interface RiskMatrixData {
  cells: Record<string, MatrixCell>
  scenarios: RiskScenario[]
}

interface RiskMatrixProps {
  data: RiskMatrixData
  onCellClick?: (cell: MatrixCell) => void
  onScenarioClick?: (scenario: RiskScenario) => void
}

const LIKELIHOOD_LABELS = [
  'Rare\n(< 1%)',
  'Unlikely\n(1-10%)',
  'Possible\n(10-50%)',
  'Likely\n(50-90%)',
  'Almost Certain\n(> 90%)'
]

const CONSEQUENCE_LABELS = [
  'Negligible\n(Minimal impact)',
  'Minor\n(Limited impact)',
  'Moderate\n(Noticeable impact)',
  'Major\n(Significant impact)',
  'Catastrophic\n(Severe impact)'
]

const RISK_COLORS = {
  'LOW': 'bg-green-100 border-green-300 text-green-800',
  'MEDIUM': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'HIGH': 'bg-orange-100 border-orange-300 text-orange-800',
  'EXTREME': 'bg-red-100 border-red-300 text-red-800'
}

const RISK_HOVER_COLORS = {
  'LOW': 'hover:bg-green-200',
  'MEDIUM': 'hover:bg-yellow-200',
  'HIGH': 'hover:bg-orange-200',
  'EXTREME': 'hover:bg-red-200'
}

export function RiskMatrix({ data, onCellClick, onScenarioClick }: RiskMatrixProps) {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'EXTREME':
        return <AlertTriangle className="h-3 w-3 text-red-600" />
      case 'HIGH':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />
      case 'MEDIUM':
        return <Info className="h-3 w-3 text-yellow-600" />
      default:
        return <Shield className="h-3 w-3 text-green-600" />
    }
  }

  const renderMatrixCell = (likelihood: number, consequence: number) => {
    const key = `${likelihood}-${consequence}`
    const cell = data.cells[key]
    const scenarioCount = cell?.scenarios.length || 0

    return (
      <TooltipProvider key={key}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                relative h-16 border border-gray-300 cursor-pointer transition-all duration-200
                ${cell ? RISK_COLORS[cell.riskLevel] : 'bg-gray-50'}
                ${cell ? RISK_HOVER_COLORS[cell.riskLevel] : 'hover:bg-gray-100'}
                ${scenarioCount > 0 ? 'ring-2 ring-blue-300' : ''}
              `}
              onClick={() => cell && onCellClick?.(cell)}
            >
              {scenarioCount > 0 && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {scenarioCount}
                  </Badge>
                </div>
              )}
              
              {cell && (
                <div className="absolute bottom-1 left-1">
                  {getRiskIcon(cell.riskLevel)}
                </div>
              )}

              {scenarioCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs font-medium">
                      {cell.scenarios.map(s => s.scenario_name).join(', ').substring(0, 20)}
                      {cell.scenarios.map(s => s.scenario_name).join(', ').length > 20 && '...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">
                Risk Level: {cell?.riskLevel || 'N/A'}
              </div>
              <div className="text-sm">
                Likelihood: {LIKELIHOOD_LABELS[likelihood - 1]?.split('\n')[0]}
              </div>
              <div className="text-sm">
                Consequence: {CONSEQUENCE_LABELS[consequence - 1]?.split('\n')[0]}
              </div>
              {scenarioCount > 0 && (
                <div className="text-sm">
                  <div className="font-medium">{scenarioCount} scenario(s):</div>
                  {cell.scenarios.map(scenario => (
                    <div key={scenario.scenario_id} className="text-xs">
                      • {scenario.scenario_name} ({scenario.system_name})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Matrix
        </CardTitle>
        <CardDescription>
          Interactive risk assessment matrix showing likelihood vs. consequence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Matrix Grid */}
          <div className="relative">
            {/* Y-axis label (Consequence) */}
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
              <div className="text-sm font-medium text-gray-700">Consequence</div>
            </div>
            
            {/* X-axis label (Likelihood) */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="text-sm font-medium text-gray-700">Likelihood</div>
            </div>

            <div className="grid grid-cols-6 gap-0 w-fit mx-auto">
              {/* Header row with likelihood labels */}
              <div className="h-16"></div> {/* Empty corner */}
              {LIKELIHOOD_LABELS.map((label, index) => (
                <div key={index} className="h-16 w-32 border border-gray-300 bg-gray-100 p-1 flex items-center justify-center">
                  <div className="text-xs text-center font-medium">
                    {label.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Matrix rows (from highest to lowest consequence) */}
              {[5, 4, 3, 2, 1].map(consequence => (
                <div key={consequence} className="contents">
                  {/* Consequence label */}
                  <div className="h-16 w-32 border border-gray-300 bg-gray-100 p-1 flex items-center justify-center">
                    <div className="text-xs text-center font-medium">
                      {CONSEQUENCE_LABELS[consequence - 1]?.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Matrix cells */}
                  {[1, 2, 3, 4, 5].map(likelihood => 
                    renderMatrixCell(likelihood, consequence)
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            {(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const).map(level => (
              <div key={level} className="flex items-center gap-2">
                <div className={`w-4 h-4 border ${RISK_COLORS[level]}`}></div>
                <span className="text-sm font-medium">{level}</span>
              </div>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            {(['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const).map(level => {
              const count = data.scenarios.filter(s => s.risk_level === level).length
              return (
                <div key={level} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{level} Risk</div>
                </div>
              )
            })}
          </div>

          {/* High Priority Scenarios */}
          {data.scenarios.filter(s => ['HIGH', 'EXTREME'].includes(s.risk_level)).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">High Priority Scenarios</h4>
              <div className="space-y-2">
                {data.scenarios
                  .filter(s => ['HIGH', 'EXTREME'].includes(s.risk_level))
                  .slice(0, 5)
                  .map(scenario => (
                    <div
                      key={scenario.scenario_id}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => onScenarioClick?.(scenario)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{scenario.scenario_name}</div>
                        <div className="text-xs text-gray-600">{scenario.system_name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={scenario.risk_level === 'EXTREME' ? 'destructive' : 'default'}>
                          {scenario.risk_level}
                        </Badge>
                        {scenario.related_failure_modes > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {scenario.related_failure_modes} FM
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}