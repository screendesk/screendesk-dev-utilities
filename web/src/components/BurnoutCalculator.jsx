import { useState } from 'react'
import { AcademicCapIcon, BuildingOfficeIcon, ChartBarIcon, CheckCircleIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon, PuzzlePieceIcon, SunIcon, UserGroupIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'

export function BurnoutCalculator() {
  // Workload factors
  const [ticketsPerDay, setTicketsPerDay] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [avgHandleTime, setAvgHandleTime] = useState('')
  const [overtimeHours, setOvertimeHours] = useState('')
  
  // Complexity factors
  const [escalationRate, setEscalationRate] = useState('')
  const [backAndForthAvg, setBackAndForthAvg] = useState('')
  const [difficultCustomerRate, setDifficultCustomerRate] = useState('')
  
  // Support factors
  const [trainingHours, setTrainingHours] = useState('')
  const [toolQuality, setToolQuality] = useState('3')
  const [managerSupport, setManagerSupport] = useState('3')
  const [teamCollaboration, setTeamCollaboration] = useState('3')
  
  // Work environment
  const [workFromHome, setWorkFromHome] = useState('hybrid')
  const [breakTime, setBreakTime] = useState('')
  const [vacationDays, setVacationDays] = useState('')
  const [turnoverRate, setTurnoverRate] = useState('')

  const calculateBurnoutScore = () => {
    // Workload Score (0-30 points)
    let workloadScore = 0
    if (ticketsPerDay && teamSize) {
      const ticketsPerAgent = parseFloat(ticketsPerDay) / parseFloat(teamSize)
      if (ticketsPerAgent > 50) workloadScore += 10
      else if (ticketsPerAgent > 35) workloadScore += 7
      else if (ticketsPerAgent > 25) workloadScore += 4
      else workloadScore += 1
    }
    
    if (avgHandleTime) {
      const handleTime = parseFloat(avgHandleTime)
      if (handleTime > 30) workloadScore += 8
      else if (handleTime > 20) workloadScore += 5
      else if (handleTime > 15) workloadScore += 3
      else workloadScore += 1
    }
    
    if (overtimeHours) {
      const overtime = parseFloat(overtimeHours)
      if (overtime > 10) workloadScore += 12
      else if (overtime > 5) workloadScore += 8
      else if (overtime > 2) workloadScore += 4
      else workloadScore += 1
    }

    // Complexity Score (0-25 points)
    let complexityScore = 0
    if (escalationRate) {
      const escalation = parseFloat(escalationRate)
      if (escalation > 30) complexityScore += 10
      else if (escalation > 20) complexityScore += 7
      else if (escalation > 10) complexityScore += 4
      else complexityScore += 1
    }
    
    if (backAndForthAvg) {
      const backAndForth = parseFloat(backAndForthAvg)
      if (backAndForth > 6) complexityScore += 8
      else if (backAndForth > 4) complexityScore += 5
      else if (backAndForth > 3) complexityScore += 3
      else complexityScore += 1
    }
    
    if (difficultCustomerRate) {
      const difficult = parseFloat(difficultCustomerRate)
      if (difficult > 25) complexityScore += 7
      else if (difficult > 15) complexityScore += 5
      else if (difficult > 10) complexityScore += 3
      else complexityScore += 1
    }

    // Support Score (0-25 points) - inverted (less support = higher score)
    let supportScore = 0
    if (trainingHours) {
      const training = parseFloat(trainingHours)
      if (training < 2) supportScore += 8
      else if (training < 5) supportScore += 5
      else if (training < 10) supportScore += 3
      else supportScore += 1
    }
    
    const toolScore = parseInt(toolQuality)
    supportScore += (5 - toolScore) * 2
    
    const managerScore = parseInt(managerSupport)
    supportScore += (5 - managerScore) * 2.5
    
    const collabScore = parseInt(teamCollaboration)
    supportScore += (5 - collabScore) * 2

    // Environment Score (0-20 points)
    let environmentScore = 0
    if (workFromHome === 'office') environmentScore += 3
    else if (workFromHome === 'hybrid') environmentScore += 1
    
    if (breakTime) {
      const breaks = parseFloat(breakTime)
      if (breaks < 30) environmentScore += 6
      else if (breaks < 45) environmentScore += 4
      else if (breaks < 60) environmentScore += 2
      else environmentScore += 0
    }
    
    if (vacationDays) {
      const vacation = parseFloat(vacationDays)
      if (vacation < 10) environmentScore += 6
      else if (vacation < 15) environmentScore += 4
      else if (vacation < 20) environmentScore += 2
      else environmentScore += 0
    }
    
    if (turnoverRate) {
      const turnover = parseFloat(turnoverRate)
      if (turnover > 30) environmentScore += 5
      else if (turnover > 20) environmentScore += 3
      else if (turnover > 10) environmentScore += 2
      else environmentScore += 0
    }

    const totalScore = workloadScore + complexityScore + supportScore + environmentScore
    
    return {
      total: totalScore,
      workload: workloadScore,
      complexity: complexityScore,
      support: supportScore,
      environment: environmentScore,
      maxScore: 100
    }
  }

  const getBurnoutLevel = (score) => {
    if (score >= 70) {
      return { level: 'Critical', tone: 'negative', message: 'Immediate action required. Your team is at severe risk of burnout.' }
    } else if (score >= 50) {
      return { level: 'High Risk', tone: 'negative', message: 'Significant burnout risk. Implement changes soon to prevent turnover.' }
    } else if (score >= 30) {
      return { level: 'Moderate Risk', tone: 'warning', message: 'Some warning signs present. Monitor closely and make improvements.' }
    } else if (score >= 15) {
      return { level: 'Low Risk', tone: 'positive', message: 'Good team health. Continue current practices and stay vigilant.' }
    } else {
      return { level: 'Excellent', tone: 'positive', message: 'Outstanding team health! Your team is thriving.' }
    }
  }

  const hasMinimumData = () => {
    return ticketsPerDay && teamSize && avgHandleTime && escalationRate
  }

  const score = hasMinimumData() ? calculateBurnoutScore() : null
  const burnoutLevel = score ? getBurnoutLevel(score.total) : null

  const numberField = ({ id, label, value, onChange, placeholder, hint, required, wide, ...rest }) => (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <label htmlFor={id} className={ui.label}>{label}{required && <span className="text-rose-500"> *</span>}</label>
      <input type="number" id={id} value={value} onChange={(e) => onChange(e.target.value)} className={ui.input} placeholder={placeholder} {...rest} />
      {hint && <p className={ui.hint}>{hint}</p>}
    </div>
  )

  const rangeField = ({ id, label, value, onChange, hint }) => (
    <div className="md:col-span-2">
      <label htmlFor={id} className={ui.label}>{label}</label>
      <div className="flex items-center gap-4">
        <input type="range" id={id} min="1" max="5" value={value} onChange={(e) => onChange(e.target.value)} className={ui.range} />
        <span className="w-6 text-center text-sm font-medium text-zinc-900 tabular-nums">{value}</span>
      </div>
      {hint && <p className={ui.hint}>{hint}</p>}
    </div>
  )

  const section = (Icon, title, children) => (
    <div className={ui.card}>
      <div className={ui.cardHeader}>
        <h2 className={`${ui.cardTitle} flex items-center gap-2`}><Icon aria-hidden="true" className={ui.listIcon} />{title}</h2>
      </div>
      <div className={`${ui.cardBody} grid grid-cols-1 gap-5 md:grid-cols-2`}>{children}</div>
    </div>
  )

  const breakdown = score ? [
    ['Workload', score.workload, 30],
    ['Complexity', score.complexity, 25],
    ['Lack of support', score.support, 25],
    ['Environment', score.environment, 20],
  ] : []

  const recommendations = score ? [
    score.workload >= 15 && {
      icon: ChartBarIcon,
      title: 'Reduce workload',
      description: ticketsPerDay && teamSize && (parseFloat(ticketsPerDay) / parseFloat(teamSize)) > 35
        ? 'Consider hiring more agents or using automation to reduce tickets per agent.'
        : 'Optimize workflows to reduce average handle time.',
    },
    score.complexity >= 12 && {
      icon: VideoCameraIcon,
      title: 'Use video support',
      description: 'Reduce back-and-forth by 42% with video responses. Screendesk helps agents resolve complex issues faster.',
    },
    score.support >= 12 && {
      icon: AcademicCapIcon,
      title: 'Increase training & support',
      description: trainingHours && parseFloat(trainingHours) < 5
        ? 'Provide more training hours to build agent confidence and skills.'
        : 'Improve tools and manager support to help agents succeed.',
    },
    score.environment >= 10 && {
      icon: SunIcon,
      title: 'Improve work-life balance',
      description: breakTime && parseFloat(breakTime) < 45
        ? 'Ensure agents take adequate breaks throughout the day.'
        : 'Address high turnover by improving team culture and benefits.',
    },
    score.total >= 50 && {
      icon: ExclamationTriangleIcon,
      title: 'Immediate action required',
      description: 'Schedule one-on-ones with team members to understand their challenges and implement changes quickly.',
    },
    score.total < 30 && {
      icon: CheckCircleIcon,
      title: 'Keep up the good work',
      description: 'Your team is healthy! Continue monitoring metrics and gathering feedback to maintain this level.',
    },
  ].filter(Boolean) : []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      <div className="space-y-6 lg:col-span-2">
        {section(ChartBarIcon, 'Workload factors', <>
          {numberField({ id: 'ticketsPerDay', label: 'Daily tickets (team total)', required: true, value: ticketsPerDay, onChange: setTicketsPerDay, placeholder: 'e.g., 200', min: '0' })}
          {numberField({ id: 'teamSize', label: 'Team size', required: true, value: teamSize, onChange: setTeamSize, placeholder: 'e.g., 8', min: '1' })}
          {numberField({ id: 'avgHandleTime', label: 'Avg handle time (minutes)', required: true, value: avgHandleTime, onChange: setAvgHandleTime, placeholder: 'e.g., 18', min: '0', step: '0.1' })}
          {numberField({ id: 'overtimeHours', label: 'Weekly overtime hours (per agent)', value: overtimeHours, onChange: setOvertimeHours, placeholder: 'e.g., 5', min: '0', step: '0.5' })}
        </>)}

        {section(PuzzlePieceIcon, 'Complexity factors', <>
          {numberField({ id: 'escalationRate', label: 'Escalation rate (%)', required: true, value: escalationRate, onChange: setEscalationRate, placeholder: 'e.g., 15', hint: '% of tickets escalated to senior agents', min: '0', max: '100', step: '0.1' })}
          {numberField({ id: 'backAndForthAvg', label: 'Avg back-and-forth messages', value: backAndForthAvg, onChange: setBackAndForthAvg, placeholder: 'e.g., 4', hint: 'Messages per ticket to resolution', min: '1', step: '0.1' })}
          {numberField({ id: 'difficultCustomerRate', label: 'Difficult customer rate (%)', wide: true, value: difficultCustomerRate, onChange: setDifficultCustomerRate, placeholder: 'e.g., 12', hint: '% of interactions with frustrated or angry customers', min: '0', max: '100', step: '0.1' })}
        </>)}

        {section(UserGroupIcon, 'Support & resources', <>
          {numberField({ id: 'trainingHours', label: 'Monthly training hours (per agent)', wide: true, value: trainingHours, onChange: setTrainingHours, placeholder: 'e.g., 8', min: '0', step: '0.5' })}
          {rangeField({ id: 'toolQuality', label: 'Tool quality (1 = poor, 5 = excellent)', value: toolQuality, onChange: setToolQuality, hint: 'Quality of helpdesk, CRM, and support tools' })}
          {rangeField({ id: 'managerSupport', label: 'Manager support (1 = poor, 5 = excellent)', value: managerSupport, onChange: setManagerSupport, hint: 'Manager availability, feedback, and support' })}
          {rangeField({ id: 'teamCollaboration', label: 'Team collaboration (1 = poor, 5 = excellent)', value: teamCollaboration, onChange: setTeamCollaboration, hint: 'Team communication and peer support' })}
        </>)}

        {section(BuildingOfficeIcon, 'Work environment', <>
          <div className="md:col-span-2">
            <span id="workLocation-label" className={ui.label}>Work location</span>
            <div className={ui.segmented} role="group" aria-labelledby="workLocation-label">
              {[['remote', 'Remote'], ['hybrid', 'Hybrid'], ['office', 'Office']].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={workFromHome === value} onClick={() => setWorkFromHome(value)} className={ui.segment(workFromHome === value)}>{label}</button>
              ))}
            </div>
          </div>
          {numberField({ id: 'breakTime', label: 'Daily break time (minutes)', value: breakTime, onChange: setBreakTime, placeholder: 'e.g., 60', min: '0', step: '5' })}
          {numberField({ id: 'vacationDays', label: 'Annual vacation days', value: vacationDays, onChange: setVacationDays, placeholder: 'e.g., 20', min: '0' })}
          {numberField({ id: 'turnoverRate', label: 'Annual turnover rate (%)', wide: true, value: turnoverRate, onChange: setTurnoverRate, placeholder: 'e.g., 18', hint: '% of team members who left in the past year', min: '0', max: '100', step: '0.1' })}
        </>)}
      </div>

      <div className="space-y-6 lg:sticky lg:top-28" aria-live="polite">
        {score && burnoutLevel ? (
          <>
            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Burnout risk score</h2><Badge tone={burnoutLevel.tone}>{burnoutLevel.level}</Badge></div>
              <div className={ui.cardBody}>
                <p className={ui.metric}>{score.total}<span className="text-base font-normal text-zinc-400"> / {score.maxScore}</span></p>
                <p className={`${ui.metricLabel} mt-1`}>{burnoutLevel.message}</p>
                <dl className="mt-5 space-y-3">
                  {breakdown.map(([label, value, max]) => (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs"><dt className="text-zinc-500">{label}</dt><dd className="font-medium text-zinc-900 tabular-nums">{value}/{max}</dd></div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100"><div className="h-1.5 rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${(value / max) * 100}%` }} /></div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Top recommendations</h2></div>
              <ul className={`${ui.cardBody} space-y-4`}>
                {recommendations.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex gap-3">
                    <Icon aria-hidden="true" className={`${ui.listIcon} mt-0.5`} />
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
                      <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-200 p-5">
                <a href="https://app.screendesk.io/users/sign_up" className={`${ui.primaryButton} w-full`}>Try Screendesk free</a>
                <p className={`${ui.hint} text-center`}>Reduce complexity and improve agent satisfaction</p>
              </div>
            </div>
          </>
        ) : (
          <div className={ui.empty}>
            <ClipboardDocumentListIcon aria-hidden="true" className={ui.emptyIcon} />
            Fill in the required fields to calculate your team’s burnout risk score.
          </div>
        )}
      </div>
    </div>
  )
}
