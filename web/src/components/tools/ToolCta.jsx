import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { ui } from '@/components/tools/toolUi'

const signupUrl = 'https://app.screendesk.io/users/sign_up'

// The in-tool next step: shown once the tool has produced a result, so it reads as a continuation
// rather than an ad. The placement attribute makes the shared click listener report
// signup_click with cta_placement "tool_cta".
export function ToolCta({ title, copy, label = 'Try Screendesk free', href = signupUrl, className = '' }) {
  return (
    <div data-analytics-placement="tool_cta" className={`${ui.card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        {copy && <p className="mt-1 text-sm text-zinc-500">{copy}</p>}
      </div>
      <a href={href} className={`${ui.primaryButton} shrink-0`}>
        {label}
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}
