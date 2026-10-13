import { useState } from 'react'
import { CalculatorIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, UsersIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'

export function FRTCalculator() {
  const [calculationMode, setCalculationMode] = useState('calculate') // 'calculate' or 'target'
  const [totalResponses, setTotalResponses] = useState('')
  const [totalResponseTime, setTotalResponseTime] = useState('')
  const [timeUnit, setTimeUnit] = useState('minutes')
  const [currentFRT, setCurrentFRT] = useState('')
  const [targetFRT, setTargetFRT] = useState('')
  const [industry, setIndustry] = useState('saas')

  // Industry benchmarks (in minutes)
  const benchmarks = {
    saas: { excellent: 60, good: 180, average: 360, poor: 720 },
    ecommerce: { excellent: 30, good: 120, average: 240, poor: 480 },
    finance: { excellent: 15, good: 60, average: 120, poor: 240 },
    healthcare: { excellent: 30, good: 90, average: 180, poor: 360 },
    general: { excellent: 120, good: 240, average: 480, poor: 960 },
  }

  const industryNames = {
    saas: 'SaaS / Software',
    ecommerce: 'E-commerce / Retail',
    finance: 'Finance / Banking',
    healthcare: 'Healthcare',
    general: 'General / Other',
  }

  const calculateFRT = () => {
    if (!totalResponses || !totalResponseTime) return null

    const responses = parseFloat(totalResponses)
    const time = parseFloat(totalResponseTime)

    // Convert to minutes
    let timeInMinutes = time
    if (timeUnit === 'hours') timeInMinutes = time * 60
    if (timeUnit === 'seconds') timeInMinutes = time / 60

    const frtMinutes = timeInMinutes / responses

    return {
      minutes: frtMinutes,
      hours: frtMinutes / 60,
      formatted: formatTime(frtMinutes),
    }
  }

  const formatTime = (minutes) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`
    } else if (minutes < 60) {
      return `${Math.round(minutes)} minutes`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`
    } else {
      const days = Math.floor(minutes / 1440)
      const hours = Math.round((minutes % 1440) / 60)
      return hours > 0 ? `${days}d ${hours}h` : `${days} days`
    }
  }

  const getBenchmarkStatus = (frtMinutes) => {
    const benchmark = benchmarks[industry]
    if (frtMinutes <= benchmark.excellent) {
      return { status: 'Excellent', tone: 'positive', message: 'Outstanding! Your FRT is in the top tier.' }
    } else if (frtMinutes <= benchmark.good) {
      return { status: 'Good', tone: 'positive', message: 'Great job! Your FRT is above average.' }
    } else if (frtMinutes <= benchmark.average) {
      return { status: 'Average', tone: 'warning', message: 'Room for improvement. Consider optimizing your workflow.' }
    } else if (frtMinutes <= benchmark.poor) {
      return { status: 'Below Average', tone: 'warning', message: 'Your FRT needs attention. Customers expect faster responses.' }
    } else {
      return { status: 'Needs Improvement', tone: 'negative', message: 'Critical: Your FRT is significantly impacting customer satisfaction.' }
    }
  }

  const getRecommendations = (frtMinutes) => {
    const recommendations = []
    const benchmark = benchmarks[industry]

    if (frtMinutes > benchmark.good) {
      recommendations.push({
        title: 'Use Video Responses',
        description: 'Teams using Screendesk reduce response time by 42% by sending quick video explanations instead of lengthy emails.',
        icon: VideoCameraIcon,
      })
    }

    if (frtMinutes > benchmark.average) {
      recommendations.push({
        title: 'Implement Auto-Responses',
        description: 'Set up automated acknowledgment emails to let customers know you received their request.',
        icon: ChatBubbleLeftRightIcon,
      })
    }

    if (frtMinutes > benchmark.excellent) {
      recommendations.push({
        title: 'Use Canned Responses',
        description: 'Create templates for common questions to respond faster. Try our Email Template Generator.',
        icon: DocumentTextIcon,
      })
    }

    if (frtMinutes > benchmark.good) {
      recommendations.push({
        title: 'Optimize Team Coverage',
        description: 'Ensure you have adequate coverage during peak hours. Use our SLA Calculator to determine team size.',
        icon: UsersIcon,
      })
    }

    return recommendations.slice(0, 3) // Return top 3 recommendations
  }

  const calculateImprovementNeeded = () => {
    if (!currentFRT || !targetFRT) return null

    const current = parseFloat(currentFRT)
    const target = parseFloat(targetFRT)

    const improvement = ((current - target) / current) * 100
    const timeReduction = current - target

    return {
      improvementPercent: improvement,
      timeReduction: timeReduction,
      formatted: formatTime(timeReduction),
    }
  }

  const result = calculationMode === 'calculate' ? calculateFRT() : null
  const benchmarkStatus = result ? getBenchmarkStatus(result.minutes) : null
  const recommendations = result ? getRecommendations(result.minutes) : []
  const improvement = calculationMode === 'target' ? calculateImprovementNeeded() : null

  return (
    <div className="space-y-6">
      <div className={ui.segmented} role="group" aria-label="Calculator mode">
        <button type="button" aria-pressed={calculationMode === 'calculate'} onClick={() => setCalculationMode('calculate')} className={ui.segment(calculationMode === 'calculate')}>Calculate FRT</button>
        <button type="button" aria-pressed={calculationMode === 'target'} onClick={() => setCalculationMode('target')} className={ui.segment(calculationMode === 'target')}>Improvement needed</button>
      </div>

      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>{calculationMode === 'calculate' ? 'Your data' : 'Your target'}</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            {calculationMode === 'calculate' ? (
              <>
                <div>
                  <label htmlFor="industry" className={ui.label}>Industry</label>
                  <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={ui.select}>
                    {Object.entries(industryNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="totalResponses" className={ui.label}>Total number of responses</label>
                  <input type="number" id="totalResponses" value={totalResponses} onChange={(e) => setTotalResponses(e.target.value)} className={ui.input} placeholder="e.g., 150" min="1" />
                  <p className={ui.hint}>How many tickets did you respond to?</p>
                </div>
                <div>
                  <label htmlFor="totalResponseTime" className={ui.label}>Total response time</label>
                  <div className="flex gap-2">
                    <input type="number" id="totalResponseTime" value={totalResponseTime} onChange={(e) => setTotalResponseTime(e.target.value)} className={ui.input} placeholder="e.g., 450" min="0" step="0.01" />
                    <select aria-label="Time unit" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className={`${ui.select} w-32`}>
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                  <p className={ui.hint}>Sum of all first response times</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="currentFRT" className={ui.label}>Current FRT (minutes)</label>
                  <input type="number" id="currentFRT" value={currentFRT} onChange={(e) => setCurrentFRT(e.target.value)} className={ui.input} placeholder="e.g., 180" min="0" step="0.1" />
                </div>
                <div>
                  <label htmlFor="targetFRT" className={ui.label}>Target FRT (minutes)</label>
                  <input type="number" id="targetFRT" value={targetFRT} onChange={(e) => setTargetFRT(e.target.value)} className={ui.input} placeholder="e.g., 60" min="0" step="0.1" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6" aria-live="polite">
          {result && (
            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Your first response time</h2><Badge tone={benchmarkStatus.tone}>{benchmarkStatus.status}</Badge></div>
              <div className={ui.cardBody}>
                <p className={ui.metric}>{result.formatted}</p>
                <p className={`${ui.metricLabel} mt-1`}>{benchmarkStatus.message}</p>
                <div className={`${ui.rows} mt-5`}>
                  <div className={ui.row}><span className={ui.rowLabel}>Industry</span><span className={ui.rowValue}>{industryNames[industry]}</span></div>
                  <div className={ui.row}><span className={ui.rowLabel}>Total responses</span><span className={ui.rowValue}>{totalResponses}</span></div>
                  <div className={ui.row}><span className={ui.rowLabel}>Average (minutes)</span><span className={ui.rowValue}>{result.minutes.toFixed(1)}</span></div>
                </div>
              </div>
            </div>
          )}

          {improvement && (
            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Improvement needed</h2></div>
              <div className={ui.cardBody}>
                <p className={ui.metric}>{improvement.improvementPercent.toFixed(1)}%</p>
                <p className={`${ui.metricLabel} mt-1`}>Reduction needed</p>
                <div className={`${ui.rows} mt-5`}>
                  <div className={ui.row}><span className={ui.rowLabel}>Current FRT</span><span className={ui.rowValue}>{formatTime(parseFloat(currentFRT))}</span></div>
                  <div className={ui.row}><span className={ui.rowLabel}>Target FRT</span><span className={ui.rowValue}>{formatTime(parseFloat(targetFRT))}</span></div>
                  <div className={ui.row}><span className={ui.rowLabel}>Time to save</span><span className={ui.rowValue}>{improvement.formatted}</span></div>
                </div>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Recommendations</h2></div>
              <ul className={`${ui.cardBody} space-y-4`}>
                {recommendations.map(({ title, description, icon: Icon }) => (
                  <li key={title} className="flex gap-3">
                    <Icon aria-hidden="true" className={`${ui.listIcon} mt-0.5`} />
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
                      <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!result && !improvement && (
            <div className={ui.empty}>
              <CalculatorIcon aria-hidden="true" className={ui.emptyIcon} />
              {calculationMode === 'calculate' ? 'Enter your data to calculate your first response time.' : 'Enter your current and target FRT to see the improvement needed.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
