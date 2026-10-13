import { useState } from 'react'
import { CalculatorIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'

export function SLACalculator() {
  const [inputs, setInputs] = useState({
    dailyTickets: '',
    targetResponseMinutes: '',
    avgHandleMinutes: '',
    businessHours: '8',
    daysPerWeek: '5',
    currentTeamSize: ''
  })

  const [results, setResults] = useState(null)

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const calculateSLA = () => {
    const {
      dailyTickets,
      targetResponseMinutes,
      avgHandleMinutes,
      businessHours,
      daysPerWeek,
      currentTeamSize
    } = inputs

    // Validate inputs
    if (!dailyTickets || !targetResponseMinutes || !avgHandleMinutes) {
      alert('Please fill in all required fields')
      return
    }

    const tickets = parseFloat(dailyTickets)
    const targetResponse = parseFloat(targetResponseMinutes)
    const handleTime = parseFloat(avgHandleMinutes)
    const hoursPerDay = parseFloat(businessHours)
    const workDays = parseFloat(daysPerWeek)
    const currentTeam = parseFloat(currentTeamSize) || 0

    // Calculate tickets per hour
    const ticketsPerHour = tickets / hoursPerDay
    
    // Calculate total work minutes needed per day
    const totalWorkMinutes = tickets * handleTime
    
    // Calculate available work minutes per agent per day (accounting for breaks, meetings, etc - assume 80% efficiency)
    const availableMinutesPerAgent = hoursPerDay * 60 * 0.8
    
    // Calculate required team size
    const requiredAgents = Math.ceil(totalWorkMinutes / availableMinutesPerAgent)
    
    // Calculate actual response time with current team
    const actualResponseTime = currentTeam > 0 
      ? Math.round((tickets / (currentTeam * (hoursPerDay * 60 / handleTime))) * handleTime)
      : 0
    
    // Calculate if meeting SLA
    const meetingSLA = currentTeam >= requiredAgents
    
    // Calculate coverage percentage
    const coveragePercentage = currentTeam > 0 
      ? Math.min(100, Math.round((currentTeam / requiredAgents) * 100))
      : 0

    // Calculate tickets per agent per day
    const ticketsPerAgent = requiredAgents > 0 ? Math.round(tickets / requiredAgents) : 0

    setResults({
      requiredAgents,
      ticketsPerHour: ticketsPerHour.toFixed(1),
      ticketsPerAgent,
      actualResponseTime,
      meetingSLA,
      coveragePercentage,
      workloadPerAgent: Math.round((totalWorkMinutes / requiredAgents) / 60 * 10) / 10
    })
  }

  const missingAgents = results ? results.requiredAgents - parseInt(inputs.currentTeamSize) : 0

  return (
    <div className={ui.grid}>
      <div className={ui.card}>
        <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Your metrics</h2></div>
        <div className={`${ui.cardBody} ${ui.stack}`}>
          <div>
            <label htmlFor="dailyTickets" className={ui.label}>Average daily tickets</label>
            <input type="number" id="dailyTickets" value={inputs.dailyTickets} onChange={(e) => handleInputChange('dailyTickets', e.target.value)} className={ui.input} placeholder="e.g., 100" min="0" />
          </div>
          <div>
            <label htmlFor="targetResponse" className={ui.label}>Target response time (minutes)</label>
            <input type="number" id="targetResponse" value={inputs.targetResponseMinutes} onChange={(e) => handleInputChange('targetResponseMinutes', e.target.value)} className={ui.input} placeholder="e.g., 60" min="0" />
          </div>
          <div>
            <label htmlFor="handleTime" className={ui.label}>Average handle time (minutes)</label>
            <input type="number" id="handleTime" value={inputs.avgHandleMinutes} onChange={(e) => handleInputChange('avgHandleMinutes', e.target.value)} className={ui.input} placeholder="e.g., 15" min="0" />
            <p className={ui.hint}>Time to fully resolve a ticket</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="businessHours" className={ui.label}>Business hours per day</label>
              <select id="businessHours" value={inputs.businessHours} onChange={(e) => handleInputChange('businessHours', e.target.value)} className={ui.select}>
                <option value="8">8 hours (9–5)</option>
                <option value="10">10 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours (24/7)</option>
              </select>
            </div>
            <div>
              <label htmlFor="daysPerWeek" className={ui.label}>Days per week</label>
              <select id="daysPerWeek" value={inputs.daysPerWeek} onChange={(e) => handleInputChange('daysPerWeek', e.target.value)} className={ui.select}>
                <option value="5">5 days (Mon–Fri)</option>
                <option value="6">6 days</option>
                <option value="7">7 days</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="currentTeam" className={ui.label}>Current team size (optional)</label>
            <input type="number" id="currentTeam" value={inputs.currentTeamSize} onChange={(e) => handleInputChange('currentTeamSize', e.target.value)} className={ui.input} placeholder="e.g., 5" min="0" />
            <p className={ui.hint}>To compare against the required size</p>
          </div>
          <button type="button" onClick={calculateSLA} className={`${ui.primaryButton} w-full`}>Calculate SLA requirements</button>
        </div>
      </div>

      <div aria-live="polite">
        {results ? (
          <div className={ui.card}>
            <div className={ui.cardHeader}>
              <h2 className={ui.cardTitle}>Your results</h2>
              {inputs.currentTeamSize && <Badge tone={results.meetingSLA ? 'positive' : 'warning'}>{results.meetingSLA ? 'Meets SLA' : 'Understaffed'}</Badge>}
            </div>
            <div className={ui.cardBody}>
              <p className={ui.metricLabel}>Required team size</p>
              <p className={`${ui.metric} mt-1`}>{results.requiredAgents} agents</p>
              <p className={`${ui.metricLabel} mt-1`}>To meet your SLA targets with current ticket volume</p>
              <div className={`${ui.rows} mt-5`}>
                {inputs.currentTeamSize && (
                  <div className={ui.row}>
                    <span className={ui.rowLabel}>Current coverage</span>
                    <span className={ui.rowValue}>{results.coveragePercentage}% · {results.meetingSLA ? 'Your team can meet SLA targets' : `Need ${missingAgents} more agent${missingAgents > 1 ? 's' : ''}`}</span>
                  </div>
                )}
                <div className={ui.row}><span className={ui.rowLabel}>Tickets per hour</span><span className={ui.rowValue}>{results.ticketsPerHour}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Tickets per agent per day</span><span className={ui.rowValue}>{results.ticketsPerAgent}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Workload per agent</span><span className={ui.rowValue}>{results.workloadPerAgent} hours/day</span></div>
              </div>
              <p className={ui.hint}>Based on an 80% efficiency factor</p>
              <div className="mt-5 border-t border-zinc-200 pt-5">
                <p className="mb-4 text-sm text-zinc-500">Want to improve these metrics? Screendesk helps support teams resolve tickets faster with video.</p>
                <a href="https://app.screendesk.io/users/sign_up" className={`${ui.primaryButton} w-full`}>Try Screendesk free</a>
              </div>
            </div>
          </div>
        ) : (
          <div className={ui.empty}>
            <CalculatorIcon aria-hidden="true" className={ui.emptyIcon} />
            Fill in your support metrics to see your SLA requirements and team size recommendations.
          </div>
        )}
      </div>
    </div>
  )
}
