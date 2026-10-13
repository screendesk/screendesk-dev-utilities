// Free-tool usage events for GA4, sent through the shared listener in public/screendesk-analytics.js.
// `tool_used` fires once per tool per page view, on the first real result, never per keystroke.
const sent = new Set()

export function trackToolUse(tool, action = 'result') {
  if (typeof window === 'undefined') return
  const key = `${window.location.pathname}:${tool}:${action}`
  if (sent.has(key)) return
  sent.add(key)
  window.screendeskAnalytics?.track('tool_used', { tool, tool_action: action })
}
